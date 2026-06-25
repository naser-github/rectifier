/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies make source boundaries hard to reason about.",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "no-engine-to-react",
      severity: "error",
      comment: "Pure engine code must not import React.",
      from: {
        path: "^src/engine/",
      },
      to: {
        dependencyTypes: ["npm", "npm-dev"],
        path: "^react",
      },
    },
    {
      name: "no-engine-to-codemirror",
      severity: "error",
      comment: "Pure engine code must not import CodeMirror.",
      from: {
        path: "^src/engine/",
      },
      to: {
        dependencyTypes: ["npm", "npm-dev"],
        path: "^@codemirror/",
      },
    },
    {
      name: "no-engine-to-ui-browser-worker",
      severity: "error",
      comment:
        "Pure engine code must not import UI, browser coordination, state, or worker adapter files.",
      from: {
        path: "^src/engine/",
      },
      to: {
        path: "^src/(app|components|hooks|state|worker)/",
      },
    },
    {
      name: "no-domain-to-ui-or-browser",
      severity: "error",
      comment: "Domain contracts must stay serializable and browser-independent.",
      from: {
        path: "^src/domain/",
      },
      to: {
        path: "^(src/(app|components|hooks|state|worker)/|react|@codemirror/)",
      },
    },
    {
      name: "no-domain-to-runtime-implementation",
      severity: "error",
      comment:
        "Domain contracts must not import engine, worker, component, hook, state, or app implementations.",
      from: {
        path: "^src/domain/",
      },
      to: {
        path: "^src/(app|components|engine|hooks|state|worker)/",
      },
    },
    {
      name: "no-broad-barrel-files",
      severity: "error",
      comment: "Broad barrel files hide source ownership and dependency direction.",
      from: {},
      to: {
        path: "^src/.*/index\\.ts$",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    exclude: {
      path: "^(dist|coverage|playwright-report|test-results|doc/execution-reports)/",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
  },
};
