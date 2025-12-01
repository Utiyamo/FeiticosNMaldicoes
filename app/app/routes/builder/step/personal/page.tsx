// routes/builder/step/personal.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  useNavigate,
  redirect,
} from 'react-router';
import { z } from 'zod';
import { useState } from 'react';
import type { Route } from './+types/page';

import { getAuthCode, getSession , commitSession } from '~/utils/auth.server';
import { PersonalAspectsSchema, CharacterSheetSchema } from '~/types/builder';
import { flow, getNextStepId } from '~/types/flow';

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};

  return { code, savedData };
}

// ✅ action
export async function action({ request }: Route.ActionArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const formData = await request.formData();
  const rawData = Object.fromEntries<any>(formData.entries());

  // Validação só dos campos desta etapa
  const result = PersonalAspectsSchema.safeParse({
    personalityTraits: JSON.parse(rawData.personalityTraits || '[]'),
    ideals: JSON.parse(rawData.ideals || '[]'),
    bonds: JSON.parse(rawData.bonds || '[]'),
    complications: JSON.parse(rawData.complications || '[]'),
    innerDomain: rawData.innerDomain,
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      submitted: rawData,
    };
  }

  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};
  const newData = { ...existing, ...result.data };

  session.set('characterData', newData);
  const headers = { 'Set-Cookie': await commitSession(session) };

  // ✅ Redirecionamento condicional com base no flow
  const nextStepId = getNextStepId('personal', newData);
  const nextStep = flow.find((s) => s.id === nextStepId);
  if (!nextStep) throw new Error(`Próxima etapa '${nextStepId}' não encontrada`);

  return redirect(nextStep.path, { headers });
}

// ✅ Componente
export default function PersonalStep() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();

  const isSubmitting = navigation.state === 'submitting';

  // Estado local para edição dinâmica
  const [traits, setTraits] = useState<string[]>(
    actionData?.submitted?.personalityTraits
      ? JSON.parse(actionData.submitted.personalityTraits)
      : savedData.personalityTraits || ['']
  );
  const [ideals, setIdeals] = useState<string[]>(
    actionData?.submitted?.ideals
      ? JSON.parse(actionData.submitted.ideals)
      : savedData.ideals || ['']
  );
  const [bonds, setBonds] = useState<string[]>(
    actionData?.submitted?.bonds
      ? JSON.parse(actionData.submitted.bonds)
      : savedData.bonds || ['']
  );
  const [complications, setComplications] = useState<string[]>(
    actionData?.submitted?.complications
      ? JSON.parse(actionData.submitted.complications)
      : savedData.complications || ['']
  );
  const [innerDomain, setInnerDomain] = useState<string>(
    actionData?.submitted?.innerDomain ?? savedData.innerDomain ?? ''
  );

  const updateArray = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter((prev) => {
      const newArr = [...prev];
      newArr[index] = value;
      return newArr;
    });
  };

  const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, '']);
  };

  const removeField = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const renderFieldGroup = (
    label: string,
    description: string,
    values: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    fieldName: string,
    error?: string[]
  ) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-300">{label}</label>
        <button
          type="button"
          onClick={() => addField(setter)}
          className="text-xs text-amber-400 hover:text-amber-300"
        >
          + Adicionar
        </button>
      </div>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      {values.map((value, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input
            type="text"
            value={value}
            onChange={(e) => updateArray(setter, i, e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            placeholder={`Digite ${label.toLowerCase()}...`}
          />
          {values.length > 1 && (
            <button
              type="button"
              onClick={() => removeField(setter, i)}
              className="px-2 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {error && <p className="text-sm text-red-400 mt-1">{error[0]}</p>}
    </div>
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Serializa arrays para JSON antes do submit
    const hiddenInputs = document.querySelectorAll<HTMLInputElement>(
      'input[name^="serialized_"]'
    );
    hiddenInputs.forEach((input) => input.remove());

    const appendHidden = (name: string, value: any) => {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = name;
      hidden.value = JSON.stringify(value);
      e.currentTarget.appendChild(hidden);
    };

    appendHidden('personalityTraits', traits);
    appendHidden('ideals', ideals);
    appendHidden('bonds', bonds);
    appendHidden('complications', complications);
    appendHidden('innerDomain', innerDomain);

    // Adiciona stepId para rastreabilidade (opcional)
    const stepIdInput = document.createElement('input');
    stepIdInput.type = 'hidden';
    stepIdInput.name = 'stepId';
    stepIdInput.value = 'personal';
    e.currentTarget.appendChild(stepIdInput);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">Etapa 3: Aspectos Pessoais</h1>
          <p className="text-gray-400">
            Defina quem seu personagem é por dentro — suas motivações, fraquezas e alma.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
          <Form method="post" onSubmit={handleSubmit} className="space-y-8">
            {renderFieldGroup(
              'Traços de Personalidade',
              'Como ele pensa, age e reage? (ex: "Cínico", "Protetor nato")',
              traits,
              setTraits,
              'personalityTraits',
              actionData?.errors?.personalityTraits
            )}

            {renderFieldGroup(
              'Ideais',
              'O que guia suas decisões? (ex: "Justiça", "Liberdade absoluta")',
              ideals,
              setIdeals,
              'ideals',
              actionData?.errors?.ideals
            )}

            {renderFieldGroup(
              'Ligações',
              'O que ou quem ele valoriza? (ex: "Minha irmã", "O Colégio Jujutsu")',
              bonds,
              setBonds,
              'bonds',
              actionData?.errors?.bonds
            )}

            {renderFieldGroup(
              'Complicações',
              'Fraquezas, vícios ou traumas? (ex: "Raiva incontrolável", "Medo de falhar")',
              complications,
              setComplications,
              'complications',
              actionData?.errors?.complications
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Domínio Inato
              </label>
              <p className="text-xs text-gray-500 mb-2">
                O "espaço interior" do personagem — onde reside sua mente e alma. (ex: "Uma
                biblioteca infinita em chamas", "Um campo de caveiras sob céu estrelado")
              </p>
              <textarea
                value={innerDomain}
                onChange={(e) => setInnerDomain(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Descreva o Domínio Inato..."
              />
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
                {isSubmitting ? 'Salvando...' : 'Próximo →'}
              </button>
            </div>
          </Form>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          Etapa 3 de 10 • Fluxo: Aspectos Pessoais →{' '}
          {savedData.origin === 'Inato' || savedData.origin === 'Herdado'
            ? 'Domínio Inato & Técnica'
            : 'Atributos e Origem'}
        </div>
      </div>
    </div>
  );
}