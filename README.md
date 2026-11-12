# D&B. — Clube Privado

Um site demasiado elaborado para convidar uma pessoa para sair. React, TypeScript e Vite, com conteúdo em português de Portugal, fontes locais e sem serviços de análise de utilização.

## Iniciar

Requer Node.js 22.12+ ou 24 LTS.

```sh
npm ci
npm run dev
```

No PowerShell, se a política do sistema bloquear `npm.ps1`, usar `npm.cmd` em vez de `npm`.

```sh
npm test
npm run build
npm run preview
```

O build fica em `dist/`. O servidor de desenvolvimento indica o endereço local, normalmente `http://127.0.0.1:5173`.

## O que está implementado

- Convocatória animada e cinco perguntas com todas as respostas aceites e reações específicas.
- Admissão, cartão reversível e exportação do cartão para PNG.
- Classificação gastronómica fictícia e cronologia editáveis.
- Cinco experiências, proposta de data, observações e bilhete PNG após entrega do pedido.
- Livro de reclamações, sugestões e elogios; inquérito de satisfação com seis avaliações livres de 1 a 5.
- Envio real por Netlify Forms ou Formspree, com validação, proteção contra duplo clique, honeypot, timeout e mensagens de erro. Não existe modo de sucesso simulado na aplicação.
- Menu para telemóvel, navegação por teclado, estados anunciados, foco na mudança de pergunta e respeito por movimento reduzido.
- Os detalhes escondidos pedidos, incluindo cinco cliques no logótipo.

## Configurar o clube

Editar `src/config.ts` para alterar `club.stars` (0 a 3), `club.history`, as experiências e as perguntas. Não há disponibilidade inventada: cada data é uma proposta e precisa de confirmação pessoal pelo Daniel.

A admissão é uma interação narrativa, **não é autenticação**. O conteúdo faz parte do código público do site. Não colocar moradas, números de telefone, segredos ou outros dados privados na configuração. Para acesso efetivamente restrito, usar a proteção de acesso do alojamento.

## Publicar no Netlify

1. Importar este repositório no Netlify. `netlify.toml` configura `npm run build` e a pasta `dist`.
2. Em **Forms**, ativar **Enable form detection** e publicar novamente. A deteção precisa de estar ativa durante o deploy.
3. Confirmar a presença dos formulários `reserva`, `livro` e `inquerito`. As declarações HTML estão em `index.html`, pois o Netlify não deteta formulários criados apenas pelo React.
4. Em **Forms → Submission notifications**, configurar as notificações de e-mail para o Daniel, para cada formulário. O endereço fica no painel do serviço, nunca no código.
5. Manter `VITE_FORM_PROVIDER=netlify` (valor predefinido). Não são necessárias chaves no navegador.
6. Fazer uma submissão de teste autorizada no site publicado, confirmar o registo no painel e a receção do e-mail. Verificar também as pastas de spam.

O código envia os campos com `application/x-www-form-urlencoded` e `form-name`, conforme a [documentação de Netlify Forms](https://docs.netlify.com/manage/forms/setup/). As notificações têm [configuração própria no painel](https://docs.netlify.com/manage/forms/notifications/).

## Publicar no Vercel ou usar Formspree

1. Criar um formulário no Formspree e verificar o endereço de receção do Daniel no serviço. Um formulário pode receber os três tipos de mensagem; `form-name` distingue-os.
2. No painel do alojamento, definir:

```env
VITE_FORM_PROVIDER=formspree
VITE_FORMSPREE_ENDPOINT=https://formspree.io/f/IDENTIFICADOR_DO_FORMULARIO
```

3. Importar o repositório no Vercel; `vercel.json` define o build e a pasta de saída.
4. Publicar de novo depois de alterar variáveis: Vite incorpora-as durante o build.
5. Fazer a mesma verificação de entrega real no painel e no e-mail. As definições de spam, limites e restrições de domínio pertencem ao serviço.

Para testar a integração localmente, copiar `.env.example` para `.env.local` e configurar Formspree. Um envio neste modo é **real**. O endpoint Formspree é um identificador público, não uma credencial. Nunca colocar chaves privadas em variáveis `VITE_*`. Consultar a [documentação de submissões AJAX do Formspree](https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax).

Sem serviço configurado, os formulários mostram um erro claro e conservam o texto. O servidor local do Vite não processa Netlify Forms. Os testes automáticos usam respostas simuladas sem transmitir mensagens. A confirmação significa aceitação pelo serviço de formulários, não que o Daniel já leu a mensagem ou confirmou a data.

## Dados e privacidade

- Só `stage` e `question` do processo de admissão são guardados em `localStorage`, na chave `db-club-progress-v1`. As escolhas do questionário não são guardadas nem enviadas.
- Pedidos, datas, observações, mensagens e avaliações ficam apenas em memória durante a interação e seguem para o serviço selecionado quando se envia o respetivo formulário.
- Não há cookies, analytics, dados pessoais de contacto nem fontes carregadas de servidores externos.
- Cartões e bilhetes são gerados localmente com Canvas e guardados em PNG. A imagem do cartão inclui também o texto do verso. Em dispositivos móveis, a imagem pode abrir no gestor de transferências do navegador.
- Recarregar a página limpa o bilhete e os formulários. Só a admissão é retomada. Para reiniciar a admissão, limpar os dados deste site no navegador.
- `noindex` reduz a indexação, mas não impede acesso pelo link. A retenção e eliminação das submissões são geridas no Netlify/Formspree.

## Verificação

`npm test` verifica o percurso de admissão, as 20 respostas possíveis, restauro de progresso, detalhes escondidos, reservas, validação, preservação de texto após erro, envio de mensagens, avaliações de 1 sem penalização, contratos HTTP e falhas de rede. Nenhum teste envia mensagens reais.

### Testes num navegador real

Com `npm run dev` ativo na porta 5173 e sem configuração Formspree local, executar noutro terminal:

```powershell
$env:BROWSER_CHANNEL='msedge'
npm.cmd run test:browser
```

Usa o Edge instalado. Noutros sistemas, instalar Chromium com `npx playwright install chromium` e omitir `BROWSER_CHANNEL`. `TEST_URL` permite alterar o endereço da primeira verificação. O segundo teste inicia e encerra automaticamente um servidor isolado na porta 5174 e intercepta os envios: não contacta o serviço real.

Os testes verificam larguras de 320, 390, 768 e 1440 píxeis, menu móvel, questionário, restauro da admissão, falhas e confirmações de formulário, PNGs e acessibilidade com axe. As capturas, PNGs e relatório ficam em `artifacts/` (ignorada pelo Git). A análise automática de acessibilidade complementa, mas não substitui, a verificação manual.

Antes de partilhar o link publicado, confirmar num telemóvel: abertura do convite, cinco respostas, frente/verso e PNG do cartão, proposta de reserva e PNG do bilhete, reclamação/sugestão e inquérito. Validar a entrega real dos três formulários e a receção das notificações.

## Organização

```text
src/
  App.tsx                 Página, navegação e detalhes escondidos
  config.ts               Estrelas, histórico, experiências e questionário
  components/             Admissão, reservas, secretaria e elementos comuns
  lib/forms.ts            Transporte, validação e datas de Lisboa
  lib/download.ts         Exportação PNG no navegador
  styles.css              Identidade, layout, responsividade e movimento
  test/                   Testes automáticos sem envios externos
```

As fontes Cormorant Garamond e Manrope são distribuídas por `@fontsource`; os respetivos pacotes incluem as licenças OFL.
