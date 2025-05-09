import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';

import { routes } from './app.routes';
import { OptimizedPreloadingStrategy } from './core/services/preload-strategy.service';
import { environment } from '../environments/environment';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { ProjectModule } from './features/project/project.module';

/**
 * Configuração principal da aplicação Angular
 * Inclui:
 * - Zone.js com otimizações
 * - Roteador com preloading estratégico e configurações de rolagem
 * - Hydration do cliente para SSR
 * - Interceptor HTTP para cache
 * - Firebase com Firestore e Storage
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
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ]
};
