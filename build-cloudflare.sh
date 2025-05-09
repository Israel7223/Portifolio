#!/bin/bash

# Script para construir o projeto Angular para o Cloudflare Pages

# Configurar node
export NODE_VERSION="18.19.1"

echo "Gerando environment.cloudflare.ts com variáveis de ambiente..."
ENV_CLOUDFLARE_FILE="src/environments/environment.cloudflare.ts"

# Recriar o arquivo com os valores das variáveis de ambiente
# As variáveis como $FIREBASE_API_KEY devem estar definidas no ambiente de build da Cloudflare
cat <<EOF > $ENV_CLOUDFLARE_FILE
export const environment = {
  production: true,
  firebase: {
    apiKey: '${FIREBASE_API_KEY}',
    authDomain: '${FIREBASE_AUTH_DOMAIN}',
    projectId: '${FIREBASE_PROJECT_ID}',
    storageBucket: '${FIREBASE_STORAGE_BUCKET}',
    messagingSenderId: '${FIREBASE_MESSAGING_SENDER_ID}',
    appId: '${FIREBASE_APP_ID}'
  },
  emailjs: {
    serviceId: '${EMAILJS_SERVICE_ID}',
    templateId: '${EMAILJS_TEMPLATE_ID}',
    userId: '${EMAILJS_USER_ID}'
  },
  recaptcha: {
    siteKey: '${RECAPTCHA_SITE_KEY}'
  }
};
EOF

echo "Conteúdo de $ENV_CLOUDFLARE_FILE gerado:"
cat $ENV_CLOUDFLARE_FILE # Para debug nos logs da Cloudflare

# Limpar a pasta dist
echo "Limpando pasta dist..."
rm -rf dist

# Instalar dependências
echo "Instalando dependências..."
yarn install --immutable

# Construir o projeto
echo "Construindo o projeto..."
yarn run build # Isso usará o environment.cloudflare.ts gerado

# Copiar arquivos adicionais
echo "Copiando arquivos adicionais..."
cp src/_redirects dist/cloudflare/

echo "Build concluído com sucesso! Os arquivos estão disponíveis em dist/cloudflare/" 