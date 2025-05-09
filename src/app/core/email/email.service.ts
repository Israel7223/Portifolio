import { Injectable } from '@angular/core';
import emailjs from 'emailjs-com';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  // Constantes para configuração do EmailJS
  private readonly SERVICE_ID: string;
  private readonly TEMPLATE_ID: string;
  private readonly USER_ID: string;

  constructor() {
    // Verificar se as variáveis de ambiente estão definidas
    if (!environment.emailjs.serviceId) {
      console.error('SERVICE_ID não encontrado nas variáveis de ambiente');
    }
    
    if (!environment.emailjs.templateId) {
      console.error('TEMPLATE_ID não encontrado nas variáveis de ambiente');
    }
    
    if (!environment.emailjs.userId) {
      console.error('USER_ID não encontrado nas variáveis de ambiente');
    }
    
    // Atribuir valores com verificação de undefined
    this.SERVICE_ID = environment.emailjs.serviceId || '';
    this.TEMPLATE_ID = environment.emailjs.templateId || '';
    this.USER_ID = environment.emailjs.userId || '';
    
    // Inicializa o EmailJS apenas se USER_ID estiver disponível
    if (this.USER_ID) {
      emailjs.init(this.USER_ID);
    } else {
      console.error('EmailJS não foi inicializado devido à falta do USER_ID');
    }
  }

  /**
   * Envia um email usando o EmailJS
   * @param formData Dados do formulário (nome, email, mensagem)
   * @param captchaResponse Resposta do reCAPTCHA
   * @returns Observable com o resultado do envio
   */
  sendEmail(formData: unknown, captchaResponse: string): Observable<unknown> {
    // Verificar se as credenciais estão disponíveis
    if (!this.SERVICE_ID || !this.TEMPLATE_ID || !this.USER_ID) {
      console.error('Credenciais do EmailJS não configuradas corretamente');
      return throwError(() => new Error('Configuração de email não encontrada'));
    }
    
    // Adiciona o email do remetente à mensagem para facilitar a resposta
    const data = formData as Record<string, unknown>;
    const formattedMessage = `Email de contato: ${data['email']}\n\n${data['message']}`;
    
    // Adiciona a resposta do captcha aos dados do formulário
    const templateParams = {
      ...data,
      message: formattedMessage,
      'g-recaptcha-response': captchaResponse
    };

    // Converte a Promise do EmailJS em um Observable
    return from(emailjs.send(
      this.SERVICE_ID,
      this.TEMPLATE_ID,
      templateParams,
      this.USER_ID
    )).pipe(
      catchError(error => {
        console.error('Erro ao enviar email:', error);
        throw error;
      })
    );
  }
} 