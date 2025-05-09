import { Pipe, PipeTransform, PLATFORM_ID, Inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { isPlatformBrowser } from '@angular/common';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Permitir que o pipe seja avaliado novamente quando o idioma mudar
})
export class TranslatePipe implements PipeTransform {
  private isBrowser: boolean;
  
  constructor(
    private translationService: TranslationService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  transform(key: string): string {
    return this.translationService.translate(key);
  }
} 