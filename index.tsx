import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { AppComponent } from './src/app.component';
import { NgZone, EventEmitter } from '@angular/core';

// This is a custom NoopNgZone implementation. It's used to run Angular
// in "zoneless" mode. This is necessary because the standard function for this,
// `provideZonelessChangeDetection`, is not found in the build environment,
// likely due to a dependency version mismatch or a caching issue.
// This manual provider achieves the same outcome.
// FIX: Correctly implement NgZone by adding missing methods and correcting existing ones.
class ManualNoopNgZone implements NgZone {
  readonly hasPendingMicrotasks = false;
  readonly hasPendingMacrotasks = false;
  readonly isStable = true;
  readonly onUnstable = new EventEmitter<any>(false);
  readonly onMicrotaskEmpty = new EventEmitter<any>(false);
  readonly onStable = new EventEmitter<any>(false);
  readonly onError = new EventEmitter<any>(false);

  run<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
    return fn.apply(applyThis, applyArgs);
  }

  runGuarded<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[]): T {
    return fn.apply(applyThis, applyArgs);
  }

  runOutsideAngular<T>(fn: (...args: any[]) => T): T {
    return fn();
  }

  runTask<T>(fn: (...args: any[]) => T, applyThis?: any, applyArgs?: any[], taskData?: any): T {
    return fn.apply(applyThis, applyArgs);
  }
}

// FIX: Import components for routing
import { DashboardComponent } from './src/components/dashboard/dashboard.component';
import { AgentsComponent } from './src/components/agents/agents.component';
import { PatientsComponent } from './src/components/patients/patients.component';
import { WhatsappComponent } from './src/components/whatsapp/whatsapp.component';
import { SettingsComponent } from './src/components/settings/settings.component';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: NgZone, useClass: ManualNoopNgZone },
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

// AI Studio always uses an `index.tsx` file for all project types$.

// AI Studio always uses an `index.tsx` file for all project types.
