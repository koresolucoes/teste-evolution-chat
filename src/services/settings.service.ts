import { Injectable, signal } from '@angular/core';

export interface ApiSettings {
  apiUrl: string;
  globalApiKey: string;
}

const SETTINGS_KEY = 'evolutionApiSettings';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settings = signal<ApiSettings>({ apiUrl: 'https://evo.zegnanutricion.com.mx', globalApiKey: '' });

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    if (typeof localStorage !== 'undefined') {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        this.settings.set(JSON.parse(savedSettings));
      }
    }
  }

  saveSettings(newSettings: ApiSettings): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      this.settings.set(newSettings);
    }
  }
}
