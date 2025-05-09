import { Component, OnInit, ViewChild, ElementRef, HostListener, AfterViewInit, Renderer2, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { Project, MultiLanguageText } from '../../../models/project.model';
import { LanguageService } from '../../../core/services/language.service';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ProjectService } from '../services/project.service';

// Classe utilitária para gerenciar o carrossel
class CarouselManager {
  private isDragging = false;
  private startX = 0;
  private currentX = 0;
  private transformValue = 0;
  private trackElement: HTMLElement;
  private renderer: Renderer2;
  private projectWidth = 0;
  private visibleProjects = 3;
  private totalProjects = 0;
  private currentIndex = 0;
  
  constructor(trackElement: HTMLElement, renderer: Renderer2) {
    this.trackElement = trackElement;
    this.renderer = renderer;
  }
  
  // Inicializar o carrossel 
  initialize(projectCount: number, isMobile: boolean, carouselWidth: number): void {
    this.totalProjects = projectCount;
    this.visibleProjects = isMobile ? 1 : 3;
    this.projectWidth = carouselWidth / this.visibleProjects;
    
    // Aplicar largura aos projetos
    const projectElements = this.trackElement.querySelectorAll('.project-card');
    projectElements.forEach(element => {
      // Convertendo Element para HTMLElement
      this.renderer.setStyle(element as HTMLElement, 'minWidth', `${this.projectWidth - 30}px`);
    });
    
    this.goToSlide(this.currentIndex);
  }
  
  // Aplicar efeitos de animação
  applyAnimationEffects(): void {
    const projectElements = this.trackElement.querySelectorAll('.project-card');
    projectElements.forEach((element, index) => {
      // Convertendo Element para HTMLElement
      this.renderer.setStyle(element as HTMLElement, '--order', index);
    });
  }
  
