# Regras de Atualização do Histórico (Commit.md)
1. **Sempre atualize este arquivo**: Cada alteração significativa no código deve ser registrada aqui.
2. **Ordem Cronológica**: Mantenha os registros organizados por data (mais recente por último) e de forma sequencial.
3. **Não Excluir**: Nunca exclua um commit deste histórico sem autorização expressa.
4. **Git Sync**: Sempre execute `git add .` e `git pull` antes de finalizar as alterações para manter o repositório sincronizado.
5. **Formato Sequencial**: Siga o padrão de numeração e data/hora para cada entrada, similar ao `git commit`.

---

# Histórico de Atualizações - Frota Manager

**Projeto:** Sistema de Gerenciamento de Frota (Full Stack)

---

## 📅 20 de Abril de 2026

### 1. Migração para Full Stack (20/04/2026 14:30)
- **Backend:** Criado servidor robusto em Node.js com Express.
- **Banco de Dados:** Implementação de SQLite (node:sqlite) para persistência real dos dados, eliminando a dependência do localStorage.
- **Estrutura:** Organização profissional de pastas (server/routes, public, uploads, db).

### 2. Gestão de Ordens de Serviço (20/04/2026 15:15)
- **Rastreabilidade:** Sistema de IDs automáticos e sequenciais (Ex: OS-0001).
- **Título Dinâmico:** Identificação rápida no formato `ORDEM DE SERVIÇO — OS-XXXX - PLACA`.
- **Campos Inteligentes:** Separação de Data e Hora com preenchimento automático do momento atual.
- **KM/Horímetro:** Campos específicos para cada tipo de veículo (CV, HR, CR) com limite de 7 caracteres e foco automático.
- **Accordion:** Interface limpa com cards minimizáveis para evitar poluição visual.

### 3. Sistema de Fotos Profissional (20/04/2026 16:00)
- **Upload Real:** Integração com `multer` para salvar fotos como arquivos físicos no servidor.
- **Compressão Inteligente:** Redimensionamento automático para 1280px via Canvas para economizar espaço sem perder qualidade.
- **Limite de Segurança:** Máximo de 5 fotos por item de serviço.
- **Captura Direta:** Integração nativa com a câmera e galeria do celular.

