import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "playwright-report", "test-results"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
    },
  },
  {
    // Design-system adherence (from the PCDS handoff): app code composes PCDS
    // components instead of raw form controls. The ported components are exempt.
    files: ["src/**/*.tsx"],
    ignores: ["src/pcds/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='button']",
          message: "Use <Button> from src/pcds instead of <button>.",
        },
        { selector: "JSXOpeningElement[name.name='input']", message: "Use <Input> from src/pcds instead of <input>." },
        {
          selector: "JSXOpeningElement[name.name='select']",
          message: "Use <Select> from src/pcds instead of <select>.",
        },
      ],
    },
  },
);
