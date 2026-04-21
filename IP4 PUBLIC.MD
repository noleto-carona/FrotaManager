Endereços IP Públicos
Este tópico descreve como gerenciar endereços IPv4 públicos em instâncias de uma Rede Virtual na Nuvem (VCN).

Há suporte para o endereçamento IPv6 em todas as regiões comerciais e do setor governamental. Para obter mais informações, consulte Endereços IPv6.

Visão Geral dos Endereços IP Públicos🔗
Um endereço IP público é um endereço IPv4 acessível pela internet. Se um recurso na sua tenancy precisar estar diretamente acessível pela internet, ele deverá ter um endereço IP público. Dependendo do tipo de recurso, pode haver outros requisitos.

Determinados tipos de recursos na sua tenancy foram projetados para serem acessíveis diretamente pela internet e, portanto, têm automaticamente um endereço IP público. Por exemplo: um gateway NAT ou um balanceador de carga público. Outros tipos de recursos só poderão ser acessados diretamente se você configurá-los para que se comportem assim. Por exemplo: instâncias na sua VCN.

Este tópico se concentra nestes assuntos:

Os tipos de endereços IP públicos e suas características
Como controlar se uma instância tem um endereço IP público
Para obter mais informações sobre recursos que obtêm automaticamente um endereço IP público, consulte Recursos Que Sempre Obtêm um IP Público.

Instâncias e Endereços IP Públicos
Você pode designar um endereço IP público a uma instância para permitir a comunicação com a internet. A instância recebe um endereço IP público do pool de endereços do Oracle Cloud Infrastructure.

A designação é, na verdade, um objeto de IP privado vinculado à VNIC da instância. A VNIC à qual o IP privado foi designado deve estar em uma sub-rede pública. Uma determinada instância pode ter várias VNICs secundárias, e uma determinada VNIC pode ter vários endereços IP privados secundários. Assim, você pode designar a uma determinada instância vários objetos IP públicos em uma ou mais VNICs, se desejar.

Para que uma instância se comunique diretamente com a internet, todas as seguintes condições são necessárias:

A instância deve estar em uma sub-rede pública.
A instância deve ter um endereço IP público reservado ou efêmero.
A VCN da instância deve ter um gateway de internet.
A sub-rede pública deve ter tabelas de roteamento e listas de segurança configuradas de forma adequada.
 Dica

O pareamento público Oracle Cloud Infrastructure FastConnect permite que sua rede local acesse o endereço IP público de recursos no Oracle Cloud Infrastructure sem o tráfego que atravessa a Internet. Para obter mais informações, consulte FastConnect.
O Objeto IP Público
O serviço Networking define um objeto chamado IP público, que tem estes atributos:

Endereço IPv4 público (escolhido pelo sistema Oracle)
Propriedades que definem ainda mais o tipo e o comportamento do objeto. Por exemplo, cada objeto IP público tem um OCID designado pela Oracle (consulte Identificadores de Recursos).
Uma designação a um endereço IP privado usado por uma VNIC da instância.
Associação opcional de um endereço IP público com uma tabela de roteamento personalizada (consulte Roteamento por Recurso).
Se você estiver usando a API, também poderá designar a cada objeto IP público um nome descritivo.
O termo IP público, conforme usado aqui, geralmente se refere ao objeto e não apenas ao endereço IP que ele contém.

Tipos de IPs Públicos
Um IP público pode ter um de dois tipos:

Efêmero: O objeto é temporário e só existe durante a vida útil da instância.
Reservado: O objeto é persistente e existe além do tempo de vida da instância à qual ele está designado. Você pode cancelar a designação desse tipo de IP e, em seguida, redesigná-lo a outra instância sempre que quiser. Uma exceção é um IP público reservado em um balanceador de carga público. Consulte Visão Geral de Endereços IP Públicos
A tabela a seguir resume as diferenças entre os dois tipos.

Característica	IPs Públicos Efêmeros	IPs Públicos Reservados
Designação permitida	
Somente para o IP privado principal de uma VNIC

Limites:

Um por VNIC
Dois por instância VM e 16 por instância bare metal
Para um IP privado principal ou para um IP privado secundário

Limite: 65 por VNIC

Criação	
Opcionalmente, criado e designado durante a inicialização da instância ou durante a criação de uma VNIC secundária. Você poderá criar e designar um posteriormente se a VNIC ainda não o tiver.

Você pode criar um a qualquer momento. Você pode designá-lo quando desejar.

Limite: você pode criar 50 por região

Cancelar designação	
Você pode cancelar a designação desse IP a qualquer momento. Isso fará com que ele seja excluído. Você poderá fazer isso se quem tiver iniciado a instância incluiu um IP público, mas você não quer que a instância tenha um IP desse tipo.

Quando você interrompe uma instância, os seus IPs públicos efêmeros permanecem designados à instância.

Você pode cancelar a designação do IP a qualquer momento, o que o faz retornar ao pool de IPs públicos reservados da sua tenancy.
Movendo para outro recurso	
Não é possível mover um IP público efêmero para outro IP privado.

Se designado a um IP privado secundário: se você mover o IP privado para outra VNIC (que deve estar na mesma sub-rede), o IP público reservado irá com ele.

É possível movê-lo (cancelar a designação e redesigná-lo) a qualquer momento para outro IP privado na mesma região. Pode estar em outra VCN ou em outro domínio de disponibilidade.

