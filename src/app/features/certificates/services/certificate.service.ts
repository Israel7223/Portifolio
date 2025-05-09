import { Injectable, OnDestroy } from '@angular/core';
import { Observable, of, BehaviorSubject, Subject, takeUntil, map, catchError, tap } from 'rxjs';
import { Certificate, FirestoreCertificate } from '../../../models/certificate.model';
import { MultiLanguageText } from '../../../models/project.model';
import { LanguageService } from '../../../core/services/language.service';
import { StorageService } from '../../../core/services/storage.service';
import { 
  Firestore, 
  collection, 
  collectionData, 
  query, 
  serverTimestamp, 
  Timestamp,
  DocumentData
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CertificateService implements OnDestroy {
  private currentLanguage: string;
  private destroy$ = new Subject<void>();
  private certificatesSubject = new BehaviorSubject<Certificate[]>([]);
  
  // Observable público para componentes se inscreverem
  public certificates$ = this.certificatesSubject.asObservable();

  constructor(
    private languageService: LanguageService,
    private firestore: Firestore,
    private storageService: StorageService
  ) {
    this.currentLanguage = this.languageService.getCurrentLanguage();
    
    // Responder a mudanças de idioma
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lang: string) => {
        this.currentLanguage = lang;
        this.certificatesSubject.next(this.certificatesSubject.getValue());
      });
      
    // Inicializar com todos os certificados
    this.fetchCertificates();
  }

  // Buscar certificados do Firestore
  private fetchCertificates(): void {
    console.log('Buscando todos os certificados');
    
    const certificatesCollection = collection(this.firestore, 'certificates');
    const certificatesQuery = query(certificatesCollection);
    
    collectionData(certificatesQuery, { idField: 'id' })
      .pipe(
        takeUntil(this.destroy$),
        tap(docs => {
          console.log('Certificados encontrados:', docs.length);
        }),
        map((firestoreCertificates: DocumentData[]) => {
          return firestoreCertificates.map(firestoreCertificate => {
            try {
              return this.convertToCertificate(firestoreCertificate as FirestoreCertificate);
            } catch (error) {
              console.error('Erro ao converter documento para Certificate:', error);
              console.error('Documento com erro:', JSON.stringify(firestoreCertificate));
              return null;
            }
          }).filter(c => c !== null) as Certificate[];
        }),
        catchError(error => {
          console.error('Erro ao buscar certificados do Firestore:', error);
          return of([]);
        })
      )
      .subscribe(certificates => {
        console.log('Certificados após conversão:', certificates.length);
        this.certificatesSubject.next(certificates);
      });
  }
  
  // Converter documento do Firestore para o modelo Certificate
  private convertToCertificate(firestoreCertificate: FirestoreCertificate & DocumentData): Certificate {
    console.log('Convertendo documento:', firestoreCertificate.id);
    
    if (!firestoreCertificate.name) {
      console.warn('Documento sem nome:', firestoreCertificate.id);
    }
    
    if (!firestoreCertificate.issuer) {
      console.warn('Documento sem emissor:', firestoreCertificate.id);
    }
    
    if (!firestoreCertificate.imageUrl) {
      console.warn('Documento sem URL de imagem:', firestoreCertificate.id);
    }
    
    let createdDate = new Date();
    if (firestoreCertificate.createdAt) {
      try {
        createdDate = (firestoreCertificate.createdAt as Timestamp).toDate();
      } catch (error) {
        console.error('Erro ao converter createdAt para Date:', error);
      }
    } else {
      console.warn('Documento sem campo createdAt:', firestoreCertificate.id);
    }
    
    let updatedDate = new Date();
    if (firestoreCertificate.updatedAt) {
      try {
        updatedDate = (firestoreCertificate.updatedAt as Timestamp).toDate();
      } catch (error) {
        console.error('Erro ao converter updatedAt para Date:', error);
      }
    } else {
      console.warn('Documento sem campo updatedAt:', firestoreCertificate.id);
    }
    
    // Verificar se temos uma estrutura multilíngue para nome
    let name: string | MultiLanguageText = '';
    
    if (firestoreCertificate.name) {
      if (typeof firestoreCertificate.name === 'object') {
        // Já está no formato multilíngue
        name = {
          en: firestoreCertificate.name.en || '',
          pt: firestoreCertificate.name.pt || ''
        };
      } else if (typeof firestoreCertificate.name === 'string') {
        // Usar o nome como está, independente do idioma
        name = firestoreCertificate.name;
      }
    }
    
    // Verificar se temos uma estrutura multilíngue para descrição
    let description: string | MultiLanguageText = '';
    
    if (firestoreCertificate.description) {
      if (typeof firestoreCertificate.description === 'object') {
        // Já está no formato multilíngue
        description = {
          en: firestoreCertificate.description.en || '',
          pt: firestoreCertificate.description.pt || ''
        };
      } else if (typeof firestoreCertificate.description === 'string') {
        // Usar a descrição como está
        description = firestoreCertificate.description;
      }
    }
    
    // Processar skills com segurança
    let skills: string[] = [];
    if (firestoreCertificate.skills) {
      if (Array.isArray(firestoreCertificate.skills)) {
        skills = firestoreCertificate.skills;
      } else if (typeof firestoreCertificate.skills === 'object') {
        // Tentar extrair valores se for um objeto em vez de array
        skills = Object.values(firestoreCertificate.skills)
          .filter(val => val && typeof val === 'string') as string[];
      }
    }
    
    const certificate: Certificate = {
      id: parseInt(firestoreCertificate.id || '', 10) || Math.floor(Math.random() * 1000), // Fallback para ID numérico
      name,
      issuer: firestoreCertificate.issuer || '',
      issueDate: firestoreCertificate.issueDate || '',
      credentialId: firestoreCertificate.credentialId || '',
      imageUrl: firestoreCertificate.imageUrl || '',
      certificateUrl: firestoreCertificate.certificateUrl || '',
      description,
      skills,
      featured: firestoreCertificate.featured === true,
      createdAt: createdDate,
      updatedAt: updatedDate
    };
    
    return certificate;
  }
  
  // Método auxiliar para obter texto no idioma atual
  public getLocalizedText(text: string | MultiLanguageText): string {
    if (typeof text === 'string') {
      return text;
    }
    
    // Retornar texto no idioma atual ou fallback para inglês
    return text[this.currentLanguage as keyof MultiLanguageText] || 
           text.en || 
           Object.values(text).find(v => v) || '';
  }
  
  // Converter objeto Certificate para formato compatível com Firestore
  private convertToFirestoreCertificate(certificate: Partial<Certificate>): Record<string, unknown> {
    // Extrair as propriedades que não devem ir para o Firestore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...firestoreData } = certificate;
    
    // Não incluir o ID numérico para o Firestore
    return {
      ...firestoreData,
      // Incluir timestamps apenas se for uma operação de criação
      ...(createdAt === undefined ? { createdAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp()
    };
  }

  // Obter todos os certificados
  getCertificates(): Observable<Certificate[]> {
    return this.certificates$;
  }

  // Obter um certificado específico por ID
  getCertificateById(id: number): Observable<Certificate | undefined> {
    return this.certificates$.pipe(
      map(certificates => certificates.find(c => c.id === id))
    );
  }

  // Métodos para administração (adicionar, atualizar, excluir certificados)
  // Podem ser implementados conforme necessário, similar ao ProjectService

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 