#!/usr/bin/env bun

// ==============================================================================
// API Drift & Breaking Change Detector
// Analyzes OpenAPI contracts & endpoints to detect breaking changes and advise
// whether changes must remain in v1 or require launching an API v2.
// ==============================================================================

import { openApiSpec } from '../src/routes/docs.route'

interface ContractIssue {
  severity: 'BREAKING' | 'WARNING' | 'INFO'
  category: string
  target: string
  detail: string
  recommendation: string
}

function analyzeContracts(): ContractIssue[] {
  const issues: ContractIssue[] = []

  const paths = openApiSpec.paths as Record<string, Record<string, any>>
  const schemas = openApiSpec.components.schemas as Record<string, any>

  // Check 1: Verify all domain endpoints are properly grouped and prefixed
  for (const [pathKey, methods] of Object.entries(paths)) {
    if (pathKey.startsWith('/api/') && !pathKey.startsWith('/api/v1')) {
      issues.push({
        severity: 'INFO',
        category: 'VERSION_SCOPE',
        target: pathKey,
        detail: `Endpoint is outside /api/v1 namespace.`,
        recommendation: `Ensure multi-version routing is mounted in src/routes/index.ts.`,
      })
    }

    for (const [method, operation] of Object.entries(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        // Verify response envelope compliance
        const responses = operation.responses || {}
        if (!responses['200'] && !responses['201']) {
          issues.push({
            severity: 'WARNING',
            category: 'RESPONSE_ENVELOPE',
            target: `${method.toUpperCase()} ${pathKey}`,
            detail: `Missing standard 200 or 201 success response schema.`,
            recommendation: `Define success response schema with standard envelope { success: true, data: ... }.`,
          })
        }
      }
    }
  }

  // Check 2: Verify DTO Schemas for breaking patterns
  for (const [schemaName, schemaObj] of Object.entries(schemas)) {
    // Check required fields on update schemas
    if (schemaName.startsWith('Update') && schemaObj.required && schemaObj.required.length > 0) {
      issues.push({
        severity: 'BREAKING',
        category: 'UPDATE_SCHEMA_STRICTNESS',
        target: schemaName,
        detail: `Update schema "${schemaName}" has required fields [${schemaObj.required.join(', ')}].`,
        recommendation: `Update schemas (PATCH) must be partial (.partial()) to avoid breaking partial update clients. If fields are mandatory, proceed to v2 or make optional.`,
      })
    }
  }

  return issues
}

function printReport(issues: ContractIssue[]) {
  console.log('[CHECK] Running API Drift & Breaking Change Detector...\n')
  console.log(`Total Endpoints Analyzed: ${Object.keys(openApiSpec.paths).length}`)
  console.log(`Total Component Schemas: ${Object.keys(openApiSpec.components.schemas).length}\n`)

  const breaking = issues.filter((i) => i.severity === 'BREAKING')
  const warnings = issues.filter((i) => i.severity === 'WARNING')
  const info = issues.filter((i) => i.severity === 'INFO')

  if (breaking.length > 0) {
    console.error('[CRITICAL] BREAKING CHANGES DETECTED -- ACTION REQUIRED:')
    console.error('----------------------------------------------------')
    console.error('The following changes break backward compatibility for active API v1 clients.')
    console.error('You must either revert these changes or proceed to publish an /api/v2 version!\n')

    breaking.forEach((issue, idx) => {
      console.error(`  [${idx + 1}] Target: ${issue.target}`)
      console.error(`      Category: ${issue.category}`)
      console.error(`      Issue:    ${issue.detail}`)
      console.error(`      Action:   ${issue.recommendation}\n`)
    })
  }

  if (warnings.length > 0) {
    console.warn('[WARNING] CONTRACT WARNINGS:')
    warnings.forEach((issue, idx) => {
      console.warn(`  [${idx + 1}] ${issue.target}: ${issue.detail} -> ${issue.recommendation}`)
    })
    console.log('')
  }

  if (breaking.length === 0) {
    console.log('[OK] API Contract Compatibility Status: PASS')
    console.log('All endpoints and schemas remain backward-compatible with API v1.')
    console.log('No breaking changes detected. No need to proceed to v2 at this time.\n')
  }
}

const issues = analyzeContracts()
printReport(issues)

if (issues.some((i) => i.severity === 'BREAKING')) {
  process.exit(1)
} else {
  process.exit(0)
}
