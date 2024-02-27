/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPoints: ['./src/index.ts'],
  out: 'docs/api',
  excludePrivate: true,
  excludeExternals: true,
  excludeProtected: true,
  theme: 'markdown',
  readme: 'none',
  plugin: ['typedoc-plugin-markdown'],
  githubPages: false,
};
