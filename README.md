# D&B. 2.0 — The Ben Incident

Quatro perguntas. Zero necessidade. Um convite do Daniel para um segundo date com o Ben.
Redesign do projeto existente em React, TypeScript e Vite, em português de Portugal.

## Executar

Node.js 22.12+ ou 24 LTS. Em PowerShell, usar `npm.cmd` se a política bloquear `npm.ps1`.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`npm run build` verifica TypeScript, gera `dist/` e executa uma verificação que
impede conteúdo privado, ficheiros de especificação e source maps no resultado.
Não executa publicação. O servidor local apresenta o endereço na consola.

## Experiência

Entrada → quatro perguntas → resultados fictícios → convite para jantar e cinema em Viseu.
Leitura e interação pensadas para 60–120 segundos; sem espera forçada nem
temporizador. O ritmo real depende de quem joga e ainda requer validação humana.

- As 16 opções têm feedback próprio. É possível mudar a seleção antes de avançar.
- Pontos iguais para qualquer opção: 420 + 690 + 900 + 330 = 2.340. Daniel recebe
  80.000 por puro abuso de poder. A pontuação não determina o convite.
- «Não, obrigado» na quarta pergunta termina imediatamente após «Terminar», sem
  apresentar resultados ou insistir no convite. A recusa no convite também termina.
- Os três memes originais estão em `public/memes/`. Surgem em escolhas específicas
  das perguntas 1 e 3 e no convite. Fecham por botão, Escape, mudança de ecrã ou após
  5,5 segundos. Não bloqueiam os controlos por baixo.
- Som sintetizado no dispositivo, desligado por defeito. Movimento reduzido respeitado;
  o caos pode ser pausado ou saltado.
- O convite é para quarta-feira, 25/11/2026, no Palácio do Gelo, Viseu: jantar à
  escolha antes do cinema às 21:00. O aceite é local, sem reserva nem bilhete comprado.
  A recusa é respeitada e permite copiar uma sugestão para outro dia.
- Os componentes de reserva, reclamação e avaliação continuam independentes e
  testados, mas não são apresentados no percurso público atual.
- Fontes Anton, Manrope e Cormorant Garamond distribuídas localmente por
  `@fontsource`, com licenças OFL nos respetivos pacotes. Sem fontes ou imagens externas.

Estrelas e histórico editáveis em `src/config.ts` (`club.stars`, `club.history`).
Classificação inicial: ★ ☆ ☆. É uma brincadeira privada, sem ligação ao Guia Michelin.

## Dados e conteúdo privado

O jogo não guarda respostas, aceitação, recusa ou progresso em armazenamento local.
Recarregar reinicia a experiência. O percurso principal não tem login, cookies
publicitários, fingerprinting ou recolha de contactos. Os PNGs são gerados no
navegador, sem upload.

### Telemetria opcional do Capítulo I

A telemetria está desligada por defeito. Quando ativada, regista apenas eventos
permitidos pelo esquema, índices das perguntas/opções e um UUID aleatório guardado
em `sessionStorage` durante a sessão do separador. Não envia texto livre, datas
propostas, nome, IP ou localização; não recolhe dados do Capítulo II. A indicação
discreta no rodapé só aparece quando esta telemetria está ativa. Falhas de rede não
interrompem o jogo e são reportadas na consola sem incluir os dados do evento.

O painel é servido em `/admin.html`; o ficheiro HTML não é um segredo. A leitura é
protegida pelo Supabase Auth e por RLS, que só permite selecionar eventos a utilizadores
com `app_metadata.role = chapter_i_admin`. Não há registo público. A chave `anon`/
publishable é pública e tem apenas permissões limitadas por RLS; nunca definir uma
chave `service_role`/secret numa variável `VITE_*`.

Para configurar:

1. Criar um projeto Supabase e rever região, retenção e política de logs.
2. Executar `supabase/migrations/20261117000100_chapter_i_telemetry.sql` no SQL Editor.
   A migração cria apenas objetos `chapter_i_*`, permite inserções com payload limitado
   sem leitura anónima e cria uma vista do funil protegida por RLS.
3. Criar no Supabase Auth a conta administrativa, sem ativar registo público, e definir
   em `app_metadata` o papel `{"role":"chapter_i_admin"}`. Terminar e voltar a iniciar
   sessão depois de alterar o papel para renovar o JWT.
4. Copiar `.env.example` para `.env.local` e preencher `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` com a URL e a chave pública do projeto. Manter
   `VITE_TELEMETRY_ENABLED=false` até testar Auth, RLS e a indicação de privacidade;
   mudar para `true` apenas no ambiente que deve registar eventos.
5. Para produção, definir as mesmas variáveis no painel do alojamento e executar um
   novo build. As variáveis `VITE_*` são incluídas no frontend; só a chave pública
   `anon`/publishable pode ser usada aí.

Os eventos guardam o timestamp do servidor, UUID de sessão e dados mínimos. A
aplicação não envia IP/localização no payload; como qualquer serviço HTTPS, o
Supabase recebe o IP de rede para processar o pedido e poderá registá-lo nos logs
operacionais. Se “sem IP” também proibir esse processamento pelo fornecedor, não
ativar a telemetria até confirmar a política e retenção desses logs com o Supabase.
Sem credenciais, o painel apresenta apenas o estado “não configurado” e a telemetria
não envia pedidos; a autenticação e as políticas RLS reais ainda exigem configuração
e validação no projeto Supabase.

As informações dos formulários opcionais só saem do dispositivo quando o utilizador
os submete explicitamente a um serviço configurado. O texto é conservado após erro.

