// routes/builder/step/equipment.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from "react-router";
import { getAuthCode, getSession, commitSession } from "~/utils/auth.server";
import { CharacterSheetSchema } from "~/types/builder";
import type { Route } from "./+types/page";

const EQUIPMENT_RULES = {
  weaponsOrShields: 2,
  uniforms: 1,
  toolkits: 1,
};

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  const session = await getSession(request);
  const savedData = session.get("characterData") ?? {};

  return { savedData };
}

export default function EquipmentStep() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  // 🔹 Estado atual do inventário
  const weapon1 = savedData.selectedWeapon1 ?? null;
  const weapon2 = savedData.selectedWeapon2 ?? null;
  const shield = savedData.selectedShield ?? null;

  const itemCount = [weapon1, weapon2, shield].filter(Boolean).length;
  const hasShieldProficiency =
    savedData.specializationDetails?.weaponsProficiencies?.includes("Escudo");

  // 🔹 Lógica de habilitação
  const canAddWeapon1 = !weapon1;
  const canAddWeapon2 = !weapon2 && itemCount < 2;
  const canAddShield = hasShieldProficiency && !shield && itemCount < 2;

  const uniform = savedData.selectedUniform ?? null;
  const toolkit = savedData.selectedToolkit ?? "";
  const isComplete = itemCount === 2 && uniform && toolkit;

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            Etapa 6: Equipamentos
          </h1>
          <p className="text-gray-400">
            Escolha seus equipamentos iniciais (nível 1). Você deve selecionar:
            <br />
            <strong>2 itens (arma/arma, arma/escudo)</strong>,{" "}
            <strong>1 uniforme</strong> e <strong>1 kit de ferramentas</strong>.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-cyan-700/30 space-y-6">
          {/* 🔹 1ª Arma */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">1ª Arma</h3>
              {weapon1 ? (
                <span className="text-sm text-gray-300 mt-1">• {weapon1}</span>
              ) : (
                <span className="text-gray-500 text-sm">
                  Aguardando seleção
                </span>
              )}
            </div>
            <Form method="post" replace>
              <input type="hidden" name="intent" value="select-weapon-1" />
              <button
                type="submit"
                disabled={!canAddWeapon1}
                className={`px-3 py-1 text-sm rounded ${
                  canAddWeapon1
                    ? "bg-cyan-700 hover:bg-cyan-600 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Selecionar
              </button>
            </Form>
          </div>

          {/* 🔹 2ª Arma */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">2ª Arma</h3>
              {weapon2 ? (
                <span className="text-sm text-gray-300 mt-1">• {weapon2}</span>
              ) : (
                <span className="text-gray-500 text-sm">
                  Aguardando seleção
                </span>
              )}
            </div>
            <Form method="post" replace>
              <input type="hidden" name="intent" value="select-weapon-2" />
              <button
                type="submit"
                disabled={!canAddWeapon2}
                className={`px-3 py-1 text-sm rounded ${
                  canAddWeapon2
                    ? "bg-cyan-700 hover:bg-cyan-600 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Selecionar
              </button>
            </Form>
          </div>

          {/* 🔹 Escudo — só se permitido e houver espaço */}
          {hasShieldProficiency && (
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Escudo</h3>
                {shield ? (
                  <span className="text-sm text-gray-300 mt-1">• {shield}</span>
                ) : (
                  <span className="text-gray-500 text-sm">
                    Aguardando seleção
                  </span>
                )}
              </div>
              <Form method="post" replace>
                <input type="hidden" name="intent" value="select-shield" />
                <button
                  type="submit"
                  disabled={!canAddShield}
                  className={`px-3 py-1 text-sm rounded ${
                    canAddShield
                      ? "bg-cyan-700 hover:bg-cyan-600 text-white"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Selecionar
                </button>
              </Form>
            </div>
          )}

          {/* 🔹 Uniforme */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">Uniforme</h3>
              {uniform ? (
                <span className="text-sm text-gray-300 mt-1">• {uniform}</span>
              ) : (
                <span className="text-gray-500 text-sm">
                  Aguardando seleção
                </span>
              )}
            </div>
            <Form method="post" replace>
              <input type="hidden" name="intent" value="select-uniform" />
              <button
                type="submit"
                disabled={!!uniform}
                className={`px-3 py-1 text-sm rounded ${
                  !uniform
                    ? "bg-cyan-700 hover:bg-cyan-600 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Selecionar
              </button>
            </Form>
          </div>

          {/* 🔹 Kit de Ferramentas */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">Kit de Ferramentas</h3>
              {toolkit ? (
                <span className="text-sm text-gray-300 mt-1">• {toolkit}</span>
              ) : (
                <span className="text-gray-500 text-sm">
                  Aguardando seleção
                </span>
              )}
            </div>
            <Form method="post" replace>
              <input type="hidden" name="intent" value="select-toolkit" />
              <button
                type="submit"
                disabled={!!toolkit}
                className={`px-3 py-1 text-sm rounded ${
                  !toolkit
                    ? "bg-cyan-700 hover:bg-cyan-600 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                {toolkit ? "Alterar" : "Selecionar"}
              </button>
            </Form>
          </div>

          {/* 🔹 Resumo */}
          <div className="p-3 bg-gray-900/50 rounded text-sm">
            <strong>Regras (nível 1, p.130):</strong>
            <ul className="list-disc pl-5 mt-1">
              <li>2 itens de custo 1 (arma/arma, arma/escudo)</li>
              <li>1 uniforme comum</li>
              <li>1 kit de ferramentas à escolha</li>
            </ul>
          </div>

          {/* 🔹 Botões */}
          <div className="flex justify-between pt-4">
            <Form method="post" replace>
              <input type="hidden" name="intent" value="reset-equipment" />
              <button
                type="submit"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
              >
                Resetar Equipamentos
              </button>
            </Form>

            <Form method="post" replace>
              <input type="hidden" name="intent" value="confirm-equipment" />
              <button
                type="submit"
                disabled={!isComplete}
                className={`px-6 py-2 font-medium rounded-lg shadow-md ${
                  isComplete
                    ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isComplete
                  ? "Confirmar Equipamentos →"
                  : "Complete todos os itens"}
              </button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ action — com safeParse completo antes de avançar
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  const session = await getSession(request);
  const existing = session.get("characterData") ?? {};

  const intent = formData.get("intent");
  const toolkit = formData.get("toolkit");

  // ✅ Reset de equipamentos
  if (intent === "reset-equipment") {
    const resetData = {
      ...existing,
      selectedWeapon1: null,
      selectedWeapon2: null,
      selectedShield: null,
      selectedUniform: null,
      selectedToolkit: "",
    };
    session.set("characterData", resetData);
    const headers = { "Set-Cookie": await commitSession(session) };
    return redirect("/builder/step/equipment", { headers });
  }

  // ✅ Redirecionamentos
  if (intent === "select-weapon-1") {
    const updated = { ...existing, selectedWeaponMode: "1" };
    session.set("characterData", updated);
    const headers = { "Set-Cookie": await commitSession(session) };
    return redirect("/builder/step/weapon-selection", { headers });
  }
  if (intent === "select-weapon-2") {
    const updated = { ...existing, selectedWeaponMode: "2" };
    session.set("characterData", updated);
    const headers = { "Set-Cookie": await commitSession(session) };
    return redirect("/builder/step/weapon-selection", { headers });
  }
  if (intent === "select-shield")
    return redirect("/builder/step/shield-selection");
  if (intent === "select-uniform")
    return redirect("/builder/step/uniform-selection");
  if (intent === "select-toolkit")
    return redirect("/builder/step/toolkit-selection");

  // ✅ Salvar kit de ferramentas (fallback)
  if (
    typeof toolkit === "string" &&
    [
      "Ferramentas de Ferreiro",
      "Ferramentas de Canalizador",
      "Ferramentas de Alfaiate",
      "Ferramentas de Alquimista",
      "Ferramentas de Farmacêutico",
      "Ferramentas de Serralheiro",
    ].includes(toolkit)
  ) {
    const updated = { ...existing, selectedToolkit: toolkit };
    session.set("characterData", updated);
    const headers = { "Set-Cookie": await commitSession(session) };
    return redirect("/builder/step/equipment", { headers });
  }

  // ✅ Confirmar equipamentos — com safeParse completo
  if (intent === "confirm-equipment") {
    const items = [
      existing.selectedWeapon1,
      existing.selectedWeapon2,
      existing.selectedShield,
    ].filter(Boolean);

    if (items.length !== 2) {
      return {
        error:
          "Você deve selecionar exatamente 2 itens (arma/arma ou arma/escudo).",
      };
    }

    const hasShield = items.includes(existing.selectedShield);
    const allowsShield =
      existing.specializationDetails?.weaponsProficiencies?.includes("Escudo");
    if (hasShield && !allowsShield) {
      return { error: "Sua especialização não permite escudos." };
    }

    if (!existing.selectedUniform) return { error: "Uniforme obrigatório." };
    if (!existing.selectedToolkit)
      return { error: "Kit de ferramentas obrigatório." };

    // 🔹 🔹 🔹 VALIDAÇÃO FINAL COM CharacterSheetSchema 🔹 🔹 🔹
    const result = CharacterSheetSchema.safeParse(existing);
    if (!result.success) {
      console.error("Erro de validação ao confirmar equipamentos:", result.error.flatten());
      return {
        error: "Dados incompletos ou inválidos. Verifique todos os passos.",
        validationErrors: result.error.flatten().fieldErrors,
      };
    }

    // ✅ Tudo OK — marca como confirmado e avança
    const updated = { ...result.data, equipmentConfirmed: true };
    session.set("characterData", updated);
    const headers = { "Set-Cookie": await commitSession(session) };
    return redirect("/builder/step/spells", { headers });
  }

  return { error: "Ação inválida" };
}