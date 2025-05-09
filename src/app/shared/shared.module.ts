import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Aqui importaremos os pipes, diretivas e componentes compartilhados
// As importações serão adicionadas após movermos os arquivos

@NgModule({
  declarations: [
    // Pipes, diretivas e componentes compartilhados serão declarados aqui
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    // Exportamos os módulos comuns para não precisar importá-los em cada módulo de feature
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Também exportaremos os pipes, diretivas e componentes compartilhados
  ]
})
export class SharedModule { } 