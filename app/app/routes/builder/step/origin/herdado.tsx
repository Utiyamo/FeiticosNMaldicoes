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
import { CharacterSheetSchema, NaturalTalentSchema } from "~/types/builder";
import { json } from "~/utils/utilities";
import { flow, getNextStepId } from "~/types/flow";
import type { Route } from "./+types/herdado";

// 🔹 Linhagens válidas
const LINEAGES = [
  {
    id: "gojo",
    name: "Clã Gojo",
    technique: "Limitless + Six Eyes",
    spell: "Domínio Expandido: Vazio Ilimitado",
  },
  {
    id: "zenin",
    name: "Clã Zenin",
    technique: "Projeção de Feitiçaria",
    spell: "Domínio Expandido: Jardim das Sombras Quiméricas",
  },
  {
    id: "kamo",
    name: "Clã Kamo",
    technique: "Manipulação Sanguínea",
    spell: "Domínio Expandido: Jogo Mortal Ocioso",
  },
  {
    id: "inumaki",
    name: "Clã Inumaki",
    technique: "Discurso Amaldiçoado",
    spell: "Domínio Expandido: Santuário Caído",
  },
  {
    id: "other",
    name: "Outra Linhagem",
    technique: "",
    spell: "",
  },
] as const;

type LineageId = (typeof LINEAGES)[number]["id"];
const LineageSchema = z.enum(
  LINEAGES.map((l) => l.id) as [LineageId, ...LineageId[]]
);

// 🔹 Talentos nível 1
const LEVEL_1_TALENTS = [
  { id: "Incremento de Atributo", desc: "Aumenta um atributo em +2 (máx 30)" },
  { id: "Afinidade com Técnica", desc: "Recebe 1 Feitiço adicional" },
  {
    id: "Voto Emergencial",
    desc: "Pode criar votos simples mesmo sem técnica",
  },
  { id: "Perceber Oportunidade", desc: "+2 em ataques furtivos" },
  { id: "Alma Inquebrável", desc: "+2 em testes contra efeitos mentais" },
  { id: "Resistência Física", desc: "+2 em Fortitude" },
  {
    id: "Artesão Amaldiçoado",
    desc: "+1 em criação de itens durante interlúdio",
  },
];

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  const session = await getSession(request);
  const savedData = session.get("characterData") ?? {};

  if (savedData.origin !== "Herdado") {
    return redirect("/builder/step/origin");
  }

  return { code, savedData };
}

