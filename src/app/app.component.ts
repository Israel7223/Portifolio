import { Component, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'portfolio-magaivin';
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: object
  ) {}
  
  // Ouvir eventos de rolagem para adicionar a classe de rolagem à visualização
  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      // Implementação de manipulação de rolagem se necessário
    }
  }
  
  // Ouvir mudanças no hash da URL
  @HostListener('window:hashchange', [])
  onHashChange() {
    if (isPlatformBrowser(this.platformId)) {
      // Implementação para lidar com mudanças de hash se necessário
    }
  }
}
