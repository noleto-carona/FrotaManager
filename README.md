# Frota Manager

Sistema de gestão de frota com ordens de serviço — Node.js + Express + SQLite.

## Instalação e Uso

```bash
npm install
npm start
```

Acesse: http://localhost:3000

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
