import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed } from '@angular/core';
import { WhatsappService } from '../../services/whatsapp.service';
import { SettingsService } from '../../services/settings.service';
import { InstanceSetupService } from '../../services/instance-setup.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-settings',
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Configuración</h1>

      <div class="bg-white p-8 rounded-lg shadow-md max-w-3xl mx-auto">
        <h2 class="text-2xl font-semibold text-gray-700 mb-2">Conexión a Evolution API</h2>
        <p class="text-gray-600 mb-6">
          Configura los parámetros para crear y conectar tu instancia de WhatsApp.
        </p>

        <form (submit)="saveSettings($event)">
          <!-- Global Settings -->
          <div class="p-4 border rounded-md mb-6 bg-gray-50">
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
          <div class="p-4 border rounded-md mb-6 bg-gray-50">
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


          <div class="flex items-center justify-between mb-8">
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

        <!-- Webhook Settings -->
        @if (whatsappService.instance()) {
          <div class="p-4 border rounded-md mb-6 bg-gray-50">
            <h3 class="text-lg font-semibold text-gray-800 mb-2">3. Configuración del Webhook (Vercel)</h3>
            <p class="text-sm text-gray-600 mb-4">Usa estos valores para configurar el webhook en tu instancia de Evolution API y recibir mensajes de pacientes automáticamente.</p>

            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">Webhook URL</label>
              <div class="flex">
                <input type="text" [value]="webhookUrl()" readonly class="flex-grow shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-500 bg-gray-200 leading-tight focus:outline-none">
                <button type="button" (click)="copyToClipboard(webhookUrl())" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r">Copiar</button>
              </div>
               <p class="text-xs text-gray-500 mt-1">Esta URL se genera automáticamente basada en el estándar de Vercel. Asegúrate de que tu dominio sea correcto.</p>
            </div>

            <div class="mb-4">
              <label class="block text-gray-700 text-sm font-bold mb-2">Webhook Secret</label>
              <div class="flex">
                <input type="text" [value]="webhookSecret() || 'Genera un secreto para continuar'" readonly class="flex-grow shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-500 bg-gray-200 leading-tight focus:outline-none">
                <button type="button" (click)="copyToClipboard(webhookSecret()!)" [disabled]="!webhookSecret()" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 disabled:opacity-50">Copiar</button>
                <button type="button" (click)="generateNewSecret()" class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-r ml-1">Generar Nuevo</button>
              </div>
            </div>

            <div class="mt-6">
                <label class="block text-gray-700 text-sm font-bold mb-2">Código de la Función del Webhook</label>
                 <p class="text-xs text-gray-500 mt-2 mb-2">
                  El código para el webhook ya ha sido añadido a tu proyecto en la carpeta <code>/api</code>. Solo necesitas configurar las variables de entorno en Vercel.
                </p>
                 <p class="text-xs text-gray-500 mt-2">
                  <b>Instrucciones de Despliegue en Vercel:</b><br>
                  1. Conecta tu repositorio a Vercel y despliega el proyecto.<br>
                  2. Ve a la configuración de tu proyecto en Vercel (Settings -> Environment Variables).<br>
                  3. Añade las siguientes variables de entorno: <code>GEMINI_API_KEY</code>, <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, y <code>EVOLUTION_API_URL</code> (la misma URL del servidor que configuraste arriba).<br>
                  4. Vercel desplegará automáticamente la función en la URL mostrada arriba. ¡Tu endpoint estará listo!
                </p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  whatsappService = inject(WhatsappService);
  private settingsService = inject(SettingsService);
  private instanceSetupService = inject(InstanceSetupService);
  private supabaseService = inject(SupabaseService);

  // Global settings
  apiUrl = signal('');
  globalApiKey = signal('');
  
  // Instance settings
  instanceName = signal('');
  
  isSaving = signal(false);
  saveStatus = signal<{ status: 'idle' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  // Webhook properties
  webhookSecret = signal<string | null>(null);
  
  // Dynamically determine Vercel URL
  vercelUrl = signal(this.getVercelUrl());
  webhookUrl = computed(() => `${this.vercelUrl()}/api/webhook`);

  private getVercelUrl(): string {
    // In a real Vercel environment, process.env.VERCEL_URL would be available.
    // We'll simulate it for local development or fallback.
    if (typeof window !== 'undefined') {
        const host = window.location.host;
        if (host.includes('vercel.app')) {
            return `https://${host}`;
        }
    }
    // Fallback for local dev or other environments. User might need to change this.
    return 'https://<tu-proyecto>.vercel.app';
  }


  ngOnInit(): void {
    const globalSettings = this.settingsService.settings();
    this.apiUrl.set(globalSettings.apiUrl);
    this.globalApiKey.set(globalSettings.globalApiKey);

    const existingInstance = this.whatsappService.instance();
    if (existingInstance) {
        this.instanceName.set(existingInstance.instance_name);
        this.webhookSecret.set(existingInstance.webhook_secret || null);
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

  async generateNewSecret(): Promise<void> {
    const instance = this.whatsappService.instance();
    if (!instance) return;

    const updatedInstance = await this.supabaseService.updateWebhookSecret(instance.instance_name);
    if (updatedInstance) {
      this.whatsappService.instance.set(updatedInstance);
      this.webhookSecret.set(updatedInstance.webhook_secret || null);
    }
  }

  copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy text: ', err));
    }
  }
}