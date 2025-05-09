import { Component, ViewChild, ElementRef, Renderer2, PLATFORM_ID, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AboutComponent } from '../../about/components/about.component';
import { WhatIDoComponent } from '../../what-i-do/components/what-i-do.component';
import { ResumeComponent } from '../../resume/components/resume.component';
import { ProjectComponent } from '../../project/components/project.component';
import { ContactComponent } from '../../contact/components/contact.component';
import { CertificatesComponent } from '../../certificates/components/certificates.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { TranslationService } from '../../../core/services/translation.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    AboutComponent, 
    WhatIDoComponent, 
    ResumeComponent,
    ProjectComponent,
    ContactComponent,
    CertificatesComponent,
    TranslatePipe
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  name = 'Israel';
  position = 'cientista de dados';
  location = 'Brasília, Distrito Federal';
  isTranslationLoaded = false;
  
  @ViewChild('aboutSection') aboutSection!: ElementRef;
  
  private translationSubscription: Subscription | undefined;
  
  constructor(
    private languageService: LanguageService,
    private translationService: TranslationService,
    private navigationService: NavigationService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    // Definir posição inicial baseada no idioma atual
    this.updatePosition(this.languageService.getCurrentLanguage());
  }
  
  ngOnInit(): void {
    // Garantir que a página comece no topo ao inicializar
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
    
    // Subscrever para alterações de idioma para atualizar a posição
    this.languageService.currentLanguage$.subscribe(lang => {
      this.updatePosition(lang);
    });
    
    // Subscrever para o estado de carregamento das traduções
    this.translationSubscription = this.translationService.isLoaded$.subscribe(isLoaded => {
      this.isTranslationLoaded = isLoaded;
    });
    
    // Verificar se as traduções já estão carregadas
    this.isTranslationLoaded = this.translationService.isLoaded();
  }
  
  ngOnDestroy(): void {
    // Limpar as subscrições
    if (this.translationSubscription) {
      this.translationSubscription.unsubscribe();
    }
  }
  
  private updatePosition(lang: string): void {
    // Atualizar a posição baseada no idioma
    this.position = lang === 'pt' ? 'cientista de dados' : 'data scientist';
  }
  
  // Métodos simplificados que utilizam o NavigationService
  
  scrollToAbout() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const arrowElement = document.querySelector('.scroll-arrow') as HTMLElement;
    
    if (arrowElement) {
      // Adicionar classe de animação à seta
      this.renderer.addClass(arrowElement, 'animate-arrow');
      
      // Remover a classe após a animação terminar
      setTimeout(() => {
        this.renderer.removeClass(arrowElement, 'animate-arrow');
      }, 800);
    }
    
    // Usar o serviço de navegação
    this.navigationService.scrollToSection('about');
  }

  scrollToWhatIDo() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.navigationService.scrollToSection('whatIDo');
  }

  scrollToResume() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.navigationService.scrollToSection('resume');
  }

  scrollToProject() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.navigationService.scrollToSection('project');
  }

  scrollToContact() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.navigationService.scrollToSection('contact');
  }
}
