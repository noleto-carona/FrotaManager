Builder

Excelente! A VCN servidor-frota está criada e ativa (Available).

Agora precisamos criar as duas peças que faltam para a internet chegar no seu servidor: a Sub-rede Pública e o Gateway de Internet .

Siga estes passos agora:

### 1. Criar o Gateway de Internet (A "porta da rua")
1. Na tela que você está, clique na aba Gateways (está ali no meio, ao lado de Subnets).
2. Clique no botão azul Create Internet Gateway .
3. Dê o nome: igw-frota .
4. Clique em Create Internet Gateway .
### 2. Criar a Sub-rede Pública (A "estrada")
1. Agora clique na aba Subnets (ao lado de Gateways).
2. Clique no botão azul Create Subnet .
3. Name: public-subnet-frota .
4. Subnet Type: Certifique-se de que está marcado Regional (é o padrão).
5. IPv4 CIDR Block: Digite 10.0.1.0/24 .
6. Subnet Access: MUITO IMPORTANTE! Selecione Public Subnet .
7. Clique em Create Subnet .
### 3. O último passo da rede (Configurar a rota):
Depois de criar a Subnet, precisamos dizer para ela usar o Gateway que você criou:

1. Clique na aba Routing Tables (ou em Default Route Table for servidor-frota que aparece na sua imagem).
2. Clique em Add Route Rules .
3. Target Type: Selecione Internet Gateway .
4. Destination CIDR Block: Digite 0.0.0.0/0 (isso significa "toda a internet").
5. Target Internet Gateway: Selecione o igw-frota que você criou.
6. Clique em Add Route Rules .
UFA! Feito isso, a sua rede estará 100% pronta. Aí é só voltar na tela de Instâncias e criar o servidor usando essa rede. O botão do IP Público finalmente estará livre!