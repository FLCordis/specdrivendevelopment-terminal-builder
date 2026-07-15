import { ProjectStateSchema } from "../../src/state/schema.js";

export const FIXTURES = {
  "api-node": ProjectStateSchema.parse({
    meta: { name: "Loja API", description: "backend de e-commerce", specDate: "2026-07-14" },
    domain: {
      projectType: "API REST",
      useCases: ["listar produtos", "criar pedido"],
      nonGoals: ["frontend"],
    },
    arch: { stack: "Node + TypeScript", style: "hexagonal" },
    quality: { testStrategy: "TDD", coverageTarget: 90, ci: true },
    security: { threatModel: "OWASP top 10", gates: ["sec-review", "deps-audit"] },
    features: [
      { name: "Catálogo", specSeed: "CRUD de produtos" },
      { name: "Pedidos", specSeed: "checkout", dependsOn: ["Catálogo"] },
    ],
  }),
  "python-cli": ProjectStateSchema.parse({
    meta: { name: "Faxina", description: "limpador de arquivos", specDate: "2026-07-14" },
    domain: { projectType: "CLI", useCases: ["escanear", "remover duplicados"], nonGoals: ["GUI"] },
    arch: { stack: "Python", style: "camadas" },
    quality: { testStrategy: "TDD", coverageTarget: 80, ci: true },
    security: { threatModel: "path traversal", gates: ["sec-review"] },
    features: [{ name: "Scanner", specSeed: "varrer diretório" }],
  }),
  "react-front": ProjectStateSchema.parse({
    meta: { name: "Painel", description: "dashboard", specDate: "2026-07-14" },
    domain: { projectType: "SPA", useCases: ["ver métricas"], nonGoals: ["mobile nativo"] },
    arch: { stack: "React + Vite", style: "componentes" },
    quality: { testStrategy: "TDD + testes de componente", coverageTarget: 75, ci: true },
    security: { threatModel: "XSS", gates: ["sec-review"] },
    features: [{ name: "Gráficos", specSeed: "renderizar séries" }],
  }),
  "sem-git": ProjectStateSchema.parse({
    meta: { name: "Rascunho", description: "protótipo", specDate: "2026-07-14", useGit: false },
    domain: { projectType: "script", useCases: ["experimentar"], nonGoals: [] },
    arch: { stack: "Node", style: "simples" },
    quality: { testStrategy: "manual", coverageTarget: 0, ci: false },
    security: { threatModel: "n/a", gates: [] },
    features: [],
  }),
} as const;
