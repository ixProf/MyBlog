import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { BlogComponent } from './pages/blog.component';
import { BlogDetailComponent } from './pages/blog-detail.component';
import { AcademicNotesComponent } from './pages/academic-notes.component';
import { AskComponent } from './pages/ask.component';
import { AnswerDetailComponent } from './pages/answer-detail.component';
import { AskAboutComponent } from './pages/ask-about.component';
import { AdminDashboardComponent } from './pages/admin-dashboard.component';
import { PortfolioComponent } from './pages/portfolio.component';
import { AdminEditorComponent } from './pages/admin-editor.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Call Me Prof — Mahmoud Sayed Mohamed | Backend .NET Developer' },
  { path: 'blog', component: BlogComponent, title: 'Blog — Call Me Prof' },
  { path: 'blog/:slug', component: BlogDetailComponent, title: 'Article — Call Me Prof' },
  { path: 'notes', component: AcademicNotesComponent, title: 'Academic Notes — Call Me Prof' },
  
  // Ask Prof Routes
  { path: 'ask', component: AskComponent, title: 'Ask Prof — Public Q&A' },
  { path: 'ask/about', component: AskAboutComponent, title: 'About Prof — Ask Prof' },
  { path: 'ask/answers/:id', component: AnswerDetailComponent, title: 'Verified Answer — Ask Prof' },
  { path: 'answers/:id', redirectTo: 'ask/answers/:id' },
  { path: 'ask/login', redirectTo: 'ask' },
  { path: 'ask/admin', redirectTo: 'ask' },

  { path: 'portfolio', component: PortfolioComponent, title: 'Portfolio — Mahmoud Sayed Mohamed (Prof)' },
  
  // Secret Standalone Admin Console
  { path: 'patrickjean', component: AdminDashboardComponent, title: 'Console — Prof' },
  { path: 'editor', component: AdminEditorComponent, canActivate: [authGuard], title: 'Studio — Call Me Prof' },
  { path: '**', redirectTo: '' }
];
