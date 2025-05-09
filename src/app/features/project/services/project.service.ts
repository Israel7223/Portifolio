import { Injectable, OnDestroy } from '@angular/core';
import { Observable, of, BehaviorSubject, Subject, takeUntil, from, map, catchError, tap, switchMap } from 'rxjs';
import { Project, FirestoreProject, MultiLanguageText } from '../../../models/project.model';
import { LanguageService } from '../../../core/services/language.service';
import { StorageService } from '../../../core/services/storage.service';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  DocumentReference,
  DocumentData,
  FieldValue
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ProjectService implements OnDestroy {
  private currentLanguage: string;
  private destroy$ = new Subject<void>();
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  
  // Observable público para componentes se inscreverem
  public projects$ = this.projectsSubject.asObservable();

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
        // Não precisamos recarregar os projetos ao mudar o idioma
        // apenas notificar os componentes para atualizar a visualização
        this.projectsSubject.next(this.projectsSubject.getValue());
      });
      
    // Inicializar com todos os projetos
    this.fetchProjects();
  }

  // Buscar projetos do Firestore
  private fetchProjects(): void {
    console.log('Buscando todos os projetos');
    
    // Criar uma consulta que busca todos os projetos, sem filtro de idioma
    const projectsCollection = collection(this.firestore, 'projects');
    
    // Criar query básica sem filtro de idioma
    const projectsQuery = query(projectsCollection);
    
    // Verificar a existência dos documentos antes de tentar recuperar
    collectionData(projectsQuery, { idField: 'id' })
      .pipe(
        takeUntil(this.destroy$),
        tap(docs => {
          console.log('Documentos encontrados:', docs.length);
        }),
        map((firestoreProjects: DocumentData[]) => {
          // Mapear documentos do Firestore para o modelo Project
          return firestoreProjects.map(firestoreProject => {
            try {
              return this.convertToProject(firestoreProject as unknown as FirestoreProject);
            } catch (error) {
              console.error('Erro ao converter documento para Project:', error);
              console.error('Documento com erro:', JSON.stringify(firestoreProject));
              return null;
            }
          }).filter(p => p !== null) as Project[];
        }),
        catchError(error => {
          console.error('Erro ao buscar projetos do Firestore:', error);
          return of([]);
        })
      )
      .subscribe(projects => {
        console.log('Projetos após conversão:', projects.length);
        this.projectsSubject.next(projects);
      });
  }
  
  // Converter documento do Firestore para o modelo Project
  private convertToProject(firestoreProject: FirestoreProject): Project {
    console.log('Convertendo documento:', firestoreProject.id);
    
    // Verificar campos obrigatórios
    if (!firestoreProject.title) {
      console.warn('Documento sem título:', firestoreProject.id);
    }
    
    if (!firestoreProject.description) {
      console.warn('Documento sem descrição:', firestoreProject.id);
    }
    
    if (!firestoreProject.imageUrl) {
      console.warn('Documento sem URL de imagem:', firestoreProject.id);
    }
    
    // Verificar formato do campo technologies
    if (firestoreProject.technologies && !Array.isArray(firestoreProject.technologies)) {
      console.warn('Campo technologies não é um array:', firestoreProject.id);
    }
    
    let createdDate = new Date();
    if (firestoreProject.createdAt) {
      try {
        createdDate = (firestoreProject.createdAt as Timestamp).toDate();
      } catch (error) {
        console.error('Erro ao converter createdAt para Date:', error);
      }
    } else {
      console.warn('Documento sem campo createdAt:', firestoreProject.id);
    }
    
    let updatedDate = new Date();
    if (firestoreProject.updatedAt) {
      try {
        updatedDate = (firestoreProject.updatedAt as Timestamp).toDate();
      } catch (error) {
        console.error('Erro ao converter updatedAt para Date:', error);
      }
    } else {
      console.warn('Documento sem campo updatedAt:', firestoreProject.id);
    }
    
    // Processar technologies com segurança
    let technologies: string[] = [];
    if (firestoreProject.technologies) {
      if (Array.isArray(firestoreProject.technologies)) {
        technologies = firestoreProject.technologies;
      } else if (typeof firestoreProject.technologies === 'object') {
        // Tentar extrair valores se for um objeto em vez de array
        technologies = Object.values(firestoreProject.technologies)
          .filter(val => val && typeof val === 'string') as string[];
      }
    }
    
    // Verificar se temos uma estrutura multilíngue para description
    let description: MultiLanguageText = { en: '', pt: '' };
    
    if (firestoreProject.description) {
      if (typeof firestoreProject.description === 'object') {
        // Já está no formato multilíngue
        description = {
          en: firestoreProject.description.en || '',
          pt: firestoreProject.description.pt || ''
        };
      } else if (typeof firestoreProject.description === 'string') {
        // Formato antigo - usar idioma do documento ou o idioma atual como fallback
        const documentLang = (firestoreProject as unknown as Record<string, string>)['language'] || this.currentLanguage;
        description[documentLang as keyof MultiLanguageText] = firestoreProject.description;
      }
    }
    
    // Verificar se temos uma estrutura multilíngue para title
    let title: string | MultiLanguageText = '';
    
    if (firestoreProject.title) {
      if (typeof firestoreProject.title === 'object') {
        // Já está no formato multilíngue
        title = {
          en: firestoreProject.title.en || '',
          pt: firestoreProject.title.pt || ''
        };
      } else if (typeof firestoreProject.title === 'string') {
        // Usar o título como está, independente do idioma
        title = firestoreProject.title;
      }
    }
    
    const project: Project = {
      id: parseInt(firestoreProject.id || '', 10) || Math.floor(Math.random() * 1000), // Fallback para ID numérico
      title,
      description,
      imageUrl: firestoreProject.imageUrl || '',
      technologies: technologies,
      githubUrl: firestoreProject.githubUrl || '',
      liveUrl: firestoreProject.liveUrl || '',
      featured: firestoreProject.featured === true,
      category: firestoreProject.category || '',
      createdAt: createdDate,
      updatedAt: updatedDate
    };
    
    return project;
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
  
  // Converter objeto Project para formato compatível com Firestore
  private convertToFirestoreProject(project: Partial<Project>): Record<string, unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...rest } = project as Record<string, unknown>;
    
    // Não incluir o ID numérico para o Firestore
    return {
      ...rest,
      // Incluir timestamps apenas se for uma operação de criação
      ...(createdAt === undefined && { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp()
    };
  }

  // Obter todos os projetos
  getProjects(): Observable<Project[]> {
    return this.projects$;
  }

  // Obter um projeto específico por ID
  getProjectById(id: number): Observable<Project | undefined> {
    return this.projects$.pipe(
      map(projects => projects.find(p => p.id === id))
    );
  }

  // Adicionar um novo projeto
  addProject(project: Omit<Project, 'id'>, imageFile?: File): Observable<Project> {
    // Se tiver um arquivo de imagem, fazer upload primeiro
    if (imageFile) {
      return this.uploadProjectImage(imageFile).pipe(
        switchMap(imageUrl => {
          // Adicionar URL da imagem ao projeto
          const projectWithImage = { ...project, imageUrl };
          return this.saveProjectToFirestore(projectWithImage);
        })
      );
    } else {
      // Salvar sem imagem (ou com URL de imagem já fornecida)
      return this.saveProjectToFirestore(project);
    }
  }
  
  // Fazer upload da imagem do projeto
  private uploadProjectImage(imageFile: File): Observable<string> {
    return this.storageService.uploadFile(imageFile, 'projects');
  }
  
  // Salvar projeto no Firestore
  private saveProjectToFirestore(project: Omit<Project, 'id'>): Observable<Project> {
    const projectsCollection = collection(this.firestore, 'projects');
    const firestoreProject = this.convertToFirestoreProject(project);
    
    return from(addDoc(projectsCollection, firestoreProject)).pipe(
      map(docRef => {
        const newId = parseInt(docRef.id, 10) || Math.floor(Math.random() * 1000);
        const newProject = { ...project, id: newId } as Project;
        
        // Atualizar a lista de projetos
        const currentProjects = this.projectsSubject.getValue();
        this.projectsSubject.next([newProject, ...currentProjects]);
        
        return newProject;
      }),
      catchError(error => {
        console.error('Erro ao adicionar projeto ao Firestore:', error);
        throw new Error('Falha ao salvar projeto: ' + error.message);
      })
    );
  }

  // Atualizar um projeto existente
  updateProject(id: number, project: Partial<Project>, imageFile?: File): Observable<Project> {
    // Se tiver um arquivo de imagem, fazer upload primeiro
    if (imageFile) {
      return this.uploadProjectImage(imageFile).pipe(
        switchMap(imageUrl => {
          // Adicionar URL da imagem à atualização
          const projectWithImage = { ...project, imageUrl };
          return this.updateFirestoreProject(id, projectWithImage);
        })
      );
    } else {
      // Atualizar sem nova imagem
      return this.updateFirestoreProject(id, project);
    }
  }
  
  // Atualizar projeto no Firestore
  private updateFirestoreProject(id: number, project: Partial<Project>): Observable<Project> {
    // Encontrar o documento no Firestore que corresponde ao ID numérico
    return this.findFirestoreDocumentByNumericId(id).pipe(
      switchMap(docRef => {
        if (!docRef) {
      throw new Error(`Projeto com ID ${id} não encontrado`);
    }
    
        const firestoreProject = this.convertToFirestoreProject(project);
        
        // Cast para o tipo aceito pelo updateDoc
        const updateData: Record<string, FieldValue | Partial<unknown>> = {};
        Object.entries(firestoreProject).forEach(([key, value]) => {
          updateData[key] = value as FieldValue | Partial<unknown>;
        });
        
        return from(updateDoc(docRef, updateData)).pipe(
          map(() => {
            // Obter a lista atual de projetos
            const currentProjects = this.projectsSubject.getValue();
            
            // Encontrar e atualizar o projeto na lista
            const updatedProjects = currentProjects.map(p => {
              if (p.id === id) {
                return { ...p, ...project };
              }
              return p;
            });
    
    // Atualizar o BehaviorSubject
            this.projectsSubject.next(updatedProjects);
            
            // Retornar o projeto atualizado
            return updatedProjects.find(p => p.id === id) as Project;
          })
        );
      }),
      catchError(error => {
        console.error('Erro ao atualizar projeto no Firestore:', error);
        throw new Error('Falha ao atualizar projeto: ' + error.message);
      })
    );
  }
  
  // Encontrar documento do Firestore por ID numérico
  private findFirestoreDocumentByNumericId(numericId: number): Observable<DocumentReference | null> {
    // Buscar todos os projetos
    const projectsCollection = collection(this.firestore, 'projects');
    
    return collectionData(projectsCollection, { idField: 'id' }).pipe(
      map((projects: DocumentData[]) => {
        // Tentar encontrar um projeto com ID numérico que corresponda
        const match = projects.find(p => {
          const projectId = parseInt((p as unknown as Record<string, string>)['id'], 10);
          return !isNaN(projectId) && projectId === numericId;
        });
        
        if (match) {
          // Retornar a referência do documento
          return doc(this.firestore, `projects/${(match as unknown as Record<string, string>)['id']}`);
        }
        
        return null;
      }),
      catchError(error => {
        console.error('Erro ao buscar documento do Firestore:', error);
        return of(null);
      })
    );
  }

  // Remover um projeto
  deleteProject(id: number): Observable<void> {
    // Primeiro, encontrar o documento no Firestore
    return this.findFirestoreDocumentByNumericId(id).pipe(
      switchMap(docRef => {
        if (!docRef) {
          throw new Error(`Projeto com ID ${id} não encontrado`);
        }
        
        // Obter o projeto antes de excluí-lo para ter a URL da imagem
        return from(getDoc(docRef)).pipe(
          switchMap(docSnapshot => {
            if (!docSnapshot.exists()) {
      throw new Error(`Projeto com ID ${id} não encontrado`);
    }
    
            const projectData = docSnapshot.data() as FirestoreProject;
            
            // Excluir o documento do Firestore
            return from(deleteDoc(docRef)).pipe(
              switchMap(() => {
                // Se houver uma imagem, excluí-la do Storage
                if (projectData.imageUrl) {
                  return this.storageService.deleteFile(projectData.imageUrl).pipe(
                    catchError(error => {
                      console.error('Erro ao excluir imagem do Storage:', error);
                      return of(undefined); // Continuar mesmo se a exclusão da imagem falhar
                    })
                  );
                }
    return of(undefined);
              }),
              tap(() => {
                // Atualizar a lista de projetos
                const currentProjects = this.projectsSubject.getValue();
                const updatedProjects = currentProjects.filter(p => p.id !== id);
                this.projectsSubject.next(updatedProjects);
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Erro ao excluir projeto do Firestore:', error);
        throw new Error('Falha ao excluir projeto: ' + error.message);
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 