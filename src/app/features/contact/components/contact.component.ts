import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RecaptchaModule, RecaptchaFormsModule } from 'ng-recaptcha';
import { EmailService } from '../../../core/email/email.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule, 
    TranslatePipe, 
    ReactiveFormsModule,
    RecaptchaModule,
    RecaptchaFormsModule
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  currentYear = 0;
  contactForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  
  // Chave do site do reCAPTCHA do ambiente
  readonly RECAPTCHA_SITE_KEY: string;
  
  constructor(
    private fb: FormBuilder,
    private emailService: EmailService
  ) {
    // Verificar se a chave do reCAPTCHA está definida
    if (!environment.recaptcha?.siteKey) {
      console.error('RECAPTCHA_SITE_KEY não encontrada nas variáveis de ambiente');
    }
    
    // Atribuir valor com verificação de undefined
    this.RECAPTCHA_SITE_KEY = environment.recaptcha?.siteKey || '';
  }
  
  ngOnInit() {
    this.currentYear = new Date().getFullYear();
    this.initForm();
  }
  
  /**
   * Inicializa o formulário com validações
   */
  private initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      recaptcha: ['', Validators.required]
    });
  }
  
  /**
   * Manipula o envio do formulário
   */
  onSubmit(): void {
    if (this.contactForm.invalid) {
      // Marca todos os campos como tocados para mostrar erros
      Object.keys(this.contactForm.controls).forEach(key => {
        const control = this.contactForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.isSubmitting = true;
    this.submitSuccess = false;
    this.submitError = false;
    
    const formData = {
      name: this.contactForm.value.name,
      email: this.contactForm.value.email,
      message: this.contactForm.value.message
    };
    
    this.emailService.sendEmail(formData, this.contactForm.value.recaptcha)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.submitSuccess = true;
          this.contactForm.reset();
        },
        error: () => {
          this.isSubmitting = false;
          this.submitError = true;
        }
      });
  }
  
  /**
   * Reinicia o formulário após envio com sucesso
   */
  resetForm(): void {
    this.contactForm.reset();
    this.submitSuccess = false;
    this.submitError = false;
  }
}
