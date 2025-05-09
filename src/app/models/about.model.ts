import { MultiLanguageText } from './project.model';
import { FirestoreTimestamp } from './firebase.types';

export interface About {
  id: string;
  bio1: MultiLanguageText;
  bio2: MultiLanguageText;
  position: MultiLanguageText;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para representar um documento do Firestore
export interface FirestoreAbout extends Omit<About, 'createdAt' | 'updatedAt'> {
  createdAt?: FirestoreTimestamp; // Timestamp do Firestore
  updatedAt?: FirestoreTimestamp; // Timestamp do Firestore
} 