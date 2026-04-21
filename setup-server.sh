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

# 3. Instalar Docker Compose V2
echo "🐙 Instalando Docker Compose V2..."
sudo apt install docker-compose-v2 -y

# 4. Configurar permissões do Docker
echo "🔑 Configurando permissões do usuário..."
sudo usermod -aG docker $USER

# 5. Criar diretórios
echo "📁 Criando diretórios de dados..."
mkdir -p db uploads

echo "✅ Configuração concluída!"
echo "⚠️  SAIA E ENTRE NOVAMENTE NO SSH PARA FINALIZAR."
echo "Após o re-login, basta rodar: cd ~/FrotaManager && docker compose up -d --build"
