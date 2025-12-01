import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
} from "react-router";
import type { Route } from "./+types/page";
import { getAuthCode, getSession, createAuthSession, commitSession } from "~/utils/auth.server";
import { BaseDataSchema } from "~/types/builder";
import { flow, getNextStepId } from "~/types/flow";

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  console.log("Loader do passo 'base' executado com sucesso.");

  // ✅ Carrega progresso salvo (se houver)
  const session = await createAuthSession(code); // reutiliza sessionStorage
  const savedData = session.get("characterData") ?? {};
  return { authenticated: true, code, savedData };
}

export async function action({ request }: Route.ActionArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  // ✅ Validação com Zod
  const result = BaseDataSchema.safeParse(rawData);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // ✅ Carrega dados salvos + merge com novos
  const session = await getSession(request);
  const existingData = session.get("characterData") ?? {};
  const newData = { ...existingData, ...result.data };

  // ✅ Salva no cookie (SSR-friendly)
  session.set("characterData", newData);
  const headers = {
    "Set-Cookie": await commitSession(session),
  };

  // ✅ Redireciona para próxima etapa dinâmica
  const nextStepId = getNextStepId("base", newData);
  const nextStep = flow.find((s) => s.id === nextStepId);
  if (!nextStep) throw new Error(`Etapa '${nextStepId}' não encontrada`);

  return redirect(nextStep.path, { headers });
}

export default function BasePage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const { savedData } = loaderData;

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">
            Etapa 2: Dados Básicos
          </h1>
          <p className="text-gray-400">
            Informe quem controla o personagem e como ele se chama.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
          <Form method="post" className="space-y-6">
            <div>
              <label
                htmlFor="playerName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Nome do Jogador
              </label>
              <input
                id="playerName"
                name="playerName"
                type="text"
                defaultValue={savedData.playerName || ""}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
              {actionData?.errors?.playerName && (
                <p className="mt-1 text-sm text-red-400">
                  {actionData.errors.playerName[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="characterName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Nome do Personagem
              </label>
              <input
                id="characterName"
                name="characterName"
                type="text"
                defaultValue={savedData.characterName || ""}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
              {actionData?.errors?.characterName && (
                <p className="mt-1 text-sm text-red-400">
                  {actionData.errors.characterName[0]}
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => window.history.back()}
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
          Etapa 2 de 10 • Fluxo: Dados Básicos → Aspectos Pessoais
        </div>
      </div>
    </div>
  );
}
