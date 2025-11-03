
import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { AppComponent } from './src/app.component';
import { provideZonelessChangeDetection } from '@angular/core';

// FIX: Import components for routing
import { DashboardComponent } from './src/components/dashboard/dashboard.component';
import { AgentsComponent } from './src/components/agents/agents.component';
import { PatientsComponent } from './src/components/patients/patients.component';
import { WhatsappComponent } from './src/components/whatsapp/whatsapp.component';
import { SettingsComponent } from './src/components/settings/settings.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient(),
    // FIX: Add router configuration
    provideRouter([
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'agents', component: AgentsComponent },
      { path: 'patients', component: PatientsComponent },
      { path: 'whatsapp', component: WhatsappComponent },
      { path: 'settings', component: SettingsComponent },
    ], withHashLocation()),
  ],
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.