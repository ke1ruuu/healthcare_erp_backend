import { Hono } from 'hono'
import { patientController } from './patient.controller'
import { validateBody, validateQuery } from '@/middlewares/validate.middleware'
import {
  createPatientSchema,
  updatePatientSchema,
  patientQuerySchema,
} from './patient.dto'

export const patientRoute = new Hono()

patientRoute.get('/', validateQuery(patientQuerySchema), (c) => patientController.listPatients(c))
patientRoute.get('/mrn/:mrn', (c) => patientController.getPatientByMRN(c))
patientRoute.get('/:id', (c) => patientController.getPatient(c))
patientRoute.post('/', validateBody(createPatientSchema), (c) => patientController.registerPatient(c))
patientRoute.patch('/:id', validateBody(updatePatientSchema), (c) => patientController.updatePatient(c))
patientRoute.delete('/:id', (c) => patientController.deletePatient(c))
