import { Injectable, OnDestroy } from '@angular/core';
import { Observable, of, BehaviorSubject, Subject, takeUntil, map, catchError } from 'rxjs';
import { About, } from '../../../models/about.model';
import { MultiLanguageText } from '../../../models/project.model';
import { LanguageService } from '../../../core/services/language.service';
import { 
  Firestore, 
  doc, 
  docData
} from '@angular/fire/firestore';
import { FirestoreTimestamp } from '../../../models/firebase.types';

@Injectable({
  providedIn: 'root'
})
export class AboutService implements OnDestroy {
  private currentLanguage: string;
  private destroy$ = new Subject<void>();
  private aboutSubject = new BehaviorSubject<About | null>(null);
  
  // Observable público para componentes se inscreverem
  public about$ = this.aboutSubject.asObservable();

  constructor(
    private languageService: LanguageService,
    private firestore: Firestore
  ) {
    this.currentLanguage = this.languageService.getCurrentLanguage();
    
    // Responder a mudanças de idioma
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lang: string) => {
        this.currentLanguage = lang;
        this.aboutSubject.next(this.aboutSubject.getValue());
      });
      
    // Inicializar buscando os dados do perfil
    this.fetchAboutData();
  }

  // Buscar dados do perfil do Firestore
  private fetchAboutData(): void {
    console.log('Buscando dados do perfil');
    
    // Obter o documento com ID "profile" da coleção "about"
    const aboutDocRef = doc(this.firestore, 'about/profile');
    
    docData(aboutDocRef, { idField: 'id' })
      .pipe(
        takeUntil(this.destroy$),
        map(firestoreAbout => {
          try {
            if (firestoreAbout) {
              console.log('Dados do perfil encontrados');
              return this.convertToAbout(firestoreAbout as Record<string, unknown>);
            } else {
              console.warn('Nenhum dado de perfil encontrado');
              return null;
            }
          } catch (error) {
            console.error('Erro ao converter documento para About:', error);
            console.error('Documento com erro:', JSON.stringify(firestoreAbout));
            return null;
          }
        }),
        catchError(error => {
          console.error('Erro ao buscar dados do perfil do Firestore:', error);
          return of(null);
        })
      )
      .subscribe(aboutData => {
        this.aboutSubject.next(aboutData);
      });
  }
  
  // Converter documento do Firestore para o modelo About
  private convertToAbout(firestoreAbout: Record<string, unknown>): About {
    console.log('Convertendo documento do perfil');
    
    // Verificar campos obrigatórios
    if (!firestoreAbout['bio1']) {
      console.warn('Documento sem bio1');
    }
    
    if (!firestoreAbout['bio2']) {
      console.warn('Documento sem bio2');
    }
    
    if (!firestoreAbout['position']) {
      console.warn('Documento sem position');
    }
    
    let createdDate = new Date();
    if (firestoreAbout['createdAt']) {
      try {
        createdDate = (firestoreAbout['createdAt'] as FirestoreTimestamp).toDate();
      } catch (error) {
        console.error('Erro ao converter createdAt para Date:', error);
      }
    } else {
      console.warn('Documento sem campo createdAt');
    }
    
    let updatedDate = new Date();
    if (firestoreAbout['updatedAt']) {
      try {
        updatedDate = (firestoreAbout['updatedAt'] as FirestoreTimestamp).toDate();
      } catch (error) {
        console.error('Erro ao converter updatedAt para Date:', error);
      }
    } else {
      console.warn('Documento sem campo updatedAt');
    }
    
    // Verificar se temos estruturas multilíngues
    let bio1: MultiLanguageText = { en: '', pt: '' };
    if (firestoreAbout['bio1']) {
      if (typeof firestoreAbout['bio1'] === 'object') {
        const bio1Data = firestoreAbout['bio1'] as Partial<MultiLanguageText>;
        bio1 = {
          en: bio1Data.en || '',
          pt: bio1Data.pt || ''
        };
      } else if (typeof firestoreAbout['bio1'] === 'string') {
        // Se for string, usar como texto em ambos idiomas
        bio1 = { en: firestoreAbout['bio1'] as string, pt: firestoreAbout['bio1'] as string };
      }
    }
    
    let bio2: MultiLanguageText = { en: '', pt: '' };
    if (firestoreAbout['bio2']) {
      if (typeof firestoreAbout['bio2'] === 'object') {
        const bio2Data = firestoreAbout['bio2'] as Partial<MultiLanguageText>;
        bio2 = {
          en: bio2Data.en || '',
          pt: bio2Data.pt || ''
        };
      } else if (typeof firestoreAbout['bio2'] === 'string') {
        // Se for string, usar como texto em ambos idiomas
        bio2 = { en: firestoreAbout['bio2'] as string, pt: firestoreAbout['bio2'] as string };
      }
    }
    
    let position: MultiLanguageText = { en: '', pt: '' };
    if (firestoreAbout['position']) {
      if (typeof firestoreAbout['position'] === 'object') {
        const positionData = firestoreAbout['position'] as Partial<MultiLanguageText>;
        position = {
          en: positionData.en || '',
          pt: positionData.pt || ''
        };
      } else if (typeof firestoreAbout['position'] === 'string') {
        // Se for string, usar como texto em ambos idiomas
        position = { en: firestoreAbout['position'] as string, pt: firestoreAbout['position'] as string };
      }
    }
    
    const about: About = {
      id: firestoreAbout['id'] as string || 'profile',
      bio1,
      bio2,
      position,
      createdAt: createdDate,
      updatedAt: updatedDate
    };
    
    return about;
  }
  
  // Método auxiliar para obter texto no idioma atual
  public getLocalizedText(text: MultiLanguageText): string {
    // Retornar texto no idioma atual ou fallback para inglês
    return text[this.currentLanguage as keyof MultiLanguageText] || 
           text.en || 
           Object.values(text).find(v => v) || '';
  }
  
  // Obter os dados do perfil
  getAboutData(): Observable<About | null> {
    return this.about$;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 