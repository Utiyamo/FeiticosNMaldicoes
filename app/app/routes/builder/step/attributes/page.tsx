// routes/builder/step/attributes.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  redirect,
  useNavigation,
  useNavigate,
} from "react-router";
import { z } from "zod";

import { getAuthCode, getSession, commitSession } from "~/utils/auth.server";
import { flow, getNextStepId } from "~/types/flow";
import type { Route } from "./+types/page";
import { json } from "~/utils/utilities";

// 🔹 Tipos
const AttributeMethodSchema = z.enum(["fixed", "rolled", "pointBuy"]);
const AttributesSchema = z.object({
  for: z.number().int().min(3).max(30),
  des: z.number().int().min(3).max(30),
  con: z.number().int().min(3).max(30),
  int: z.number().int().min(3).max(30),
  sab: z.number().int().min(3).max(30),
  pre: z.number().int().min(3).max(30),
});

const AttributesStepSchema = z.object({
  attributeMethod: AttributeMethodSchema,
  attributes: AttributesSchema,
});

const RolledAttributesGenerator = (): number[] => {
  function rollD6(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  function rollAttribute(): number {
    const rolls = [rollD6(), rollD6(), rollD6(), rollD6()];
    const min = Math.min(...rolls);

    const result = rolls.reduce((a, b) => a + b, 0) - min;
    return result;
  }

  return Array.from({ length: 6 }, () => rollAttribute());
};

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/auth");

  const session = await getSession(request);
  const savedData = session.get("characterData") ?? {};
  return { code, savedData };
}

