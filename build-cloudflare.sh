#!/bin/bash

# Script para construir o projeto Angular para o Cloudflare Pages

# Configurar node
export NODE_VERSION="18.18.0"

# Limpar a pasta dist
echo "Limpando pasta dist..."
rm -rf dist

# Instalar dependências
echo "Instalando dependências..."
npm install --legacy-peer-deps --no-fund --no-audit

# Construir o projeto
echo "Construindo o projeto..."
npm run build

# Copiar arquivos adicionais
echo "Copiando arquivos adicionais..."
cp src/_redirects dist/cloudflare/

echo "Build concluído com sucesso! Os arquivos estão disponíveis em dist/cloudflare/" 