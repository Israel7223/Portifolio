import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from './language.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

// Tipo recursivo para estruturas de tradução
interface TranslationData {
  [key: string]: string | number | boolean | null | undefined | TranslationData;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations: Record<string, TranslationData> = {};
  private loadedLanguages = new Set<string>();
  private currentLanguage: string;
  
  // Indica se as traduções foram carregadas
  private isLoadedSubject = new BehaviorSubject<boolean>(false);
  public isLoaded$ = this.isLoadedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private languageService: LanguageService
  ) {
    this.currentLanguage = this.languageService.getCurrentLanguage();
    
    // Pré-carregar todos os idiomas disponíveis para evitar flicker ao mudar
    this.preloadAllLanguages();
    
    // Inscrever-se para mudanças de idioma
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      if (!this.loadedLanguages.has(lang)) {
        this.loadLanguage(lang);
      }
    });
  }

  /**
   * Pré-carrega todos os idiomas disponíveis
   */
  private async preloadAllLanguages(): Promise<void> {
    const langs = this.languageService.languages;
    
    try {
      const promises = langs.map(lang => this.loadLanguage(lang));
      await Promise.all(promises);
      
      // Marcar como carregado após todos os idiomas serem carregados
      this.isLoadedSubject.next(true);
    } catch {
      // Se houver erro, pelo menos tentamos carregar o idioma atual
      if (this.loadedLanguages.has(this.currentLanguage)) {
        this.isLoadedSubject.next(true);
      }
    }
  }

  /**
   * Verifica se as traduções estão carregadas
   */
  public isLoaded(): boolean {
    return this.isLoadedSubject.value;
  }

  /**
   * Carrega as traduções para um idioma específico
   */
  private async loadLanguage(lang: string): Promise<void> {
    // Evitar recarregar um idioma já carregado
    if (this.loadedLanguages.has(lang)) {
      return;
    }
    
    try {
      const data = await firstValueFrom(
        this.http.get<TranslationData>(`assets/i18n/${lang}/main.json`)
      );
      
      this.translations[lang] = data;
      this.loadedLanguages.add(lang);
      
      // Se for o idioma atual, marcar como carregado
      if (lang === this.currentLanguage && !this.isLoadedSubject.value) {
        this.isLoadedSubject.next(true);
      }
    } catch {
      // Erro silencioso
    }
  }

  /**
   * Retorna a tradução para uma chave específica
   */
  translate(key: string): string {
    // Se não temos traduções para o idioma atual, retornar vazio ou a chave
    if (!this.translations[this.currentLanguage]) {
      // Iniciar o carregamento se o idioma não estiver carregado
      if (!this.loadedLanguages.has(this.currentLanguage)) {
        this.loadLanguage(this.currentLanguage);
      }
      return ''; // Retornar string vazia em vez da chave para evitar flicker
    }

    // Navegar pela hierarquia de chaves (ex: "home.welcome")
    const keys = key.split('.');
    let value: string | number | boolean | null | undefined | TranslationData = this.translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return ''; // Retornar string vazia em vez da chave para evitar flicker
      }
    }

    // Verificar se o valor final é uma string
    if (typeof value === 'string') {
      return value;
    } else {
      return ''; // Retornar string vazia em vez da chave
    }
  }
} 