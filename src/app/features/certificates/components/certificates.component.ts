import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { CertificateService } from '../services/certificate.service';
import { Certificate } from '../../../models/certificate.model';
import { MultiLanguageText } from '../../../models/project.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.css']
})
export class CertificatesComponent implements OnInit, OnDestroy {
  loading = true;
  error = false;
  certificates: Certificate[] = [];
  selectedCertificate: Certificate | null = null;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private certificateService: CertificateService,
    private languageService: LanguageService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCertificates();
      
      // Monitorar mudanças de idioma
      this.languageService.currentLanguage$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          // Não é necessário recarregar os certificados ao mudar o idioma
          // apenas forçar uma atualização da visualização
          this.certificates = [...this.certificates];
        });
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCertificates(): void {
    this.loading = true;
    this.certificateService.getCertificates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (certificates) => {
          // Filtrar apenas certificados com featured=true
          this.certificates = certificates.filter(certificate => certificate.featured === true);
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar certificados:', error);
          this.loading = false;
          this.error = true;
        }
      });
  }

  selectCertificate(certificate: Certificate): void {
    this.selectedCertificate = certificate;
  }

  closeDetails(): void {
    this.selectedCertificate = null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(this.languageService.getCurrentLanguage() === 'pt' ? 'pt-BR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Método auxiliar para obter texto localizado
  getLocalizedText(text: string | MultiLanguageText): string {
    return this.certificateService.getLocalizedText(text);
  }
} 