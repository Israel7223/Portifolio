import { Injectable, OnDestroy } from '@angular/core';
import { Observable, of, BehaviorSubject, Subject, takeUntil, map, catchError, tap, from } from 'rxjs';
import { WhatIDoService as WhatIDoServiceModel } from '../../../models/what-i-do.model';
import { MultiLanguageText } from '../../../models/project.model';
import { LanguageService } from '../../../core/services/language.service';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  DocumentData
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class WhatIDoService implements OnDestroy {
  private currentLanguage: string;
  private destroy$ = new Subject<void>();
  private servicesSubject = new BehaviorSubject<WhatIDoServiceModel[]>([]);
  
  // Observable público para componentes se inscreverem
  public services$ = this.servicesSubject.asObservable();

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
        // Não precisamos recarregar os serviços ao mudar o idioma
        // apenas notificar os componentes para atualizar a visualização
        this.servicesSubject.next(this.servicesSubject.getValue());
      });
      
    // Inicializar buscando todos os serviços
    this.fetchServices();
  }

  // Buscar serviços do Firestore
  private fetchServices(): void {
    console.log('Buscando todos os serviços');
    
    // Criar uma consulta que busca todos os serviços, ordenados pelo campo order
    const servicesCollection = collection(this.firestore, 'whatIDo');
    
    // Ordenar por ordem ascendente
    const servicesQuery = query(servicesCollection, orderBy('order', 'asc'));
    
    // Buscar os documentos
    collectionData(servicesQuery, { idField: 'id' })
      .pipe(
        takeUntil(this.destroy$),
        tap(docs => {
          console.log('Serviços encontrados:', docs.length);
        }),   
       
        map((firestoreServices: DocumentData[]) => {
          // Mapear documentos do Firestore para o modelo WhatIDoService
          return firestoreServices.map(firestoreService => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return this.convertToService(firestoreService as any);
            } catch (error) {
              console.error('Erro ao converter documento para WhatIDoService:', error);
              console.error('Documento com erro:', JSON.stringify(firestoreService));
              return null;
            }
          }).filter(s => s !== null) as WhatIDoServiceModel[];
        }),
        catchError(error => {
          console.error('Erro ao buscar serviços do Firestore:', error);
          return of([]);
        })
      )
      .subscribe(services => {
        console.log('Serviços após conversão:', services.length);
        this.servicesSubject.next(services);
      });
  }
  
  // Converter documento do Firestore para o modelo WhatIDoService
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertToService(firestoreService: any): WhatIDoServiceModel {
    console.log('Convertendo documento de serviço:', firestoreService.id);
    
    // Verificar campos obrigatórios
    if (!firestoreService.title) {
      console.warn('Documento sem título:', firestoreService.id);
    }
    
    if (!firestoreService.description) {
      console.warn('Documento sem descrição:', firestoreService.id);
    }
    
    if (!firestoreService.iconClass) {
      console.warn('Documento sem classe de ícone:', firestoreService.id);
    }
    
    let createdDate = new Date();
    if (firestoreService.createdAt) {
      try {
        createdDate = (firestoreService.createdAt as Timestamp).toDate();
      } catch (error) {
        console.error('Erro ao converter createdAt para Date:', error);
      }
    } else {
      console.warn('Documento sem campo createdAt:', firestoreService.id);
    }
    
    let updatedDate = new Date();
    if (firestoreService.updatedAt) {
      try {
        updatedDate = (firestoreService.updatedAt as Timestamp).toDate();
      } catch (error) {
        console.error('Erro ao converter updatedAt para Date:', error);
      }
    } else {
      console.warn('Documento sem campo updatedAt:', firestoreService.id);
    }
    
    // Verificar se temos estruturas multilíngues
    let title: MultiLanguageText = { en: '', pt: '' };
    if (firestoreService.title) {
      if (typeof firestoreService.title === 'object') {
        title = {
          en: firestoreService.title.en || '',
          pt: firestoreService.title.pt || ''
        };
      } else if (typeof firestoreService.title === 'string') {
        // Se for string, usar como texto em ambos idiomas
        title = { en: firestoreService.title, pt: firestoreService.title };
      }
    }
    
    let description: MultiLanguageText = { en: '', pt: '' };
    if (firestoreService.description) {
      if (typeof firestoreService.description === 'object') {
        description = {
          en: firestoreService.description.en || '',
          pt: firestoreService.description.pt || ''
        };
      } else if (typeof firestoreService.description === 'string') {
        // Se for string, usar como texto em ambos idiomas
        description = { en: firestoreService.description, pt: firestoreService.description };
      }
    }
    
    // Ordem padrão se não estiver definida
    const order = typeof firestoreService.order === 'number' ? firestoreService.order : 999;
    
    const service: WhatIDoServiceModel = {
      id: firestoreService.id,
      title,
      description,
      iconClass: firestoreService.iconClass || '',
      order,
      createdAt: createdDate,
      updatedAt: updatedDate
    };
    
    return service;
  }
  
  // Método auxiliar para obter texto no idioma atual
  public getLocalizedText(text: MultiLanguageText): string {
    // Retornar texto no idioma atual ou fallback para inglês
    return text[this.currentLanguage as keyof MultiLanguageText] || 
           text.en || 
           Object.values(text).find(v => v) || '';
  }
  
  // Converter objeto WhatIDoService para formato compatível com Firestore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private convertToFirestoreService(service: Partial<WhatIDoServiceModel>): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, updatedAt, ...rest } = service as Partial<WhatIDoServiceModel>;
    
    // Usamos um tipo mais genérico aqui devido a limitações de tipagem com serverTimestamp()
    return {
      ...rest,
      // Incluir timestamps apenas se for uma operação de criação
      ...(createdAt === undefined ? { createdAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp()
    };
  }

  // Obter todos os serviços
  getServices(): Observable<WhatIDoServiceModel[]> {
    return this.services$;
  }

  // Obter um serviço específico por ID
  getServiceById(id: string): Observable<WhatIDoServiceModel | undefined> {
    return this.services$.pipe(
      map(services => services.find(s => s.id === id))
    );
  }

  // Adicionar um novo serviço
  addService(service: Omit<WhatIDoServiceModel, 'id'>): Observable<WhatIDoServiceModel> {
    const firestoreService = this.convertToFirestoreService(service);
    const servicesCollection = collection(this.firestore, 'whatIDo');
    
    return from(addDoc(servicesCollection, firestoreService)).pipe(
      map(docRef => {
        const newService: WhatIDoServiceModel = {
          ...(service as WhatIDoServiceModel),
          id: docRef.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Atualizar subject com o novo serviço
        const currentServices = this.servicesSubject.getValue();
        this.servicesSubject.next([...currentServices, newService]);
        
        return newService;
      }),
      catchError(error => {
        console.error('Erro ao adicionar serviço:', error);
        throw error;
      })
    );
  }

  // Atualizar um serviço existente
  updateService(id: string, service: Partial<WhatIDoServiceModel>): Observable<WhatIDoServiceModel> {
    const firestoreService = this.convertToFirestoreService(service);
    const serviceDoc = doc(this.firestore, `whatIDo/${id}`);
    
    return from(updateDoc(serviceDoc, firestoreService)).pipe(
      map(() => {
        // Buscar o serviço atual
        const currentServices = this.servicesSubject.getValue();
        const currentService = currentServices.find(s => s.id === id);
        
        if (!currentService) {
          throw new Error(`Serviço com ID ${id} não encontrado`);
        }
        
        // Criar serviço atualizado
        const updatedService: WhatIDoServiceModel = {
          ...currentService,
          ...service,
          updatedAt: new Date()
        };
        
        // Atualizar lista de serviços
        const updatedServices = currentServices.map(s => 
          s.id === id ? updatedService : s
        );
        
        this.servicesSubject.next(updatedServices);
        
        return updatedService;
      }),
      catchError(error => {
        console.error(`Erro ao atualizar serviço ${id}:`, error);
        throw error;
      })
    );
  }

  // Excluir um serviço
  deleteService(id: string): Observable<void> {
    const serviceDoc = doc(this.firestore, `whatIDo/${id}`);
    
    return from(deleteDoc(serviceDoc)).pipe(
      tap(() => {
        // Remover serviço da lista
        const currentServices = this.servicesSubject.getValue();
        const updatedServices = currentServices.filter(s => s.id !== id);
        this.servicesSubject.next(updatedServices);
      }),
      catchError(error => {
        console.error(`Erro ao excluir serviço ${id}:`, error);
        throw error;
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 