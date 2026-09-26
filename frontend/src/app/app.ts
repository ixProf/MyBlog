import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from './components/navbar.component';
import { FooterComponent } from './components/footer.component';
import { LoginModalComponent } from './components/login-modal.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, LoginModalComponent],
  template: `
    <div class="site-wrapper">
      <app-navbar></app-navbar>
      
      <main class="site-main">
        <router-outlet></router-outlet>
      </main>

      <app-footer></app-footer>

      <!-- Prof Login Modal -->
      <app-login-modal></app-login-modal>
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
export class App implements OnInit {
  private route = inject(ActivatedRoute);
  themeService = inject(ThemeService);

  ngOnInit(): void {
    // Check if ?login=true was passed in URL to trigger login modal automatically
    this.route.queryParamMap.subscribe(params => {
      if (params.get('login') === 'true') {
        window.dispatchEvent(new CustomEvent('callmeprof-open-login'));
      }
    });
  }
}
