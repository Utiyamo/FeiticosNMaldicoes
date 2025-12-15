// routes/builder/specialization/restringido.tsx
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
import type { Route } from "./+types/restringido";
import { flow, getNextStepId } from "~/types/flow";

// 🔹 Dados fixos (p.114–117)
const ATTR_KEY_OPTIONS = ["for", "des", "con", "int", "sab", "pre"] as const;
const ALL_SKILLS = [
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
const FREE_SKILL_COUNT = 4;

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  const session = await getSession(request);
  const savedData = session.get("characterData") ?? {};

  return { savedData };
}

// ✅ action — só 1 parse, com SpecializationDetailsSchema + validação + limpeza
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const session = await getSession(request);
  const existing = session.get("characterData") ?? {};

  // Coletar freeSkills
  const freeSkills: string[] = [];
  for (let i = 0; i < FREE_SKILL_COUNT; i++) {
    const skill = formData.get(`freeSkill_${i}`);
    if (typeof skill === "string") freeSkills.push(skill);
  }

  // ✅ VALIDAÇÃO: perícias livres devem ser diferentes entre si
  const hasDupes = new Set(freeSkills).size !== freeSkills.length;
  if (hasDupes) {
    return {
      errors: { freeSkills: ["As 4 perícias livres devem ser diferentes."] },
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // ✅ VALIDAÇÃO: não pode escolher Feitiçaria
  if (freeSkills.includes("Feitiçaria")) {
    return {
      errors: { freeSkills: ["Restringidos não podem escolher Feitiçaria."] },
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // ✅ Só 1 parse com type: 'Restringido'
  const result = SpecializationDetailsSchema.safeParse({
    type: "Restringido",
    specializationAttr: formData.get("specializationAttr"),
    freeSkills,
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  // ✅ LIMPEZA OBRIGATÓRIA: remove tudo que depende de energia (p.114)
  const updated = {
    ...existing,
    specializationDetails: result.data,
    spells: [],
    aptitudes: [],
    techniqueName: "",
    trademarkSpell: "",
    peMax: 0,
    estamina: 4, // p.115
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
export default function RestringidoDetail() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  const specializationAttr =
    savedData.specializationDetails?.specializationAttr ?? "for";
  const freeSkills = savedData.specializationDetails?.freeSkills ?? [];

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rose-400 mb-2">
            Especialização: <span className="text-rose-300">Restringido</span>
          </h1>
          <p className="text-gray-400">
            Você abre mão da energia amaldiçoada em troca de um corpo
            aperfeiçoado pelos céus — força, velocidade e resistência além do
            humano.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-rose-700/30">
          <div className="mb-6 p-4 bg-rose-900/20 rounded-lg">
            <h3 className="font-bold text-rose-300 mb-2">
              Benefícios da Especialização Restringido
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>PV inicial:</strong> 16 + mod. CON (maior do jogo)
              </li>
              <li>
                <strong>Estamina:</strong> 4 (substitui Pontos de Energia)
              </li>
              <li>
                <strong>Treinamentos:</strong>
              </li>
              <ul className="list-none pl-4 mt-1 space-y-1">
                <li>
                  • <strong>TR:</strong> Fortitude, Reflexos
                </li>
                <li>
                  • <strong>Perícias:</strong> 4 livres (
                  <strong>não pode escolher Feitiçaria</strong>)
                </li>
              </ul>
              <li>
                <strong>Atributo-chave:</strong> Qualquer um (CD de habilidades)
              </li>
              <li>
                <strong>Habilidades Base:</strong> Restrito pelos Céus (Fort/Ref
                +2, Estamina 4, +2 em perícias de combate)
              </li>
              <li className="text-xs text-rose-200 mt-2">
                ⚠️ Ao escolher Restringido, você{" "}
                <strong>perde acesso a feitiços, aptidões e PE</strong> — tudo é
                substituído por Estamina e Técnicas Marciais.
              </li>
            </ul>
          </div>

          <Form method="post" className="space-y-8">
            {/* Atributo-chave */}
            <div>
              <h3 className="text-xl font-bold mb-3">Atributo-chave para CD</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha <strong>qualquer atributo</strong> para calcular a CD
                das suas habilidades.
              </p>
              <div className="space-y-2">
                {(["for", "des", "con", "int", "sab", "pre"] as const).map(
                  (attr) => {
                    const label = {
                      for: "Força",
                      des: "Destreza",
                      con: "Constituição",
                      int: "Inteligência",
                      sab: "Sabedoria",
                      pre: "Presença",
                    }[attr];
                    return (
                      <label key={attr} className="flex items-center">
                        <input
                          type="radio"
                          name="specializationAttr"
                          value={attr}
                          defaultChecked={specializationAttr === attr}
                          className="mr-2 text-rose-500"
                          required
                        />
                        <span>{label}</span>
                      </label>
                    );
                  }
                )}
              </div>
              {actionData?.errors?.specializationAttr && (
                <p className="text-red-400 text-sm mt-1">
                  {actionData.errors.specializationAttr[0]}
                </p>
              )}
            </div>

            {/* 4 Perícias Livres */}
            <div>
              <h3 className="text-xl font-bold mb-3">4 Perícias Livres</h3>
              <p className="text-sm text-gray-400 mb-2">
                Escolha <strong>4 perícias diferentes</strong>.{" "}
                <strong>Não é permitido Feitiçaria.</strong>
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
                <p className="text-red-400 text-sm mt-1">
                  {actionData.errors.freeSkills[0]}
                </p>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate("/builder/step/origin")}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
              >
                {isSubmitting ? "Salvando..." : "Confirmar Restringido →"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
