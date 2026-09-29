import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar.component';
import { FooterComponent } from './components/footer.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="site-wrapper">
      <app-navbar></app-navbar>
      
      <main class="site-main">
        <router-outlet></router-outlet>
      </main>

      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .site-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .site-main {
      flex: 1;
    }
  `]
})
export class App {
  themeService = inject(ThemeService);
}
