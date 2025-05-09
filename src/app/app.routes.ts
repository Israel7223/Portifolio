import { Routes, ExtraOptions } from '@angular/router';

/**
 * Configurações do router para habilitar rolagem suave para âncoras e fragmentos
 */
export const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',         // Ativa rolagem para âncoras
  scrollPositionRestoration: 'enabled', // Restaura posição de rolagem
  scrollOffset: [0, 75],              // Compensação de rolagem [x, y] - ajuste para a altura do cabeçalho
  onSameUrlNavigation: 'reload'       // Força renavegação em mesmo URL para fragmentos
};

/**
 * Rotas principais da aplicação com lazy loading para cada seção
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/components/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/components/about.component').then(m => m.AboutComponent),
    data: { preload: true }
  },
  {
    path: 'what-i-do',
    loadComponent: () => import('./features/what-i-do/components/what-i-do.component').then(m => m.WhatIDoComponent),
    data: { preload: true }
  },
  {
    path: 'resume',
    loadComponent: () => import('./features/resume/components/resume.component').then(m => m.ResumeComponent)
  },
  {
    path: 'project',
    loadComponent: () => import('./features/project/components/project.component').then(m => m.ProjectComponent),
    data: { preload: true }
  },
  {
    path: 'certificates',
    loadComponent: () => import('./features/certificates/components/certificates.component').then(m => m.CertificatesComponent),
    data: { preload: true }
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/components/contact.component').then(m => m.ContactComponent)
  },
  { path: '**', redirectTo: '' }
];