// ✅ action
export async function action({ request }: Route.ActionArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/auth");

  const formData = await request.formData();
  const intent = formData.get("intent")?.toString() ?? "submit";

  const session = await getSession(request);
  const existing = session.get("characterData") ?? {};
  let updated = { ...existing };

  // Atualização parcial (ex: mudar método)
  if (intent === "update") {
    const field = formData.get("field")?.toString();
    const value = formData.get("value")?.toString();

    if (field === "attributeMethod") {
      // Ao mudar método, reseta atributos para valores padrão
      let newAttrs = { for: 10, des: 10, con: 10, int: 10, sab: 10, pre: 10 };
      if (value === "fixed") {
        newAttrs = { for: 15, des: 14, con: 13, int: 12, sab: 10, pre: 8 };
      } else if (value === "rolled") {
        var rolls = RolledAttributesGenerator().sort((a, b) => b - a);
        newAttrs = {
          for: rolls[0],
          des: rolls[1],
          con: rolls[2],
          int: rolls[3],
          sab: rolls[4],
          pre: rolls[5],
        };
      }
      updated = { ...updated, attributeMethod: value, attributes: newAttrs };
    } else if (field === "attributes") {
      try {
        const attrs = JSON.parse(value ?? "{}");
        updated = { ...updated, attributes: attrs };
      } catch (e) {
        // mantém atual
      }
    }

    session.set("characterData", updated);
    const headers = { "Set-Cookie": await commitSession(session) };
    return redirect("/builder/step/attributes", { headers });
  }

  // Submissão final
  if (intent === "submit") {
    let finalAttrs = existing.attributes ?? { for: 10, des: 10, con: 10, int: 10, sab: 10, pre: 10 };

  if (existing.attributeMethod === 'rolled' && !existing.attributes) {
    const rolls = RolledAttributesGenerator().sort((a, b) => b - a);
    finalAttrs = {
      for: rolls[0], des: rolls[1], con: rolls[2],
      int: rolls[3], sab: rolls[4], pre: rolls[5],
    };
  } else if (existing.attributeMethod !== 'rolled') {
    finalAttrs = Object.fromEntries(
      Object.entries(Object.fromEntries(formData.entries()))
        .filter(([k]) => k.startsWith('attr_'))
        .map(([k, v]) => [k.replace('attr_', ''), Number(v)])
    );
  }

    const result = AttributesStepSchema.safeParse({
      attributeMethod: formData.get("attributeMethod"),
      attributes: finalAttrs,
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

    // Valida soma para compra por pontos
    if (result.data.attributeMethod === "pointBuy") {
      const base = { for: 10, des: 10, con: 10, int: 10, sab: 10, pre: 10 };
      const costTable: Record<number, number> = {
        8: -2,
        9: -1,
        10: 0,
        11: 2,
        12: 3,
        13: 4,
        14: 5,
        15: 7,
      };
      let points = 0;
      for (const [attr, val] of Object.entries(result.data.attributes)) {
        const diff = val - base[attr as keyof typeof base];
        if (diff !== 0) {
          const cost = costTable[val];
          if (cost === undefined) {
            return json(
              {
                errors: {
                  [`attr_${attr}`]: [
                    `Valor ${val} inválido para compra por pontos`,
                  ],
                },
              },
              { status: 400 }
            );
          }
          points += cost;
        }
      }
      if (points !== 17) {
        return json(
          {
            errors: {
              _global: [`Total de pontos: ${points}. Deve ser exatamente 17.`],
            },
          },
          { status: 400 }
        );
      }
    }

    updated = { ...updated, ...result.data };
    session.set("characterData", updated);
    const headers = { "Set-Cookie": await commitSession(session) };

    const nextStepId = getNextStepId("attributes", updated);
    const nextStep = flow.find((s) => s.id === nextStepId);
    if (!nextStep)
      throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);
    return redirect(nextStep.path, { headers });
  }

  return redirect("/builder/step/attributes", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

// ✅ Componente — 100% SSR
export default function AttributesStep() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  const method = savedData.attributeMethod ?? "fixed";
  const attrs = savedData.attributes ?? {
    for: 15,
    des: 14,
    con: 13,
    int: 12,
    sab: 10,
    pre: 8,
  };

  const attrNames = {
    for: "Força",
    des: "Destreza",
    con: "Constituição",
    int: "Inteligência",
    sab: "Sabedoria",
    pre: "Presença",
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">
            Etapa 4: Atributos
          </h1>
          <p className="text-gray-400">
            Defina as capacidades inatas do seu personagem. Existem três métodos
            para distribuir seus atributos.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-amber-700/30">
          <Form method="post" className="space-y-8">
            <input type="hidden" name="intent" value="submit" />

            {/* MÉTODO DE ATRIBUTOS */}
            <div>
              <h3 className="text-xl font-bold mb-4">Método de Atributos</h3>
              <p className="text-sm text-gray-400 mb-4">
                Escolha como deseja definir os valores base dos seus atributos.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: "fixed",
                    title: "Valores Fixos",
                    desc: "15, 14, 13, 12, 10, 8",
                  },
                  {
                    id: "rolled",
                    title: "Rolagem",
                    desc: "4d6, descarte o menor",
                  },
                  {
                    id: "pointBuy",
                    title: "Compra por Pontos",
                    desc: "17 pontos, limite 15",
                  },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      method === opt.id
                        ? "border-amber-500 bg-amber-900/20"
                        : "border-gray-600 bg-gray-800 hover:border-amber-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="attributeMethod"
                      value={opt.id}
                      defaultChecked={method === opt.id}
                      className="sr-only"
                      onClick={() => {
                        // Atualização parcial via form submit
                        const f = document.createElement("form");
                        f.method = "POST";
                        const i1 = document.createElement("input");
                        i1.name = "intent";
                        i1.value = "update";
                        f.appendChild(i1);
                        const i2 = document.createElement("input");
                        i2.name = "field";
                        i2.value = "attributeMethod";
                        f.appendChild(i2);
                        const i3 = document.createElement("input");
                        i3.name = "value";
                        i3.value = opt.id;
                        f.appendChild(i3);
                        document.body.appendChild(f);
                        f.submit();
                      }}
                    />
                    <div className="font-bold">{opt.title}</div>
                    <div className="text-sm text-gray-300 mt-1">{opt.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* VALORES DOS ATRIBUTOS */}
            <div>
              <h3 className="text-xl font-bold mb-4">Valores dos Atributos</h3>
              <p className="text-sm text-gray-400 mb-2">
                Ajuste os valores conforme seu método escolhido.
              </p>

              {method === "pointBuy" && (
                <div className="mb-4 p-3 bg-gray-700/50 rounded text-sm">
                  <strong>Compra por Pontos:</strong> Comece com 10 em todos.
                  Gaste 17 pontos seguindo:
                  <br />
                  8(-2), 9(-1), 10(0), 11(+2), 12(+3), 13(+4), 14(+5), 15(+7)
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(attrNames).map(([key, name]) => (
                  <div key={key} className="space-y-1">
                    <label className="block text-sm font-medium">{name}</label>
                    <input
                      type="number"
                      name={`attr_${key}`}
                      defaultValue={attrs[key as keyof typeof attrs] ?? 10}
                      min={3}
                      max={30}
                      step={1}
                      readOnly={method === "rolled"}
                      className={`w-full p-2 bg-gray-700 rounded ${
                        method === "rolled"
                          ? "border-amber-500 cursor-not-allowed"
                          : "border-gray-600"
                      }`}
                      required
                    />
                    {actionData?.errors?.[`attr_${key}`] && (
                      <p className="text-red-400 text-xs">
                        {actionData.errors[`attr_${key}`][0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {actionData?.errors?._global && (
                <p className="text-red-400 mt-2">
                  {actionData.errors._global[0]}
                </p>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
              >
                {isSubmitting ? "Salvando..." : "Próximo →"}
              </button>
            </div>
          </Form>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Etapa 3 de 10 • Próximo: Escolha sua Origem
        </div>
      </div>
    </div>
  );
}
