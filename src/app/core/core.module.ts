import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

// Agora importamos dos caminhos corretos
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { LanguageService } from './services/language.service';
import { TranslationService } from './services/translation.service';
import { NavigationService } from './services/navigation.service';
import { OptimizedPreloadingStrategy } from './services/preload-strategy.service';
import { StorageService } from './services/storage.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    // Serviços do core
    LanguageService,
    TranslationService,
    NavigationService,
    OptimizedPreloadingStrategy,
    StorageService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CacheInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  // Previne que o CoreModule seja importado mais de uma vez
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule já foi carregado. Importe apenas no AppModule.');
    }
  }
} 