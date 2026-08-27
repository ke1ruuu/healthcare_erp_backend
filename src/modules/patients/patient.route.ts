import { Hono } from 'hono'
import { patientController } from './patient.controller'

export const patientRoute = new Hono()

patientRoute.get('/', (c) => patientController.listPatients(c))
patientRoute.get('/mrn/:mrn', (c) => patientController.getPatientByMRN(c))
patientRoute.get('/:id', (c) => patientController.getPatient(c))
patientRoute.post('/', (c) => patientController.registerPatient(c))
patientRoute.patch('/:id', (c) => patientController.updatePatient(c))
patientRoute.delete('/:id', (c) => patientController.deletePatient(c))