// ✅ action
export async function action({ request }: Route.ActionArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString() ?? "submit";

  const session = await getSession(request);
  const existing = session.get("characterData") ?? {};
  let updated = { ...existing };

  // ➕ Selecionar linhagem
  if (intent === "select-lineage") {
    const lineage = formData.get("inheritedLineage")?.toString() ?? "other";
    const lineageData = LINEAGES.find((l) => l.id === lineage);
    if (lineageData) {
      updated = {
        ...updated,
        inheritedLineage: lineage,
        baseTechnique: lineage === "other" ? "" : lineageData.technique,
        trademarkSpell: lineage === "other" ? "" : lineageData.spell,
      };
    }

    session.set("characterData", updated);
    const headers = { "Set-Cookie": await commitSession(session) };
    return redirect("/builder/origin/herdado", { headers });
  }

  // ➖ Voltar à seleção de linhagem (limpa etapa 2)
  if (intent === "reset-lineage") {
    updated = {
      ...updated,
      inheritedLineage: null,
      baseTechnique: null,
      trademarkSpell: null,
      bonusAttr1: null,
      bonusAttr2: null,
      naturalTalent1: null,
      naturalTalent2: null,
    };
    session.set("characterData", { ...updated });
    const headers = { "Set-Cookie": await commitSession(session) };
    return redirect("/builder/origin/herdado", { headers });
  }

  // ✅ Submissão final
  if (intent === "submit") {
    const result = CharacterSheetSchema.safeParse({
      inheritedLineage: formData.get("inheritedLineage"),
      bonusAttr1: formData.get("bonusAttr1"),
      bonusAttr2: formData.get("bonusAttr2"),
      talents: {
        level1: formData.get("naturalTalent1"),
      },
    });

    if (!result.success) {
      return json(
        {
          errors: result.error.flatten().fieldErrors,
          submitted: Object.fromEntries(formData.entries()),
        },
        { status: 400 }
      );
    }

    if (result.data.bonusAttr1 === result.data.bonusAttr2) {
      return json(
        {
          errors: { bonusAttr2: ["Os atributos devem ser diferentes"] },
          submitted: Object.fromEntries(formData.entries()),
        },
        { status: 400 }
      );
    }

    updated = { ...updated, ...result.data };
    session.set("characterData", updated);
    const headers = { "Set-Cookie": await commitSession(session) };

    const nextStepId = getNextStepId("origin", updated);
    const nextStep = flow.find((s) => s.id === nextStepId);
    if (!nextStep)
      throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);
    return redirect(nextStep.path, { headers });
  }

  return redirect("/builder/origin/herdado", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

function lineageContent(lineage: LineageId) {
  return (
    <HerdadoLayout>
      <Form method="post" className="space-y-6">
        <input type="hidden" name="intent" value="select-lineage" />

        <div>
          <h3 className="text-xl font-bold mb-4">1. Qual é a sua linhagem?</h3>
          <p className="text-sm text-gray-400 mb-4">
            Escolha o clã ou linhagem que lhe concedeu a técnica. Apenas uma
            opção pode ser selecionada.
          </p>

          <div className="space-y-3">
            {LINEAGES.map((l) => (
              <label
                key={l.id}
                className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition ${
                  lineage === l.id
                    ? "border-purple-500 bg-purple-900/20"
                    : "border-gray-600 bg-gray-800 hover:border-purple-400"
                }`}
              >
                <input
                  type="radio"
                  name="inheritedLineage"
                  value={l.id}
                  defaultChecked={lineage === l.id}
                  className="mt-1 text-purple-500"
                  required
                />
                <div className="ml-4">
                  <div className="font-bold">{l.name}</div>
                  {l.id !== "other" && (
                    <div className="text-sm text-gray-300 mt-1">
                      <span className="text-amber-400">Técnica:</span>{" "}
                      {l.technique}
                      <br />
                      <span className="text-amber-400">
                        Feitiço Único:
                      </span>{" "}
                      {l.spell}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition disabled:opacity-75"
          >
            Avançar → Definir Atributos e Talentos
          </button>
        </div>
      </Form>
    </HerdadoLayout>
  );
}

function HerdadoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-2">
            Origem: <span className="text-violet-300">Herdado</span>
          </h1>
          <p className="text-gray-400">
            Você recebeu uma técnica amaldiçoada por linhagem — um legado
            poderoso, mas com responsabilidades únicas.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-700/30">
          <div className="mb-6 p-4 bg-purple-900/20 rounded-lg border border-purple-800">
            <h3 className="font-bold text-purple-300 mb-2">
              Benefícios da Origem Herdado
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>Técnica de Linhagem:</strong> Recebe uma técnica
                específica do seu clã
              </li>
              <li>
                <strong>+1 em dois atributos diferentes</strong>
              </li>
              <li>
                <strong>1 Talentos Naturais</strong> (1 no 1º nível e outro
                durante progressão)
              </li>
              <li>
                <strong>Marca Registrada:</strong> 1 Feitiço com custo reduzido
                em 1 PE
              </li>
            </ul>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ✅ Componente — sem form aninhado
export default function HerdadoOrigin() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<Route.ActionArgs>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const lineage = savedData.inheritedLineage ?? "";
  const bonusAttr1 = savedData.bonusAttr1 ?? "int";
  const bonusAttr2 = savedData.bonusAttr2 ?? "sab";
  const naturalTalent1 = savedData.naturalTalent1 ?? "";
  const isLineageSelected = !!lineage;

  const attrNames = {
    for: "Força",
    des: "Destreza",
    con: "Constituição",
    int: "Inteligência",
    sab: "Sabedoria",
    pre: "Presença",
  };

  if (!isLineageSelected) return lineageContent(lineage);

  return (
    <HerdadoLayout>
      <Form method="post" className="space-y-8">
        <input type="hidden" name="inheritedLineage" value={lineage} />
        <div className="mb-6 p-3 bg-gray-700/50 rounded">
          <h4 className="font-bold text-purple-300">Linhagem Selecionada:</h4>
          <p>
            <strong>{LINEAGES.find((l) => l.id === lineage)?.name}</strong>
            <br />
            Técnica:{" "}
            <span className="text-amber-300">
              {savedData.baseTechnique || "—"}
            </span>
            <br />
            Marca Registrada:{" "}
            <span className="text-amber-300">
              {savedData.trademarkSpell || "—"}
            </span>
          </p>
        </div>

        {/* Atributos */}
        <div>
          <h3 className="text-xl font-bold mb-4">
            Bônus em Atributos (+1 em dois)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Atributo +1 (1º)
              </label>
              <select
                name="bonusAttr1"
                defaultValue={bonusAttr1}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                required
              >
                {Object.entries(attrNames).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
              {actionData?.errors?.bonusAttr1 && (
                <p className="text-red-400 text-sm mt-1">
                  {actionData.errors.bonusAttr1[0]}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Atributo +1 (2º){" "}
                <span className="text-gray-500">(diferente do anterior)</span>
              </label>
              <select
                name="bonusAttr2"
                defaultValue={bonusAttr2}
                className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                required
              >
                {Object.entries(attrNames)
                  .filter(([key]) => key !== bonusAttr1)
                  .map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
              </select>
              {actionData?.errors?.bonusAttr2 && (
                <p className="text-red-400 text-sm mt-1">
                  {actionData.errors.bonusAttr2[0]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Talentos */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-2">1º Talento Natural</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LEVEL_1_TALENTS.map((t) => {
                const isChecked = naturalTalent1 === t.id;
                return (
                  <label
                    key={t.id}
                    className={`flex items-start p-3 rounded border cursor-pointer ${
                      isChecked
                        ? "border-purple-500 bg-purple-900/20"
                        : "border-gray-600 bg-gray-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="naturalTalent1"
                      value={t.id}
                      defaultChecked={isChecked}
                      className="mt-1 text-purple-500"
                      required
                    />
                    <div className="ml-3">
                      <div className="font-medium">{t.id}</div>
                      <div className="text-xs text-gray-300">{t.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          {/* ✅ Botão SSR-safe — sem form aninhado */}
          <button
            type="submit"
            name="intent"
            value="reset-lineage"
            className="px-4 py-2 text-gray-400 hover:text-white transition"
          >
            ← Voltar à Linhagem
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
          >
            {isSubmitting ? "Salvando..." : "Confirmar Origem →"}
          </button>
        </div>
      </Form>
    </HerdadoLayout>
  );
}
