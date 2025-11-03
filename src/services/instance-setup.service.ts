import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { WhatsappInstance } from '../models/whatsapp-instance.model';
import { WhatsappService } from './whatsapp.service';
import { EvolutionApiService } from './evolution-api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InstanceSetupService {
  private supabase = inject(SupabaseService);
  private whatsappService = inject(WhatsappService);
  private evolutionApi = inject(EvolutionApiService);

  async setupInstance(globalApiKey: string, instanceName: string): Promise<void> {
    console.log('[InstanceSetup] Iniciando el proceso de configuración de la instancia.');
    console.log(`[InstanceSetup] Parámetros: instanceName=${instanceName}`);

    try {
      // Step 1: Create instance in Evolution API
      console.log('[InstanceSetup] Paso 1: Creando instancia en Evolution API...');
      const response = await firstValueFrom(
        this.evolutionApi.createInstance(globalApiKey, instanceName)
      ).catch(error => {
        console.error('[InstanceSetup] ERROR en la llamada a Evolution API. Payload de error:', error);
        throw new Error('Error al comunicarse con la API de Evolution. Ver la consola para más detalles.');
      });
      
      console.log('[InstanceSetup] Payload de respuesta de Evolution API:', response);

      if (response?.hash && typeof response.hash === 'string') {
        console.log('[InstanceSetup] La respuesta de la API es válida y contiene una apikey en la propiedad hash.');
        
        // Step 2: Save instance-specific data to Supabase
        // FIX: Updated Omit type to use 'createdAt' to match the model update.
        const instanceData: Omit<WhatsappInstance, 'id' | 'createdAt'> = {
          instance_name: response.instance.instanceName,
          apikey: response.hash,
          status: 'created',
        };

        console.log('[InstanceSetup] Paso 2: Guardando datos de la instancia en Supabase. Payload a guardar:', instanceData);
        const savedInstance = await this.supabase.saveWhatsappInstance(instanceData);
        
        if (savedInstance) {
          console.log('[InstanceSetup] Instancia guardada exitosamente en Supabase. Respuesta:', savedInstance);
          
          // Step 3: Reload instance data in the app state
          console.log('[InstanceSetup] Paso 3: Recargando la instancia en el estado de la aplicación.');
          await this.whatsappService.loadInstance();
          console.log('[InstanceSetup] Proceso de configuración completado con éxito.');
        } else {
            const dbError = 'No se pudo guardar la instancia en la base de datos.';
            console.error(`[InstanceSetup] ERROR: ${dbError}`);
            throw new Error(dbError);
        }

      } else {
        console.warn('[InstanceSetup] La respuesta de la API de Evolution no contiene la apikey esperada en la propiedad `hash`.');
        if (response?.instance?.instanceName) {
            const specificError = `La instancia "${instanceName}" se creó o ya existía, pero la API no devolvió la clave necesaria. Esto puede ocurrir si el nombre de la instancia ya está en uso. Por favor, pruebe con un nombre diferente.`;
            console.error(`[InstanceSetup] ERROR: ${specificError}`);
            throw new Error(specificError);
        } else {
            const genericError = 'Respuesta inválida de la API de Evolution. La instancia puede haber sido creada, pero no se recibió la clave API para continuar.';
            console.error(`[InstanceSetup] ERROR: ${genericError}`);
            throw new Error(genericError);
        }
      }

    } catch(e: any) {
      console.error('[InstanceSetup] Error final en el proceso de configuración:', e);
      // Re-throw the error so the component can catch it
      throw e;
    }
  }
}