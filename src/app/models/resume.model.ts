import { MultiLanguageText } from './project.model';
import { FirestoreTimestamp } from './firebase.types';

export interface Education {
  id?: string;
  degree: MultiLanguageText;
  institution: MultiLanguageText;
  period: string;
  description: MultiLanguageText;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Experience {
  id?: string;
  position: MultiLanguageText;
  company: MultiLanguageText;
  period: string;
  description: MultiLanguageText;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Skill {
  id?: string;
  name: string;
  level: number; // 0-100
  years: number;
  order?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Resume {
  id?: string;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  summary?: MultiLanguageText;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interfaces para representar documentos do Firestore
export interface FirestoreEducation extends Omit<Education, 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: FirestoreTimestamp; // Timestamp do Firestore
  updatedAt?: FirestoreTimestamp; // Timestamp do Firestore
}

export interface FirestoreExperience extends Omit<Experience, 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: FirestoreTimestamp; // Timestamp do Firestore
  updatedAt?: FirestoreTimestamp; // Timestamp do Firestore
}

export interface FirestoreSkill extends Omit<Skill, 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: FirestoreTimestamp; // Timestamp do Firestore
  updatedAt?: FirestoreTimestamp; // Timestamp do Firestore
}

export interface FirestoreResume extends Omit<Resume, 'education' | 'experience' | 'skills' | 'createdAt' | 'updatedAt'> {
  id?: string;
  summary?: MultiLanguageText;
  createdAt?: FirestoreTimestamp; // Timestamp do Firestore
  updatedAt?: FirestoreTimestamp; // Timestamp do Firestore
} 