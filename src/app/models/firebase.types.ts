/**
 * Tipos para o Firebase
 * Este arquivo contém definições de tipos para objetos do Firebase
 * para evitar o uso de 'any' no código
 */

/**
 * Representa o tipo Timestamp do Firestore
 */
export interface FirestoreTimestamp {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
}

/**
 * Tipo para representar referências de documentos no Firestore
 */
export interface FirestoreDocRef {
  id: string;
  path: string;
  // Adicione mais propriedades conforme necessário
}

/**
 * Interface para representar documentos do Firestore com metadados
 */
export interface FirestoreDocument {
  id?: string;
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
} 