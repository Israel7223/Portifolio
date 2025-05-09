#!/bin/bash

# Script para construir o projeto Angular para o Cloudflare Pages

# Configurar node
export NODE_VERSION="18.18.0"

# Limpar a pasta dist
echo "Limpando pasta dist..."
rm -rf dist

# Instalar dependências
echo "Instalando dependências..."
yarn install --immutable

# Construir o projeto
echo "Construindo o projeto..."
yarn run build

# Copiar arquivos adicionais
echo "Copiando arquivos adicionais..."
cp src/_redirects dist/cloudflare/

echo "Build concluído com sucesso! Os arquivos estão disponíveis em dist/cloudflare/" 