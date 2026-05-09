export const INVENTORY_ARTIFACT_PATH =
  "inventory/react-19.2.6-runtime-package-inventory.json";

export const GENERATED_RUNTIME_TARGETS = [
  {
    packageName: "react",
    version: "19.2.6",
    role: "official-react-runtime-target"
  },
  {
    packageName: "react-dom",
    version: "19.2.6",
    role: "official-react-dom-runtime-target"
  }
];

export const GENERATED_SUPPORTING_RUNTIME_PACKAGES = [
  {
    packageName: "scheduler",
    version: "0.27.0",
    role: "react-dom-runtime-dependency-needed-for-artifact-probes",
    targetStatus: "supporting-package-not-official-react-target"
  }
];

export const MANUAL_INVENTORY_FIELDS = [
  {
    id: "type-declaration-surfaces",
    status: "manual-targets-only",
    packages: ["@types/react@19.2.14", "@types/react-dom@19.2.3"],
    reason:
      "Worker 017 generates runtime/package inventory only. Type declaration parsing requires a later TypeScript compiler API inventory and a project decision on @types/react-dom."
  },
  {
    id: "fast-react-behavior-compatibility",
    status: "explicitly-false",
    packages: ["@fast-react/react"],
    reason:
      "Inventory data proves React package facts only. Fast React behavior compatibility requires the future dual-run oracle harness."
  }
];

export const RUNTIME_PROBE_MODES = [
  {
    id: "default-node-development",
    nodeArgs: [],
    nodeEnv: "development",
    executesPackageCode: true,
    reason:
      "Default Node package resolution and development runtime export keys are the baseline package surface."
  },
  {
    id: "default-node-production",
    nodeArgs: [],
    nodeEnv: "production",
    executesPackageCode: true,
    reason:
      "Production runtime export keys are captured separately from development diagnostics."
  },
  {
    id: "react-server-development",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "development",
    executesPackageCode: true,
    reason:
      "The react-server condition exposes materially different React and React DOM development surfaces."
  },
  {
    id: "react-server-production",
    nodeArgs: ["--conditions=react-server"],
    nodeEnv: "production",
    executesPackageCode: true,
    reason:
      "Production react-server surfaces are captured separately from development diagnostics."
  }
];

export const CONDITION_RESOLUTION_MODES = [
  {
    id: "default-node",
    nodeArgs: [],
    reason: "Baseline Node condition set."
  },
  {
    id: "react-server",
    nodeArgs: ["--conditions=react-server"],
    reason: "React Server Components condition branch."
  },
  {
    id: "browser",
    nodeArgs: ["--conditions=browser"],
    reason:
      "Custom browser condition as resolved by Node; built-in node conditions may still win depending on export-map order."
  },
  {
    id: "worker",
    nodeArgs: ["--conditions=worker"],
    reason:
      "Custom worker condition as resolved by Node; captured as resolver evidence only."
  },
  {
    id: "edge-light",
    nodeArgs: ["--conditions=edge-light"],
    reason:
      "Custom edge-light condition as resolved by Node; captured as resolver evidence only."
  },
  {
    id: "workerd",
    nodeArgs: ["--conditions=workerd"],
    reason:
      "Custom workerd condition as resolved by Node; captured as resolver evidence only."
  },
  {
    id: "bun",
    nodeArgs: ["--conditions=bun"],
    reason:
      "Custom bun condition as resolved by Node; captured as resolver evidence only."
  },
  {
    id: "deno",
    nodeArgs: ["--conditions=deno"],
    reason:
      "Custom deno condition as resolved by Node; captured as resolver evidence only."
  }
];

export const SOURCE_DOCUMENTS = [
  "WORKER_BRIEF.md",
  "MASTER_PLAN.md",
  "MASTER_PROGRESS.md",
  "worker-progress/worker-002-conformance.md",
  "worker-progress/worker-004-api-inventory.md",
  "worker-progress/worker-013-conformance-inventory-tooling.md",
  "worker-progress/worker-014-react-entrypoint-placeholders.md"
];
