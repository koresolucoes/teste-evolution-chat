export interface Patient {
  id?: string;
  patient_code: string;
  full_name: string;
  phone: string;
  last_consultation: string;
  medical_history_notes: string;
  created_at?: string;
}
