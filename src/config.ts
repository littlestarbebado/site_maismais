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
    title: 'Ben, porque é que continuas aqui?',
    options: [
      'Vim ver até onde ia o ridículo.',
      'Porque tu tens a tua graça.',
      'Estou à espera da comida.',
      'Não encontro a saída.',
    ],
    reactions: [
      'Ainda agora começámos. Senta-te.',
      'Pronto. Agora vou ficar insuportável.',
      'Um homem com prioridades. Ligeiramente ofensivas.',
      'É a cruz no canto. Mas olha que já fiz isto tudo.',
    ],
    memes: [null, 'coracao', null, 'sanidade'],
  },
  {
    title: 'A minha comida estava boa ou estás só a ser simpático?',
    options: [
      'Estava mesmo boa, chato.',
      'Estou a ser simpático.',
      'Já comi pior.',
      'Repete e eu confirmo.',
    ],
    reactions: [
      'O “chato” fica fora da crítica gastronómica.',
      'Obrigado pela sinceridade. Vou só olhar pela janela um bocado.',
      'Uma frase. Uma facada. Zero estrelas para a tua delicadeza.',
      'Pedir comida grátis com esta classe. Respeito.',
    ],
    memes: [null, 'fallesi', null, 'sanidade'],
  },
  {
    title: 'Adormeci a meio do filme. Qual é o teu plano?',
    options: [
      'Roubo a manta.',
      'Tiro uma foto para te chantagear.',
      'Fico encostado a ti.',
      'Acordo-te. Escolheste tu esta seca.',
    ],
    reactions: [
      'Convidado de honra. Ladrão de têxteis.',
      'Não publiquei este site para ser vítima de um crime.',
      'Não estava a dormir. Estava a criar oportunidades.',
      'Era cinema de autor. O autor também devia estar a dormir.',
    ],
    memes: [null, 'fallesi', 'coracao', null],
  },
  {
    title: 'Fiz um site inteiro para te convidar. Diagnóstico?',
    options: [
      'Tens demasiado tempo livre.',
      'Devias falar com alguém.',
      'Podias só ter mandado mensagem.',
      'Está giro. Preocupante, mas giro.',
    ],
    reactions: [
      'Tinha. Gastei-o todo nisto.',
      'Estou a tentar falar contigo há quatro perguntas.',
      'E perder a oportunidade de escolher duas fontes? Nunca.',
      'Vou ficar só com o “giro”. O resto é ruído.',
    ],
    memes: [null, 'sanidade', null, null],
  },
  {
    title: 'Então, queres outro date ou vais fazer-te difícil?',
    options: [
      'Quero. Era preciso este aparato todo?',
      'Depende. O que é o jantar?',
      'Vou fazer-me difícil mais um bocadinho.',
      'Hoje passo. Sem drama, Daniel.',
    ],
    reactions: [
      'Não. Mas agora temos uma identidade visual.',
      'Olha para ti a negociar em posição de força.',
      'Está bem. Vou aproveitar para lavar a loiça.',
      'Sem drama. O convite fica aqui. Eu vou buscar um snack.',
    ],
    memes: ['coracao', null, null, null],
  },
] satisfies { title: string; options: string[]; reactions: string[]; memes: (MemeId | null)[] }[];

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