### 4. Interface e UX (20/04/2026 16:45)
- **Paleta de Cores:** Design moderno baseado no Azul Vibrante (#0077d3) e Verde Neon (#00ffa3).
- **Padrão de Texto:** Todos os campos configurados para conversão automática em MAIÚSCULAS.
- **Animações de Destaque:** 
    - Efeito de borda giratória dupla (perseguição) em observações.
    - Pulsação suave (pulse) para alertas visuais em ordens com carga.
- **Edição Completa:** Agora todos os cadastros (Motoristas, Gestores, Encarregados e Placas) são 100% editáveis.

### 5. Integração com WhatsApp (20/04/2026 17:30)
- **Compartilhamento:** Botão de envio rápido no rodapé de cada ordem.
- **Formatação:** Mensagem organizada com Negritos para títulos e Itálicos para o histórico de observações.
- **Indicador Visual:** Aviso automático na mensagem quando o serviço possui fotos anexadas.

### 6. Dinâmica de Lançamento (20/04/2026 18:15)
- **Salvamento Automático:** Ao clicar no botão "+" para adicionar um serviço, a Ordem é salva automaticamente no banco de dados.
- **Fluxo de Fotos:** Após o salvamento, o sistema pergunta se o usuário deseja adicionar fotos.
- **Continuidade:** Se o usuário escolher "Sim", o painel de fotos abre na hora. Se escolher "Não", o modal da Ordem continua aberto para que ele possa lançar o próximo item sem interrupções.

### 7. Rastreio de Comunicação (20/04/2026 19:00)
- **Destaque Dinâmico WhatsApp:**
    - Ordens pendentes: Borda sólida **Verde Neon** e botão de WhatsApp **Verde**.
    - Ordens enviadas: Borda sólida **Cinza** e botão de WhatsApp **Cinza**, removendo o destaque visual para focar nas pendências.
- **Confirmação Personalizada:** Substituição dos diálogos nativos do navegador (`confirm`) por modais exclusivos com a identidade visual do Frota Manager (Azul/Verde Neon).
- **Rastreio Automático:** Ao clicar em "Enviar p/ WhatsApp", o sistema marca a OS automaticamente como "Enviada" no banco de dados, atualizando instantaneamente as cores da borda e do botão.

### 8. Estabilidade e UX (20/04/2026 19:45)
- **Correção no Fluxo de Fotos:** O modal de serviços agora limpa corretamente os campos de entrada e atualiza a lista de itens imediatamente ao salvar, mesmo quando o usuário opta por adicionar fotos na sequência.
- **Sincronização de Status:** Corrigida a falha na atualização do status do WhatsApp, garantindo que a marcação de "Enviada" seja refletida instantaneamente na interface após o compartilhamento.
- **Migração de Dados:** Garantida a integridade do banco de dados com a inclusão correta da coluna de rastreio de comunicação.

### 9. Otimização de Espaço (20/04/2026 20:15)
- **Minimização Inteligente:** Implementação de seção colapsável para os detalhes da Ordem (Motorista, Gestor, etc.) no modal de edição.
- **Automação de Foco:** O modal minimiza automaticamente os campos principais assim que a primeira placa é adicionada, permitindo foco total nos itens de serviço.
- **Persistência Visual:** Ordens que já possuem placas abrem por padrão com os detalhes minimizados, economizando rolagem de tela em dispositivos móveis.
- **Controle Manual:** Botão "Detalhes da Ordem" permite expandir ou recolher as informações a qualquer momento.

### 10. Rastreio de Alterações (20/04/2026 21:00)
- **Reset Automático de Status:** Implementação de TRIGGERS no SQLite que monitoram qualquer alteração em serviços, placas, fotos ou observações.
- **Destaque Dinâmico Reversivo:** Sempre que uma Ordem é editada, uma nova foto é adicionada/excluída ou um serviço é alterado, o status "Enviada" é resetado para "Pendente" (Verde Neon).
- **Garantia de Atualização:** Isso garante que o gestor saiba exatamente quais ordens precisam ser reenviadas após modificações, mantendo a comunicação sempre sincronizada com o estado real da frota.

### 11. Preservação de Estado (20/04/2026 21:30)
- **Memória de Expansão:** O sistema agora lembra quais Ordens de Serviço estão expandidas na lista principal. Ao editar um serviço ou adicionar fotos, o card da ordem permanece aberto, facilitando a edição de múltiplos itens sem interrupções.
- **Sincronização em Tempo Real:** Melhoria na comunicação entre o painel de serviços e o modal de ordens, garantindo que as alterações sejam refletidas instantaneamente em todas as telas abertas sem perder o foco do usuário.

### 12. Fluxo de Conclusão (20/04/2026 22:00)
- **Status Global Dinâmico**: O cabeçalho da Ordem agora exibe badges abreviados (**PEN**, **AND**, **FIN**) com cores específicas (Amarelo, Azul, Verde).
- **Lógica de Hierarquia**:
    - **FIN**: Somente se TODOS os serviços forem finalizados.
    - **AND**: Se houver ao menos um serviço "Em Andamento".
    - **PEN**: Se todos os serviços estiverem pendentes.
- **Arquivamento Corrigido**: Melhoria na lógica de filtragem para garantir que ordens totalmente finalizadas sejam removidas da lista principal instantaneamente, mantendo a tela focada apenas no trabalho ativo.

### 13. Busca e Filtros (20/04/2026 22:45)
- **Filtro de Status**: Agora é possível alternar entre exibir apenas ordens **ATIVAS** (PEN/AND), apenas **FINALIZADAS** (FIN) ou **TODAS** simultaneamente.
- **Busca por Data**: Campo de data para localizar ordens criadas/previstas em um dia específico.
- **Busca por Nº OS**: Campo de busca em tempo real para localizar ordens pelo seu código identificador (ex: 0001).
- **Interface Otimizada**: Painel de filtros compacto e intuitivo posicionado no topo da aba de Ordens, com botão de limpeza rápida para resetar as buscas.

### 14. Padronização de Diálogos e UX (20/04/2026 23:15)
- **Modais Customizados**: Substituição de todos os `prompt()` e `confirm()` nativos por modais exclusivos com o tema Frota Manager.
- **Ícones Dinâmicos**: Inclusão de ícones específicos conforme o contexto (ex: **Câmera** para fotos).
- **Cadastro de Placas**: Evolução do campo "Tipo" para **ListBox** (Select) e renomeação de labels para **Placa** e **Marca / Modelo**.
- **Ajustes Visuais**: Padronização de sombras, bordas e alinhamento de todos os campos de filtro e botões de ação.

---

## 📅 22 de Abril de 2026

### 16. Refatoração de Status - Siglas de 3 Letras (22/04/2026 10:00)
- **Banco de Dados:** Inclusão da coluna `sigla` (VARCHAR 3) na tabela de status, com migração automática para preencher siglas existentes (Ex: PENDENTE → PEN).
- **Componentização UI:** Criação de um padrão global de "Status Badge" em formato de pílula (pill-shaped) com cores dinâmicas e texto em caixa alta.
- **Interatividade (Tooltip):** Implementação de tooltips nativos em todas as siglas. Ao passar o mouse ou clicar na tag, o nome completo do status é exibido para evitar ambiguidades.
- **Otimização de Espaço:** Substituição dos nomes completos por siglas em todas as listagens, cards de serviço e modais de edição, tornando a interface mais compacta e limpa.
- **Dropdowns Inteligentes:** Atualização de todos os seletores (dropdowns) para exibir o formato `SIGLA - NOME` (Ex: PEN - PENDENTE), facilitando a identificação rápida.
- **Filtros de Busca:** Atualização do dropdown de pesquisa principal para refletir as siglas entre parênteses, como `ATIVOS (PEN/AND)` e `FINALIZADOS (FIN)`.
    - **WhatsApp Compacto:** Atualização da mensagem enviada via WhatsApp para utilizar siglas nos status dos serviços, mantendo a consistência visual e economizando espaço na mensagem.
    - **Gestão de Status:** Inclusão do campo de sigla na tela de cadastro de novos status, permitindo personalização total pelo administrador.
- **Contraste Dinâmico:** Algoritmo de detecção de brilho da cor de fundo para ajustar automaticamente a cor do texto da sigla (Branco ou Escuro) para legibilidade máxima.

---

### 16. Infraestrutura e Deploy Oracle Cloud (21/04/2026 10:00)
- **Infraestrutura (OCI):** Configuração completa de VCN, Sub-redes públicas, Internet Gateway e Security Lists para liberação das portas 22 (SSH) e 3000 (App).
- **Automação:** Criação do script `setup-server.sh` para instalação automatizada do Docker e Docker Compose V2 no Ubuntu 24.04.
- **Persistência em Nuvem:** Ajuste do Docker Compose para sincronização de dados via *bind mounts*, garantindo a persistência do banco SQLite mesmo após reinicializações do container.
- **Firewall:** Liberação manual de portas no `iptables` do servidor para acesso externo.

### 17. Melhorias de Acessibilidade Mobile (21/04/2026 10:15)
- **Flexibilidade de Mídia:** Remoção da captura forçada de câmera. Agora o usuário pode escolher entre **Tirar Foto** ou **Selecionar da Galeria**, facilitando o uso de fotos já existentes no aparelho.
- **Estabilidade de Banco:** Tratamento de erros em exclusões de status. O sistema agora identifica e avisa quando um status não pode ser removido por estar em uso em alguma ordem de serviço, evitando erros genéricos 500.

### 18. Otimização Android e Mobile UX (21/04/2026 11:30)
- **Busca Retrátil:** Filtros de pesquisa agora são minimizados por padrão com o nome "Pesquisar", economizando 40% de espaço na tela inicial do celular.
- **Título OS Simplificado:** Remoção do nome do motorista do título do card para garantir que o código (Ex: OS-0001) apareça 100% visível em telas pequenas.
- **Responsividade:** Ajuste de paddings e gaps no cabeçalho das ordens para maximizar o aproveitamento horizontal no Android.
- **Correção de Renderização:** Ajuste na lógica de escape de caracteres para permitir a exibição correta de tags HTML dinâmicas nos títulos.

### 19. Dockerização e Preparação para Servidores Profissionais (21/04/2026 11:30)
- **Containerização:** Criação do `Dockerfile` oficial utilizando a imagem leve do Node 22-slim.
- **Orquestração Local:** Implementação do `docker-compose.yml` para facilitar o rodar do sistema completo em qualquer máquina com um único comando.
- **Persistência Blindada:** Configuração de volumes no Docker para garantir que o banco de dados SQLite e a pasta de fotos (uploads) nunca sejam apagados ao reiniciar o container.

### 20. Sincronização em Tempo Real (Desenvolvimento) (21/04/2026 12:00)
- **Volumes de Desenvolvimento:** Atualização do `docker-compose.yml` para mapear as pastas `public` e `server` como volumes.
- **Hot-Reload de Estilos:** Agora as alterações feitas no `style.css` e `app.js` no VS Code são refletidas instantaneamente no navegador (após refresh), sem necessidade de reconstruir a imagem Docker.
- **Produtividade:** Facilidade para testar ajustes finos de layout diretamente no `localhost:3000`.

### 21. Automação de Deploy VPS (21/04/2026 13:30)
- **Script de Setup:** Criado o `setup-server.sh` para automatizar a instalação do Docker e Docker Compose em servidores Linux (Ubuntu/Oracle Linux).
- **Configuração de Permissões:** O script já configura o usuário para rodar Docker sem necessidade de `sudo`.
- **Documentação de Deploy:** Atualização do `README.md` com o guia passo a passo para deploy na infraestrutura da Oracle Cloud.

### 22. Finalização do Deploy na Oracle Cloud (21/04/2026 15:50)
- **Sucesso no Acesso SSH:** Resolução de problemas de permissão de chave privada no Windows e configuração de porta 22.
- **Configuração de Firewall OCI:** Abertura das portas 22 (SSH) e 3000 (Aplicação) nas Ingress Rules.
- **Firewall Interno (Ubuntu):** Aplicação de regras de `iptables` para permitir tráfego na porta 3000.
- **Docker Compose V2:** Migração para o comando `docker compose` (V2) para maior estabilidade e compatibilidade.
- **Deploy Ativo:** Sistema rodando em produção no IP `137.131.205.215:3000`.

### 23. Otimização de Interface Mobile e Simplificação (21/04/2026 16:30)
- **Filtros Retráteis:** Implementada seção de busca minimizada com botão "PESQUISAR", economizando espaço em telas de Android.
- **Simplificação de Títulos:** Título das Ordens de Serviço simplificado para exibir apenas o código (ex: `OS-0001`), removendo o nome do motorista para evitar cortes e poluição visual.
- **Ajuste de Estilo:** Adicionado destaque visual (fundo azul claro e bordas) para o código da OS, melhorando a leitura rápida.
- **Sincronização de Dados:** Realizada a sincronização completa do banco de dados `frota.db` e pastas de `uploads` entre o ambiente local e o servidor Oracle.
- **Workflow de Deploy:** Garantida a atualização do servidor via `git pull` e `docker compose` para refletir as mudanças de UI.

### 24. Forçamento de Atualização de Cache (Cache Busting) (21/04/2026 17:00)
- **Versão de Arquivos:** Implementada técnica de "Cache Busting" no `index.html` adicionando sufixos de versão (`?v=2.1`) aos arquivos `style.css` e `app.js`.
- **Resolução de Conflitos:** Isso garante que dispositivos Android/iOS que já acessaram o sistema baixem obrigatoriamente a nova lógica de interface, eliminando estilos antigos (como estilos inline de truncamento) que estavam travados na memória do navegador.
- **Uniformidade:** Garantia de que a visualização seja idêntica em todos os aparelhos, seguindo o padrão testado no emulador.

### 25. Refinamento Crítico de Layout Mobile (21/04/2026 17:15)
- **Proibição de Truncamento:** Adicionada a regra `!important` para `overflow: visible` e `text-overflow: clip` no código da OS, impedindo cortes em qualquer dispositivo.
- **Otimização de Milímetros:** Reduzido o `gap` (espaço) entre elementos do cabeçalho de 4px para 2px em telas pequenas.
- **Ajuste de Escala:** Leve redução na fonte da OS para 0.72rem para garantir o encaixe perfeito em dispositivos com alta densidade de pixels (como o Redmi 14C).
- **Versão 2.2:** Atualização do Cache Buster para v2.2 em todos os arquivos estáticos.

### 26. Ajuste de Layout Mobile Extremo (v2.3) (21/04/2026 17:30)
- **Minimização de Botões:** Redução dos botões de ação de 32px para 28px em dispositivos móveis, maximizando o espaço para os dados da OS.
- **Área Reservada:** Implementado `min-width: 65px` no código da OS para impedir que o navegador tente comprimir o texto.
- **Hierarquia de Flexbox:** Ajustado o `flex-shrink` dos botões para 0, garantindo que eles fiquem no final da linha sem invadir o espaço do código.
- **Versão 2.3:** Atualização do Cache Buster para v2.3.

### 27. Padronização de Experiência Mobile (v2.4) (21/04/2026 17:45)
- **Container Inteligente:** Implementada restrição de largura máxima (`420px`) para dispositivos móveis, garantindo que a visualização seja consistente com o padrão de teste de 400px, independente do tamanho físico do aparelho.
- **Centralização Automática:** O conteúdo agora se mantém centralizado em telas largas (como tablets ou celulares em modo paisagem), preservando a proporção ideal de leitura.
- **Versão 2.4:** Atualização do Cache Buster para v2.4.

### 28. Consolidação de Layout Mobile e Proteção de DPI (v2.5) (21/04/2026 18:00)
- **Blindagem de UI:** Reforçadas as regras de CSS com `!important` para garantir que o código da OS nunca seja cortado, mesmo em dispositivos com a DPI padrão de 360.
- **Eficiência de Espaço:** Padronização final dos botões de ação para 28px e gaps mínimos, garantindo que o layout caiba perfeitamente em telas estreitas.
- **Cache Busting v2.5:** Atualização forçada das versões de CSS e JS para garantir que todos os usuários recebam as melhorias de layout instantaneamente.
- **Manutenção:** Limpeza e organização final do histórico de atualizações.

### 29. adicionando sombra o botão OS-0000 (21/04/2026 18:15)
- **Efeito de Sombra:** Adicionado sombra ao botão OS-0000 para melhorar a visibilidade em telas claras.
- **Versão 2.5:** Atualização do Cache Buster para v2.5.

### 30. Mudança da cor da sombra (21/04/2026 18:30)
- **Cor da Sombra:** Alterada a cor da sombra para preto para melhorar a visibilidade em telas claras.
- **Versão 2.5:** Atualização do Cache Buster para v2.5.

### 31. Adicionado Box Shadow ao botão OS-0000 (21/04/2026 18:45)
- **Efeito de Sombra:** Adicionado sombra ao botão OS-0000 para melhorar a visibilidade em telas claras.
- **Versão 2.5:** Atualização do Cache Buster para v2.5.

### 32. Nova alteção no box shadow do OS-0000 (22/04/2026  00:35)
- **Efeito de Sombra:** Adicionado sombra ao botão OS-0000 para melhorar a visibilidade em telas claras.

### 33. Correção de Seleção de Mídia no Android (22/04/2026 10:45)
- **Flexibilidade de Mídia**: Implementado menu de escolha entre "Câmera" e "Galeria" para resolver problemas de compatibilidade no Android.
- **Inputs Separados**: Adicionado input específico com `capture="environment"` para garantir a abertura da câmera.
- **Refatoração**: Unificada a lógica de processamento e upload de imagens para maior consistência.
- **Versão 2.7**: Novo modal de escolha com botões grandes (Câmera/Galeria) e botão fechar (X), removendo o select anterior.
### 34. Edição de Status e Cache Busting v3.0 (22/04/2026 13:30)
- **Funcionalidade de Edição**: Adicionado botão de editar na aba de Status, permitindo alterar o Nome e a Sigla de status existentes.
- **Sincronização em Tempo Real**: Ao editar um status, todas as ordens de serviço na memória são atualizadas instantaneamente para refletir as novas siglas/nomes.
- **Cache Busting v3.0**: Atualização forçada das versões de CSS e JS para `v3.0` no `index.html`, garantindo que os usuários recebam as novas funções de sigla e edição.
- **Identificação de Versão**: Adicionado selo visual `v3.0 SIGLAS` no cabeçalho do sistema para facilitar a verificação da versão ativa.
- **Manutenção de Regras**: Inclusão de regras de commit e manutenção do arquivo `Commit.md` no topo do documento e na memória do assistente.

---
*Relatório organizado cronologicamente pelo assistente de desenvolvimento.*
