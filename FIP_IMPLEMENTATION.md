# Implementação do Status FIP e Segurança de Status

Este documento detalha as alterações realizadas na versão 5.0 para a implementação do status **FIP (Finalizado com Pendência)** e as novas regras de segurança e bloqueio.

## 1. O que foi feito

### Banco de Dados
- **Novo Status**: Inserido o status `Finalizado com Pendência` (Sigla: **FIP**, Cor: **#fa0000**) na tabela `status_servico`.
- **Persistência de Status Global**: Adicionada a coluna `status_id` na tabela `ordens`. Agora o status da OS não é apenas visual, mas gravado no banco, permitindo controle manual.

### Regras de Negócio (Frontend)
- **Trava de Segurança**: Ao editar uma OS, o sistema verifica se há itens de serviço com status diferente de "FINALIZADO" (FIN).
- **Bloqueio de FIN**: Se houver pendências, a opção **FIN (Verde)** no Status Global é desabilitada para impedir o fechamento indevido.
- **Sugestão de FIP**: Quando bloqueado, o sistema exibe o rótulo "BLOQUEADO - HÁ PENDÊNCIAS" ao lado da opção FIN, orientando o uso do FIP.

### Segurança e Hierarquia
- **Níveis de Acesso**: O sistema agora verifica o `userRole` no armazenamento local (`localStorage`).
- **Restrição Motorista**: Usuários com perfil **MOTORISTA** não conseguem clicar ou alterar o Status Global nem o Status dos Itens de Serviço. Os campos ficam em modo "Apenas Leitura".
- **Permissão Encarregado/Gestor**: Apenas estes perfis têm o poder de alterar status e finalizar ordens.

## 2. Problemas Identificados e Correções

### Status Global não clicável
- **Sintoma**: O select de status global aparece bloqueado mesmo para usuários que deveriam ter permissão.
- **Causa**: A lógica de verificação de permissão no `app.js` pode estar assumindo "MOTORISTA" se o `userRole` não estiver explicitamente definido como "GESTOR" ou "ENCARREGADO" no navegador.
- **Sugestão de Solução**: Verificaremos se o `userRole` está sendo setado corretamente e garantiremos que o atributo `disabled` seja removido para os perfis autorizados.

## 3. Lógica Implementada

```javascript
// Exemplo da lógica de trava no app.js
const hasPending = servicos.some(s => s.status_sigla !== 'FIN');
if (isFin && hasPending) {
    option.disabled = true;
    option.label = "FIN (BLOQUEADO - HÁ PENDÊNCIAS)";
}
```

---
*Documentação gerada automaticamente para referência técnica.*
