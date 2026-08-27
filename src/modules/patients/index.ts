// Public API surface for the Patients Domain Module

export { patientService, PatientService } from './patient.service'
export { patientRoute } from './patient.route'
export type {
  CreatePatientDto,
  UpdatePatientDto,
  PatientQueryDto,
  PatientResponseDto,
} from './patient.dto'
export {
  createPatientSchema,
  updatePatientSchema,
  patientQuerySchema,
} from './patient.dto'
