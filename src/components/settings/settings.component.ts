import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { WhatsappService } from '../../services/whatsapp.service';
import { SettingsService } from '../../services/settings.service';
import { InstanceSetupService } from '../../services/instance-setup.service';

@Component({
  selector: 'app-settings',
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Configuración</h1>

      <div class="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <h2 class="text-2xl font-semibold text-gray-700 mb-2">Conexión a Evolution API</h2>
        <p class="text-gray-600 mb-6">
          Configura los parámetros para crear y conectar tu instancia de WhatsApp.
        </p>

        <form (submit)="saveSettings($event)">
          <!-- Global Settings -->
          <div class="p-4 border rounded-md mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">1. Credenciales Globales</h3>
             <div class="mb-4">
              <label for="apiUrl" class="block text-gray-700 text-sm font-bold mb-2">URL del Servidor API</label>
              <input 
                id="apiUrl" 
                type="text"
                [value]="apiUrl()"
                (input)="apiUrl.set($any($event.target).value)"
                placeholder="https://evo.example.com"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required>
            </div>
            <div class="mb-2">
              <label for="globalApiKey" class="block text-gray-700 text-sm font-bold mb-2">API Key Global</label>
              <input 
                id="globalApiKey" 
                type="password"
                [value]="globalApiKey()"
                (input)="globalApiKey.set($any($event.target).value)"
                placeholder="Clave para crear instancias"
                class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required>
            </div>
          </div>

          <!-- Instance Settings -->
          <div class="p-4 border rounded-md mb-6">
             <h3 class="text-lg font-semibold text-gray-800 mb-2">2. Datos de la Instancia</h3>
             <div class="mb-2">
                <label for="instanceName" class="block text-gray-700 text-sm font-bold mb-2">Nombre de la Instancia</label>
                <input 
                  id="instanceName" 
                  type="text"
                  [value]="instanceName()"
                  (input)="instanceName.set($any($event.target).value)"
                  placeholder="clinica-zegna-whatsapp"
                  class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required>
                <p class="text-xs text-gray-500 mt-1">Este nombre será usado para crear la instancia en Evolution API. Si ya existe, se actualizarán sus datos.</p>
              </div>
          </div>


          <div class="flex items-center justify-between">
            <button 
              type="submit"
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors disabled:bg-blue-300"
              [disabled]="isSaving()">
              @if (isSaving()) {
                <span class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Guardando...
                </span>
              } @else {
                <span>Guardar y Crear Instancia</span>
              }
            </button>
            @if (saveStatus().status === 'success') {
              <span class="text-green-600 font-semibold">{{ saveStatus().message || '¡Instancia guardada con éxito!' }}</span>
            }
            @if (saveStatus().status === 'error') {
              <span class="text-red-600 font-semibold text-sm text-right">{{ saveStatus().message }}</span>
            }
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private whatsappService = inject(WhatsappService);
  private settingsService = inject(SettingsService);
  private instanceSetupService = inject(InstanceSetupService);

  // Global settings
  apiUrl = signal('');
  globalApiKey = signal('');
  
  // Instance settings
  instanceName = signal('');
  
  isSaving = signal(false);
  saveStatus = signal<{ status: 'idle' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  ngOnInit(): void {
    const globalSettings = this.settingsService.settings();
    this.apiUrl.set(globalSettings.apiUrl);
    this.globalApiKey.set(globalSettings.globalApiKey);

    const existingInstance = this.whatsappService.instance();
    if (existingInstance) {
        this.instanceName.set(existingInstance.instance_name);
    }
  }

  async saveSettings(event: Event): Promise<void> {
    event.preventDefault();
    this.isSaving.set(true);
    this.saveStatus.set({ status: 'idle' });

    // 1. Save global settings to localStorage
    this.settingsService.saveSettings({
      apiUrl: this.apiUrl(),
      globalApiKey: this.globalApiKey(),
    });

    const currentInstance = this.whatsappService.instance();
    // If instance name hasn't changed, we assume we're just updating global settings
    if (currentInstance && currentInstance.instance_name === this.instanceName()) {
        this.saveStatus.set({ status: 'success', message: 'Configuración global guardada.' });
        this.isSaving.set(false);
        await this.whatsappService.loadInstance(); 
        return;
    }

    // Proceed to create/re-create instance via the new service
    try {
      await this.instanceSetupService.setupInstance(
        this.globalApiKey(), 
        this.instanceName()
      );
      this.saveStatus.set({ status: 'success' });
    } catch(e: any) {
      console.error('Error in SettingsComponent while saving:', e);
      this.saveStatus.set({ status: 'error', message: e.message || 'Ocurrió un error inesperado.' });
    } finally {
      this.isSaving.set(false);
    }
  }
}