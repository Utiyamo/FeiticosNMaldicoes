// routes/builder/step/specialization.tsx
import { Form, useLoaderData, useNavigate, redirect } from 'react-router';
import { getAuthCode, getSession, commitSession } from '~/utils/auth.server';
import type { Route } from './+types/page';

// 🔹 Especializações válidas (p.44)
const SPECIALIZATIONS = [
  { id: 'Lutador', title: 'Lutador', icon: '⚔️', color: 'bg-red-900/20 border-red-700' },
  { id: 'Especialista em Combate', title: 'Especialista em Combate', icon: '🛡️', color: 'bg-amber-900/20 border-amber-700' },
  { id: 'Especialista em Técnica', title: 'Especialista em Técnica', icon: '🌀', color: 'bg-purple-900/20 border-purple-700' },
  { id: 'Controlador', title: 'Controlador', icon: ' Puppet', color: 'bg-emerald-900/20 border-emerald-700' },
  { id: 'Suporte', title: 'Suporte', icon: '✚', color: 'bg-blue-900/20 border-blue-700' },
  { id: 'Restringido', title: 'Restringido', icon: '⛓️', color: 'bg-gray-900/20 border-gray-700' },
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect('/');

  const session = await getSession(request);
  const savedData = session.get('characterData') ?? {};
  return { savedData };
}

export default function SpecializationStep() {
  const { savedData } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">Etapa 5: Especialização</h1>
          <p className="text-gray-400">
            Escolha o caminho que seu personagem tomou para se fortalecer — sua especialização define suas capacidades principais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECIALIZATIONS.map(spec => (
            <Form key={spec.id} method="post" replace>
              <input type="hidden" name="specialization" value={spec.id} />
              <button
                type="submit"
                className={`w-full h-full p-5 rounded-xl border-2 transition-all duration-200 ${
                  spec.color
                } hover:ring-2 hover:ring-white/30 hover:scale-[1.02] flex flex-col items-center text-left`}
              >
                <span className="text-3xl mb-2">{spec.icon}</span>
                <h3 className="text-xl font-bold">{spec.title}</h3>
                <p className="text-sm text-gray-300 mt-2">
                  {spec.id === 'Lutador' && 'PV: 12 + CON, PE: 4'}
                  {spec.id === 'Especialista em Combate' && 'PV: 12 + CON, PE: 4'}
                  {spec.id === 'Especialista em Técnica' && 'PV: 10 + CON, PE: 6 + INT/SAB'}
                  {spec.id === 'Controlador' && 'PV: 10 + CON, PE: 5 + INT/SAB'}
                  {spec.id === 'Suporte' && 'PV: 10 + CON, PE: 5 + INT/SAB'}
                  {spec.id === 'Restringido' && 'PV: 16 + CON, Estamina'}
                </p>
              </button>
            </Form>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          Etapa 5 de 10 • Próximo: Detalhes da Especialização
        </div>
      </div>
    </div>
  );
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const specialization = String(formData.get('specialization'));

  const valid = SPECIALIZATIONS.some(s => s.id === specialization);
  if (!valid) return { error: 'Especialização inválida' };

  const session = await getSession(request);
  const existing = session.get('characterData') ?? {};
  const updated = { ...existing, specialization };

  session.set('characterData', updated);
  const headers = { 'Set-Cookie': await commitSession(session) };

  // Redireciona para detalhes
  const slug = specialization.toLowerCase().replace(/\s+/g, '-');
  return redirect(`/builder/specialization/${slug}`, { headers });
}