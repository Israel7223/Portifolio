// Estrutura para campos de texto multilíngues
import { FirestoreTimestamp } from './firebase.types';

export interface MultiLanguageText {
  en: string;
  pt: string;
}

export interface Project {
  id: number;
  // Título pode ser o mesmo em todos os idiomas ou multilíngue
  title: string | MultiLanguageText;
  // Descrição multilíngue
  description: MultiLanguageText;
  technologies?: string[];
  imageUrl: string;
  githubUrl?: string;
  liveUrl?: string;
  featured?: boolean;
  category?: string;
  // Não precisamos mais do campo language
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para representar um documento do Firestore
export interface FirestoreProject extends Omit<Project, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string; // ID do documento no Firestore
  createdAt?: FirestoreTimestamp; // Timestamp do Firestore
  updatedAt?: FirestoreTimestamp; // Timestamp do Firestore
} 