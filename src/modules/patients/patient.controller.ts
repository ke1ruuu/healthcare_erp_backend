import type { Context } from 'hono'
import { patientService, type PatientService } from './patient.service'
import {
  createPatientSchema,
  updatePatientSchema,
  patientQuerySchema,
  type CreatePatientDto,
  type UpdatePatientDto,
  type PatientQueryDto,
} from './patient.dto'
import {
  sendCreated,
  sendPaginated,
  sendSuccess,
  sendNoContent,
} from '@/shared/utils/response.util'
import { NotFoundException } from '@/shared/exceptions/app.exception'

export class PatientController {
  constructor(private readonly service: PatientService = patientService) {}

  async getPatient(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new NotFoundException('Patient ID is required')
    }
    const patient = await this.service.getPatientById(id)
    return sendSuccess(c, patient)
  }

  async getPatientByMRN(c: Context) {
    const mrn = c.req.param('mrn')
    if (!mrn) {
      throw new NotFoundException('Medical Record Number is required')
    }
    const patient = await this.service.getPatientByMRN(mrn)
    return sendSuccess(c, patient)
  }

  async listPatients(c: Context) {
    const validated = c.get('validatedQuery') as PatientQueryDto | undefined
    const query = validated ?? patientQuerySchema.parse(c.req.query())
    const result = await this.service.listPatients(query)
    return sendPaginated(c, result.patients, result.meta)
  }

  async registerPatient(c: Context) {
    const validated = c.get('validatedBody') as CreatePatientDto | undefined
    const body = validated ?? createPatientSchema.parse(await c.req.json())
    const userContext = c.get('user') as { id?: string } | undefined

    const patient = await this.service.registerPatient(body, userContext?.id)
    return sendCreated(c, patient, 'Patient registered successfully')
  }

  async updatePatient(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new NotFoundException('Patient ID is required')
    }
    const validated = c.get('validatedBody') as UpdatePatientDto | undefined
    const body = validated ?? updatePatientSchema.parse(await c.req.json())
    const userContext = c.get('user') as { id?: string } | undefined

    const patient = await this.service.updatePatient(id, body, userContext?.id)
    return sendSuccess(c, patient, 'Patient record updated successfully')
  }

  async deletePatient(c: Context) {
    const id = c.req.param('id')
    if (!id) {
      throw new NotFoundException('Patient ID is required')
    }
    const userContext = c.get('user') as { id?: string } | undefined

    await this.service.deletePatient(id, userContext?.id)
    return sendNoContent(c, 'Patient record deleted successfully')
  }
}

export const patientController = new PatientController()
