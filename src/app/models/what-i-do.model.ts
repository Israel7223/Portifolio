import { MultiLanguageText } from './project.model';
import { FirestoreTimestamp } from './firebase.types';

export interface WhatIDoService {
  id: string;
  title: MultiLanguageText;
  description: MultiLanguageText;
  iconClass: string;
  order: number; // Para controlar a ordem de exibição
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para representar um documento do Firestore
export interface FirestoreWhatIDoService extends Omit<WhatIDoService, 'createdAt' | 'updatedAt'> {
  createdAt?: FirestoreTimestamp; // Timestamp do Firestore
  updatedAt?: FirestoreTimestamp; // Timestamp do Firestore
} 