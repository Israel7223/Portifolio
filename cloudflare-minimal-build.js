// Script Node.js minimalista para configuração pré-build no Cloudflare Pages
// Este script foi projetado para funcionar com Node.js 16.x

const fs = require('fs');
const path = require('path');

console.log('Iniciando configuração para build no Cloudflare...');

// Conteúdo básico do arquivo de ambiente
const envContent = `export const environment = {
  production: true,
  firebase: { 
    apiKey: '', 
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
  emailjs: {
    serviceId: '',
    templateId: '',
    userId: ''
  },
  recaptcha: {
    siteKey: ''
  }
};`;

try {
  // Confirmar se o diretório existe
  const envDir = path.join(__dirname, 'src', 'environments');
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
    console.log(`Criado diretório: ${envDir}`);
  }

  // Gravar o arquivo de ambiente
  const envFilePath = path.join(envDir, 'environment.cloudflare.ts');
  fs.writeFileSync(envFilePath, envContent);
  console.log(`Arquivo de ambiente criado: ${envFilePath}`);

  // Confirmar se o diretório dist existe
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log(`Criado diretório: ${distDir}`);
  }

  // Gravar um arquivo _redirects vazio
  const redirectsContent = '/* /index.html 200';
  const redirectsPath = path.join(__dirname, 'src', '_redirects');
  fs.writeFileSync(redirectsPath, redirectsContent);
  console.log(`Arquivo _redirects criado: ${redirectsPath}`);

  console.log('Configuração para build concluída!');
} catch (error) {
  console.error('Erro durante a configuração:', error);
  // Não falhar o build caso ocorra um erro
} 