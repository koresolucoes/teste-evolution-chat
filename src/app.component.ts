
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  // FIX: Implement the main application layout.
  template: `
    <div class="flex h-screen bg-gray-100 font-sans">
      <app-sidebar></app-sidebar>
      <main class="flex-1 flex flex-col">
        <div class="p-8 flex-1 overflow-y-auto">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent],
})
export class AppComponent {}
