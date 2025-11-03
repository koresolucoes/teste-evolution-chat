
import { ChangeDetectionStrategy, Component, inject, signal, WritableSignal, computed } from '@angular/core';
import { Agent } from '../../models/agent.model';
import { GeminiService } from '../../services/gemini.service';
import { SupabaseService } from '../../services/supabase.service';

const NEW_AGENT_TEMPLATE: Omit<Agent, 'id' | 'created_at'> = {
  name: '',
  description: '',
  status: 'inactive',
  system_prompt: '',
  knowledge_base_files: []
};

@Component({
  selector: 'app-agents',
  // FIX: Converted to inline template
  template: `
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Agentes de IA</h1>
        <button (click)="openNewAgentModal()" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors">
          + Nuevo Agente
        </button>
      </div>

      @if (isLoading()) {
        <div class="flex justify-center items-center p-8 bg-white shadow-md rounded-lg">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p class="ml-4 text-gray-600">Cargando agentes...</p>
        </div>
      } @else if (loadingError()) {
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
          <p class="font-bold">Error al Cargar Agentes</p>
          <p>{{ loadingError() }}</p>
        </div>
      } @else {
        <div class="bg-white shadow-md rounded-lg overflow-hidden">
          <table class="min-w-full leading-normal">
            <thead>
              <tr>
                <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th class="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
              </tr>
            </thead>
            <tbody>
              @for (agent of agents(); track agent.id) {
                <tr>
                  <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                    <p class="text-gray-900 whitespace-no-wrap">{{ agent.name }}</p>
                  </td>
                  <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                    <p class="text-gray-900 whitespace-no-wrap max-w-xs truncate">{{ agent.description }}</p>
                  </td>
                  <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                    <span class="relative inline-block px-3 py-1 font-semibold leading-tight"
                      [class]="agent.status === 'active' ? 'text-green-900' : 'text-gray-700'">
                      <span aria-hidden="true" class="absolute inset-0 rounded-full"
                        [class]="agent.status === 'active' ? 'bg-green-200 opacity-50' : 'bg-gray-200 opacity-50'"></span>
                      <span class="relative">{{ agent.status === 'active' ? 'Activo' : 'Inactivo' }}</span>
                    </span>
                  </td>
                  <td class="px-5 py-4 border-b border-gray-200 bg-white text-sm text-right">
                    <button (click)="openTestModal(agent)" class="text-indigo-600 hover:text-indigo-900 mr-4">Probar</button>
                    <button (click)="openEditAgentModal(agent)" class="text-indigo-600 hover:text-indigo-900">Editar</button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="text-center py-10 text-gray-500">
                    No se han creado agentes todavía.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
    
    <!-- Test Modal -->
    @if (isTestModalOpen()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 z-40" (click)="closeTestModal()"></div>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
          <div class="p-6 border-b">
            <h3 class="text-xl font-semibold text-gray-800">Probar Agente: {{ selectedAgentForTest()?.name }}</h3>
          </div>
          <div class="p-6">
            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">Mensaje del Usuario:</label>
              <textarea [value]="testUserMessage()" (input)="onTestUserMessageChange($event)" rows="3" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Escribe un mensaje de prueba..."></textarea>
            </div>
            @if (isLoadingTest()) {
              <div class="bg-gray-100 p-4 rounded-md">
                <div class="flex items-center">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-3"></div>
                  <span class="text-gray-600">Generando respuesta...</span>
                </div>
              </div>
            }
            @if(testResponse()) {
              <div class="bg-blue-50 p-4 rounded-md mt-4">
                 <p class="text-sm font-semibold text-blue-800 mb-2">Respuesta del Agente:</p>
                 <p class="text-gray-700 whitespace-pre-wrap">{{ testResponse() }}</p>
              </div>
            }
          </div>
          <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-2">
            <button (click)="closeTestModal()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Cerrar</button>
            <button (click)="sendTestMessage()" [disabled]="!testUserMessage() || isLoadingTest()" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300">Enviar</button>
          </div>
        </div>
      </div>
    }

    <!-- Create/Edit Agent Modal -->
    @if (isAgentModalOpen() && editingAgent()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 z-40" (click)="closeAgentModal()"></div>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
          <form (submit)="$event.preventDefault(); saveAgent()">
            <div class="p-6 border-b">
              <h3 class="text-xl font-semibold text-gray-800">{{ isEditing() ? 'Editar' : 'Nuevo' }} Agente</h3>
            </div>
            <div class="p-6 max-h-[70vh] overflow-y-auto">
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
                    <input type="text" [value]="editingAgent()!.name" (input)="onAgentFormChange('name', $any($event.target).value)" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
                    <input type="text" [value]="editingAgent()!.description" (input)="onAgentFormChange('description', $any($event.target).value)" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required>
                </div>
                 <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">Estado</label>
                    <select [value]="editingAgent()!.status" (change)="onAgentFormChange('status', $any($event.target).value)" class="shadow border rounded w-full py-2 px-3 text-gray-700">
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2">System Prompt</label>
                    <textarea rows="8" [value]="editingAgent()!.system_prompt" (input)="onAgentFormChange('system_prompt', $any($event.target).value)" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 font-mono text-sm" required></textarea>
                </div>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-2">
              <button type="button" (click)="closeAgentModal()" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">Cancelar</button>
              <button type="submit" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsComponent {
  private geminiService = inject(GeminiService);
  private supabaseService = inject(SupabaseService);

  agents = signal<Agent[]>([]);
  isLoading = signal(true);
  loadingError = signal<string | null>(null);

  // Test Modal State
  isTestModalOpen = signal(false);
  selectedAgentForTest = signal<Agent | null>(null);
  testUserMessage = signal('');
  testResponse = signal<string | null>(null);
  isLoadingTest = signal(false);

  // Edit/Create Modal State
  isAgentModalOpen = signal(false);
  editingAgent: WritableSignal<Omit<Agent, 'id' | 'created_at'> | Agent | null> = signal(null);
  isEditing = computed(() => {
    const agent = this.editingAgent();
    return !!agent && 'id' in agent;
  });

  constructor() {
    this.loadAgents();
  }

  async loadAgents(): Promise<void> {
    this.isLoading.set(true);
    this.loadingError.set(null);
    try {
      const agents = await this.supabaseService.getAgents();
      this.agents.set(agents);
    } catch (e: any) {
      this.loadingError.set('No se pudieron cargar los agentes. Verifique la conexión y la configuración.');
      console.error(e);
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- Test Modal Methods ---

  openTestModal(agent: Agent): void {
    this.selectedAgentForTest.set(agent);
    this.isTestModalOpen.set(true);
    this.testResponse.set(null);
    this.testUserMessage.set('');
  }

  closeTestModal(): void {
    this.isTestModalOpen.set(false);
    this.selectedAgentForTest.set(null);
  }

  onTestUserMessageChange(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    this.testUserMessage.set(input.value);
  }

  async sendTestMessage(): Promise<void> {
    if (!this.testUserMessage() || !this.selectedAgentForTest()) {
      return;
    }

    this.isLoadingTest.set(true);
    this.testResponse.set(null);

    const agent = this.selectedAgentForTest()!;
    const response = await this.geminiService.generateTestResponse(agent.system_prompt, this.testUserMessage());

    this.testResponse.set(response);
    this.isLoadingTest.set(false);
  }

  // --- Create/Edit Modal Methods ---

  openNewAgentModal(): void {
    this.editingAgent.set({ ...NEW_AGENT_TEMPLATE });
    this.isAgentModalOpen.set(true);
  }

  openEditAgentModal(agent: Agent): void {
    this.editingAgent.set({ ...agent }); // Create a copy for editing
    this.isAgentModalOpen.set(true);
  }

  closeAgentModal(): void {
    this.isAgentModalOpen.set(false);
    this.editingAgent.set(null);
  }

  async saveAgent(): Promise<void> {
    const agentData = this.editingAgent();
    if (!agentData) return;

    if ('id' in agentData) { // Editing existing agent
      await this.supabaseService.updateAgent(agentData as Agent);
    } else { // Creating new agent
      await this.supabaseService.addAgent(agentData);
    }
    
    await this.loadAgents();
    this.closeAgentModal();
  }

  onAgentFormChange(field: keyof Omit<Agent, 'id' | 'created_at'>, value: string | string[]): void {
    this.editingAgent.update(agent => {
      if (!agent) return null;
      return { ...agent, [field]: value };
    });
  }
}
