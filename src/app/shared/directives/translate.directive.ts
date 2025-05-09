import { Directive, ElementRef, Input, OnInit, OnDestroy, PLATFORM_ID, Inject, OnChanges, SimpleChanges } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { LanguageService } from '../../core/services/language.service';
import { Subscription } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appTranslate]',
  standalone: true
})
export class TranslateDirective implements OnInit, OnChanges, OnDestroy {
  @Input('appTranslate') key = '';
  private langSubscription: Subscription | undefined;
  private isBrowser: boolean;
  private lastTranslatedText = '';

  constructor(
    private el: ElementRef,
    private translationService: TranslationService,
    private languageService: LanguageService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Atualizar o texto inicialmente
    this.updateText();

    // Inscrever-se para alterações de idioma apenas no navegador
    if (this.isBrowser) {
      this.langSubscription = this.languageService.currentLanguage$.subscribe(() => {
        this.updateText();
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Atualizar quando a chave mudar
    if (changes['key']) {
      this.updateText();
    }
  }

  ngOnDestroy(): void {
    // Cancelar inscrição para evitar vazamentos de memória
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
      this.langSubscription = undefined;
    }
  }

  private updateText(): void {
    if (!this.key) return;
    
    const translatedText = this.translationService.translate(this.key);
    
    // Só atualizar se o texto for diferente do último para evitar renderizações desnecessárias
    if (translatedText !== this.lastTranslatedText) {
      this.el.nativeElement.textContent = translatedText;
      this.lastTranslatedText = translatedText;
    }
  }
} 