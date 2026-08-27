import { Hono } from 'hono'
import { swaggerUI } from '@hono/swagger-ui'

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Healthcare ERP Backend API',
    version: '1.0.1',
    description:
      'Enterprise Resource Planning (ERP) Backend API for healthcare systems, hospitals, and clinics. Built with Bun, Hono, and Prisma ORM following a Modular-Monolith architecture.',
    contact: {
      name: 'Healthcare ERP Engineering Team',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment Server',
    },
  ],
  tags: [
    { name: 'System & Health', description: 'System health checks, diagnostics, and metadata' },
    { name: 'Users Domain', description: 'Staff accounts, credentials, and role management' },
    { name: 'Patients Domain', description: 'Master Patient Index (MPI), demographics, and records' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide a valid JWT token issued by the auth domain.',
      },
    },
    schemas: {
      Role: {
        type: 'string',
        enum: [
          'SUPER_ADMIN',
          'ADMIN',
          'DOCTOR',
          'NURSE',
          'PHARMACIST',
          'RECEPTIONIST',
          'LAB_TECHNICIAN',
          'ACCOUNTANT',
        ],
        example: 'DOCTOR',
      },
      UserStatus: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        example: 'ACTIVE',
      },
      Gender: {
        type: 'string',
        enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'],
        example: 'FEMALE',
      },
      BloodType: {
        type: 'string',
        enum: [
          'A_POSITIVE',
          'A_NEGATIVE',
          'B_POSITIVE',
          'B_NEGATIVE',
          'AB_POSITIVE',
          'AB_NEGATIVE',
          'O_POSITIVE',
          'O_NEGATIVE',
          'UNKNOWN',
        ],
        example: 'O_POSITIVE',
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 100 },
          totalPages: { type: 'integer', example: 5 },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Resource not found' },
              status: { type: 'integer', example: 404 },
              details: { type: 'object', nullable: true },
            },
          },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'e4b3c2a1-0000-4000-8000-000000000001' },
          email: { type: 'string', format: 'email', example: 'doctor.smith@healthcare-erp.local' },
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Smith' },
          role: { $ref: '#/components/schemas/Role' },
          status: { $ref: '#/components/schemas/UserStatus' },
          phoneNumber: { type: 'string', nullable: true, example: '+1-555-0199' },
          avatarUrl: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateUserRequest: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName', 'role'],
        properties: {
          email: { type: 'string', format: 'email', example: 'nurse.joy@healthcare-erp.local' },
          password: { type: 'string', format: 'password', minLength: 8, example: 'SecurePassword@123' },
          firstName: { type: 'string', example: 'Joy' },
          lastName: { type: 'string', example: 'Jenny' },
          role: { $ref: '#/components/schemas/Role' },
          phoneNumber: { type: 'string', example: '+1-555-0144' },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          firstName: { type: 'string', example: 'Joy' },
          lastName: { type: 'string', example: 'Jenny' },
          role: { $ref: '#/components/schemas/Role' },
          status: { $ref: '#/components/schemas/UserStatus' },
          phoneNumber: { type: 'string', example: '+1-555-0144' },
        },
      },
      PatientResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'f5a4b3c2-0000-4000-8000-000000000002' },
          medicalRecordNumber: { type: 'string', example: 'MRN-20260827-4821' },
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', format: 'email', nullable: true, example: 'jane.doe@example.com' },
          phoneNumber: { type: 'string', nullable: true, example: '+1-555-0188' },
          dateOfBirth: { type: 'string', format: 'date', example: '1992-04-12' },
          gender: { $ref: '#/components/schemas/Gender' },
          bloodType: { $ref: '#/components/schemas/BloodType' },
          address: { type: 'string', nullable: true, example: '742 Evergreen Terrace, Springfield' },
          emergencyContactName: { type: 'string', nullable: true, example: 'John Doe' },
          emergencyContactPhone: { type: 'string', nullable: true, example: '+1-555-0189' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreatePatientRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'dateOfBirth'],
        properties: {
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
          phoneNumber: { type: 'string', example: '+1-555-0188' },
          dateOfBirth: { type: 'string', format: 'date', example: '1992-04-12' },
          gender: { $ref: '#/components/schemas/Gender' },
          bloodType: { $ref: '#/components/schemas/BloodType' },
          address: { type: 'string', example: '742 Evergreen Terrace, Springfield' },
          emergencyContactName: { type: 'string', example: 'John Doe' },
          emergencyContactPhone: { type: 'string', example: '+1-555-0189' },
          medicalRecordNumber: {
            type: 'string',
            description: 'Optional custom MRN. If omitted, automatically generated.',
            example: 'MRN-20260827-4821',
          },
        },
      },
      UpdatePatientRequest: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phoneNumber: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { $ref: '#/components/schemas/Gender' },
          bloodType: { $ref: '#/components/schemas/BloodType' },
          address: { type: 'string' },
          emergencyContactName: { type: 'string' },
          emergencyContactPhone: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['System & Health'],
        summary: 'Root API metadata',
        description: 'Returns API server name, active version, status, and environment.',
        responses: {
          200: {
            description: 'API metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Healthcare ERP Backend API' },
                    version: { type: 'string', example: '1.0.1' },
                    environment: { type: 'string', example: 'development' },
                    status: { type: 'string', example: 'active' },
                    documentation: { type: 'string', example: '/docs' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        tags: ['System & Health'],
        summary: 'Health probe & database connectivity',
        description: 'Performs live database latency probe and checks service uptime.',
        responses: {
          200: {
            description: 'System healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', example: 124.5 },
                    environment: { type: 'string', example: 'development' },
                    database: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'connected' },
                        latencyMs: { type: 'number', example: 2.4 },
                      },
                    },
                  },
                },
              },
            },
          },
          503: {
            description: 'System degraded / Database unreachable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Users Domain'],
        summary: 'List users (paginated)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'role', in: 'query', schema: { $ref: '#/components/schemas/Role' } },
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/UserStatus' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Paginated user list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/UserResponse' },
                    },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Users Domain'],
        summary: 'Create a new user / staff account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserResponse' },
                    message: { type: 'string', example: 'User created successfully' },
                  },
                },
              },
            },
          },
          409: {
            description: 'Email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/users/{id}': {
      get: {
        tags: ['Users Domain'],
        summary: 'Get user by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'User found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserResponse' },
                  },
                },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Users Domain'],
        summary: 'Update user profile or status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/UserResponse' },
                  },
                },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users Domain'],
        summary: 'Soft-delete a user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'User soft-deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User deleted successfully' },
                  },
                },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/patients': {
      get: {
        tags: ['Patients Domain'],
        summary: 'List patients (paginated with search & filters)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'gender', in: 'query', schema: { $ref: '#/components/schemas/Gender' } },
          { name: 'bloodType', in: 'query', schema: { $ref: '#/components/schemas/BloodType' } },
          { name: 'search', in: 'query', description: 'Search by name, MRN, or email', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Paginated patients list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/PatientResponse' },
                    },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Patients Domain'],
        summary: 'Register a new patient',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePatientRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Patient registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/PatientResponse' },
                    message: { type: 'string', example: 'Patient registered successfully' },
                  },
                },
              },
            },
          },
          409: {
            description: 'Patient with email or MRN already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/patients/{id}': {
      get: {
        tags: ['Patients Domain'],
        summary: 'Get patient by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Patient found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/PatientResponse' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Patient not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      patch: {
        tags: ['Patients Domain'],
        summary: 'Update patient demographics or contact info',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePatientRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Patient record updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/PatientResponse' },
                    message: { type: 'string', example: 'Patient record updated successfully' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Patient not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Patients Domain'],
        summary: 'Soft-delete a patient record',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Patient soft-deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Patient record deleted successfully' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Patient not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/patients/mrn/{mrn}': {
      get: {
        tags: ['Patients Domain'],
        summary: 'Get patient by Medical Record Number (MRN)',
        parameters: [{ name: 'mrn', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Patient found by MRN',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/PatientResponse' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Patient with this MRN not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/telemetry': {
      get: {
        tags: ['System & Health'],
        summary: 'System telemetry & live vitals',
        description: 'Returns real-time memory usage (RSS, Heap), process uptime, database latency, and active entity counters.',
        responses: {
          200: {
            description: 'System telemetry vitals',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        system: { type: 'object' },
                        memory: { type: 'object' },
                        database: { type: 'object' },
                        entities: { type: 'object' },
                        architecture: { type: 'object' },
                        telemetryLatencyMs: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

export const docsRoute = new Hono()

// OpenAPI JSON Specification
docsRoute.get('/openapi.json', (c) => {
  return c.json(openApiSpec)
})

// Interactive Swagger UI
docsRoute.get(
  '/',
  swaggerUI({
    url: '/docs/openapi.json',
  })
)
