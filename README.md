# OS Template

Aplicação web em **HTML, CSS e JavaScript** para montar ordens de serviço com saída pronta para **Ficha Técnica** e **Mensagem Telegram**.

O foco é organizar melhor as ordens de serviço. Os dados inseridos neste projeto servem apenas para essa finalidade e ficam salvos somente em `localStorage`, sem backend, sem envio para servidor e sem compartilhamento automático entre usuários.

## O que faz

- Modo **Simples** e modo **Complexa**
- Saída para **Ficha Técnica** e **Telegram**
- Configuração de campos por modo e por destino
- Ordenação manual dos campos
- Abas de OS, no estilo navegador, para trabalhar em várias ordens ao mesmo tempo
- Isolamento dos campos por aba, incluindo textos longos em `textarea`
- Exportação e importação das configurações do usuário
- Botão para voltar ao padrão do código
- Reset completo do `localStorage`
- Persistência local dos dados e preferências
- Confirmação antes de fechar ou limpar uma OS pela aba

## Como funciona

O formulário usa campos internos canônicos e troca apenas os rótulos conforme o modo. Exemplo: `priority` pode aparecer como “Nível de prioridade” no simples e “Tipo (P0/P1/P2)” no complexo.

Cada aba mantém seu próprio conjunto de valores. Isso evita conflito quando o usuário está preenchendo mais de uma OS ao mesmo tempo. Ao trocar de aba, os campos e os previews são atualizados com os dados daquela OS.

## Abas de OS

- O botão `+` cria uma nova guia de ordem de serviço.
- O botão `x` fecha a guia selecionada, mas antes pede confirmação.
- Se só existir uma guia, o `x` limpa a OS atual após confirmação.
- O botão **Limpar** limpa apenas os campos da guia atual.
- Os valores das guias ficam salvos no `localStorage`.

## Configurações

Na tela **Configurar**, o usuário pode:

- Ativar ou remover campos dos modos **Simples** e **Complexa**
- Escolher quais campos aparecem na **Ficha Técnica** e no **Telegram**
- Alterar a ordem dos campos
- Criar campos personalizados
- Voltar a configuração para o padrão do projeto
- Exportar a própria organização de campos
- Importar a organização de outro usuário
- Apagar tudo com **Reset localStorage**

## Exportar e importar configurações

A exportação gera um arquivo `.json` com a organização do usuário. Esse arquivo inclui:

- Ordem dos campos
- Campos ativos ou removidos
- Destino dos campos, como Ficha Técnica ou Telegram
- Campos personalizados
- Preferência de retorno ao último campo

A exportação **não inclui os textos preenchidos nas OS**. Ela serve apenas para compartilhar o método de organização da tela entre usuários.

## Privacidade

- Os dados ficam somente no navegador do usuário
- Nada é enviado para servidor
- Nada é compartilhado automaticamente entre pessoas ou máquinas
- Ao limpar o navegador ou o `localStorage`, os dados salvos localmente são removidos
- O arquivo exportado de configuração não contém os dados preenchidos nas ordens de serviço

## Estrutura

- `index.html` -> interface
- `style.css` -> estilos
- `script.js` -> lógica da aplicação

## Tecnologias

- HTML5
- CSS3
- JavaScript puro
- Google Fonts
- Font Awesome

Desenvolvido com ❤️ por Jonathan Laco
