import { Injectable, Inject, PLATFORM_ID, Renderer2, RendererFactory2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private renderer: Renderer2;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Rola a página para a seção especificada com efeito visual
   */
  scrollToSection(section: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Caso especial para o Home
    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.updateActiveNavLink(section);
      return;
    }
    
    // Para outras seções
    const sectionId = this.getSectionId(section);
    
    const targetElement = document.getElementById(sectionId);
    
    if (!targetElement) {
      return;
    }
    
    // Calcular posição com ajuste para o header
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    
    try {
      // Tentar primeiro método de rolagem: scrollTo animado manualmente (estilo jQuery)
      
      const rect = targetElement.getBoundingClientRect();
      const targetPosition = window.pageYOffset + rect.top - headerHeight - 20;
      
      // Implementar uma animação de rolagem manualmente
      this.animateScroll(targetPosition);
      
      // Atualizar URL e destacar link no menu sem aplicar o efeito visual
      setTimeout(() => {
        history.pushState(null, '', `#${sectionId}`);
        this.updateActiveNavLink(section);
      }, 800);
    } catch {
      // Tentar método de fallback se falhar
      this.fallbackScroll(targetElement, headerHeight);
      this.updateActiveNavLink(section);
    }
  }
  
  /**
   * Anima a rolagem manualmente para maior compatibilidade
   */
  private animateScroll(targetPosition: number): void {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 800; // duração em ms
    let startTime: number | null = null;
    
    // Função de atenuação
    const easeOutCubic = (t: number) => {
      return 1 - Math.pow(1 - t, 3);
    };
    
    // Função de animação
    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeProgress = easeOutCubic(progress);
      
      window.scrollTo(0, startPosition + distance * easeProgress);
      
      if (timeElapsed < duration) {
        window.requestAnimationFrame(animation);
      }
    };
    
    window.requestAnimationFrame(animation);
  }
  
  /**
   * Método de fallback para scroll caso os métodos principais falhem
   */
  private fallbackScroll(element: HTMLElement, headerHeight: number): void {
    try {
      // Tentar scrollIntoView
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Ajustar para o header após um momento
      setTimeout(() => {
        if (headerHeight > 0) {
          window.scrollBy({
            top: -headerHeight - 20,
            behavior: 'smooth'
          });
        }
      }, 100);
    } catch {
      // Último recurso: rolagem direta
      const rect = element.getBoundingClientRect();
      const targetPosition = window.pageYOffset + rect.top - headerHeight - 20;
      window.scrollTo(0, targetPosition);
    }
  }
  
  /**
   * Obtém o ID da seção a partir do nome
   */
  private getSectionId(section: string): string {
    // Mapeamento especial para 'whatIDo' -> 'what-i-do'
    if (section === 'whatIDo') {
      return 'what-i-do';
    }
    return section.toLowerCase();
  }
  
  /**
   * Atualiza o link ativo no menu de navegação
   */
  private updateActiveNavLink(section: string): void {
    const sectionId = this.getSectionId(section);
    
    // Tentar encontrar o link de várias maneiras
    let navLink = document.querySelector(`a[href="#${sectionId}"]`);
    
    // Busca alternativa para links no menu
    if (!navLink) {
      navLink = Array.from(document.querySelectorAll('.nav-link'))
        .find(link => {
          const href = link.getAttribute('href');
          const dataSection = link.getAttribute('data-section');
          return (href === `#${sectionId}` || dataSection === sectionId || dataSection === section);
        }) as HTMLElement || null;
    }
    
    if (navLink) {
      const allNavLinks = document.querySelectorAll('.nav-link');
      allNavLinks.forEach(link => {
        this.renderer.removeClass(link, 'active');
      });
      this.renderer.addClass(navLink, 'active');
    }
  }
} 