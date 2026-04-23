# Frota Manager

Sistema de gestão de frota com ordens de serviço — Node.js + Express + SQLite.

## Instalação e Uso

```bash
npm install
npm start
```

Acesse: http://localhost:3000

## 🚀 Deploy na Oracle Cloud (VPS)

Para colocar o sistema online em seu próprio servidor:

### 1. Preparar o Servidor
Após criar sua instância na Oracle Cloud e abrir a porta **3000** nas Ingress Rules:

1. Conecte-se ao servidor via SSH:
   ```bash
   ssh -i "ssh-key-2026-04-21.key" ubuntu@137.131.205.215
   ```
   1.a Iniciar servidor
   ```bash
   docker compose up -d
   ```

2. No servidor, crie o arquivo de setup:
   ```bash
   nano setup-server.sh
   ```
   (Cole o conteúdo do arquivo `setup-server.sh` do projeto, salve com `Ctrl+O` e saia com `Ctrl+X`).

3. Execute o setup:
   ```bash
   chmod +x setup-server.sh
   ./setup-server.sh
   ```

4. **Saia e entre novamente no SSH** para aplicar as permissões.

### 2. Subir o Sistema
1. Envie os arquivos do seu projeto para o servidor (via `git clone` ou `scp`).
2. Rode o comando final:
   ```bash
   docker compose up -d --build
   ```

## Deploy no Render

1. `git init && git add . && git commit -m "initial"`
2. Push para o GitHub
3. Criar **Web Service** no Render apontando para o repo
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Adicionar um **Disk** persistente montado em `/db` para o SQLite não resetar

## Funcionalidades

- Cadastro de Motoristas, Gestores, Encarregados, Placas e Status
- Ordens de Serviço com ID rastreável (OS-0001, OS-0002...)
- Múltiplas placas por ordem com múltiplos serviços por placa
- Status com cor personalizável
- Histórico de observações imutável por serviço (timeline)
- Compartilhamento via WhatsApp
- Link compartilhável — basta enviar a URL do Render para o encarregado/mecânico
