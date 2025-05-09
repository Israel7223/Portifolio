import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OptimizedPreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Precarregar apenas rotas marcadas com data.preload = true
    if (route.data?.['preload'] === true) {
      return load();
    } else {
      return of(null);
    }
  }
} 