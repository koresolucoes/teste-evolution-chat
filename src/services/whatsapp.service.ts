import { effect, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { WhatsappInstance } from '../models/whatsapp-instance.model';
import { EvolutionApiService } from './evolution-api.service';
import { firstValueFrom, interval, Subject, switchMap, takeUntil } from 'rxjs';

type ConnectionStatus = 'initial' | 'needs-config' | 'disconnected' | 'connecting' | 'connected' | 'error';

@Injectable({
  providedIn: 'root',
})
export class WhatsappService {
  private supabase = inject(SupabaseService);
  private evolutionApi = inject(EvolutionApiService);

  instance: WritableSignal<WhatsappInstance | null> = signal(null);
  status = signal<ConnectionStatus>('initial');
  qrCodeString = signal<string | null>(null);
  
  private stopPolling$ = new Subject<void>();
  private pollingInterval = 5000; // 5 seconds

  constructor() {
    this.loadInstance();
  }

  async loadInstance(): Promise<void> {
    this.status.set('initial');
    const instance = await this.supabase.getWhatsappInstance();
    this.instance.set(instance);

    if (!instance) {
      this.status.set('needs-config');
    } else {
      this.checkInitialConnectionStatus(instance);
    }
  }

  private async checkInitialConnectionStatus(instance: WhatsappInstance): Promise<void> {
    try {
      const connectionState = await firstValueFrom(
        this.evolutionApi.getConnectionState(instance.apikey, instance.instance_name)
      );
      if (connectionState?.instance.state === 'open') {
        this.status.set('connected');
      } else {
        this.status.set('disconnected');
      }
    } catch (e) {
      console.error('Error checking initial connection status', e);
      this.status.set('error');
    }
  }

  async connect(): Promise<void> {
    const instance = this.instance();
    if (!instance) {
      this.status.set('error');
      return;
    }
    
    this.status.set('connecting');
    this.qrCodeString.set(null);

    try {
      const response = await firstValueFrom(this.evolutionApi.connect(instance.apikey, instance.instance_name));
      if (response && response.code) {
        this.qrCodeString.set(response.code);
        this.startPolling();
      } else {
        this.status.set('error');
      }
    } catch (e) {
      console.error('Error connecting to WhatsApp:', e);
      this.status.set('error');
    }
  }

  async disconnect(): Promise<void> {
    const instance = this.instance();
    if (!instance) return;

    this.stopPolling();
    try {
      await firstValueFrom(this.evolutionApi.logout(instance.apikey, instance.instance_name));
      this.status.set('disconnected');
    } catch (e) {
      console.error('Error disconnecting:', e);
      this.status.set('error');
    }
  }

  private startPolling(): void {
    const instance = this.instance();
    if (!instance) return;

    this.stopPolling();

    interval(this.pollingInterval).pipe(
      takeUntil(this.stopPolling$),
      switchMap(() => this.evolutionApi.getConnectionState(instance.apikey, instance.instance_name))
    ).subscribe(state => {
      if (state?.instance.state === 'open') {
        this.status.set('connected');
        this.qrCodeString.set(null);
        this.stopPolling();
      }
    });
  }

  private stopPolling(): void {
    this.stopPolling$.next();
  }
}