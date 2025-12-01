// routes.ts
import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Página inicial → redireciona ou explica
  index("routes/home.tsx"),

  // Layout de proteção — NÃO é uma rota acessível diretamente
  layout(
    // layout component (com loader que protege)
    "routes/layout/baseLayout.tsx",
    [
      // Rotas filhas protegidas
      route("/builder/step/base", "routes/builder/step/base/page.tsx"),
      route("/builder/step/personal", "routes/builder/step/personal/page.tsx"),
      route("/builder/step/origin", "routes/builder/step/origin/page.tsx"),
      route("/builder/origin/inato", "routes/builder/step/origin/inato.tsx"),
      route("/builder/origin/herdado", "routes/builder/step/origin/herdado.tsx"),
      route("/builder/origin/sem-tecnica", "routes/builder/step/origin/semtecnica.tsx"),
      route("/builder/origin/derivado", "routes/builder/step/origin/derivado.tsx"),
      route("/builder/origin/FetoAmaldicoado", "routes/builder/step/origin/fetoamaldicoado.tsx"),
      route('/builder/origin/ObjetoAmaldicoado', 'routes/builder/step/origin/objetoamaldicoado.tsx'),
      route('/builder/step/attribute-increment', 'routes/builder/step/attribute-increment/page.tsx'),
      route("/builder/step/attributes", "routes/builder/step/attributes/page.tsx"),
      route("/builder/step/specialization", "routes/builder/step/specialization/page.tsx"),
      route("/builder/specialization/lutador", "routes/builder/step/specialization/lutador.tsx"),
      route("/builder/review", "routes/builder/review/page.tsx"),
      // + demais etapas...
    ]
  ),

  // Logout (livre, para resetar sessão)
  route("/logout", "routes/logout/page.tsx"),
] satisfies RouteConfig;