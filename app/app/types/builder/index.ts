import { z } from 'zod';

export type FlowStepId = 
  | 'auth'
  | 'base'
  | 'personal'
  | 'attributes'
  | 'technique' // só aparece se origem === 'Inato' | 'Herdado'
  | 'specialization'
  | 'equipment'
  | 'spells'
  | 'final-details'
  | 'appearance'
  | 'review'
  | 'origin'
  | 'origin-details'
  | 'attribute-increment';

export const NaturalTalentSchema = z.string().nullable().transform((val) => {
  if (val === null) return null;

  const normalized = val
    .trim()
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ');

  const validOptions = [
    'Afinidade com Técnica',
    'Incremento de Atributo',
    'Voto Emergencial',
    'Perceber Oportunidade',
    'Artesão Amaldiçoado',
    'Adepto de Medicina',
    'Adepto de Briga',
    'Adepto de Feitiçaria',
    'Alma Inquebrável',
    'Resistência Física',
    'Saltador Constante',
    'Mestre do Arremesso',
    'Dominância em Técnica',
    'Incremento de Aptidão',
    'Conhecimento Iluminado',
    'Consciência Absoluta da Alma',
    'Resistência Lendária',
    'Um com o Mundo',
  ];

  if (!validOptions.includes(normalized)) {
    throw new Error(`Talento inválido: ${val}`);
  }

  return normalized;
});
  
export interface FlowStep {
  id: FlowStepId;
  title: string;
  path: string; // rota relativa
  next: FlowStepId | ConditionalNext;
  // Opcional: pré-requisitos para exibir esta etapa
  condition?: (data: Partial<CharacterSheet>) => boolean;
}


export interface ConditionalNext {
  if: (data: Partial<CharacterSheet>) => boolean;
  then: FlowStepId;
  else: FlowStepId;
}

// 🔹 Dados de autenticação
export const AuthDataSchema = z.object({
  authCode: z.string().min(1),
});

// 🔹 Etapa: Dados Básicos
export const BaseDataSchema = z.object({
  playerName: z.string().min(1, 'Nome do jogador é obrigatório'),
  characterName: z.string().min(1, 'Nome do personagem é obrigatório'),
});

export type BaseData = z.infer<typeof BaseDataSchema>;

// 🔹 Etapa: Aspectos Pessoais
export const PersonalAspectsSchema = z.object({
  personalityTraits: z.array(z.string()).min(1, 'Pelo menos 1 traço é necessário'),
  ideals: z.array(z.string()).min(1, 'Pelo menos 1 ideal é necessário'),
  bonds: z.array(z.string()).min(1, 'Pelo menos 1 ligação é necessária'),
  complications: z.array(z.string()).min(1, 'Pelo menos 1 complicação é necessária'),
  innerDomain: z.string().optional().default(''),
});

// 🔹 Origens (do livro, p.18+)
export const OriginSchema = z.enum([
  'Inato',
  'Herdado',
  'Sem-Técnica',
  'Derivado',
  'Feto Amaldiçoado',
  'FetoAmaldicoado',
  'Objeto Amaldiçoado',
  'ObjetoAmaldicoado'
]);
export type Origin = z.infer<typeof OriginSchema>;

// 🔹 Método de atributos
export const AttributeMethodSchema = z.enum(['fixed', 'rolled', 'pointBuy']);

// 🔹 Atributos (valores base, sem bônus)
export const AttributesSchema = z.object({
  for: z.number().int().min(3).max(18),
  des: z.number().int().min(3).max(18),
  con: z.number().int().min(3).max(18),
  int: z.number().int().min(3).max(18),
  sab: z.number().int().min(3).max(18),
  pre: z.number().int().min(3).max(18),
});

export const TalentsSchema = z.object({
  level1: z.string().optional(),
  level5: z.string().optional(),
}).optional();

// 🔹 Estado completo do personagem (progressivo)
export const CharacterSheetSchema = z.object({
  // Autenticação
  authCode: z.string().optional(),

  // Etapa 2
  playerName: z.string().optional(),
  characterName: z.string().optional(),

  // Etapa 3
  personalityTraits: z.array(z.string()).optional(),
  ideals: z.array(z.string()).optional(),
  bonds: z.array(z.string()).optional(),
  complications: z.array(z.string()).optional(),
  innerDomain: z.string().optional(),

  // Etapa 4
  attributeMethod: AttributeMethodSchema.optional(),
  attributes: AttributesSchema.optional(),
  origin: OriginSchema.optional(),

  // ✅ Campos do Inato (só preenchidos se origin === 'Inato')
  bonusAttr1: z.enum(['for', 'des', 'con', 'int', 'sab', 'pre']).optional(),
  bonusAttr2: z.enum(['for', 'des', 'con', 'int', 'sab', 'pre']).optional(),
  naturalTalent: NaturalTalentSchema.optional(),
  talents: TalentsSchema,
  trademarkSpell: z.string().optional(),
});

export const OriginDetailsSchema = z.object({
  origin: OriginSchema,
});

export const ATTRIBUTE_VALUES = ['for', 'des', 'con', 'int', 'sab', 'pre'] as const;
export type Attribute = (typeof ATTRIBUTE_VALUES)[number];
export const COMBAT_STYLES = ['Novo Estilo da Sombra', 'Estilo de Combate Livre'] as const;

export type CharacterSheet = z.infer<typeof CharacterSheetSchema>;
export type PartialCharacterSheet = Partial<CharacterSheet>;