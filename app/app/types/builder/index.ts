import { z } from "zod";

// 🔹 Constantes reutilizáveis
export const ATTRIBUTE_VALUES = [
  "for",
  "des",
  "con",
  "int",
  "sab",
  "pre",
] as const;
export type Attribute = (typeof ATTRIBUTE_VALUES)[number];

export const COMBAT_STYLES = [
  "Novo Estilo da Sombra",
  "Estilo de Combate Livre",
] as const;

export const PERICIAS = [
  "Acrobacia",
  "Atletismo",
  "Atuação",
  "Furtividade",
  "História",
  "Intimidação",
  "Investigação",
  "Medicina",
  "Natureza",
  "Ofício",
  "Percepção",
  "Persuasão",
  "Prestidigitação",
  "Religião",
  "Sobrevivência",
] as const;

export const OFICIOS = [
  "Ofício (Ferreiro)",
  "Ofício (Canalizador)",
  "Ofício (Costureiro)",
  "Ofício (Serralheiro)",
  "Ofício (Alquimista)",
  "Ofício (Carpinteiro)",
] as const;

// 🔹 Validação para weaponsProficiencies
const WeaponsProficienciesSchema = z
  .array(z.enum(["Simples", "Marciais", "Escudo", "Armas a Distancia"]))
  .refine(
    (arr) => arr.length > 0,
    "weaponsProficiencies deve ter pelo menos 1 item"
  );

// 🔹 Especializações detalhadas
export const SpecializationDetailsSchema = z.discriminatedUnion("type", [
  // Lutador
  z.object({
    type: z.literal("Lutador"),
    specializationAttr: z.enum(["for", "des"]),
    resistance: z.enum(["fortitude", "reflexos"]),
    combatSkill: z.enum(["Atletismo", "Acrobacia"]),
    weaponsProficiencies: WeaponsProficienciesSchema.default([
      "Simples",
      "Marciais",
      "Escudo",
    ]),
    freeSkills: z.array(z.enum(PERICIAS)).length(3),
  }),
  // Controlador
  z.object({
    type: z.literal("Controlador"),
    specializationAttr: z.enum(["int", "sab"]),
    resistance: z.enum(["astucia", "vontade"]),
    craft: z.enum(OFICIOS),
    weaponsProficiencies: WeaponsProficienciesSchema.default([
      "Simples",
      "Armas a Distancia",
    ]),
    freeSkills: z.array(z.enum(PERICIAS)).length(2),
  }),
  // Especialista em Combate
  z.object({
    type: z.literal("Especialista em Combate"),
    specializationAttr: z.enum(["for", "des", "sab"]),
    resistance: z.enum(["fortitude", "reflexos"]),
    combatSkill: z.enum(["Atletismo", "Acrobacia"]),
    oficio1: z.enum(OFICIOS),
    oficio2: z.enum(OFICIOS),
    weaponsProficiencies: WeaponsProficienciesSchema.default([
      "Simples",
      "Marciais",
      "Escudo",
    ]),
    freeSkills: z.array(z.enum(PERICIAS)).length(3),
  }),
  // Especialista em Técnica
  z.object({
    type: z.literal("Especialista em Técnica"),
    specializationAttr: z.enum(["int", "sab"]),
    resistance: z.enum(["astucia", "vontade"]),
    foundationChanges: z
      .array(z.enum(["Feitiço Cruel", "Feitiço Rápido", "Técnica Rápida"]))
      .length(2),
    craft: z.enum(OFICIOS),
    weaponsProficiencies: WeaponsProficienciesSchema.default([
      "Simples",
      "Armas a Distancia",
    ]),
    freeSkills: z.array(z.enum(PERICIAS)).length(2),
  }),
  // Suporte
  z.object({
    type: z.literal("Suporte"),
    specializationAttr: z.enum(["pre", "sab"]),
    resistance: z.enum(["astucia", "vontade"]),
    craft: z.enum(OFICIOS),
    weaponsProficiencies: WeaponsProficienciesSchema.default(["Simples"]),
    freeSkills: z.array(z.enum(PERICIAS)).length(2),
  }),
  // Restringido
  z.object({
    type: z.literal("Restringido"),
    specializationAttr: z.enum(["for", "des", "con", "int", "sab", "pre"]),
    weaponsProficiencies: WeaponsProficienciesSchema.default([
      "Simples",
      "Marciais",
      "Armas a Distancia",
      "Escudo",
    ]),
    freeSkills: z.array(z.enum(PERICIAS)).length(4),
  }),
]);

export type SpecializationDetails = z.infer<typeof SpecializationDetailsSchema>;
export type SpecializationNames = SpecializationDetails["type"];

