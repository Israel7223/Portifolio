import { Component, ElementRef, AfterViewInit, ViewChild, PLATFORM_ID, Inject, QueryList, ViewChildren, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { WhatIDoService } from '../services/what-i-do.service';
import { WhatIDoService as WhatIDoModel } from '../../../models/what-i-do.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-what-i-do',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './what-i-do.component.html',
  styleUrl: './what-i-do.component.css'
})
export class WhatIDoComponent implements AfterViewInit, OnInit, OnDestroy {
  // Referências aos elementos DOM
  @ViewChild('servicesSection') servicesSection!: ElementRef;
  @ViewChild('sectionTitle') sectionTitle!: ElementRef;
  @ViewChild('titleUnderline') titleUnderline!: ElementRef;
  @ViewChildren('serviceItem') serviceItems!: QueryList<ElementRef>;
  
  // Lista de serviços do Firebase
  services: WhatIDoModel[] = [];
  
  // Flag para controlar se a animação já foi ativada
  private animationTriggered = false;
  private langSubscription: Subscription | undefined;
  private servicesSubscription: Subscription | undefined;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private languageService: LanguageService,
    private whatIDoService: WhatIDoService
  ) {}

  ngOnInit() {
    // Garantir que o componente está inicialmente invisível
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById('what-i-do')?.setAttribute('style', 'opacity: 0; background-color: #2a2e35;');
    }
    
    // Subscrever para mudanças de idioma
    this.langSubscription = this.languageService.currentLanguage$.subscribe(() => {
      // Evitar reiniciar animações quando o idioma muda
      // e preservar a visibilidade dos elementos
      const wasVisible = this.animationTriggered;
      
      // Se os itens já estavam visíveis antes da mudança de idioma,
      // garantir que continuem visíveis após a atualização do conteúdo
      if (wasVisible && isPlatformBrowser(this.platformId)) {
        // Aguardar a próxima renderização antes de garantir que as classes estão aplicadas
        setTimeout(() => {
          this.ensureItemsVisible();
        }, 0);
      }
    });
    
    // Buscar serviços do Firebase
    this.servicesSubscription = this.whatIDoService.getServices().subscribe(services => {
      // Ordenar os serviços pelo campo order
      this.services = services.sort((a, b) => a.order - b.order);
      
      // Se já tínhamos ativado as animações, precisamos garantir que os novos itens também sejam visíveis
      if (this.animationTriggered && isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          this.ensureItemsVisible();
        }, 0);
      }
    });
  }

  ngAfterViewInit() {
    // Inicializar o observer para detectar quando os elementos estão visíveis
    if (isPlatformBrowser(this.platformId)) {
      // Configurar observer para scroll
      this.setupScrollObserver();
      
      // Adicionar também um listener para scroll como backup
      window.addEventListener('scroll', this.checkScrollPosition.bind(this), { passive: true });
    }
  }

  ngOnDestroy() {
    // Limpar subscrições para evitar vazamentos de memória
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
    
    if (this.servicesSubscription) {
      this.servicesSubscription.unsubscribe();
    }
    
    // Remover o event listener quando o componente for destruído
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.checkScrollPosition.bind(this));
    }
  }
  
  // Método para obter o texto localizado do serviço
  getLocalizedTitle(service: WhatIDoModel): string {
    return this.whatIDoService.getLocalizedText(service.title);
  }
  
  // Método para obter a descrição localizada do serviço
  getLocalizedDescription(service: WhatIDoModel): string {
    return this.whatIDoService.getLocalizedText(service.description);
  }

  // Método para garantir que todos os itens permaneçam visíveis após a troca de idioma
  private ensureItemsVisible() {
    if (this.servicesSection) {
      this.servicesSection.nativeElement.classList.add('visible');
    }
    
    if (this.sectionTitle) {
      this.sectionTitle.nativeElement.classList.add('visible');
    }
    
    if (this.titleUnderline) {
      this.titleUnderline.nativeElement.classList.add('visible');
    }
    
    if (this.serviceItems) {
      this.serviceItems.forEach(item => {
        item.nativeElement.classList.add('visible');
      });
    }
  }

  // Método para verificar a posição do scroll e acionar a animação
  private checkScrollPosition() {
    if (this.animationTriggered) return;

    const sectionEl = this.servicesSection?.nativeElement;
    if (!sectionEl) return;
    
    const rect = sectionEl.getBoundingClientRect();
    
    // Se a seção estiver próxima da visualização ou parcialmente na tela
    if (rect.top < window.innerHeight * 0.8) {
      // Remover o estilo inline antes de iniciar as animações
      document.getElementById('what-i-do')?.removeAttribute('style');
      this.startAnimationSequence();
    }
  }

  private setupScrollObserver() {
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.animationTriggered) {
            document.getElementById('what-i-do')?.removeAttribute('style');
            this.startAnimationSequence();
          }
        });
      }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px'
      });

      observer.observe(this.servicesSection.nativeElement);
    }
  }

  // Método para iniciar a sequência de animações
  private startAnimationSequence() {
    if (this.animationTriggered) return;
    this.animationTriggered = true;
    
    // Sequência de animações com atrasos progressivos
    setTimeout(() => {
      this.servicesSection.nativeElement.classList.add('visible');
    }, 50);
    
    // 2. Título da seção
    setTimeout(() => {
      if (this.sectionTitle) {
        this.sectionTitle.nativeElement.classList.add('visible');
      }
    }, 150);
    
    // 3. Underline do título
    setTimeout(() => {
      if (this.titleUnderline) {
        this.titleUnderline.nativeElement.classList.add('visible');
      }
    }, 250);
    
    // 4. Itens de serviço, um por um
    if (this.serviceItems) {
      this.serviceItems.forEach((item, index) => {
        setTimeout(() => {
          item.nativeElement.classList.add('visible');
        }, 350 + (index * 150));
      });
    }
  }
}
