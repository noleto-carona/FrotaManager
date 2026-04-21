#!/bin/bash

# Script de Configuração Automatizada para Frota Manager na Oracle Cloud
# Desenvolvido para Ubuntu 22.04+

echo "🚀 Iniciando a configuração do servidor..."

# 1. Atualizar o sistema
echo "📦 Atualizando pacotes do sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker
echo "🐳 Instalando Docker..."
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# 3. Instalar Docker Compose
echo "🐙 Instalando Docker Compose..."
sudo apt install docker-compose -y

# 4. Configurar permissões do Docker para o usuário atual
echo "🔑 Configurando permissões do usuário..."
sudo usermod -aG docker $USER

# 5. Criar estrutura de pastas se não existir
echo "📁 Criando diretórios de dados..."
mkdir -p db uploads

# 6. Finalização
echo "✅ Configuração concluída com sucesso!"
echo "------------------------------------------------------------"
echo "⚠️  IMPORTANTE: Saia do servidor (digite 'exit') e entre novamente via SSH"
echo "para que as permissões do Docker entrem em vigor."
echo "------------------------------------------------------------"
echo "Após o re-login, basta rodar: docker-compose up -d --build"