// 🔹 Origens detalhadas
export const OriginDetailsSchema = z.discriminatedUnion("type", [
  // Inato
  z.object({
    type: z.literal("Inato"),
    trademarkSpell: z.string().min(1, "Marca Registrada é obrigatória"),
    techniqueName: z.string().min(1, "Nome da Técnica é obrigatório"),
  }),
  // Herdado
  z.object({
    type: z.literal("Herdado"),
    clan: z.enum(["Zenin", "Gojo", "Kamo", "Inumaki"]),
    clanSpell: z.string().min(1, "Feitiço do Clã é obrigatório"),
  }),
  // Sem-Técnica
  z.object({
    type: z.literal("Sem-Técnica"),
    vow: z.string().optional(),
  }),
  // Derivado
  z.object({
    type: z.literal("Derivado"),
    sourceTechnique: z.string().min(1, "Técnica de Origem é obrigatória"),
    adaptation: z.string().min(1, "Adaptação é obrigatória"),
  }),
  // Feto Amaldiçoado
  z.object({
    type: z.literal("Feto Amaldiçoado"),
    maldictionName: z.string().min(1, "Nome da Maldição é obrigatório"),
    maldictionGrade: z.enum(["1", "2", "3", "4"]).default("1"),
  }),
  // Objeto Amaldiçoado
  z.object({
    type: z.literal("Corpo Amaldiçoado Mutante"),
    primaryCore: z.enum(["Físico", "Técnico", "Híbrido"]),
    coreName: z.string().min(1, "Nome do núcleo primário é obrigatório"),
    objectName: z.string().optional(),
  }),
  z.object({
    type: z.literal("Restringido"),
  })
]);

export type OriginDetails = z.infer<typeof OriginDetailsSchema>;
export const OriginSchema = z.enum([
  "Inato",
  "Herdado",
  "Sem-Técnica",
  "Derivado",
  "Feto Amaldiçoado",
  "FetoAmaldicoado",
  "Corpo Amaldiçoado Mutante",
  "ObjetoAmaldicoado",
  "Restringido",
]);
export type Origin = z.infer<typeof OriginSchema>;

// 🔹 Feitiços
export const SPELLS_LIST = [
  "Golpe de Energia",
  "Escudo de Energia",
  "Detectar Maldição",
  "Foco Amaldiçoado",
  "Reflexo Instintivo",
  "Carga Explosiva",
  "Aura de Pressão",
  "Rajada de Choque",
  "Barreira Momentânea",
  "Concentração Afiada",
  "Soco Perfurante",
] as const;

const SpellNameSchema = z.enum(SPELLS_LIST);
export type SpellName = z.infer<typeof SpellNameSchema>;

// 🔹 Equipamentos
const WeaponNameSchema = z.enum([
  "Adaga",
  "Bastão",
  "Lança",
  "Machado",
  "Espada Curta",
  "Espada Longa",
  "Katana",
  "Machado de Batalha",
  "Martelo",
  "Nunchaku",
  "Rapieira",
  "Alabarda",
  "Lança Grande",
  "Machado Grande",
  "Martelo Grande",
  "Nunchaku Pesado",
  "Arco Curto",
  "Besta Leve",
  "Pistola",
]);

const ShieldNameSchema = z.enum([
  "Escudo Leve",
  "Escudo Pequeno",
  "Escudo Médio",
  "Escudo Pesado",
]);

const UniformNameSchema = z.enum([
  "Uniforme Comum",
  "Uniforme com Revestimento Leve",
  "Uniforme com Revestimento Médio",
  "Uniforme com Revestimento Robusto",
]);

const ToolkitNameSchema = z.enum([
  "Ferramentas de Ferreiro",
  "Ferramentas de Canalizador",
  "Ferramentas de Alfaiate",
  "Ferramentas de Alquimista",
  "Ferramentas de Farmacêutico",
  "Ferramentas de Serralheiro",
]);

const CraftSelectionSchema = z.enum(OFICIOS);

// 🔹 Talentos
export const NaturalTalentSchema = z
  .string()
  .nullable()
  .transform((val) => {
    if (val === null) return null;
    const normalized = val.trim().replace(/-/g, " ").replace(/\s+/g, " ");
    const validOptions = [
      "Afinidade com Técnica",
      "Incremento de Atributo",
      "Voto Emergencial",
      "Perceber Oportunidade",
      "Artesão Amaldiçoado",
      "Adepto de Medicina",
      "Adepto de Briga",
      "Adepto de Feitiçaria",
      "Alma Inquebrável",
      "Resistência Física",
      "Saltador Constante",
      "Mestre do Arremesso",
      "Dominância em Técnica",
      "Incremento de Aptidão",
      "Conhecimento Iluminado",
      "Consciência Absoluta da Alma",
      "Resistência Lendária",
      "Um com o Mundo",
    ];
    if (!validOptions.includes(normalized))
      throw new Error(`Talento inválido: ${val}`);
    return normalized;
  });

export const TalentsSchema = z
  .object({
    level1: z.string().optional(),
    level5: z.string().optional(),
  })
  .optional();

