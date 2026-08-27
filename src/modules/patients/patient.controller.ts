import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { patientService, type PatientService } from './patient.service'
import {
  createPatientSchema,
  updatePatientSchema,
  patientQuerySchema,
} from './patient.dto'
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
  sendNoContent,
} from '@/shared/utils/response.util'

export class PatientController {
  constructor(private readonly service: PatientService = patientService) {}

  async getPatient(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new HTTPException(400, { message: 'Patient ID is required' })
    }

    const patient = await this.service.getPatientById(id)
    return sendSuccess(c, patient)
  }

  async getPatientByMRN(c: Context) {
    const mrn = c.req.param('mrn')
    if (!mrn) {
      throw new HTTPException(400, { message: 'Medical Record Number is required' })
    }

    const patient = await this.service.getPatientByMRN(mrn)
    return sendSuccess(c, patient)
  }

  async listPatients(c: Context) {
    const rawQuery = c.req.query()
    const query = patientQuerySchema.parse(rawQuery)
    const result = await this.service.listPatients(query)

    return sendPaginated(c, result.patients, result.meta)
  }

  async registerPatient(c: Context) {
    const body = await c.req.json()
    const validated = createPatientSchema.parse(body)
    const userContext = c.get('user') as { id?: string } | undefined

    const patient = await this.service.registerPatient(validated, userContext?.id)
    return sendCreated(c, patient, 'Patient registered successfully')
  }

  async updatePatient(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new HTTPException(400, { message: 'Patient ID is required' })
    }

    const body = await c.req.json()
    const validated = updatePatientSchema.parse(body)
    const userContext = c.get('user') as { id?: string } | undefined

    const patient = await this.service.updatePatient(id, validated, userContext?.id)
    return sendSuccess(c, patient, 'Patient record updated successfully')
  }

  async deletePatient(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new HTTPException(400, { message: 'Patient ID is required' })
    }

    const userContext = c.get('user') as { id?: string } | undefined

    await this.service.deletePatient(id, userContext?.id)
    return sendNoContent(c, 'Patient record deleted successfully')
  }
}

export const patientController = new PatientController()
