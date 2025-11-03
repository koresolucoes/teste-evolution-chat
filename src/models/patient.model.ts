export interface Patient {
  id?: string;
  patientCode: string;
  fullName: string;
  phone: string;
  lastConsultation: string;
  medicalHistoryNotes: string;
  createdAt?: string;
}