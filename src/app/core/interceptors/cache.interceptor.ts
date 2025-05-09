import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, HttpResponse<unknown>>();

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Somente métodos GET são cacheados
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    // Não cachear solicitações que têm um cabeçalho 'no-cache'
    if (req.headers.has('no-cache')) {
      return next.handle(req);
    }

    // Chave de cache é a URL da solicitação
    const cachedResponse = this.cache.get(req.urlWithParams);
    if (cachedResponse) {
      return of(cachedResponse.clone());
    }

    // Processa a solicitação e a armazena em cache
    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cache.set(req.urlWithParams, event.clone());
        }
      }),
      shareReplay(1) // Garantir que múltiplos assinantes compartilhem a mesma resposta
    );
  }

  // Método para limpar o cache manualmente se necessário
  clearCache() {
    this.cache.clear();
  }
} 