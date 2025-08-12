// eslint.config.mjs
import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import a11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";
import globals from "globals";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  { ignores: ["node_modules", "build", "dist", "src/**/*.test.js", "src/setupTests.js"] },

  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      // évite les "window/fetch/console/process is not defined"
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": a11y,
      import: importPlugin,
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": { node: { extensions: [".js", ".jsx"] } },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...(react.configs.recommended?.rules ?? {}),
      ...(a11y.configs.recommended?.rules ?? {}),
      ...(importPlugin.configs.recommended?.rules ?? {}),

      // ✅ déclare explicitement les règles du plugin react-hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React 17+
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",

      "import/order": ["warn", { "newlines-between": "always", alphabetize: { order: "asc" } }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^(React|_)" }],
      "no-redeclare": ["error", { builtinGlobals: false }],
    },
  },

  // à laisser en dernier
  prettier,
];
