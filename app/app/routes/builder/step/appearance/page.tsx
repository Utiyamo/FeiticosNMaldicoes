// routes/builder/step/appearance.tsx
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
import { AppearanceSchema, CharacterSheetSchema } from '~/types/builder';
import type { Route } from './+types/page';

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
    height: formData.get('height')?.toString().trim() || undefined,
    weight: formData.get('weight')?.toString().trim() || undefined,
    age: formData.get('age')?.toString().trim() || undefined,
    hairColor: formData.get('hairColor')?.toString().trim() || undefined,
    eyeColor: formData.get('eyeColor')?.toString().trim() || undefined,
    skinTone: formData.get('skinTone')?.toString().trim() || undefined,
    distinctiveFeatures: formData.get('distinctiveFeatures')?.toString().trim() || undefined,
    usualExpression: formData.get('usualExpression')?.toString().trim() || undefined,
    uniformPreference: formData.get('uniformPreference')?.toString().trim() || undefined,
    voiceDescription: formData.get('voiceDescription')?.toString().trim() || undefined,
    presenceNote: formData.get('presenceNote')?.toString().trim() || undefined,
  };

  const result = AppearanceSchema.safeParse(input);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const updated = { ...existing, appearance: result.data };
  const fullValidation = CharacterSheetSchema.safeParse(updated);
  if (!fullValidation.success) {
    return { errors: fullValidation.error.flatten().fieldErrors };
  }

  session.set('characterData', fullValidation.data);
  const headers = { 'Set-Cookie': await commitSession(session) };
  return redirect('/builder/review', { headers });
}

export default function AppearanceStep() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === 'submitting';

  // Sugestões contextuais por origem
  const suggestions = {
    hairColor: savedData.origin === 'Inumaki' ? 'preto com listras vermelhas' :
                savedData.origin === 'Gojo' ? 'branco/prateado' :
                savedData.origin === 'Feto Amaldiçoado Híbrido' ? 'iridescente/escuro' :
                '',
    eyeColor: savedData.origin === 'Gojo' ? 'azul celeste (Seis Olhos)' :
              savedData.origin === 'Kamo' ? 'vermelho sangue' :
              savedData.origin === 'Inumaki' ? 'preto com detalhes dourados' :
              '',
    distinctiveFeatures: savedData.origin === 'Inumaki' ? 'símbolos ao redor da boca (como olhos de cobra e presas)' :
                       savedData.origin === 'Feto Amaldiçoado Híbrido' ? 'veios escuros sob a pele, garras retráteis' :
                       savedData.origin === 'Corpo Amaldiçoado Mutante' ? 'costuras sutis, olhos com íris geométrica' :
                       '',
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-400 mb-2">
            Etapa 10: Aparência
          </h1>
          <p className="text-gray-400">
            Descreva como seu personagem é visto pelo mundo — detalhes que definem sua presença no campo de batalha e na sociedade do jujutsu.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-indigo-700/30 space-y-6">
          <Form method="post" className="space-y-8">
            {/* 🔹 Dados físicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Altura</label>
                <input
                  type="text"
                  name="height"
                  defaultValue={savedData.height ?? ''}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  placeholder="Ex: 1,75m"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Peso</label>
                <input
                  type="text"
                  name="weight"
                  defaultValue={savedData.weight ?? ''}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  placeholder="Ex: 68kg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Idade</label>
                <input
                  type="text"
                  name="age"
                  defaultValue={savedData.age ?? ''}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  placeholder="Ex: 16 anos"
                />
              </div>
            </div>

            {/* 🔹 Cores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Cor do cabelo</label>
                <input
                  type="text"
                  name="hairColor"
                  defaultValue={savedData.hairColor ?? ''}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  placeholder={suggestions.hairColor || 'Ex: preto azulado'}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Cor dos olhos</label>
                <input
                  type="text"
                  name="eyeColor"
                  defaultValue={savedData.eyeColor ?? ''}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  placeholder={suggestions.eyeColor || 'Ex: dourado âmbar'}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Tom de pele</label>
                <input
                  type="text"
                  name="skinTone"
                  defaultValue={savedData.skinTone ?? ''}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  placeholder="Ex: moreno claro, pálido como porcelana"
                />
              </div>
            </div>

            {/* 🔹 Traços distintivos */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Traços distintivos (cicatrizes, marcas, tatuagens, etc.)
              </label>
              <textarea
                name="distinctiveFeatures"
                defaultValue={savedData.distinctiveFeatures ?? ''}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 min-h-[60px] text-sm"
                placeholder={suggestions.distinctiveFeatures || 'Ex: cicatriz vertical no olho esquerdo'}
              />
            </div>

            {/* 🔹 Expressão e voz */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Expressão habitual</label>
                <input
                  type="text"
                  name="usualExpression"
                  defaultValue={savedData.usualExpression ?? ''}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  placeholder="Ex: olhar frio e avaliativo"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Tom de voz</label>
                <input
                  type="text"
                  name="voiceDescription"
                  defaultValue={savedData.voiceDescription ?? ''}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  placeholder="Ex: calma, mas com subtom de ameaça"
                />
              </div>
            </div>

            {/* 🔹 Uniforme (link com etapa anterior) */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Uniforme preferido (baseado na sua escolha de equipamentos)
              </label>
              <select
                name="uniformPreference"
                defaultValue={savedData.uniformPreference ?? savedData.selectedUniform ?? ''}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600"
              >
                <option value="">— Selecione ou descreva —</option>
                <option value="Uniforme Comum">Uniforme Comum</option>
                <option value="Uniforme com Revestimento Leve">Uniforme com Revestimento Leve</option>
                <option value="Uniforme com Revestimento Médio">Uniforme com Revestimento Médio</option>
                <option value="Uniforme com Revestimento Robusto">Uniforme com Revestimento Robusto</option>
                <option value="personalizado">Outro (descreva abaixo)</option>
              </select>
              {savedData.uniformPreference === 'personalizado' && (
                <input
                  type="text"
                  name="uniformPreference"
                  defaultValue=""
                  className="w-full mt-2 p-2 bg-gray-700 rounded border border-gray-600 text-sm"
                  placeholder="Ex: jaqueta preta com detalhes em vermelho"
                />
              )}
            </div>

            {/* 🔹 Nota de presença (RP) */}
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Nota de presença (como os outros percebem você?)
              </label>
              <textarea
                name="presenceNote"
                defaultValue={savedData.presenceNote ?? ''}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 min-h-[80px]"
                placeholder="Ex: 'Mesmo calado, sua simples entrada na sala faz o clima esfriar.'"
              />
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate('/builder/step/final-details')}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                ← Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md disabled:opacity-75"
              >
                {isSubmitting ? 'Salvando...' : 'Ir para Revisão →'}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}