  // Navegação para slide anterior
  prevSlide(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.goToSlide(this.currentIndex);
    } else {
      // Loop para o final quando no início
      this.currentIndex = this.totalProjects - this.visibleProjects;
      this.goToSlide(this.currentIndex);
    }
  }
  
  // Navegação para próximo slide
  nextSlide(): void {
    if (this.currentIndex < this.totalProjects - this.visibleProjects) {
      this.currentIndex++;
      this.goToSlide(this.currentIndex);
    } else {
      // Loop para o início quando no final
      this.currentIndex = 0;
      this.goToSlide(this.currentIndex);
    }
  }
  
  // Ir para um slide específico
  goToSlide(index: number): void {
    this.currentIndex = Math.max(0, Math.min(index, this.totalProjects - this.visibleProjects));
    this.transformValue = -(this.currentIndex * this.projectWidth);
    this.renderer.setStyle(this.trackElement, 'transform', `translateX(${this.transformValue}px)`);
  }
  
  // Eventos de arrastar
  startDrag(clientX: number): void {
    this.isDragging = true;
    this.startX = clientX;
    this.currentX = clientX;
    this.renderer.addClass(this.trackElement, 'dragging');
  }
  
  moveDrag(clientX: number): boolean {
    if (!this.isDragging) return false;
    
    const deltaX = clientX - this.currentX;
    this.currentX = clientX;
    
    this.transformValue += deltaX;
    
    // Limites com efeito elástico
    const maxTransform = 0;
    const minTransform = -((this.totalProjects - this.visibleProjects) * this.projectWidth);
    
    if (this.transformValue > maxTransform) {
      this.transformValue = maxTransform + (this.transformValue - maxTransform) * 0.3;
    } else if (this.transformValue < minTransform) {
      this.transformValue = minTransform + (this.transformValue - minTransform) * 0.3;
    }
    
    this.renderer.setStyle(this.trackElement, 'transform', `translateX(${this.transformValue}px)`);
    return true;
  }
  
  endDrag(): void {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.renderer.removeClass(this.trackElement, 'dragging');
    
    const totalDragDistance = this.currentX - this.startX;
    
    // Determinar direção do movimento
    if (Math.abs(totalDragDistance) > 50) {
      if (totalDragDistance > 0) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    } else {
      // Voltar para a posição do slide atual se o movimento foi pequeno
      this.goToSlide(this.currentIndex);
    }
  }
  
  // Obter o índice atual
  getCurrentIndex(): number {
    return this.currentIndex;
  }
}

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  providers: [ProjectService],
  templateUrl: './project.component.html',
  styleUrl: './project.component.css'
})
export class ProjectComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('carousel') carouselRef!: ElementRef;
  @ViewChild('track') trackRef!: ElementRef;
  
  projects: Project[] = [];
  loading = true;
  error = false;
  selectedProject: Project | null = null;
  currentIndex = 0;
  isMobile = window.innerWidth < 768;
  
  private destroy$ = new Subject<void>();
  private carouselManager: CarouselManager | null = null;
  
  private projectService = inject(ProjectService);
  private languageService = inject(LanguageService);
  private renderer = inject(Renderer2);
  private http = inject(HttpClient);
  
  ngOnInit(): void {
    this.loadProjects();
    
    // Monitorar mudanças de idioma
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Não é necessário recarregar os projetos ao mudar o idioma
        // apenas forçar uma atualização da visualização
        this.projects = [...this.projects];
        
        setTimeout(() => {
          if (this.trackRef && this.carouselRef) {
            this.initCarousel();
          }
        }, 300);
      });
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCarousel();
    }, 300);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  @HostListener('window:resize')
  onResize(): void {
    this.isMobile = window.innerWidth < 768;
    this.initCarousel();
  }
  
  // Carregar projetos do serviço
  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects: Project[]) => {
          // Filtrar apenas projetos com featured=true
          this.projects = projects.filter((project: Project) => project.featured === true);
          this.loading = false;
          
          setTimeout(() => {
            if (this.trackRef && this.carouselRef) {
              this.initCarousel();
            }
          }, 300);
        },
        error: (error: Error) => {
          console.error('Erro ao carregar projetos:', error);
          this.loading = false;
          this.error = true;
        }
      });
  }
  
  // Inicializar o carrossel 
  private initCarousel(): void {
    if (!this.trackRef || !this.carouselRef || this.projects.length === 0) return;
    
    if (!this.carouselManager) {
      this.carouselManager = new CarouselManager(
        this.trackRef.nativeElement,
        this.renderer
      );
    }
    
    this.carouselManager.initialize(
      this.projects.length,
      this.isMobile,
      this.carouselRef.nativeElement.offsetWidth
    );
    
    this.carouselManager.applyAnimationEffects();
    
    // Aplicar estilos adicionais
    this.applyExtraStyles();
  }
  
  // Aplicar estilos extras aos elementos
  private applyExtraStyles(): void {
    // Estilizar badges de tecnologia
    const techBadges = document.querySelectorAll('.tech-badge');
    techBadges.forEach((badge: Element, index: number) => {
      this.renderer.setStyle(badge, '--index', index % 5);
    });
    
    // Estilizar pontos de navegação
    const navDots = document.querySelectorAll('.nav-dot');
    navDots.forEach((dot: Element, index: number) => {
      this.renderer.setStyle(dot, '--index', index);
    });
  }
  
  // Eventos de toque para dispositivos móveis
  onTouchStart(event: TouchEvent): void {
    if (!this.carouselManager) return;
    this.carouselManager.startDrag(event.touches[0].clientX);
    event.preventDefault();
  }
  
  onTouchMove(event: TouchEvent): void {
    if (!this.carouselManager) return;
    if (this.carouselManager.moveDrag(event.touches[0].clientX)) {
      event.preventDefault();
    }
  }
  
  onTouchEnd(): void {
    if (!this.carouselManager) return;
    this.carouselManager.endDrag();
  }
  
  // Eventos de mouse
  onMouseDown(event: MouseEvent): void {
    if (!this.carouselManager) return;
    this.carouselManager.startDrag(event.clientX);
    event.preventDefault();
  }
  
  onMouseMove(event: MouseEvent): void {
    if (!this.carouselManager) return;
    if (this.carouselManager.moveDrag(event.clientX)) {
      event.preventDefault();
    }
  }
  
  onMouseUp(): void {
    if (!this.carouselManager) return;
    this.carouselManager.endDrag();
  }
  
  onMouseLeave(): void {
    if (!this.carouselManager) return;
    this.carouselManager.endDrag();
  }
  
  // Navegação do carrossel
  prevSlide(): void {
    if (!this.carouselManager) return;
    this.carouselManager.prevSlide();
    this.currentIndex = this.carouselManager.getCurrentIndex();
  }
  
  nextSlide(): void {
    if (!this.carouselManager) return;
    this.carouselManager.nextSlide();
    this.currentIndex = this.carouselManager.getCurrentIndex();
  }
  
  goToSlide(index: number): void {
    if (!this.carouselManager) return;
    this.carouselManager.goToSlide(index);
    this.currentIndex = this.carouselManager.getCurrentIndex();
  }
  
  // Selecionar um projeto para exibir detalhes
  selectProject(project: Project): void {
    this.selectedProject = project;
    
    // Aguardar a renderização do DOM antes de rolar
    setTimeout(() => {
      const detailsElement = document.querySelector('.project-details');
      if (!detailsElement) return;
      
      // Obter a altura do cabeçalho para ajuste
      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
      
      // Calcular a posição com ajuste para o cabeçalho
      const elementPosition = detailsElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight - 20; // 20px extra de margem
      
      // Rolar para a posição usando comportamento suave nativo
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }, 100);
  }
  
  // Fechar detalhes do projeto
  closeProjectDetails(): void {
    this.selectedProject = null;
  }
  
  // Método auxiliar para obter texto localizado
  getLocalizedText(text: string | MultiLanguageText): string {
    return this.projectService.getLocalizedText(text);
  }
} 