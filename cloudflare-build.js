// Script Node.js para configurar as variáveis de ambiente do Cloudflare Pages

const fs = require('fs');
const path = require('path');

// Criar arquivo de ambiente temporário
const envContent = `
export const environment = {
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
};
`;

try {
  // Garantir que o diretório de ambientes existe
  const envDir = path.join(__dirname, 'src', 'environments');
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  // Escrever o arquivo de ambiente para Cloudflare
  fs.writeFileSync(
    path.join(envDir, 'environment.cloudflare.ts'),
    envContent
  );

  console.log('Ambiente para Cloudflare configurado com sucesso!');
} catch (error) {
  console.error('Erro ao configurar ambiente para Cloudflare:', error);
  process.exit(1);
} 