// 🔹 Schemas de etapas
export const AuthDataSchema = z.object({ authCode: z.string().min(1) });
export const BaseDataSchema = z.object({
  playerName: z.string().min(1, "Nome do jogador é obrigatório"),
  characterName: z.string().min(1, "Nome do personagem é obrigatório"),
});
export type BaseData = z.infer<typeof BaseDataSchema>;

export const PersonalAspectsSchema = z.object({
  personalityTraits: z
    .array(z.string())
    .min(1, "Pelo menos 1 traço é necessário"),
  ideals: z.array(z.string()).min(1, "Pelo menos 1 ideal é necessário"),
  bonds: z.array(z.string()).min(1, "Pelo menos 1 ligação é necessária"),
  complications: z
    .array(z.string())
    .min(1, "Pelo menos 1 complicação é necessária"),
  innerDomain: z.string().optional().default(""),
});

export const AttributeMethodSchema = z.enum(["fixed", "rolled", "pointBuy"]);
export const AttributesSchema = z.object({
  for: z.number().int().min(3).max(18),
  des: z.number().int().min(3).max(18),
  con: z.number().int().min(3).max(18),
  int: z.number().int().min(3).max(18),
  sab: z.number().int().min(3).max(18),
  pre: z.number().int().min(3).max(18),
});

export const AppearanceSchema = z.object({
  height: z.string().optional(),
  weight: z.string().optional(),
  age: z.string().optional(),
  hairColor: z.string().optional(),
  eyeColor: z.string().optional(),
  skinTone: z.string().optional(),
  distinctiveFeatures: z.string().optional(),
  usualExpression: z.string().optional(),
  uniformPreference: z.string().optional(),
  voiceDescription: z.string().optional(),
  presenceNote: z.string().optional(),
});

// 🔹 CharacterSheet — estrutura limpa, coerente e validada
export const CharacterSheetSchema = z.object({
  // Autenticação
  authCode: z.string().optional(),

  // Etapa 2: Básico
  playerName: z.string().optional(),
  characterName: z.string().optional(),

  // Etapa 3: Pessoal
  personalityTraits: z.array(z.string()).optional(),
  ideals: z.array(z.string()).optional(),
  bonds: z.array(z.string()).optional(),
  complications: z.array(z.string()).optional(),
  innerDomain: z.string().optional(),

  // Etapa 4: Atributos & Origem
  attributeMethod: AttributeMethodSchema.optional(),
  attributes: AttributesSchema.optional(),
  origin: OriginSchema.optional(),
  originDetails: OriginDetailsSchema.optional(),

  // Bônus Inato (só se aplicável)
  bonusAttr1: z.enum(ATTRIBUTE_VALUES).optional(),
  bonusAttr2: z.enum(ATTRIBUTE_VALUES).optional(),
  naturalTalent: NaturalTalentSchema.optional(),
  talents: TalentsSchema,

  // Especialização
  specialization: z
    .enum([
      "Lutador",
      "Controlador",
      "Especialista em Combate",
      "Especialista em Técnica",
      "Suporte",
      "Restringido",
    ])
    .optional(),
  specializationDetails: SpecializationDetailsSchema.optional(),

  // Equipamentos NV1
  selectedWeapon1: WeaponNameSchema.optional().nullable(),
  selectedWeapon2: WeaponNameSchema.optional().nullable(),
  selectedShield: ShieldNameSchema.optional().nullable(),
  selectedUniform: UniformNameSchema.optional().nullable(),
  selectedToolkit: ToolkitNameSchema.optional().nullable(),
  craftSelection: CraftSelectionSchema.optional().nullable(),
  equipmentConfirmed: z.boolean().optional(),
  selectedWeaponMode: z.enum(["1", "2"]).optional(),

  // Feitiços
  spells: z
    .array(SpellNameSchema)
    .max(3)
    .refine((spells) => spells.length <= 2 || spells.length === 3, {
      message: "Máximo de 3 feitiços (2 + 1 com Afinidade com Técnica)",
    })
    .optional(),
  spellsConfirmed: z.boolean().optional(),
  appearance: AppearanceSchema.optional(),
});

// 🔹 Tipos derivados
export type CharacterSheet = z.infer<typeof CharacterSheetSchema>;
export type PartialCharacterSheet = Partial<CharacterSheet>;
export type SpeelSheet = z.infer<typeof SpellNameSchema>[];

// 🔹 FlowStep
export type FlowStepId =
  | "auth"
  | "base"
  | "personal"
  | "attributes"
  | "technique"
  | "specialization"
  | "equipment"
  | "spells"
  | "final-details"
  | "appearance"
  | "review"
  | "origin"
  | "origin-details"
  | "attribute-increment"
  | "craft-selection";

export interface ConditionalNext {
  if: (data: PartialCharacterSheet) => boolean;
  then: FlowStepId;
  else: FlowStepId;
}

export interface FlowStep {
  id: FlowStepId;
  title: string;
  path: string;
  next: FlowStepId | ConditionalNext;
  condition?: (data: PartialCharacterSheet) => boolean;
}
