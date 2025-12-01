// routes/builder/step/origin.tsx
import {
  Form,
  useLoaderData,
  useActionData,
  useNavigation,
  useNavigate,
  redirect,
} from "react-router";
import { useState, useEffect } from "react";
import type { Route } from "./+types/page";

import { getAuthCode, getSession, commitSession } from "~/utils/auth.server";
import { OriginSchema } from "~/types/builder";
import { flow, getNextStepId } from "~/types/flow";
import { ORIGINS, type OriginData } from "~/data/origins";
import { slugify } from "~/utils/utilities";

// ✅ loader
export async function loader({ request }: Route.LoaderArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  const session = await getSession(request);
  const savedData = session.get("characterData") ?? {};
  return { code, savedData };
}

// ✅ action
export async function action({ request }: Route.ActionArgs) {
  const code = await getAuthCode(request);
  if (!code) return redirect("/");

  const formData = await request.formData();
  const origin = String(formData.get("origin"));

  const result = OriginSchema.safeParse(origin);
  if (!result.success) {
    return { error: "Origem inválida" };
  }

  const session = await getSession(request);
  const existing = session.get("characterData") ?? {};
  const newData = { ...existing, origin: result.data };

  session.set("characterData", newData);
  const headers = { "Set-Cookie": await commitSession(session) };

  console.log("Selected origin:", result.data);

  // Redireciona para tela dedicada da origem
  const nextPath = `/builder/origin/${slugify(result.data)}`;
  return redirect(nextPath, { headers });
}

// ✅ Componente
export default function OriginStep() {
  const { savedData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<OriginData["id"] | null>(null);

  const isSubmitting = navigation.state === "submitting";

  // // Se já tiver origem salva, pula para tela dedicada
  // useEffect(() => {
  //   if (savedData.origin) {
  //     navigate(`/builder/origin/${savedData.origin.toLowerCase()}`);
  //   }
  // }, [savedData.origin, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-amber-400 mb-2">
            Etapa 4: Escolha sua Origem
          </h1>
          <p className="text-gray-400">
            Sua origem define como você acessou a energia amaldiçoada — e molda
            seu potencial único.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {ORIGINS.map((origin) => (
            <div
              key={origin.id}
              className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                hovered && hovered !== origin.id ? "blur-sm" : ""
              }`}
              onMouseEnter={() => setHovered(origin.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className={`h-full p-6 bg-gradient-to-br ${origin.colorClass} border-2 rounded-xl cursor-pointer transition-colors ${
                  hovered === origin.id ? "ring-2 ring-white/50 scale-105" : ""
                }`}
                onClick={() => {
                  const form = document.createElement("form");
                  form.method = "POST";
                  const input = document.createElement("input");
                  input.type = "hidden";
                  input.name = "origin";
                  input.value = origin.id; // ✅ valor exato, com acento
                  form.appendChild(input);
                  document.body.appendChild(form);
                  form.submit();
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-3xl">{origin.icon}</span>
                  <h3 className="text-xl font-bold">{origin.title}</h3>
                </div>

                <p className="text-sm text-gray-300 mb-4">{origin.summary}</p>

                <ul className="text-xs space-y-1">
                  {origin.bonuses.map((bonus, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-amber-400 mr-1">•</span>
                      <span>{bonus}</span>
                    </li>
                  ))}
                </ul>

                {/* Tooltip expandido no hover */}
                {hovered === origin.id && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-end p-4">
                    <div className="bg-gray-800/90 text-white p-4 rounded-lg w-full">
                      <h4 className="font-bold text-amber-400 mb-2">
                        Próximos passos para {origin.title}
                      </h4>
                      <p className="text-sm">
                        Você será levado a uma tela dedicada para definir: bônus
                        de atributos, talentos naturais (se aplicável) e
                        detalhes da sua técnica (se tiver).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-gray-500">
          Etapa 4 de 10 • Clique em uma origem para continuar
        </div>
      </div>
    </div>
  );
}
