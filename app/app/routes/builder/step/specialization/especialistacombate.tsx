// routes/builder/specialization/especialistacombate.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from "react-router";
import { z } from "zod";

import { getAuthCode, getSession, commitSession } from "~/utils/auth.server";
import { SpecializationDetailsSchema } from "~/types/builder";
import type { Route } from "./+types/especialistacombate";
import { flow, getNextStepId } from "~/types/flow";

// 🔹 Dados fixos (p.63–64)
const ATTR_KEY_OPTIONS = ["for", "des", "sab"] as const;
const RESISTANCE_OPTIONS = ["fortitude", "reflexos"] as const;
const COMBAT_SKILL_OPTIONS = ["Atletismo", "Acrobacia"] as const;
const OFICIO_OPTIONS = [
  "Ofício (Ferreiro)",
  "Ofício (Canalizador)",
  "Ofício (Costureiro)",
  "Ofício (Serralheiro)",
  "Ofício (Alquimista)",
  "Ofício (Carpinteiro)",
] as const;
const FREE_SKILL_COUNT = 3;

// 🔹 Lista de perícias (p.285)
const ALL_SKILLS = [
  "Acrobacia", "Atletismo", "Atuação", "Furtividade", "História", "Intimidação",
  "Investigação", "Medicina", "Natureza", "Ofício", "Percepção", "Persuasão",
  "Prestidigitação", "Religião", "Sobrevivência"
] as const;

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  const session = await getSession(request);
  const savedData = session.get("characterData") ?? {};

  if (savedData.specialization !== "Especialista em Combate") {
    return redirect("/builder/step/specialization");
  }

  return { savedData };
}

