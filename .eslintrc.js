/** @type {import("eslint").Linter.Config} */
module.exports = {
  parser: "@typescript-eslint/parser",
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },
  ],
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:prettier/recommended",
  ],
  root: true,
  env: { node: true },
  ignorePatterns: [".eslintrc.js", "webpack.config.js"],
  rules: {
    "no-trailing-spaces": "error",
    quotes: ["error", "double"],
    semi: ["error", "never"],
    "arrow-spacing": "error",
    "no-var": "error",
    "prefer-const": "error",
    "no-console": "error",
  },
}
