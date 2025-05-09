import { Injectable, OnDestroy } from '@angular/core';
import { Observable, of, BehaviorSubject, Subject, takeUntil, map, catchError, from, switchMap, filter } from 'rxjs';
import { LanguageService } from '../../../core/services/language.service';
import { 
  Firestore, 
  collection, 
  collectionData,
  doc, 
  docData,
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  orderBy, 
  addDoc, 
  Timestamp
} from '@angular/fire/firestore';
import { 
  Education, 
  Experience, 
  Resume, 
  Skill, 
  FirestoreEducation, 
  FirestoreExperience,
  FirestoreResume,
  FirestoreSkill 
} from '../../../models/resume.model';
import { MultiLanguageText } from '../../../models/project.model';

// Interface para os dados recebidos
interface FirestoreData {
  id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Necessário para acessar propriedades dinâmicas do Firestore
}

@Injectable({
  providedIn: 'root'
})
export class ResumeService implements OnDestroy {
  private currentLanguage: string;
  private destroy$ = new Subject<void>();
  
  // BehaviorSubjects para cada tipo de dado
  private resumeSubject = new BehaviorSubject<Resume | null>(null);
  private educationSubject = new BehaviorSubject<Education[]>([]);
  private experienceSubject = new BehaviorSubject<Experience[]>([]);
  private skillsSubject = new BehaviorSubject<Skill[]>([]);
  