// ✅ action — só 1 parse, com SpecializationDetailsSchema + validação de duplicatas
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const session = await getSession(request);
  const existing = session.get("characterData") ?? {};

  // Coletar perícias livres
  const freeSkills: string[] = [];
  for (let i = 0; i < FREE_SKILL_COUNT; i++) {
    const skill = formData.get(`freeSkill_${i}`);
    if (typeof skill === "string" && skill !== "") freeSkills.push(skill);
  }

  // ✅ VALIDAÇÃO: perícias livres devem ser diferentes entre si
  const hasDupes = new Set(freeSkills).size !== freeSkills.length;
  if (hasDupes) {
    return {
      errors: { freeSkills: ["As 3 perícias livres devem ser diferentes."] },
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // ✅ VALIDAÇÃO: não pode repetir ofícios ou combatSkill
  const oficio1 = formData.get("oficio1");
  const oficio2 = formData.get("oficio2");
  const combatSkill = formData.get("combatSkill");

  if (oficio1 === oficio2) {
    return {
      errors: { oficio2: ["Os dois ofícios devem ser diferentes."] },
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  const oficio1Base = (oficio1 as string)?.replace("Ofício (", "").replace(")", "") ?? "";
  const oficio2Base = (oficio2 as string)?.replace("Ofício (", "").replace(")", "") ?? "";
  const forbidden = new Set([oficio1Base, oficio2Base, combatSkill]);
  const invalidFree = freeSkills.filter(skill => forbidden.has(skill));

  if (invalidFree.length > 0) {
    return {
      errors: {
        freeSkills: [
          `As perícias livres não podem repetir Ofícios (${oficio1Base}, ${oficio2Base}) nem a Perícia de Combate (${combatSkill}).`,
        ],
      },
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // ✅ Só 1 parse com type: 'Especialista em Combate'
  const result = SpecializationDetailsSchema.safeParse({
    type: "Especialista em Combate",
    specializationAttr: formData.get("specializationAttr"),
    resistance: formData.get("resistance"),
    combatSkill: formData.get("combatSkill"),
    oficio1: formData.get("oficio1"),
    oficio2: formData.get("oficio2"),
    freeSkills,
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  const updated = {
    ...existing,
    specializationDetails: result.data, // ✅ inferido como SpecializationDetails
  };

  session.set("characterData", updated);
  const headers = { "Set-Cookie": await commitSession(session) };

  const nextStepId = getNextStepId("specialization", updated);
    const nextStep = flow.find((s) => s.id === nextStepId);
    if (!nextStep)
      throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);
    return redirect(nextStep.path, { headers });
}

// ✅ Componente — nível 1, só o necessário
export default function EspecialistaCombateDetail() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  const specializationAttr = savedData.specializationDetails?.specializationAttr ?? "for";
  const resistance = savedData.specializationDetails?.resistance ?? "fortitude";
  const combatSkill = savedData.specializationDetails?.combatSkill ?? "Atletismo";
  const oficio1 = savedData.specializationDetails?.oficio1 ?? "";
  const oficio2 = savedData.specializationDetails?.oficio2 ?? "";
  const freeSkills = savedData.specializationDetails?.freeSkills ?? [];

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">
            Especialização: <span className="text-amber-300">Especialista em Combate</span>
          </h1>
          <p className="text-gray-400">
            Domina o combate como uma arte — versátil, estratégico e letal.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-amber-700/30">
          <div className="mb-2 p-4 bg-amber-900/20 rounded-lg">
            <h3 className="font-bold text-amber-300 mb-2">Características (p.63)</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>PV inicial:</strong> 12 + mod. CON</li>
              <li><strong>PE inicial:</strong> 4</li>
              <li><strong>Treinamentos:</strong></li>
              <ul className="list-none pl-4 mt-1 space-y-1">
                <li>• <strong>Armas:</strong> Simples, Marciais, Escudo</li>
                <li>• <strong>TR:</strong> Fortitude <em>ou</em> Reflexos</li>
                <li>• <strong>Perícias:</strong> 2× Ofício + (Atletismo <em>ou</em> Acrobacia) + 3 livres</li>
              </ul>
              <li><strong>Atributo-chave:</strong> Força, Destreza <em>ou</em> Sabedoria</li>
              <li><strong>Habilidades Base:</strong> Repertório do Especialista, Artes do Combate</li>
            </ul>
          </div>

          {/* Nota sobre Estilo de Combate */}
          <div className="mb-6 p-3 bg-gray-700/50 rounded text-sm">
            <strong>Nota:</strong> O Estilo de Combate será escolhido no <strong>nível 4</strong> (p.66).
          </div>

          <Form method="post" className="space-y-8">
            {/* Atributo-chave */}
            <div>
              <h3 className="text-xl font-bold mb-3">Atributo-chave para CD</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha o atributo usado para calcular a CD das suas habilidades.
              </p>
              <div className="space-y-2">
                {(["for", "des", "sab"] as const).map((attr) => {
                  const label = { for: "Força", des: "Destreza", sab: "Sabedoria" }[attr];
                  return (
                    <label key={attr} className="flex items-center">
                      <input
                        type="radio"
                        name="specializationAttr"
                        value={attr}
                        defaultChecked={specializationAttr === attr}
                        className="mr-2 text-amber-500"
                        required
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
              {actionData?.errors?.specializationAttr && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.specializationAttr[0]}</p>
              )}
            </div>

            {/* Teste de Resistência */}
            <div>
              <h3 className="text-xl font-bold mb-3">Teste de Resistência</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha <strong>um</strong> teste de resistência para ser treinado.
              </p>
              <div className="space-y-2">
                {(["fortitude", "reflexos"] as const).map((tr) => {
                  const label = tr === "fortitude" ? "Fortitude" : "Reflexos";
                  return (
                    <label key={tr} className="flex items-center">
                      <input
                        type="radio"
                        name="resistance"
                        value={tr}
                        defaultChecked={resistance === tr}
                        className="mr-2 text-amber-500"
                        required
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
              {actionData?.errors?.resistance && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.resistance[0]}</p>
              )}
            </div>

            {/* Perícia de Combate */}
            <div>
              <h3 className="text-xl font-bold mb-3">Perícia de Combate</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha <strong>uma</strong> perícia para combate corpo a corpo.
              </p>
              <div className="space-y-2">
                {(["Atletismo", "Acrobacia"] as const).map((skill) => (
                  <label key={skill} className="flex items-center">
                    <input
                      type="radio"
                      name="combatSkill"
                      value={skill}
                      defaultChecked={combatSkill === skill}
                      className="mr-2 text-amber-500"
                      required
                    />
                    <span>{skill}</span>
                  </label>
                ))}
              </div>
              {actionData?.errors?.combatSkill && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.combatSkill[0]}</p>
              )}
            </div>

            {/* 2 Ofícios */}
            <div>
              <h3 className="text-xl font-bold mb-3">Ofícios (2)</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha duas especialidades de Ofício (p.285).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  name="oficio1"
                  defaultValue={oficio1}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                  required
                >
                  <option value="">— Ofício 1 —</option>
                  {OFICIO_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <select
                  name="oficio2"
                  defaultValue={oficio2}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                  required
                >
                  <option value="">— Ofício 2 —</option>
                  {OFICIO_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              {actionData?.errors?.oficio1 && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.oficio1[0]}</p>
              )}
              {actionData?.errors?.oficio2 && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.oficio2[0]}</p>
              )}
            </div>

            {/* 3 Perícias Livres */}
            <div>
              <h3 className="text-xl font-bold mb-3">3 Perícias Livres</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha <strong>3 perícias diferentes</strong>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: FREE_SKILL_COUNT }).map((_, i) => (
                  <select
                    key={i}
                    name={`freeSkill_${i}`}
                    defaultValue={freeSkills[i] || ""}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                    required
                  >
                    <option value="">— Selecione —</option>
                    {ALL_SKILLS.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
              {actionData?.errors?.freeSkills && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.freeSkills[0]}</p>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate("/builder/step/specialization")}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
              >
                {isSubmitting ? "Salvando..." : "Confirmar Especialista em Combate →"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}