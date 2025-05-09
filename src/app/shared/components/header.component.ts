import { 
  Component, 
  OnInit, 
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  PLATFORM_ID,
  Inject,
  NgZone,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LanguageService } from '../../core/services/language.service';
import { Subscription } from 'rxjs';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../core/services/navigation.service';

// TIPO para informações de seção
interface SectionInfo {
  id: string;
  element: HTMLElement;
  rect: DOMRect;
  visiblePercentage: number;
  centerPosition: number;
  distanceToCenter?: number;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Array de chaves de navegação
  private readonly navKeys = ['home', 'about', 'whatIDo', 'resume', 'project', 'certificates', 'contact'];
  
  isOpen = false;
  currentLanguage: string;
  isTranslationLoaded = false;
  activeSection = 'home'; // Valor padrão para não começar vazio
  
  private langSubscription: Subscription | undefined;
  private translationSubscription: Subscription | undefined;
  private scrollHandler: (() => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private scrollTimeout: number | null = null;

  constructor(
    private languageService: LanguageService,
    private translationService: TranslationService,
    private navigationService: NavigationService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.currentLanguage = this.languageService.getCurrentLanguage();
  }
  
  // Mapeamento simples de IDs
  getSectionId(section: string): string {
    return section.toLowerCase();
  }

  ngOnInit(): void {
    // Inscrever para mudanças de idioma
    this.langSubscription = this.languageService.currentLanguage$.subscribe((lang: string) => {
      this.currentLanguage = lang;
      this.cdr.markForCheck();
    });
    
    // Subscrever para o estado de carregamento das traduções
    this.translationSubscription = this.translationService.isLoaded$.subscribe(isLoaded => {
      this.isTranslationLoaded = isLoaded;
      this.cdr.markForCheck();
    });
    
    // Verificar se as traduções já estão carregadas
    this.isTranslationLoaded = this.translationService.isLoaded();
    
    if (isPlatformBrowser(this.platformId)) {
      // Inicializar a seção ativa com base na URL
      this.initializeActiveSection();
      
      // Configurar os event listeners fora da zona do Angular para melhor desempenho
      this.setupScrollListeners();
      
      // Verificações iniciais após o carregamento da página
      this.scheduleInitialChecks();
    }
  }
  
  // Toggle menu de navegação mobile
  toggleMenu(): void {
    this.isOpen = !this.isOpen;
    this.cdr.markForCheck();
  }

  // Alternar idioma
  toggleLanguage(): void {
    const newLang = this.currentLanguage === 'pt' ? 'en' : 'pt';
    this.languageService.changeLanguage(newLang);
  }

  // Método para definir o idioma diretamente
  changeLanguage(lang: string): void {
    if (this.currentLanguage !== lang) {
      this.languageService.changeLanguage(lang);
    }
  }

  // Método para rolar para uma seção - usando o NavigationService
  scrollToSection(event: Event, section: string): void {
    event.preventDefault();
    
    if (isPlatformBrowser(this.platformId)) {
      // Definir como seção ativa
      this.activeSection = section;
      
      // Fechar o menu móvel se aberto
      if (this.isOpen) {
        this.isOpen = false;
      }
      
      // Usar o serviço de navegação para rolar até a seção
      this.navigationService.scrollToSection(section);
    }
  }
  
  // Configurar os event listeners de rolagem e redimensionamento
  private setupScrollListeners(): void {
    this.ngZone.runOutsideAngular(() => {
      // Manipulador de scroll otimizado com debounce
      this.scrollHandler = () => {
        if (this.scrollTimeout) {
          window.clearTimeout(this.scrollTimeout);
        }
        
        this.scrollTimeout = window.setTimeout(() => {
          this.updateActiveSection();
        }, 50);
      };
      
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
      
      // Atualizar ao redimensionar a janela
      this.resizeHandler = () => {
        if (this.scrollTimeout) {
          window.clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = window.setTimeout(() => {
          this.updateActiveSection();
        }, 100);
      };
      
      window.addEventListener('resize', this.resizeHandler, { passive: true });
    });
  }
  
  // Agendar verificações iniciais após carregamento da página
  private scheduleInitialChecks(): void {
    // Primeira verificação após 1 segundo
    setTimeout(() => {
      this.updateActiveSection();
      
      // Segunda verificação após mais tempo
      setTimeout(() => {
        this.updateActiveSection();
      }, 2000);
    }, 1000);
    
    // Verificar também quando a página estiver totalmente carregada
    window.addEventListener('load', () => {
      this.updateActiveSection();
    });
  }
  
  // Inicializar a seção ativa com base na URL atual
  private initializeActiveSection(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const hash = window.location.hash;
    if (hash) {
      const sectionId = hash.substring(1); // Remover o # do início
      
      // Verificar se o hash corresponde a uma de nossas seções
      for (const key of this.navKeys) {
        const elementId = this.getSectionId(key);
        if (elementId === sectionId) {
          this.ngZone.run(() => {
            this.activeSection = key;
            this.cdr.detectChanges();
          });
          break;
        }
      }
    }
  }
  
  // Método otimizado que atualiza a seção ativa com base na posição de rolagem
  private updateActiveSection(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Altura do cabeçalho para ajustar o cálculo
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    
    // Coletando todas as seções visíveis
    const sections: SectionInfo[] = [];
    
    for (const key of this.navKeys) {
      const elementId = this.getSectionId(key);
      const element = document.getElementById(elementId);
      
      if (element) {
        const rect = element.getBoundingClientRect();
        const visiblePercentage = this.calculateVisiblePercentage(element, headerHeight);
        const centerPosition = rect.top + (rect.height / 2);
        
        sections.push({
          id: key,
          element,
          rect,
          visiblePercentage,
          centerPosition
        });
      }
    }
    
    // Verificar se há seções com visibilidade significativa
    const visibleSections = sections.filter(section => section.visiblePercentage > 0.1);
    
    if (visibleSections.length > 0) {
      // Calcular a distância ao centro da tela
      const windowCenter = window.innerHeight / 2;
      visibleSections.forEach(section => {
        section.distanceToCenter = Math.abs(section.centerPosition - windowCenter);
      });
      
      // Ordenar por maior visibilidade e menor distância ao centro
      visibleSections.sort((a, b) => {
        // Se a diferença de visibilidade é maior que 20%, priorizar visibilidade
        if (Math.abs(a.visiblePercentage - b.visiblePercentage) > 0.2) {
          return b.visiblePercentage - a.visiblePercentage;
        }
        
        // Caso contrário, usar a distância ao centro da tela
        return (a.distanceToCenter || Infinity) - (b.distanceToCenter || Infinity);
      });
      
      const topSection = visibleSections[0];
      
      // Só atualizar se mudou para reduzir re-renders
      if (this.activeSection !== topSection.id) {
        this.ngZone.run(() => {
          this.activeSection = topSection.id;
          this.cdr.markForCheck();
        });
      }
    }
  }
  
  // Calcular a porcentagem da seção que está visível na janela
  private calculateVisiblePercentage(element: HTMLElement, headerHeight: number): number {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    // Ajustar para considerar o cabeçalho fixo
    const visibleTop = Math.max(rect.top, headerHeight);
    const visibleBottom = Math.min(rect.bottom, windowHeight);
    
    // Se não há sobreposição
    if (visibleBottom <= visibleTop) {
      return 0;
    }
    
    const visibleHeight = visibleBottom - visibleTop;
    return visibleHeight / rect.height;
  }

  ngOnDestroy(): void {
    // Limpar as subscrições
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
    
    if (this.translationSubscription) {
      this.translationSubscription.unsubscribe();
    }
    
    // Remover os event listeners
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollHandler) {
        window.removeEventListener('scroll', this.scrollHandler);
      }
      
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
      
      if (this.scrollTimeout) {
        window.clearTimeout(this.scrollTimeout);
      }
    }
  }
}