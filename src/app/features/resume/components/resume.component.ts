import { Component, ElementRef, ViewChild, PLATFORM_ID, Inject, OnInit, OnDestroy, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../core/services/translation.service';
import { LanguageService } from '../../../core/services/language.service';
import { ResumeService } from '../services/resume.service';
import { Education, Experience, Skill, Resume } from '../../../models/resume.model';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MultiLanguageText } from '../../../models/project.model';

// Interfaces para os dados JSON
interface EducationItem {
  degree: string | MultiLanguageText;
  institution: string | MultiLanguageText;
  period: string;
  description: string | MultiLanguageText;
  order?: number;
}

interface ExperienceItem {
  position: string | MultiLanguageText;
  company: string | MultiLanguageText;
  period: string;
  description: string | MultiLanguageText;
  order?: number;
}

interface EducationData {
  items?: EducationItem[];
}

interface ExperienceData {
  items?: ExperienceItem[];
}

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.css'
})
export class ResumeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('resumeSection') resumeSection!: ElementRef;
  @ViewChild('sectionTitle') sectionTitle!: ElementRef;
  @ViewChild('titleUnderline') titleUnderline!: ElementRef;
  @ViewChild('skillsTitle') skillsTitle!: ElementRef;
  @ViewChildren('sectionSubtitle') sectionSubtitles!: QueryList<ElementRef>;
  @ViewChildren('timelineItem') timelineItems!: QueryList<ElementRef>;
  @ViewChildren('skillItem') skillItems!: QueryList<ElementRef>;

  // Flag para controlar se a animação já foi ativada
  private animationTriggered = false;

  // Para destruir observáveis
  private destroy$ = new Subject<void>();
  
  // Propriedades para templates
  education: Education[] = [];
  experience: Experience[] = [];
  skills: Skill[] = [];
  resumeData: Resume | null = null;
  
  // Estado da carga de dados
  loading = true;
  error = false;
  
  // Disponibilizar Math para o template
  Math = Math;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private translationService: TranslationService,
    private languageService: LanguageService,
    private resumeService: ResumeService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    // Garantir que o componente está inicialmente invisível
    if (isPlatformBrowser(this.platformId)) {
      document.getElementById('resume')?.setAttribute('style', 'opacity: 0;');
    }
    
    // Carregar dados do Firebase
    this.loadResumeData();
    
    // Subscrever para mudanças de idioma
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Não precisamos recarregar os dados, apenas atualizar a interface
        // O serviço ResumeService já lida com a localização
      });
  }

  ngAfterViewInit() {
    // Inicializar o observer para detectar quando os elementos estão visíveis
    if (isPlatformBrowser(this.platformId)) {
      // Configurar o observador para scroll
      this.setupScrollObserver();
      
      // Adicionar também um listener para scroll que verifica a posição da seção
      window.addEventListener('scroll', this.checkScrollPosition.bind(this), { passive: true });
    }
  }

  ngOnDestroy() {
    // Remover o event listener quando o componente for destruído
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.checkScrollPosition.bind(this));
    }
    
    // Limpar as subscrições
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Carregar dados do resumo do Firebase
  loadResumeData(): void {
    this.loading = true;
    
    // Subscrever ao observable do resumo
    this.resumeService.getResume()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data) {
            this.resumeData = data;
            this.education = data.education || [];
            this.experience = data.experience || [];
            this.skills = data.skills || [];
          } else {
            // Carregar dados de fallback se não houver dados do Firebase
            this.loadFallbackData();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar dados do resumo:', error);
          this.error = true;
          this.loading = false;
          // Carregar dados de fallback em caso de erro
          this.loadFallbackData();
        }
      });
  }
  
  // Carregar dados de fallback de arquivos JSON locais
  private loadFallbackData(): void {
    this.loadEducationData();
    this.loadExperienceData();
    this.loadSkillsData();
  }
  
  // Converte string para MultiLanguageText
  private toMultiLanguageText(text: string | MultiLanguageText): MultiLanguageText {
    if (typeof text === 'string') {
      return { en: text, pt: text };
    }
    return text;
  }
  
  // Carregar dados de educação de arquivo JSON local (fallback)
  loadEducationData(): void {
    const lang = this.languageService.getCurrentLanguage();
    const educationPath = `assets/i18n/${lang}/education.json`;
    
    // Dados de fallback
    const fallbackEducation: EducationItem[] = [
      {
        degree: { en: 'Computer Science', pt: 'Ciência da Computação' },
        institution: { en: 'International University', pt: 'Universidade Internacional' },
        period: '2000 - 2004',
        description: { en: 'Focus on algorithms and data structures.', pt: 'Foco em algoritmos e estruturas de dados.' }
      },
      {
        degree: { en: 'Bachelor Degree', pt: 'Bacharelado' },
        institution: { en: 'University of California', pt: 'Universidade da Califórnia' },
        period: '2005 - 2008',
        description: { en: 'Studied mathematics and statistics.', pt: 'Estudou matemática e estatística.' }
      },
      {
        degree: { en: 'Master Degree', pt: 'Mestrado' },
        institution: { en: 'Harvard University', pt: 'Universidade de Harvard' },
        period: '2009 - 2012',
        description: { en: 'Specialized in machine learning.', pt: 'Especializado em aprendizado de máquina.' }
      }
    ];
    
    this.http.get<EducationData | EducationItem[]>(educationPath).subscribe({
      next: (data) => {
        // Verificar se data contém a propriedade 'items' que é um array
        if (data && 'items' in data && Array.isArray(data.items)) {
          // Converter os dados para o formato Education
          this.education = data.items.map((item: EducationItem) => ({
            degree: this.toMultiLanguageText(item.degree),
            institution: this.toMultiLanguageText(item.institution),
            period: item.period,
            description: this.toMultiLanguageText(item.description),
            order: item.order || 999
          }));
        } else if (Array.isArray(data)) {
          // Caso os dados sejam um array diretamente
          this.education = data.map((item: EducationItem) => ({
            degree: this.toMultiLanguageText(item.degree),
            institution: this.toMultiLanguageText(item.institution),
            period: item.period,
            description: this.toMultiLanguageText(item.description),
            order: item.order || 999
          }));
        } else {
          console.error('Dados de educação não estão no formato esperado:', data);
          this.education = fallbackEducation.map(item => ({
            degree: this.toMultiLanguageText(item.degree),
            institution: this.toMultiLanguageText(item.institution),
            period: item.period,
            description: this.toMultiLanguageText(item.description),
            order: item.order || 999
          }));
        }
      },
      error: () => {
        this.education = fallbackEducation.map(item => ({
          degree: this.toMultiLanguageText(item.degree),
          institution: this.toMultiLanguageText(item.institution),
          period: item.period,
          description: this.toMultiLanguageText(item.description),
          order: item.order || 999
        }));
      }
    });
  }
  
  // Carregar dados de experiência de arquivo JSON local (fallback)
  loadExperienceData(): void {
    const lang = this.languageService.getCurrentLanguage();
    const experiencePath = `assets/i18n/${lang}/experience.json`;
    
    // Dados de fallback
    const fallbackExperience: ExperienceItem[] = [
      {
        position: { en: 'Jr. Data Analyst', pt: 'Analista de Dados Jr.' },
        company: { en: 'Tech Solutions', pt: 'Tech Solutions' },
        period: '2012 - 2013',
        description: { en: 'Started career analyzing business data.', pt: 'Iniciou carreira analisando dados de negócios.' }
      },
      {
        position: { en: 'Data Scientist', pt: 'Cientista de Dados' },
        company: { en: 'AI Innovations', pt: 'AI Innovations' },
        period: '2014 - 2016',
        description: { en: 'Developed machine learning models.', pt: 'Desenvolveu modelos de aprendizado de máquina.' }
      },
      {
        position: { en: 'Sr. Data Scientist', pt: 'Cientista de Dados Sr.' },
        company: { en: 'Google', pt: 'Google' },
        period: '2017 - Present',
        description: { en: 'Leading NLP projects.', pt: 'Liderando projetos de NLP.' }
      }
    ];
    
    this.http.get<ExperienceData | ExperienceItem[]>(experiencePath).subscribe({
      next: (data) => {
        // Verificar se data contém a propriedade 'items' que é um array
        if (data && 'items' in data && Array.isArray(data.items)) {
          // Converter os dados para o formato Experience
          this.experience = data.items.map((item: ExperienceItem) => ({
            position: this.toMultiLanguageText(item.position),
            company: this.toMultiLanguageText(item.company),
            period: item.period,
            description: this.toMultiLanguageText(item.description),
            order: item.order || 999
          }));
        } else if (Array.isArray(data)) {
          // Caso os dados sejam um array diretamente
          this.experience = data.map((item: ExperienceItem) => ({
            position: this.toMultiLanguageText(item.position),
            company: this.toMultiLanguageText(item.company),
            period: item.period,
            description: this.toMultiLanguageText(item.description),
            order: item.order || 999
          }));
        } else {
          console.error('Dados de experiência não estão no formato esperado:', data);
          this.experience = fallbackExperience.map(item => ({
            position: this.toMultiLanguageText(item.position),
            company: this.toMultiLanguageText(item.company),
            period: item.period,
            description: this.toMultiLanguageText(item.description),
            order: item.order || 999
          }));
        }
      },
      error: () => {
        this.experience = fallbackExperience.map(item => ({
          position: this.toMultiLanguageText(item.position),
          company: this.toMultiLanguageText(item.company),
          period: item.period,
          description: this.toMultiLanguageText(item.description),
          order: item.order || 999
        }));
      }
    });
  }
  
  // Carregar dados de habilidades (fallback)
  loadSkillsData(): void {
    // Dados de fallback
    this.skills = [
      { name: 'Python', level: 85, years: 7, order: 1 },
      { name: 'Machine Learning', level: 75, years: 5, order: 2 },
      { name: 'NLP', level: 65, years: 4, order: 3 },
      { name: 'Data Analysis', level: 90, years: 8, order: 4 },
      { name: 'Deep Learning', level: 70, years: 3, order: 5 },
      { name: 'SQL', level: 80, years: 6, order: 6 }
    ];
  }

  // Método para obter texto localizado
  getLocalizedText(text: MultiLanguageText): string {
    if (!text) return '';
    
    return this.resumeService.getLocalizedText(text);
  }

  // Método para verificar a posição do scroll e acionar a animação
  private checkScrollPosition() {
    if (this.animationTriggered) return;

    const resumeSectionEl = this.resumeSection.nativeElement;
    const rect = resumeSectionEl.getBoundingClientRect();
    
    // Se a seção estiver próxima da visualização ou parcialmente na tela
    if (rect.top < window.innerHeight * 0.8) {
      // Remover o estilo inline antes de iniciar as animações
      document.getElementById('resume')?.removeAttribute('style');
      this.startAnimationSequence();
    }
  }

  private setupScrollObserver() {
    if (typeof IntersectionObserver !== 'undefined') {
      const resumeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.animationTriggered) {
            // Remover o estilo inline antes de iniciar as animações
            document.getElementById('resume')?.removeAttribute('style');
            this.startAnimationSequence();
          }
        });
      }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px'
      });

      resumeObserver.observe(this.resumeSection.nativeElement);
    }
  }
  
  // Método para iniciar a sequência de animações
  private startAnimationSequence() {
    if (this.animationTriggered) return;
    this.animationTriggered = true;
    
    // Sequência de animações graduais
    setTimeout(() => {
      this.resumeSection.nativeElement.classList.add('visible');
    }, 50);
    
    // Título da seção
    setTimeout(() => {
      if (this.sectionTitle) {
        this.sectionTitle.nativeElement.classList.add('visible');
      }
    }, 150);
    
    // Underline do título
    setTimeout(() => {
      if (this.titleUnderline) {
        this.titleUnderline.nativeElement.classList.add('visible');
      }
    }, 250);
    
    // Subtítulos das seções
    if (this.sectionSubtitles) {
      this.sectionSubtitles.forEach((subtitle, index) => {
        setTimeout(() => {
          subtitle.nativeElement.classList.add('visible');
        }, 350 + (index * 100));
      });
    }
    
    // Itens da timeline
    if (this.timelineItems) {
      this.timelineItems.forEach((item, index) => {
        setTimeout(() => {
          item.nativeElement.classList.add('visible');
        }, 550 + (index * 150));
      });
    }
    
    // Título de skills
    setTimeout(() => {
      if (this.skillsTitle) {
        this.skillsTitle.nativeElement.classList.add('visible');
      }
    }, 850);
    
    // Itens de skills
    if (this.skillItems) {
      this.skillItems.forEach((item, index) => {
        setTimeout(() => {
          item.nativeElement.classList.add('visible');
        }, 950 + (index * 100));
      });
    }
  }
}
