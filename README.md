# OS Template

Aplicação web em **HTML, CSS e JavaScript** para montar ordens de serviço com saída pronta para **Ficha Técnica** e **Mensagem Telegram**.

O foco é organizar melhor as ordens de serviço. Os dados inseridos neste projeto servem apenas para essa finalidade e ficam salvos somente em `localStorage`, sem backend, sem envio para servidor e sem compartilhamento automático entre usuários.

## O que faz

- Modo **Simples** e modo **Complexa**
- Saída para **Ficha Técnica** e **Telegram**
- Configuração de campos por modo e por destino
- Ordenação manual dos campos
- Botão para voltar ao padrão do código
- Persistência local dos dados e preferências 

## Como funciona

O formulário usa campos internos canônicos e troca apenas os rótulos conforme o modo. Exemplo: `priority` pode aparecer como “Nível de prioridade” no simples e “Tipo (P0/P1/P2)” no complexo.

## Privacidade

- Os dados ficam somente no navegador do usuário
- Nada é enviado para servidor
- Nada é compartilhado automaticamente entre pessoas ou máquinas
- Ao limpar o navegador ou o `localStorage`, os dados salvos localmente são removidos

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
