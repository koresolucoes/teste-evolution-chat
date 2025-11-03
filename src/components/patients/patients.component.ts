import { ChangeDetectionStrategy, Component, signal, WritableSignal, inject, computed } from '@angular/core';
import { Patient } from '../../models/patient.model';
import { SupabaseService } from '../../services/supabase.service';

const NEW_PATIENT_TEMPLATE: Omit<Patient, 'patientCode' | 'id' | 'createdAt'> = {
  fullName: '',
  phone: '',
  lastConsultation: new Date().toISOString().split('T')[0], // Today's date
  medicalHistoryNotes: '',
};

@Component({
  selector: 'app-patients',
  // FIX: Converted to inline template
  template: `
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Pacientes</h1>
        <div class="flex items-center space-x-4">
          <input 
            type="text"
            [value]="searchTerm()"
            (input)="onSearch($event)" 
            placeholder="Buscar por nombre, código o teléfono..."
            class="shadow-sm appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-64">
          <button (click)="openNewPatientModal()" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors">
            + Nuevo Paciente
          </button>
        </div>
      </div>

      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <table class="min-w-full leading-normal">
          <thead>
            <tr>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código</th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre Completo</th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Teléfono</th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Última Consulta</th>
              <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            @for (patient of filteredPatients(); track patient.id) {
              <tr>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                  <p class="text-gray-900 whitespace-no-wrap">{{ patient.patientCode }}</p>
                </td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                  <p class="text-gray-900 whitespace-no-wrap">{{ patient.fullName }}</p>
                </td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                  <p class="text-gray-900 whitespace-no-wrap">{{ patient.phone }}</p>
                </td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                  <p class="text-gray-900 whitespace-no-wrap">{{ patient.lastConsultation }}</p>
                </td>
                <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm text-right">
                  <button (click)="openViewPatientModal(patient)" class="text-indigo-600 hover:text-indigo-900">Ver Detalles</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="text-center py-10 text-gray-500">No se encontraron pacientes.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Patient Modal -->
    @if (modalMode() !== 'hidden' && activePatient()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 z-40" (click)="closeModal()"></div>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
          <form (submit)="$event.preventDefault(); savePatient()">
            <div class="p-6 border-b">
              <h3 class="text-xl font-semibold text-gray-800">
                @if (modalMode() === 'create') { Nuevo Paciente }
                @if (modalMode() === 'view') { Detalles del Paciente }
              </h3>
            </div>
            <div class="p-6 max-h-[70vh] overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Código de Paciente</label>
                        <input type="text" [value]="activePatient()!.patientCode" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-200" readonly>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Nombre Completo</label>
                        <input type="text" [value]="activePatient()!.fullName" (input)="onPatientFormChange('fullName', $any($event.target).value)" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" [readonly]="modalMode() === 'view'">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Teléfono</label>
                        <input type="text" [value]="activePatient()!.phone" (input)="onPatientFormChange('phone', $any($event.target).value)" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" [readonly]="modalMode() === 'view'">
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">Última Consulta</label>
                        <input type="date" [value]="activePatient()!.lastConsultation" (input)="onPatientFormChange('lastConsultation', $any($event.target).value)" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" [readonly]="modalMode() === 'view'">
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Historial Médico</label>
                    <textarea rows="5" [value]="activePatient()!.medicalHistoryNotes" (input)="onPatientFormChange('medicalHistoryNotes', $any($event.target).value)" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" [readonly]="modalMode() === 'view'"></textarea>
                </div>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-2">
              <button type="button" (click)="closeModal()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Cerrar</button>
              @if (modalMode() === 'create') {
                <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Guardar Paciente</button>
              }
            </div>
          </form>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientsComponent {
  private supabaseService = inject(SupabaseService);

  patients = signal<Patient[]>([]);
  searchTerm = signal('');
  
  modalMode = signal<'hidden' | 'view' | 'create'>('hidden');
  activePatient: WritableSignal<Patient | null> = signal(null);

  filteredPatients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.patients();
    }
    return this.patients().filter(p =>
      p.fullName.toLowerCase().includes(term) ||
      p.patientCode.toLowerCase().includes(term) ||
      p.phone.includes(term)
    );
  });

  constructor() {
    this.loadPatients();
  }

  async loadPatients(): Promise<void> {
    const patients = await this.supabaseService.getPatients();
    this.patients.set(patients);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  openNewPatientModal(): void {
    const newPatient = {
      patientCode: `ZN-${Math.floor(1000 + Math.random() * 9000)}`,
      ...NEW_PATIENT_TEMPLATE
    };
    this.activePatient.set(newPatient as Patient);
    this.modalMode.set('create');
  }

  openViewPatientModal(patient: Patient): void {
    this.activePatient.set(patient);
    this.modalMode.set('view');
  }

  closeModal(): void {
    this.modalMode.set('hidden');
    this.activePatient.set(null);
  }

  onPatientFormChange(field: keyof Omit<Patient, 'id' | 'createdAt'>, value: string): void {
    this.activePatient.update(patient => {
      if (!patient) return null;
      return { ...patient, [field]: value };
    });
  }

  async savePatient(): Promise<void> {
    const patientData = this.activePatient();
    if (!patientData || this.modalMode() !== 'create') return;
    
    await this.supabaseService.addPatient(patientData);
    await this.loadPatients();
    this.closeModal();
  }
}