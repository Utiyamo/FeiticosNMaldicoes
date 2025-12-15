// routes/builder/step/final-details.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  redirect,
  useNavigate,
} from 'react-router';
import { z } from 'zod';
import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import { CharacterSheetSchema } from '~/types/builder';
import type { Route } from './+types/page';

// 🔹 Características de Anatomia (p.35–36)
const ANATOMY_OPTIONS = [
  'Alma Maldita', 'Anatomia Incompreensível', 'Arma Natural', 'Articulações Extensas',
  'Braços Extras', 'Capacidade de Voo', 'Carapaça Mutante', 'Corpo Especializado',
  'Desenvolvimento Exagerado', 'Devorador de Energia', 'Instinto Sanguinário',
  'Olhos Sombrios', 'Pernas Extras', 'Presença Nefasta', 'Sangue Tóxico',
] as const;

// 🔹 Schema local para validação parcial (só o que é novo nesta etapa)
const FinalDetailsSchema = z.object({
  vow: z.string().optional(),
  innerDomain: z.string().optional(),
  // Anatomia (só para Feto)
  anatomia: z.enum(ANATOMY_OPTIONS).optional(),
  // Núcleos (só para Corpo Mutante)
  nucleo1: z.string().min(1, 'Nome do Núcleo 1 é obrigatório').optional(),
  nucleo2: z.string().min(1, 'Nome do Núcleo 2 é obrigatório').optional(),
  nucleo3: z.string().min(1, 'Nome do Núcleo 3 é obrigatório').optional(),
});

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  return { savedData };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};

  const input = {
    vow: formData.get('vow')?.toString().trim() || undefined,
    innerDomain: formData.get('innerDomain')?.toString().trim() || undefined,
    anatomia: formData.get('anatomia')?.toString().trim() || undefined,
    nucleo1: formData.get('nucleo1')?.toString().trim() || undefined,
    nucleo2: formData.get('nucleo2')?.toString().trim() || undefined,
    nucleo3: formData.get('nucleo3')?.toString().trim() || undefined,
  };

  const result = FinalDetailsSchema.safeParse(input);
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      submitted: input,
    };
  }

  // ✅ Mescla com dados existentes e valida com schema completo
  const updated = { ...existing, ...result.data };
  const fullValidation = CharacterSheetSchema.safeParse(updated);
  if (!fullValidation.success) {
    return {
      errors: fullValidation.error.flatten().fieldErrors,
    };
  }

  session.set('characterData', fullValidation.data);
  const headers = { 'Set-Cookie': await commitSession(session) };
  return redirect('/builder/step/appearance', { headers });
}

export default function FinalDetailsStep() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  const isFeto = savedData.origin === 'Feto Amaldiçoado Híbrido';
  const isSemTecnica = savedData.origin === 'Sem-Técnica';
  const isCorpoMutante = savedData.origin === 'Corpo Amaldiçoado Mutante';

  // Validação de completude (condicional)
  const isComplete = (() => {
    if (isFeto && !savedData.anatomia) return false;
    if (isCorpoMutante && (!savedData.nucleo1 || !savedData.nucleo2 || !savedData.nucleo3)) return false;
    return true;
  })();

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            Etapa 9: Detalhes Finais
          </h1>
          <p className="text-gray-400">
            Complete os últimos detalhes narrativos antes de definir sua aparência.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-cyan-700/30 space-y-6">
          <Form method="post" className="space-y-8">
            {/* 🔹 Anatomia (Feto Amaldiçoado Híbrido) */}
            {isFeto && (
              <div>
                <h3 className="text-lg font-bold mb-2">Característica de Anatomia</h3>
                <p className="text-sm text-gray-400 mb-2">
                  Escolha sua primeira característica (p.35 do livro). Ex: <em>Sangue Tóxico</em>, <em>Arma Natural</em>.
                </p>
                <select
                  name="anatomia"
                  defaultValue={savedData.anatomia ?? ''}
                  className="w-full p-3 bg-gray-700 rounded border border-gray-600"
                  required
                >
                  <option value="">— Selecione uma característica —</option>
                  {ANATOMY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {actionData?.errors?.anatomia && (
                  <p className="text-red-400 text-sm mt-1">{actionData.errors.anatomia[0]}</p>
                )}
              </div>
            )}

            {/* 🔹 Núcleos (Corpo Amaldiçoado Mutante) */}
            {isCorpoMutante && (
              <div>
                <h3 className="text-lg font-bold mb-2">Núcleos Múltiplos</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Você possui 3 núcleos. Dê um nome a cada um (ex: <em>Núcleo Solar</em>, <em>Núcleo de Aço</em>).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(['nucleo1', 'nucleo2', 'nucleo3'] as const).map((key, i) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-300 mb-1">
                        Núcleo {i + 1}
                      </label>
                      <input
                        type="text"
                        name={key}
                        defaultValue={savedData[key] ?? ''}
                        className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm"
                        placeholder={`Ex: Núcleo ${i === 0 ? 'Solar' : i === 1 ? 'de Aço' : 'Tóxico'}`}
                        required
                      />
                      {actionData?.errors?.[key] && (
                        <p className="text-red-400 text-xs mt-1">{actionData.errors[key]?.[0]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🔹 Voto (Sem-Técnica) */}
            {isSemTecnica && (
              <div>
                <h3 className="text-lg font-bold mb-2">Voto Narrativo (Opcional)</h3>
                <p className="text-sm text-gray-400 mb-2">
                  Um princípio ou restrição que define seu personagem. Ex: <em>“Nunca recuo”</em>, <em>“Só uso punhos”</em>.
                </p>
                <input
                  type="text"
                  name="vow"
                  defaultValue={savedData.vow ?? ''}
                  className="w-full p-3 bg-gray-700 rounded border border-gray-600"
                  placeholder="Ex: Nunca uso armas de fogo"
                />
                {actionData?.errors?.vow && (
                  <p className="text-red-400 text-sm mt-1">{actionData.errors.vow[0]}</p>
                )}
              </div>
            )}

            {/* 🔹 Domínio Interior (todos) */}
            <div>
              <h3 className="text-lg font-bold mb-2">Domínio Interior (Opcional)</h3>
              <p className="text-sm text-gray-400 mb-2">
                Descreva o “cenário” do seu domínio, mesmo que ainda não o tenha ativo. Ex: <em>“Um jardim em ruínas sob céu estrelado”</em>.
              </p>
              <textarea
                name="innerDomain"
                defaultValue={savedData.innerDomain ?? ''}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 min-h-[80px]"
                placeholder="Ex: Um corredor infinito com espelhos quebrados..."
              />
              {actionData?.errors?.innerDomain && (
                <p className="text-red-400 text-sm mt-1">{actionData.errors.innerDomain[0]}</p>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate('/builder/step/spells')}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isComplete}
                className={`px-6 py-2 font-medium rounded-lg shadow-md ${
                  isComplete
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Salvando...' : 'Ir para Aparência →'}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}