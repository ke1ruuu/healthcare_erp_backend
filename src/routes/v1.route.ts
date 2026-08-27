import { Hono } from 'hono'
import { userRoute } from '@/modules/users'
import { patientRoute } from '@/modules/patients'
import { telemetryRoute } from './telemetry.route'

export const v1Route = new Hono()

// v1 Root API Discovery / Metadata
v1Route.get('/', (c) => {
  return c.json({
    version: 'v1',
    status: 'active',
    description: 'Healthcare ERP Backend API Version 1.0',
    endpoints: {
      users: '/api/v1/users',
      patients: '/api/v1/patients',
      telemetry: '/api/v1/telemetry',
    },
  })
})

// Domain Module Route Mounts
v1Route.route('/users', userRoute)
v1Route.route('/patients', patientRoute)
v1Route.route('/telemetry', telemetryRoute)
