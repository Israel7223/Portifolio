import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { ProjectModule } from './features/project/project.module';
import { routes } from './app.routes';
import { OptimizedPreloadingStrategy } from './core/services/preload-strategy.service';

/**
 * Configuração principal da aplicação Angular
 * Inclui:
 * - Zone.js com otimizações
 * - Roteador com preloading estratégico e configurações de rolagem
 * - Hydration do cliente para SSR
 * - Interceptor HTTP para cache
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
    provideHttpClient(withInterceptorsFromDi())
  ]
};