Exclusão automática	
Seu tempo de vida é vinculado ao tempo de vida do IP privado. Tem a designação automaticamente cancelada e é excluído quando:

Seu IP privado é excluído
Sua VNIC é desanexada ou encerrada
Sua instância é encerrada
Nunca. Existe até você excluí-lo.

Escopo	Domínio de disponibilidade	Regional ( pode ser designado a um IP privado em qualquer domínio de disponibilidade da região)
Domínio de compartimento e disponibilidade	O mesmo que IPs privados	Pode ser diferente dos IPs privados
Quando você inicia uma instância em uma sub-rede pública, por padrão, a instância recebe um IP público, a menos que você especifique outra definição. Consulte Escolhendo se um IP Público Efêmero É Designado na Criação da Instância.

Após criar um objeto IP público, você não poderá alterar seu tipo. Portanto, se iniciar uma instância e designar a ela um IP público efêmero com o endereço 203.0.113.2, você não poderá converter o IP público efêmero em um IP público reservado com o endereço 203.0.113.2.

A tabela anterior registra os limites de endereços IP públicos por VNIC e por instância. Se você tentar executar qualquer operação que designe ou mova um IP público para uma VNIC ou para uma instância que já tenha atingido o limite de IPs públicos, um erro será retornado. As operações incluem:

Designar um IP público
Criar uma nova VNIC secundária com um IP público
Mover um IP privado com um IP público para outra VNIC
Mover um IP público para outro IP privado
Recursos Que Sempre Obtêm um IP Público
Conforme mencionado anteriormente, determinados tipos de recursos foram projetados para serem diretamente acessíveis pela internet. Exemplos: um gateway NAT ou um balanceador de carga público. Esses recursos obtêm automaticamente um endereço IP público durante o processo de criação. O sistema Oracle escolhe o endereço IP público no pool Oracle. Não é possível remover ou alterar o endereço.

Para balanceadores de carga públicos, o endereço pode ser um endereço IP público reservado regional criado com base em um pool e designado ao balanceador de carga no momento da criação ou um endereço IP público efêmero designado pela Oracle durante a vida útil do balanceador de carga. Quando o balanceador de carga não for mais necessário, o endereço IP efêmero será retornado para o pool de endereços disponíveis, mas o endereço IP reservado poderá ser movido para outro recurso. Enquanto ativo, esse IP público aparece na lista de IPs públicos reservados da sua tenancy, que você pode exibir na Console.

Para gateways NAT, você pode escolher entre um endereço IP público reservado ou efêmero. Por padrão, a Oracle designa automaticamente um endereço IP de seu pool de IPs. Consulte Criando um Gateway NAT.
Endereço IP Efêmero: O Oracle aloca um endereço IP temporário de seu pool. Esta é a opção padrão.
Endereço IP Reservado: Você pode selecionar um endereço IP reservado existente por nome ou criar um novo. Para criar um novo IP reservado, forneça um nome e escolha um pool de IPs de origem; se nenhum pool for selecionado, o pool de IPs padrão da Oracle será usado. Como alternativa, você pode utilizar o recurso BYOIP para criar seu próprio pool de IPs públicos e, em seguida, designar um IP público reservado ao seu gateway NAT.
Política do Serviço IAM Necessária
Para usar o Oracle Cloud Infrastructure, um administrador deve ser membro de um grupo ao qual foi concedido acesso de segurança em uma política  por um administrador da tenancy. Esse acesso será necessário se você estiver usando a Console ou a API REST com um SDK, uma CLI ou outra ferramenta. Se você receber uma mensagem informando que não tem permissão ou está não autorizado, verifique com o administrador da tenancy qual tipo de acesso você tem e qual compartimento  seu acesso funciona.

// A virtual network interface card (VNIC) connects your instance to a virtual cloud network (VCN) and endpoints in and outside the VCN. Having a public IP address is required to make this instance accessible from the internet.


Primary VNIC
VNIC name
Primary network

Select existing virtual cloud network

Create new virtual cloud network

Specify OCID
New virtual cloud network name
vcn-20260421-1321
Create in compartment
noleto (root)
Subnet

Create new public subnet
New subnet name
subnet-20260421-1321
Create in compartment
noleto (root)
CIDR block
10.0.0.0/24
Warning
There are additional options available when you use the Networking pages in the console. To have the full range of options, Create a VCN and Create a Subnet and then select an existing VCN and subnet when you create a compute instance.
Messages region has new messages. Press F6 to navigate.

Private IPv4 address assignment
If the VNIC must be reachable only by your cloud or on-premises resources, it must have a private IPv4 address. To assign the VNIC a private IPv4 address, select a subnet that’s configured to support private IPv4 addresses. Learn more about private IPv4 addresses

Subnet IPv4 prefixes
Private IPv4 address
Automatically assign private IPv4 address
Oracle assigns the next unused address in the chosen subnet to the VNIC

Manually assign private IPv4 address
Enter an unused address in the chosen subnet for the VNIC

Provide existing private IPv4 OCID
Enter the OCID of an existing private IPv4 address in the chosen subnet for the VNIC


Public IPv4 address assignment
If the VNIC must be reachable from the internet, it must have a public IPv4 address. Learn more about public IPv4 addresses
Automatically assign public IPv4 address
If you're not sure whether you need a public IP address, you can always assign one later.
Warning
You must select a public subnet to assign a public IPv4 address.