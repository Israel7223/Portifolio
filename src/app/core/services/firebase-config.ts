import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { environment } from '../../../environments/environment';

// Inicializa o Firebase apenas se estivermos em ambiente de produção ou com a configuração disponível
export const initFirebase = () => {
  try {
    if (environment.firebase && Object.keys(environment.firebase).length > 0) {
      const app = initializeApp(environment.firebase);
      
      // Inicializa Analytics apenas em produção e se disponível no navegador
      if (typeof window !== 'undefined') {
        getAnalytics(app);
      }
      
      return app;
    }
    return null;
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    return null;
  }
}; 