  // Observables públicos para componentes se inscreverem
  public resume$ = this.resumeSubject.asObservable();
  public education$ = this.educationSubject.asObservable();
  public experience$ = this.experienceSubject.asObservable();
  public skills$ = this.skillsSubject.asObservable();

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
        // Emitir novamente os valores atuais para acionar atualizações de UI
        this.resumeSubject.next(this.resumeSubject.getValue());
        this.educationSubject.next(this.educationSubject.getValue());
        this.experienceSubject.next(this.experienceSubject.getValue());
        this.skillsSubject.next(this.skillsSubject.getValue());
      });
      
    // Inicializar buscando todos os dados
    this.fetchAllResumeData();
  }

  // Buscar todos os dados relacionados ao resumo
  private fetchAllResumeData(): void {
    console.log('Buscando todos os dados do resumo');
    
    // Buscar o resumo principal
    this.fetchResumeData();
    
    // Buscar educação, experiência e habilidades
    this.fetchEducationData();
    this.fetchExperienceData();
    this.fetchSkillsData();
  }

  // Buscar o resumo principal do Firestore
  private fetchResumeData(): void {
    console.log('Buscando dados do resumo principal');
    
    // Obter o documento com ID "main" da coleção "resume"
    const resumeDocRef = doc(this.firestore, 'resume/main');
    
    docData<FirestoreData>(resumeDocRef, { idField: 'id' })
      .pipe(
        takeUntil(this.destroy$),
        filter((firestoreDoc): firestoreDoc is FirestoreData => firestoreDoc !== undefined),
        map((firestoreDoc: FirestoreData) => {
          try {
            const firestoreResume = firestoreDoc;
            if (firestoreResume) {
              console.log('Dados do resumo principal encontrados');
              
              // Criar um objeto Resume básico
              const resume: Resume = {
                id: firestoreResume.id || 'main',
                education: this.educationSubject.getValue(),
                experience: this.experienceSubject.getValue(),
                skills: this.skillsSubject.getValue(),
                summary: this.convertToMultiLanguageText(firestoreResume['summary']),
                createdAt: firestoreResume['createdAt'] ? (firestoreResume['createdAt'] as Timestamp).toDate() : new Date(),
                updatedAt: firestoreResume['updatedAt'] ? (firestoreResume['updatedAt'] as Timestamp).toDate() : new Date()
              };
              
              return resume;
            } else {
              console.warn('Nenhum dado de resumo principal encontrado');
              return null;
            }
          } catch (error) {
            console.error('Erro ao converter documento para Resume:', error);
            console.error('Documento com erro:', JSON.stringify(firestoreDoc));
            return null;
          }
        }),
        catchError(error => {
          console.error('Erro ao buscar dados do resumo do Firestore:', error);
          return of(null);
        })
      )
      .subscribe(resumeData => {
        this.resumeSubject.next(resumeData);
      });
  }

  // Buscar dados de educação do Firestore
  private fetchEducationData(): void {
    console.log('Buscando dados de educação');
    
    const educationCollection = collection(this.firestore, 'education');
    const educationQuery = query(educationCollection, orderBy('order', 'asc'));
    
    collectionData<FirestoreData>(educationQuery, { idField: 'id' })
      .pipe(
        takeUntil(this.destroy$),
        map((docs: FirestoreData[]) => {
          return docs.map(item => this.convertToEducation(item))
            .filter(item => item !== null) as Education[];
        }),
        catchError(error => {
          console.error('Erro ao buscar educação do Firestore:', error);
          return of([]);
        })
      )
      .subscribe(educationData => {
        this.educationSubject.next(educationData);
        
        // Atualizar também o resumo com os novos dados de educação
        const currentResume = this.resumeSubject.getValue();
        if (currentResume) {
          this.resumeSubject.next({
            ...currentResume,
            education: educationData
          });
        }
      });
  }

  // Buscar dados de experiência do Firestore
  private fetchExperienceData(): void {
    console.log('Buscando dados de experiência');
    
    const experienceCollection = collection(this.firestore, 'experience');
    const experienceQuery = query(experienceCollection, orderBy('order', 'asc'));
    
    collectionData<FirestoreData>(experienceQuery, { idField: 'id' })
      .pipe(
        takeUntil(this.destroy$),
        map((docs: FirestoreData[]) => {
          return docs.map(item => this.convertToExperience(item))
            .filter(item => item !== null) as Experience[];
        }),
        catchError(error => {
          console.error('Erro ao buscar experiência do Firestore:', error);
          return of([]);
        })
      )
      .subscribe(experienceData => {
        this.experienceSubject.next(experienceData);
        
        // Atualizar também o resumo com os novos dados de experiência
        const currentResume = this.resumeSubject.getValue();
        if (currentResume) {
          this.resumeSubject.next({
            ...currentResume,
            experience: experienceData
          });
        }
      });
  }

  // Buscar dados de habilidades do Firestore
  private fetchSkillsData(): void {
    console.log('Buscando dados de habilidades');
    
    const skillsCollection = collection(this.firestore, 'skills');
    const skillsQuery = query(skillsCollection, orderBy('order', 'asc'));
    
    collectionData<FirestoreData>(skillsQuery, { idField: 'id' })
      .pipe(
        takeUntil(this.destroy$),
        map((docs: FirestoreData[]) => {
          return docs.map(item => this.convertToSkill(item))
            .filter(item => item !== null) as Skill[];
        }),
        catchError(error => {
          console.error('Erro ao buscar habilidades do Firestore:', error);
          return of([]);
        })
      )
      .subscribe(skillsData => {
        this.skillsSubject.next(skillsData);
        
        // Atualizar também o resumo com os novos dados de habilidades
        const currentResume = this.resumeSubject.getValue();
        if (currentResume) {
          this.resumeSubject.next({
            ...currentResume,
            skills: skillsData
          });
        }
      });
  }

  // Converter objeto para MultiLanguageText
  private convertToMultiLanguageText(data: string | MultiLanguageText | null | undefined): MultiLanguageText {
    if (!data) return { en: '', pt: '' };
    
    if (typeof data === 'object') {
      return {
        en: data.en || '',
        pt: data.pt || ''
      };
    } else if (typeof data === 'string') {
      return { en: data, pt: data };
    }
    
    return { en: '', pt: '' };
  }

  // Converter documento do Firestore para o modelo Education
  private convertToEducation(firestoreEducation: FirestoreData): Education | null {
    try {
      if (!firestoreEducation) return null;
      
      if (!firestoreEducation['degree']) {
        console.warn('Documento de educação sem grau:', firestoreEducation.id);
      }
      
      if (!firestoreEducation['institution']) {
        console.warn('Documento de educação sem instituição:', firestoreEducation.id);
      }
      
      let createdDate = new Date();
      if (firestoreEducation['createdAt']) {
        try {
          createdDate = (firestoreEducation['createdAt'] as Timestamp).toDate();
        } catch (error) {
          console.error('Erro ao converter createdAt para Date:', error);
        }
      }
      
      let updatedDate = new Date();
      if (firestoreEducation['updatedAt']) {
        try {
          updatedDate = (firestoreEducation['updatedAt'] as Timestamp).toDate();
        } catch (error) {
          console.error('Erro ao converter updatedAt para Date:', error);
        }
      }
      
      return {
        id: firestoreEducation.id,
        degree: this.convertToMultiLanguageText(firestoreEducation['degree']),
        institution: this.convertToMultiLanguageText(firestoreEducation['institution']),
        period: firestoreEducation['period'] as string || '',
        description: this.convertToMultiLanguageText(firestoreEducation['description']),
        order: typeof firestoreEducation['order'] === 'number' ? firestoreEducation['order'] as number : 999,
        createdAt: createdDate,
        updatedAt: updatedDate
      };
    } catch (error) {
      console.error('Erro ao converter documento para Education:', error);
      console.error('Documento com erro:', JSON.stringify(firestoreEducation));
      return null;
    }
  }

  // Converter documento do Firestore para o modelo Experience
  private convertToExperience(firestoreExperience: FirestoreData): Experience | null {
    try {
      if (!firestoreExperience) return null;
      
      if (!firestoreExperience['position']) {
        console.warn('Documento de experiência sem posição:', firestoreExperience.id);
      }
      
      if (!firestoreExperience['company']) {
        console.warn('Documento de experiência sem empresa:', firestoreExperience.id);
      }
      
      let createdDate = new Date();
      if (firestoreExperience['createdAt']) {
        try {
          createdDate = (firestoreExperience['createdAt'] as Timestamp).toDate();
        } catch (error) {
          console.error('Erro ao converter createdAt para Date:', error);
        }
      }
      
      let updatedDate = new Date();
      if (firestoreExperience['updatedAt']) {
        try {
          updatedDate = (firestoreExperience['updatedAt'] as Timestamp).toDate();
        } catch (error) {
          console.error('Erro ao converter updatedAt para Date:', error);
        }
      }
      
      return {
        id: firestoreExperience.id,
        position: this.convertToMultiLanguageText(firestoreExperience['position']),
        company: this.convertToMultiLanguageText(firestoreExperience['company']),
        period: firestoreExperience['period'] as string || '',
        description: this.convertToMultiLanguageText(firestoreExperience['description']),
        order: typeof firestoreExperience['order'] === 'number' ? firestoreExperience['order'] as number : 999,
        createdAt: createdDate,
        updatedAt: updatedDate
      };
    } catch (error) {
      console.error('Erro ao converter documento para Experience:', error);
      console.error('Documento com erro:', JSON.stringify(firestoreExperience));
      return null;
    }
  }

  // Converter documento do Firestore para o modelo Skill
  private convertToSkill(firestoreSkill: FirestoreData): Skill | null {
    try {
      if (!firestoreSkill) return null;
      
      if (!firestoreSkill['name']) {
        console.warn('Documento de habilidade sem nome:', firestoreSkill.id);
      }
      
      let createdDate = new Date();
      if (firestoreSkill['createdAt']) {
        try {
          createdDate = (firestoreSkill['createdAt'] as Timestamp).toDate();
        } catch (error) {
          console.error('Erro ao converter createdAt para Date:', error);
        }
      }
      
      let updatedDate = new Date();
      if (firestoreSkill['updatedAt']) {
        try {
          updatedDate = (firestoreSkill['updatedAt'] as Timestamp).toDate();
        } catch (error) {
          console.error('Erro ao converter updatedAt para Date:', error);
        }
      }
      
      return {
        id: firestoreSkill.id,
        name: firestoreSkill['name'] as string || '',
        level: typeof firestoreSkill['level'] === 'number' ? firestoreSkill['level'] as number : 0,
        years: typeof firestoreSkill['years'] === 'number' ? firestoreSkill['years'] as number : 0,
        order: typeof firestoreSkill['order'] === 'number' ? firestoreSkill['order'] as number : 999,
        createdAt: createdDate,
        updatedAt: updatedDate
      };
    } catch (error) {
      console.error('Erro ao converter documento para Skill:', error);
      console.error('Documento com erro:', JSON.stringify(firestoreSkill));
      return null;
    }
  }

  // Método auxiliar para obter texto no idioma atual
  public getLocalizedText(text: MultiLanguageText): string {
    // Retornar texto no idioma atual ou fallback para inglês
    return text[this.currentLanguage as keyof MultiLanguageText] || 
           text.en || 
           Object.values(text).find(v => v) || '';
  }

  // Obter resumo completo
  getResume(): Observable<Resume | null> {
    return this.resume$;
  }

  // Obter lista de educação
  getEducation(): Observable<Education[]> {
    return this.education$;
  }

  // Obter lista de experiência
  getExperience(): Observable<Experience[]> {
    return this.experience$;
  }

  // Obter lista de habilidades
  getSkills(): Observable<Skill[]> {
    return this.skills$;
  }

  // Atualizar o resumo principal
  updateResumeSummary(summary: MultiLanguageText): Observable<void> {
    const resumeDocRef = doc(this.firestore, 'resume/main');
    
    // Dados para atualizar
    const updateData: Partial<FirestoreResume> = {
      summary,
      updatedAt: Timestamp.now()
    };
    
    return from(getDoc(resumeDocRef)).pipe(
      switchMap((docSnap) => {
        if (docSnap.exists()) {
          // Atualizar documento existente
          return from(updateDoc(resumeDocRef, updateData));
        } else {
          // Criar novo documento
          return from(setDoc(resumeDocRef, {
            ...updateData,
            id: 'main',
            createdAt: Timestamp.now()
          }));
        }
      }),
      map(() => {
        // Atualizar o BehaviorSubject localmente
        const currentResume = this.resumeSubject.getValue();
        if (currentResume) {
          this.resumeSubject.next({
            ...currentResume,
            summary,
            updatedAt: new Date()
          });
        } else {
          this.resumeSubject.next({
            id: 'main',
            education: this.educationSubject.getValue(),
            experience: this.experienceSubject.getValue(),
            skills: this.skillsSubject.getValue(),
            summary,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }),
      catchError(error => {
        console.error('Erro ao atualizar resumo:', error);
        throw error;
      })
    );
  }

  // Adicionar uma nova educação
  addEducation(education: Omit<Education, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const educationCollection = collection(this.firestore, 'education');
    
    // Converter para formato do Firestore
    const firestoreEducation: Partial<FirestoreEducation> = {
      ...education,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    return from(addDoc(educationCollection, firestoreEducation)).pipe(
      switchMap(docRef => {
        const newId = docRef.id;
        // Recarregar dados após adicionar
        this.fetchEducationData();
        return of(newId);
      }),
      catchError(error => {
        console.error('Erro ao adicionar educação:', error);
        throw error;
      })
    );
  }

  // Atualizar educação existente
  updateEducation(id: string, education: Partial<Education>): Observable<void> {
    const educationDocRef = doc(this.firestore, `education/${id}`);
    
    // Extrair createdAt e criar um novo objeto sem ele
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...educationWithoutCreatedAt } = education;
    
    // Converter para formato do Firestore e adicionar timestamp de atualização
    const firestoreEducation: Partial<FirestoreEducation> = {
      ...educationWithoutCreatedAt,
      updatedAt: Timestamp.now()
    };
    
    return from(updateDoc(educationDocRef, firestoreEducation)).pipe(
      map(() => {
        // Recarregar dados após atualizar
        this.fetchEducationData();
      }),
      catchError(error => {
        console.error(`Erro ao atualizar educação ${id}:`, error);
        throw error;
      })
    );
  }

  // Excluir educação
  deleteEducation(id: string): Observable<void> {
    const educationDocRef = doc(this.firestore, `education/${id}`);
    
    return from(deleteDoc(educationDocRef)).pipe(
      map(() => {
        // Recarregar dados após excluir
        this.fetchEducationData();
      }),
      catchError(error => {
        console.error(`Erro ao excluir educação ${id}:`, error);
        throw error;
      })
    );
  }

  // Adicionar uma nova experiência
  addExperience(experience: Omit<Experience, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const experienceCollection = collection(this.firestore, 'experience');
    
    // Converter para formato do Firestore
    const firestoreExperience: Partial<FirestoreExperience> = {
      ...experience,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    return from(addDoc(experienceCollection, firestoreExperience)).pipe(
      switchMap(docRef => {
        const newId = docRef.id;
        // Recarregar dados após adicionar
        this.fetchExperienceData();
        return of(newId);
      }),
      catchError(error => {
        console.error('Erro ao adicionar experiência:', error);
        throw error;
      })
    );
  }

  // Atualizar experiência existente
  updateExperience(id: string, experience: Partial<Experience>): Observable<void> {
    const experienceDocRef = doc(this.firestore, `experience/${id}`);
    
    // Extrair createdAt e criar um novo objeto sem ele
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...experienceWithoutCreatedAt } = experience;
    
    // Converter para formato do Firestore e adicionar timestamp de atualização
    const firestoreExperience: Partial<FirestoreExperience> = {
      ...experienceWithoutCreatedAt,
      updatedAt: Timestamp.now()
    };
    
    return from(updateDoc(experienceDocRef, firestoreExperience)).pipe(
      map(() => {
        // Recarregar dados após atualizar
        this.fetchExperienceData();
      }),
      catchError(error => {
        console.error(`Erro ao atualizar experiência ${id}:`, error);
        throw error;
      })
    );
  }

  // Excluir experiência
  deleteExperience(id: string): Observable<void> {
    const experienceDocRef = doc(this.firestore, `experience/${id}`);
    
    return from(deleteDoc(experienceDocRef)).pipe(
      map(() => {
        // Recarregar dados após excluir
        this.fetchExperienceData();
      }),
      catchError(error => {
        console.error(`Erro ao excluir experiência ${id}:`, error);
        throw error;
      })
    );
  }

  // Adicionar uma nova habilidade
  addSkill(skill: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const skillsCollection = collection(this.firestore, 'skills');
    
    // Converter para formato do Firestore
    const firestoreSkill: Partial<FirestoreSkill> = {
      ...skill,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    return from(addDoc(skillsCollection, firestoreSkill)).pipe(
      switchMap(docRef => {
        const newId = docRef.id;
        // Recarregar dados após adicionar
        this.fetchSkillsData();
        return of(newId);
      }),
      catchError(error => {
        console.error('Erro ao adicionar habilidade:', error);
        throw error;
      })
    );
  }

  // Atualizar habilidade existente
  updateSkill(id: string, skill: Partial<Skill>): Observable<void> {
    const skillDocRef = doc(this.firestore, `skills/${id}`);
    
    // Extrair createdAt e criar um novo objeto sem ele
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...skillWithoutCreatedAt } = skill;
    
    // Converter para formato do Firestore e adicionar timestamp de atualização
    const firestoreSkill: Partial<FirestoreSkill> = {
      ...skillWithoutCreatedAt,
      updatedAt: Timestamp.now()
    };
    
    return from(updateDoc(skillDocRef, firestoreSkill)).pipe(
      map(() => {
        // Recarregar dados após atualizar
        this.fetchSkillsData();
      }),
      catchError(error => {
        console.error(`Erro ao atualizar habilidade ${id}:`, error);
        throw error;
      })
    );
  }

  // Excluir habilidade
  deleteSkill(id: string): Observable<void> {
    const skillDocRef = doc(this.firestore, `skills/${id}`);
    
    return from(deleteDoc(skillDocRef)).pipe(
      map(() => {
        // Recarregar dados após excluir
        this.fetchSkillsData();
      }),
      catchError(error => {
        console.error(`Erro ao excluir habilidade ${id}:`, error);
        throw error;
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}