# Healthcare ERP Backend — API Root, Versioning Strategy & v2 Decision Policy

This document outlines the **API Root metadata specification**, **URI-based API Versioning Strategy**, **Route Registration Architecture**, and the **Definitive v2 Decision Matrix & Automated Drift Detector**.

---

## 1. System Overview

```
                        HTTP Request
                             │
                             ▼
                    ┌─────────────────┐
                    │   src/app.ts    │ (Global Middlewares & Error Handlers)
                    └────────┬────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │  src/routes/index.ts  │ (Central Route Registration)
                 └───────────┬───────────┘
                             │
       ┌─────────────────────┼─────────────────────┬─────────────────────┐
       │                     │                     │                     │
       ▼                     ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────────────┐
│ root.route.ts│     │health.route.ts│    │ docs.route.ts│     │    v1.route.ts    │
│  [GET /]     │     │ [GET /health]│     │ [GET /docs]  │     │   [/api/v1/...]   │
└──────────────┘     └──────────────┘     └──────────────┘     └─────────┬─────────┘
                                                                         │
                                                   ┌─────────────────────┴─────────────────────┐
                                                   │                                           │
                                                   ▼                                           ▼
                                          ┌─────────────────┐                         ┌─────────────────┐
                                          │  users/index.ts │                         │patients/index.ts│
                                          │ [/api/v1/users] │                         │[/api/v1/patients│
                                          └─────────────────┘                         └─────────────────┘
```

---

## 2. API Root Discovery (`GET /`)

The root endpoint acts as the entrypoint discovery service for API clients, frontend applications, and monitoring health checks.

### Response Payload:
```json
{
  "name": "Healthcare ERP Backend API",
  "version": "1.0.2",
  "environment": "development",
  "status": "operational",
  "uptime": 142.3,
  "documentation": {
    "swaggerUi": "/docs",
    "openApiJson": "/docs/openapi.json"
  },
  "healthCheck": "/health",
  "versions": {
    "v1": {
      "status": "current",
      "path": "/api/v1",
      "description": "Version 1.0 (Active)"
    }
  }
}
```

---

## 3. When to Stay on v1 vs When to Proceed to v2

In an enterprise Healthcare ERP, breaking changes affect hospital workstations, mobile apps, third-party EHR integrations, and lab machinery. Therefore, **proceeding to `v2` is a high-cost operational decision** and should only occur under strict conditions.

```
                    Is the change backward-compatible with existing clients?
                                           │
                        ┌──────────────────┴──────────────────┐
                        │ YES                                 │ NO
                        ▼                                     ▼
            ┌───────────────────────┐             ┌───────────────────────┐
            │       STAY ON v1      │             │ Can we use an Adapter │
            │ (Additive Evolution)  │             │ or Aliasing in v1?    │
            └───────────────────────┘             └───────────┬───────────┘
                                                              │
                                           ┌──────────────────┴──────────────────┐
                                           │ YES                                 │ NO
                                           ▼                                     ▼
                               ┌───────────────────────┐             ┌───────────────────────┐
                               │       STAY ON v1      │             │     PROCEED TO v2     │
                               │ (Deprecate Old Field) │             │ (Launch /api/v2 Route)│
                               └───────────────────────┘             └───────────────────────┘
```

### When to STAY on v1 (Additive Evolution)
Stay on `v1` for any change that existing clients can safely ignore:
1. **Adding New Modules**: Launching `appointments`, `clinical`, `pharmacy`, `billing`, `laboratory`, etc.
2. **Adding New Endpoints**: e.g., `POST /api/v1/patients/batch`, `GET /api/v1/users/stats`.
3. **Adding Optional Fields to Requests**: e.g., adding `middleName?: string` to `CreatePatientDto`.
4. **Adding New Fields to Responses**: e.g., adding `avatarThumbnailUrl` to `UserResponseDto`.
5. **Adding Query Parameters**: e.g., adding `?status=ACTIVE` or `?bloodType=O_POSITIVE` to search filters.
6. **Internal Refactoring**: Changing database queries, adding caching, optimizing indexing, bug fixes.

---

### When to PROCEED to v2 (Breaking Changes Only)
Proceed to `v2` **ONLY** when a change would cause existing production clients to fail:
1. **Renaming / Removing Required Request Fields**:
   - e.g., changing `{ firstName, lastName }` to a mandatory `{ fullName }` or requiring a new `nationalInsuranceNumber` on patient creation without fallback.
2. **Changing Data Types / Formats**:
   - e.g., changing `dateOfBirth` from ISO string (`YYYY-MM-DD`) to an epoch integer (`1700000000`), or UUID IDs to composite keys.
3. **Restructuring the Standard Response Envelope**:
   - e.g., removing `{ success, data, meta }` or changing `meta.totalPages` to `meta.total_pages`.
4. **Removing Existing Endpoints**:
   - e.g., permanently deleting `GET /api/v1/patients/mrn/:mrn` without keeping a redirect or compatibility handler.
5. **Fundamental Authentication / Security Protocol Shift**:
   - e.g., replacing Bearer JWT tokens with mTLS or non-backward-compatible session signatures.

---

## 4. Backward-Compatibility Preservation Patterns (Avoiding Unnecessary v2)

Before declaring a `v2`, apply these non-breaking adaptation techniques in `v1`:

### A. Field Aliasing & Deprecation
If renaming `phoneNumber` to `contactNumber`, accept **both** in `v1`:
```ts
export const updatePatientSchema = z.object({
  contactNumber: z.string().optional(),
  phoneNumber: z.string().optional(), // @deprecated: Use contactNumber
}).transform((data) => ({
  ...data,
  contactNumber: data.contactNumber ?? data.phoneNumber,
}))
```

### B. Optional Defaults
If adding a new field that the database requires, provide a safe default value in the application service layer so legacy v1 clients do not break.

---

## 5. Automated Breaking Change & Drift Detector

To prevent accidental breaking changes from sneaking into production, an automated static detector scans the API contract in the background:

```sh
# Run API drift check manually:
bun run check:api-drift
```

### What `scripts/check-api-drift.ts` Detects:
- Checks whether `PATCH` / update schemas contain non-optional fields (`BREAKING`).
- Checks whether response envelopes adhere to standard format.
- Checks whether endpoints deviate from active version paths.
- Automatically chained into `bun run build` so breaking builds fail before deployment.

---

## 6. How to Launch `v2` When Genuinely Needed

When a breaking change is approved:
1. Create `src/routes/v2.route.ts`.
2. Mount it in `src/routes/index.ts`:
   ```ts
   app.route('/api/v1', v1Route)
   app.route('/api/v2', v2Route)
   ```
3. Attach standard deprecation headers to `v1Route`:
   ```ts
   v1Route.use('*', async (c, next) => {
     c.header('Deprecation', '@1772150400')
     c.header('Sunset', 'Fri, 27 Aug 2027 00:00:00 GMT')
     await next()
   })
   ```
4. Keep `v1` alive for a minimum 6-month migration period.
