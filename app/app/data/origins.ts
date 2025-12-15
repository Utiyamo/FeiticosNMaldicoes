export interface OriginData {
  id: string;
  title: string;
  summary: string;
  bonuses: string[];
  icon: string;
  colorClass: string;
}

export const ORIGINS: OriginData[] = [
  {
    id: "Inato",
    title: "Inato",
    icon: "⚡",
    colorClass: "from-amber-900/30 to-amber-800/20 border-amber-700",
    summary:
      "Você nasceu com uma técnica amaldiçoada única, fruto de uma linhagem poderosa ou anomalia natural.",
    bonuses: [
      "+2 em um atributo, +1 em outro",
      "1 Talento Natural no 1º nível",
      "Marca Registrada: 1 Feitiço com custo reduzido em 1 PE",
    ],
  },
  {
    id: "Herdado",
    title: "Herdado",
    icon: "🔱",
    colorClass: "from-purple-900/30 to-purple-800/20 border-purple-700",
    summary:
      "Você recebeu uma técnica amaldiçoada de um ancestral, mestre ou entidade.",
    bonuses: [
      "+1 em dois atributos",
      "2 Talentos Naturais ao longo do tempo",
      "Marca Registrada: 1 Feitiço com custo reduzido em 1 PE",
    ],
  },
  {
    id: "Sem-Técnica",
    title: "Sem-Técnica",
    icon: "✊",
    colorClass: "from-gray-800 to-gray-700 border-gray-600",
    summary:
      "Você não possui uma técnica amaldiçoada, mas domina o jujutsu com puro treinamento e força de vontade.",
    bonuses: [
      "+1 em Força e +1 em Destreza",
      "Combate Amaldiçoado: +1d6 dano corpo a corpo",
      "Resistência Superior: +2 em testes de Fortitude",
    ],
  },
  {
    id: "Derivado",
    title: "Derivado",
    icon: "🌀",
    colorClass: "from-blue-900/30 to-blue-800/20 border-blue-700",
    summary:
      "Sua técnica foi moldada a partir de outra — adaptada, fragmentada ou reinventada.",
    bonuses: [
      "+2 em Sabedoria ou Inteligência",
      "Domínio Adaptativo: copie 1 feitiço de outra técnica (custo +1 PE)",
      "Voto Emergencial: crie votos simples mesmo sem técnica",
    ],
  },
  {
    id: "FetoAmaldicoado",
    title: "Feto Amaldiçoado",
    icon: "🌑",
    colorClass: "from-emerald-900/30 to-emerald-800/20 border-emerald-700",
    summary:
      "Você é um feto amaldiçoado que nasceu com consciência e tomou forma humana. Sua existência é uma anomalia.",
    bonuses: [
      "+2 em Constituição",
      "Vigor Maldito: recupere PV ao entrar em combate",
      "Maldição Inata: comece com 1 Feitiço de Grau 1 de maldição",
    ],
  },
  {
    id: "ObjetoAmaldicoado",
    title: "Corpo Amaldiçoado Mutante",
    icon: "🤖",
    colorClass: "from-emerald-900/30 to-emerald-800/20 border-emerald-700",
    summary:
      "Você é uma forma de vida artificial consciente, criada com múltiplos núcleos — como Panda, uma relíquia viva do jujutsu.",
    bonuses: [
      "+2 pontos adicionais para distribuir entre atributos",
      "Forma de Vida Sintética: imune a veneno/envenenado; não se beneficia de refeições ou medicinas",
      "Mutação Abrupta: 3 núcleos, troca como Ação Bônus, técnica definida pelo núcleo primário",
    ],
  },
  {
    id: 'Restringido',
    title: 'Restringido',
    icon: '⛓️',
    colorClass: 'from-slate-900/40 to-slate-800/30 border-slate-700',
    summary:
      'Você nasceu com quase nenhuma energia amaldiçoada, mas em troca alcançou o ápice humano — como Toji Fushiguro.',
    bonuses: [
      '+1 em Força, Destreza e Constituição + 2 pontos para atributos físicos',
      'Físico Abençoado: +3m deslocamento, imunidade a doenças, vantagem vs. venenos, cura acelerada',
      'Ápice Corporal Humano: limite de FOR/DES/CON = 30; +2 em um atributo a cada 6 níveis',
      'Resiliência Imediata: reduza dano ou evite desmembramento (usos = BT/dia)',
      'Especialização vinculada: só pode escolher a especialização *Restringido*',
    ],
  },
];