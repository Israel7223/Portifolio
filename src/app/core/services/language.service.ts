import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  // Idiomas disponíveis (inglês como principal)
  public languages = ['en', 'pt'];
  
  // Idioma atual (padrão é inglês)
  private currentLanguageSubject = new BehaviorSubject<string>('en');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Verificar se há um idioma salvo no localStorage (apenas se estiver no navegador)
    if (this.isBrowser) {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && this.languages.includes(savedLanguage)) {
        this.currentLanguageSubject.next(savedLanguage);
      }
    }
  }

  // Método para alterar o idioma
  changeLanguage(language: string): void {
    if (this.languages.includes(language)) {
      this.currentLanguageSubject.next(language);
      
      // Salvar no localStorage apenas se estiver no navegador
      if (this.isBrowser) {
        localStorage.setItem('language', language);
      }
    }
  }

  // Método para obter o idioma atual
  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }
} 