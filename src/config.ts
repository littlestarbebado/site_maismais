export const club = {
  member: 'Ben',
  director: 'Daniel',
  memberNumber: '0001',
  stars: 1,
  cardBack:
    'Autoriza o portador a distrair o chef. Não autoriza roubar a manta. Estamos a olhar para ti, Ben.',
  history: [
    {
      number: '001',
      title: 'Comeste. E sobreviveste.',
      detail: 'Uma estrela. O ego do Daniel nunca mais recuperou.',
      status: 'Concluído',
    },
    {
      number: '002',
      title: 'Era só para confirmar.',
      detail: 'Se foi talento ou sorte com o sal.',
      status: 'Por marcar',
    },
    {
      number: '003',
      title: 'Já está a pensar no terceiro.',
      detail: 'Ainda nem marcaste o segundo. Enfim.',
      status: 'Em perspetiva',
    },
  ],
  experiences: [
    {
      id: 'jantar',
      title: 'Jantar às Cegas',
      description: 'Tu apareces. Eu cozinho. Tu finges surpresa com o talento.',
    },
    {
      id: 'cinema',
      title: 'Cinema Privado',
      description: 'Escolhemos um filme durante 40 minutos. Depois adormeço.',
    },
    {
      id: 'cozinha',
      title: 'Dois Chefs, Uma Cozinha',
      description: 'Tu cortas a cebola. Eu explico como se faz. Insuportável, eu sei.',
    },
    {
      id: 'surpresa',
      title: 'Programa Surpresa',
      description: 'Tenho tudo pensado. Esta frase pode conter mentiras.',
    },
    {
      id: 'ideia',
      title: 'Tens Uma Ideia Melhor?',
      description: 'Força. Já fiz o site, também não posso fazer tudo.',
    },
  ],
};

export const questions = [
  {
    title: 'Ben, porque é que abriste isto?',
    options: [
      'Porque gosto de ti.',
      'Porque me mandaste o link, burro.',
      'Achei que era phishing.',
      'Não tenho amor-próprio.',
    ],
    reactions: [
      'Eish. Não era preciso seres querido.',
      'OK, DESCULPA LÁ.',
      'Pior. É o Daniel.',
      'Finalmente, alguma honestidade.',
    ],
    memes: ['coracao', null, 'sanidade', null],
  },
  {
    title: 'A comida do Daniel estava...',
    options: [
      'Boa.',
      'Muito boa.',
      'Uma experiência traumática.',
      'Não me lembro, estava distraído.',
    ],
    reactions: [
      'UMA ESTRELA CONFIRMADA.',
      'O chef está insuportável agora.',
      'O chef vai chorar na cozinha.',
      'Distraído com quem, BEN?',
    ],
    memes: [null, null, null, null],
  },
  {
    title: 'O Daniel é...',
    options: ['Um querido.', 'Uma peste.', 'Um problema de saúde pública.', 'Infelizmente giro.'],
    reactions: ['Não espalhes.', 'Acertaste.', 'A DGS já foi informada.', 'INFELIZMENTE???'],
    memes: [null, null, 'sanidade', 'fallesi'],
  },
  {
    title: 'Queres outro jantar?',
    options: ['Sim.', 'Sim, mas cala-te.', 'Depende do menu.', 'Não, obrigado.'],
    reactions: [
      'Pronto, era só isso.',
      'Não prometo nada.',
      'Olha o crítico Michelin.',
      'Tudo bem. O convite fica sem efeito.',
    ],
    memes: [null, null, null, null],
  },
] satisfies { title: string; options: string[]; reactions: string[]; memes: (MemeId | null)[] }[];
// Pontos fictícios: todas as opções têm o mesmo valor.
export const pointsPerQuestion = [420, 690, 900, 330];

export type MemeId = 'coracao' | 'sanidade' | 'fallesi';
export const memes: Record<MemeId, { src: string; alt: string; caption: string }> = {
  coracao: {
    src: '/memes/coracao.png',
    alt: 'Personagem azul inclinado sobre um coração vermelho.',
    caption: 'A direção está normalíssima.',
  },
  sanidade: {
    src: '/memes/sanidade.png',
    alt: 'Maçã vermelha com olhos e o texto «acho q to perdendo a sanidade».',
    caption: 'Estado atual do responsável.',
  },
  fallesi: {
    src: '/memes/fallesi.png',
    alt: 'Emoji amarelo caído com a palavra «fallesi».',
    caption: 'Um minuto de silêncio pelo Daniel.',
  },
};

export const ratingCategories = [
  ['comida', 'Comida'],
  ['ambiente', 'Ambiente'],
  ['filme', 'Escolha do filme'],
  ['companhia', 'Companhia'],
  ['abracos', 'Qualidade dos abraços'],
  ['repetir', 'Vontade de repetir'],
] as const;
