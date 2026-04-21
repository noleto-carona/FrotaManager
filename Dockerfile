# Use a imagem oficial do Node.js 22 (que já possui suporte nativo ao SQLite)
FROM node:22-slim

# Cria o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de definição de pacotes
COPY package*.json ./

# Instala as dependências de produção
RUN npm install --omit=dev

# Copia o restante do código do projeto
COPY . .

# Garante que as pastas de dados existam com as permissões corretas
# Não criamos as pastas db e uploads aqui para não conflitar com os volumes do docker-compose
# RUN mkdir -p db uploads

# Define a porta que o app vai rodar
EXPOSE 3000

# Variáveis de ambiente padrão
ENV PORT=3000
ENV NODE_ENV=production

# Comando para iniciar o servidor com a flag experimental necessária para o node:sqlite
CMD ["node", "--experimental-sqlite", "server/index.js"]
