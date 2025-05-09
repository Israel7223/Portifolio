import { Component, ElementRef, AfterViewInit, ViewChild, QueryList, ViewChildren, PLATFORM_ID, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { AboutService } from '../services/about.service';
import { About } from '../../../models/about.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements AfterViewInit, OnInit, OnDestroy {
  // Referências aos elementos DOM
  @ViewChild('aboutSection') aboutSection!: ElementRef;
  @ViewChild('leftCol') leftCol!: ElementRef;
  @ViewChild('rightCol') rightCol!: ElementRef;
  @ViewChild('sectionTitle') sectionTitle!: ElementRef;
  @ViewChild('knowMeMore') knowMeMore!: ElementRef;
  @ViewChild('personalInfoDiv') personalInfoDiv!: ElementRef;
  @ViewChild('downloadCv') downloadCv!: ElementRef;
  @ViewChildren('infoItem') infoItems!: QueryList<ElementRef>;
  @ViewChildren('contentHeading') contentHeading!: QueryList<ElementRef>;
  @ViewChildren('contentPara') contentParagraphs!: QueryList<ElementRef>;

  // Flag para controlar se a animação já foi ativada
  private animationTriggered = false;
  
  // Data de nascimento
  private birthDate = new Date(1995, 0, 15); // Mês é base 0, então janeiro = 0

  // Timer para atualizar a idade
  private ageUpdateTimer: NodeJS.Timeout | null = null;

  // Informações pessoais
  personalInfo = {
    name: 'Israel Oliveira',
    age: this.calculateAge(),
    location: 'Brasília, Distrito Federal'
  };
  
  // Dados do perfil do Firebase
  aboutData: About | null = null;
  loading = true;
  error = false;

  // Para limpeza de observables
  private destroy$ = new Subject<void>();
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: object, 
    private languageService: LanguageService,
    private aboutService: AboutService
  ) {}

  ngOnInit() {
    // Garantir que o componente está inicialmente invisível
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById('about')?.setAttribute('style', 'opacity: 0; background-color: #1e2125;');
      
      // Configurar o timer para verificar a idade à meia-noite
      this.setupAgeUpdateTimer();
    }

    // Carregar dados do perfil do Firebase
    this.loadAboutData();
  }

  ngOnDestroy() {
    // Remover o event listener quando o componente for destruído
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.checkScrollPosition.bind(this));
      
      // Limpar o timer de atualização de idade
      if (this.ageUpdateTimer) {
        clearTimeout(this.ageUpdateTimer);
      }
    }

    // Limpar os observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Método para carregar dados do perfil do Firebase
  loadAboutData(): void {
    this.loading = true;
    this.aboutService.getAboutData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.aboutData = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar dados do perfil:', error);
          this.error = true;
          this.loading = false;
        }
      });
  }

  // Método para obter texto localizado
  getLocalizedText(field: 'bio1' | 'bio2' | 'position'): string {
    if (!this.aboutData || !this.aboutData[field]) {
      // Fallback para as traduções i18n se os dados do Firebase não estiverem disponíveis
      return field === 'position' ? 'about.position' : `about.${field}`;
    }
    return this.aboutService.getLocalizedText(this.aboutData[field]);
  }

  // Método para calcular a idade baseado na data de nascimento
  private calculateAge(): number {
    const today = new Date();
    let age = today.getFullYear() - this.birthDate.getFullYear();
    const monthDiff = today.getMonth() - this.birthDate.getMonth();
    
    // Se ainda não chegou ao mês de aniversário ou se está no mês mas não chegou ao dia
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  
  // Configura um timer para atualizar a idade à meia-noite
  private setupAgeUpdateTimer(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeToMidnight = tomorrow.getTime() - now.getTime();
    
    this.ageUpdateTimer = setTimeout(() => {
      // Verificar se é o aniversário e atualizar a idade
      this.personalInfo.age = this.calculateAge();
      
      // Configurar o próximo timer
      this.setupAgeUpdateTimer();
    }, timeToMidnight);
  }

  // Método para rolar para a seção "O Que Faço"
  scrollToWhatIDo() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const whatIDoElement = document.getElementById('what-i-do');
    
    if (whatIDoElement) {
      // Removi o efeito visual de destaque
      
      // Rolar suavemente para a seção
      whatIDoElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Adicionalmente, fazer o scroll manualmente para garantir consistência em browsers
      const topOffset = whatIDoElement.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: topOffset,
        behavior: 'smooth'
      });
    }
  }

  // Método para baixar o currículo
  downloadResume(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Usar apenas o currículo em português, sem verificar o idioma
    const resumeUrl = 'assets/docs/curriculo-israel-eustaquio.pdf';
    
    // Criar um link invisível e clicar nele
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.download = 'curriculo-israel-eustaquio.pdf';
    document.body.appendChild(link);
    link.click();
    
    // Limpar
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  }

  ngAfterViewInit() {
    // Inicializar o observer para detectar quando os elementos estão visíveis
    if (isPlatformBrowser(this.platformId)) {
      // Configurar dois observadores: um para scroll e outro para clicks
      this.setupScrollObserver();
      
      // Adicionar também um listener para scroll que verifica a posição da seção
      // Isso serve como um backup para garantir que a animação ocorra mesmo se o IntersectionObserver falhar
      window.addEventListener('scroll', this.checkScrollPosition.bind(this), { passive: true });
    }
  }

  // Método para verificar a posição do scroll e acionar a animação
  private checkScrollPosition() {
    if (this.animationTriggered) return;

    const aboutSectionEl = this.aboutSection.nativeElement;
    const rect = aboutSectionEl.getBoundingClientRect();
    
    // Se a seção estiver próxima da visualização ou parcialmente na tela
    if (rect.top < window.innerHeight * 0.8) {
      // Remover o estilo inline antes de iniciar as animações
      document.getElementById('about')?.removeAttribute('style');
      this.startAnimationSequence();
    }
  }

  private setupScrollObserver() {
    if (typeof IntersectionObserver !== 'undefined') {
      // Configurar o IntersectionObserver com limiar mais baixo para detectar o início da seção
      const aboutObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          // Se a seção estiver entrando na visualização e a animação ainda não foi acionada
          if (entry.isIntersecting && !this.animationTriggered) {
            // Remover o estilo inline antes de iniciar as animações
            document.getElementById('about')?.removeAttribute('style');
            this.startAnimationSequence();
          }
        });
      }, { 
        threshold: 0.05, // Aciona quando apenas 5% da seção estiver visível
        rootMargin: '0px 0px -10% 0px' // Considerar um pouco antes da seção entrar na tela
      });

      // Observar a seção about
      aboutObserver.observe(this.aboutSection.nativeElement);
    }
  }

  // Método para iniciar a sequência de animações em cascata
  private startAnimationSequence() {
    // Marcar que a animação já foi acionada para evitar repetições
    if (this.animationTriggered) return;
    this.animationTriggered = true;
    
    // Sequência de animações com atrasos progressivos (reduzidos para maior velocidade)
    
    // 1. Seção principal
    setTimeout(() => {
      this.aboutSection.nativeElement.classList.add('visible');
    }, 50); // Reduzido de 100ms para 50ms
    
    // 2. Título da seção
    setTimeout(() => {
      if (this.sectionTitle) {
        this.sectionTitle.nativeElement.classList.add('visible');
      }
    }, 150); // Reduzido de 300ms para 150ms
    
    // 3. Subtítulo "Know Me More"
    setTimeout(() => {
      if (this.knowMeMore) {
        this.knowMeMore.nativeElement.classList.add('visible');
      }
    }, 250); // Reduzido de 500ms para 250ms
    
    // 4. Colunas principais
    setTimeout(() => {
      if (this.leftCol) {
        this.leftCol.nativeElement.classList.add('visible');
      }
    }, 300); // Reduzido de 700ms para 300ms
    
    setTimeout(() => {
      if (this.rightCol) {
        this.rightCol.nativeElement.classList.add('visible');
      }
    }, 350); // Reduzido de 900ms para 350ms
    
    // 5. Heading do conteúdo
    if (this.contentHeading) {
      this.contentHeading.forEach((heading, index) => {
        setTimeout(() => {
          heading.nativeElement.classList.add('visible');
        }, 400 + (index * 75)); // Reduzido de 1000 + (index * 150) para 400 + (index * 75)
      });
    }
    
    // 6. Parágrafos do conteúdo
    if (this.contentParagraphs) {
      this.contentParagraphs.forEach((para, index) => {
        setTimeout(() => {
          para.nativeElement.classList.add('visible');
        }, 500 + (index * 100)); // Reduzido de 1300 + (index * 200) para 500 + (index * 100)
      });
    }
    
    // 7. Div de informações pessoais
    setTimeout(() => {
      if (this.personalInfoDiv) {
        this.personalInfoDiv.nativeElement.classList.add('visible');
      }
    }, 700); // Reduzido de 1500ms para 700ms
    
    // 8. Items de informações
    if (this.infoItems) {
      this.infoItems.forEach((item, index) => {
        setTimeout(() => {
          item.nativeElement.classList.add('visible');
        }, 800 + (index * 100)); // Reduzido de 1700 + (index * 200) para 800 + (index * 100)
      });
    }
    
    // 9. Botão de download CV
    setTimeout(() => {
      if (this.downloadCv) {
        this.downloadCv.nativeElement.classList.add('visible');
      }
    }, 1100); // Reduzido de 2300ms para 1100ms
  }
}
