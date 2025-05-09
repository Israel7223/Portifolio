import { MultiLanguageText } from './project.model';
import { FirestoreTimestamp } from './firebase.types';

export interface Certificate {
  id: number;
  name: string | MultiLanguageText;
  issuer: string;
  issueDate: string;
  credentialId: string;
  imageUrl: string;
  certificateUrl: string;
  description?: string | MultiLanguageText;
  skills?: string[];
  featured?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para representar um documento do Firestore
export interface FirestoreCertificate extends Omit<Certificate, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string; // ID do documento no Firestore
  createdAt?: FirestoreTimestamp; // Timestamp do Firestore
  updatedAt?: FirestoreTimestamp; // Timestamp do Firestore
} 