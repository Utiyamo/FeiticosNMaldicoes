// routes/builder/origin/restringido.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from "react-router";
import { getAuthCode, getSession, commitSession } from "~/utils/auth.server";
import { CharacterSheetSchema, OriginDetailsSchema } from "~/types/builder"; // ✅ schema centralizado
import { flow, getNextStepId } from "~/types/flow";
import type { Route } from "./+types/restringido";

// ✅ loader — valida se o jogador chegou aqui corretamente
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  const session = await getSession(request);
  const savedData = session.get("characterData") ?? {};

  if (savedData.origin !== "Restringido") {
    return redirect("/builder/step/origin");
  }

  return { code, savedData };
}

// ✅ action — salva apenas `origin: 'Restringido'` (sem originDetails extras)
export async function action({ request }: Route.ActionArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  const session = await getSession(request);
  const existing = session.get("characterData") ?? {};

  const formData = await request.formData();

  // ✅ Restringido não tem campos extras em originDetails — é só a origem
  const originDetailsInput = {
    type: "Restringido" as const,
  };

  const resultOrigin = OriginDetailsSchema.safeParse(originDetailsInput);
  if (!resultOrigin.success) {
    return {
      errors: resultOrigin.error.flatten().fieldErrors,
    };
  }

  const updated = {
    ...existing,
    origin: "Restringido",
    originDetails: resultOrigin.data,
  };

  const result = CharacterSheetSchema.safeParse(updated);
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      submitted: Object.fromEntries(formData.entries()),
    };
  }

  session.set("characterData", result.data);
  const headers = { "Set-Cookie": await commitSession(session) };

  const nextStepId = getNextStepId("origin", result.data);
  const nextStep = flow.find((s) => s.id === nextStepId);
  if (!nextStep)
    throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);

  return redirect(nextStep.path, { headers });
}

// ✅ Componente — limpo, fiel e funcional
export default function RestringidoOrigin() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-300 mb-2">
            Origem: <span className="text-gray-200">Restringido</span>
          </h1>
          <p className="text-gray-400">
            Você nasceu com uma quantidade quase nula de energia amaldiçoada —
            mas em troca, seu corpo alcançou o ápice humano.
            <br />
            <em>
              “O céu te restringiu… então você se tornou maior que o céu.”
            </em>
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700/30">
          <div className="mb-6 p-4 bg-gray-900/30 rounded-lg border border-gray-600">
            <h3 className="font-bold text-gray-200 mb-2">
              Benefícios da Origem Restringido (p.33)
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                <strong>Bônus em Atributo:</strong> +1 em{" "}
                <strong>Força, Destreza e Constituição</strong> + 2 pontos
                livres (físicos)
              </li>
              <li>
                <strong>Físico Abençoado:</strong> +3m de deslocamento, imune a
                doenças mundanas, vantagem vs. venenos, cura acelerada
              </li>
              <li>
                <strong>Ápice Corporal Humano:</strong> limite de FOR/DES/CON ={" "}
                <strong>30</strong>; +2 em um desses a cada 6 níveis
              </li>
              <li>
                <strong>Resiliência Imediata:</strong> reduz dano ou evita
                desmembramento (usos = bônus de treinamento/dia)
              </li>
              <li>
                <strong>Especialização vinculada:</strong> só pode escolher{" "}
                <strong>Restringido</strong>
              </li>
            </ul>
            <p className="text-xs text-gray-400 mt-3">
              (Livro de Regras, p.33 — exemplo canônico: <em>Toji Fushiguro</em>
              )
            </p>
          </div>

          <Form method="post" className="space-y-6">
            <div className="text-center text-gray-300">
              <p className="mb-4">
                Esta origem representa o ápice do físico humano — uma anomalia
                capaz de enfrentar até os mais fortes feiticeiros.
              </p>
              <p className="text-sm text-gray-500">
                Você não terá acesso a feitiços, PE ou técnicas amaldiçoadas —
                mas ganhará poderes físicos sem igual.
              </p>
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
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
              >
                {isSubmitting ? "Confirmando..." : "Confirmar Origem →"}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
