import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(private storage: Storage) { }

  /**
   * Faz upload de um arquivo para o Firebase Storage
   * @param file O arquivo a ser enviado
   * @param path O caminho no Storage (pasta)
   * @returns Observable com a URL de download
   */
  uploadFile(file: File, path: string): Observable<string> {
    // Cria um nome de arquivo único baseado no timestamp
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `${path}/${fileName}`;
    
    // Cria a referência ao arquivo no Storage
    const storageRef = ref(this.storage, filePath);
    
    // Cria a tarefa de upload
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Converte a Promise em Observable e retorna a URL do arquivo
    return from(
      new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          // Progress
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload progress: ${progress}%`);
          },
          // Error
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          // Complete
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then(downloadURL => {
                resolve(downloadURL);
              })
              .catch(err => {
                reject(err);
              });
          }
        );
      })
    ).pipe(
      catchError(error => {
        console.error('Error getting download URL:', error);
        return throwError(() => new Error('Falha ao obter URL de download'));
      })
    );
  }

  /**
   * Deleta um arquivo do Firebase Storage
   * @param fileUrl A URL do arquivo a ser deletado
   * @returns Observable que completa quando a operação termina
   */
  deleteFile(fileUrl: string): Observable<void> {
    // Extrai o caminho do arquivo da URL
    try {
      const fileRef = ref(this.storage, this.getPathFromUrl(fileUrl));
      return from(deleteObject(fileRef)).pipe(
        catchError(error => {
          console.error('Error deleting file:', error);
          return throwError(() => new Error('Falha ao deletar arquivo'));
        })
      );
    } catch (error) {
      console.error('Invalid file URL:', error);
      return throwError(() => new Error('URL de arquivo inválida'));
    }
  }

  /**
   * Extrai o caminho do arquivo da URL de download
   * @param url URL de download do Firebase Storage
   * @returns Caminho do arquivo no Storage
   */
  private getPathFromUrl(url: string): string {
    // Extrai o caminho do arquivo da URL do Firebase Storage
    const baseUrl = 'https://firebasestorage.googleapis.com/v0/b/';
    const urlParts = url.replace(baseUrl, '').split('?')[0].split('/');
    
    // Remove o bucket name e o token 'o'
    urlParts.shift(); // Remove o bucket name
    urlParts.shift(); // Remove 'o'
    
    // Decodifica as partes do caminho
    return urlParts.map(part => decodeURIComponent(part)).join('/');
  }
} 