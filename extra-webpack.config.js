const webpack = require('webpack');
const dotenv = require('dotenv');
const fs = require('fs');

module.exports = (config, options) => {
  // Determina o arquivo .env a ser usado com base na configuração
  let environment = '.env';
  
  if (options.configuration === 'production') {
    environment = '.env.production';
  } else if (options.configuration === 'cloudflare') {
    environment = '.cloudflare.env';
  }
  
  // Tenta ler o arquivo .env específico, caso não exista, usa o .env padrão
  const currentPath = process.cwd();
  const envPath = `${currentPath}/${environment}`;
  const fallbackPath = `${currentPath}/.env`;
  
  let finalPath = fs.existsSync(envPath) ? envPath : fallbackPath;
  const env = dotenv.config({ path: finalPath }).parsed || {};
  
  // Converte as variáveis de ambiente em constantes que o Angular pode usar
  const envKeys = Object.keys(env).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(env[next]);
    return prev;
  }, {});
  
  // Adiciona o plugin DefinePlugin do webpack para substituir referências a 'process.env'
  config.plugins.push(
    new webpack.DefinePlugin(envKeys)
  );
  
  return config;
}; 