O planeamento futuro está apenas na pasta local `.private/`, ignorada pelo Git e
pelo upload Vercel. Não existe rota, QR code, import dinâmico ou conteúdo futuro em
`src/`, `public/` ou `dist/`. Essa experiência deverá ter uma publicação independente.
Guardar uma cópia privada dessa pasta: não acompanha clones do repositório.

`noindex` reduz indexação; não é controlo de acesso. O Capítulo I pode ser lido por quem tiver acesso ao alojamento. A página do painel
também é estática e acessível por URL, mas os dados não são públicos: a proteção real
está na autenticação e nas políticas RLS. Publicar apenas `dist/`, nunca a raiz.

## Testar no navegador

```powershell
npm.cmd run build
$env:BROWSER_CHANNEL='msedge'
npm.cmd run test:browser
```

O primeiro teste inicia automaticamente um **preview do build de produção** na
porta 5175. Verifica larguras 320, 390, 768 e 1440, as 16 respostas, teclado, foco,
aceitação e recusa, sugestão de outro dia, pausa/salto das animações, movimento
reduzido e acessibilidade com axe. Não contacta serviços externos.
`TEST_URL` permite usar outro servidor já iniciado; nesse caso o script não o gere.

O segundo teste confirma que aceitar o date não apresenta reservas, bilhetes ou
formulários, nem inicia pedidos externos.
Ambos encerram os servidores que iniciam.

Noutros sistemas, usar um Chromium instalado para Playwright e omitir
`BROWSER_CHANNEL`. Capturas, PNGs e relatórios estão em `artifacts/`, ignorada pelo
Git. A análise automática e a emulação de larguras não substituem um teste num
iPhone/Android real ou uma revisão com leitor de ecrã.

## Preparação para publicação

**Não fazer commit, push ou deploy sem autorização explícita do Daniel.**

Existem `netlify.toml` e `vercel.json`, ambos com `npm run build` e saída `dist`.
Não foi encontrada ligação local a um projeto de alojamento (`.netlify/` ou
`.vercel/`). Isso não confirma nem exclui uma integração configurada num painel remoto.
Nenhum URL público foi verificado. Não foram criadas contas ou projetos.

O Capítulo I funciona sem variáveis de ambiente. Para publicar depois de autorizado:

1. Escolher Netlify ou Vercel e autenticar a conta a usar.
2. Associar/importar este repositório ou selecionar um projeto existente no painel.
3. Confirmar comando `npm run build`, saída `dist`, Node compatível e público pretendido.
4. Rever o build e autorizar separadamente qualquer commit/push necessário. Uma
   integração Git pode publicar automaticamente quando se faz push.
5. Executar o deploy apenas após autorização. Guardar o URL devolvido pelo serviço.

Não há React Router nem URLs internas: os ecrãs são estados React na raiz. Não é
necessário um rewrite SPA. Não adicionar rotas ocultas para conteúdo futuro.

### Formulários opcionais

Os formulários não fazem parte do percurso público atual e não requerem variáveis
de ambiente. Se forem reintroduzidos, os envios sem serviço configurado devem
continuar a apresentar erro explícito.

**Netlify:** ativar deteção Forms e confirmar `reserva`, `livro`, `inquerito` no
painel após build. As declarações HTML estão em `index.html`. Configurar notificações
para o Daniel no painel. Usar `VITE_FORM_PROVIDER=netlify` (predefinição).

**Vercel/Formspree:** criar e verificar um formulário no serviço; definir:

```env
VITE_FORM_PROVIDER=formspree
VITE_FORMSPREE_ENDPOINT=https://formspree.io/f/IDENTIFICADOR
```

Voltar a construir após alterações. O endpoint é público; nunca colocar chaves
privadas em `VITE_*`. `.env.example` é apenas um modelo, não prova que o serviço
está configurado. Sucesso de formulário significa aceitação pelo serviço, não
leitura pelo Daniel nem confirmação da data. A entrega real ainda não foi testada.

### Checklist após deploy autorizado

- Abrir o URL real no computador e num telemóvel, com e sem movimento reduzido.
- Confirmar fontes, os três memes, quatro perguntas, resultados e ambas as recusas.
- Aceitar, guardar o PNG e copiar a mensagem; confirmar data/local por definir.
- Recarregar a raiz e verificar teclado, foco e ausência de cortes horizontais.
- Confirmar que não existe conteúdo futuro no HTML, JS, assets ou caminhos públicos.
- Se Forms estiver configurado, autorizar uma submissão real e confirmar registo
  no painel e receção da notificação. Os testes locais não demonstram entrega real.

## Organização

```text
src/App.tsx                    Percurso principal e convite
src/config.ts                  Perguntas, reações, memes, estrelas e histórico
src/incident.css               Identidade luxury punk, responsividade e movimento
src/admin/                     Painel autenticado do Capítulo I
src/lib/telemetry.ts           Eventos mínimos e tolerância a falhas de rede
supabase/migrations/           Tabela, funil e políticas RLS do Capítulo I
src/styles.css                 Base e componentes preservados dos extras
src/components/Admission.tsx   Cartão de sócio reutilizado
src/components/MemeReaction.tsx Reações contextuais e dismiss
src/lib/download.ts            Exportação PNG por Canvas
src/lib/forms.ts               Transporte e validação de formulários opcionais
src/test/                      Testes unitários e de integração
scripts/browser-check.mjs      Percurso, capturas, PNGs e acessibilidade
scripts/booking-check.mjs      Confirma que o aceite não expõe reservas ou bilhetes
scripts/check-public-build.mjs Verificação de isolamento do build
```
