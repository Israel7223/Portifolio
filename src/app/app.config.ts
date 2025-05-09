import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

// Firebase
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage'; // Adicionado Storage como exemplo, remova se não usar

// ng-recaptcha (para v2/invisible)
import { RecaptchaFormsModule, RecaptchaModule, RecaptchaSettings, RECAPTCHA_SETTINGS } from 'ng-recaptcha';

import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { ProjectModule } from './features/project/project.module';
import { routes } from './app.routes';
import { OptimizedPreloadingStrategy } from './core/services/preload-strategy.service';
import { environment } from '../environments/environment'; // Importar environment

/**
 * Configuração principal da aplicação Angular
 * Inclui:
 * - Zone.js com otimizações
 * - Roteador com preloading estratégico e configurações de rolagem
 * - Hydration do cliente para SSR
 * - Interceptor HTTP para cache
 * - Provedores para Firebase e Recaptcha
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Importação dos módulos principais
    importProvidersFrom(CoreModule),
    importProvidersFrom(SharedModule),
    importProvidersFrom(ProjectModule),
    
    // Melhora detecção de mudanças agrupando eventos
    provideZoneChangeDetection({ eventCoalescing: true }), 
    
    // Configuração do roteador com preloading otimizado e suporte a rolagem
    provideRouter(
      routes,
      withPreloading(OptimizedPreloadingStrategy),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      }),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always'
      })
    ), 
    
    // Suporte a hydration para renderização do lado do servidor
    provideClientHydration(withEventReplay()),
    
    // Cliente HTTP com suporte a interceptores
    provideHttpClient(withInterceptorsFromDi()),

    // Configuração do Firebase
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()), // Remova ou ajuste conforme o uso

    // Configuração do ng-recaptcha
    importProvidersFrom(RecaptchaFormsModule, RecaptchaModule),
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: { siteKey: environment.recaptcha.siteKey } as RecaptchaSettings,
    },
  ]
};
