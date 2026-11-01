import { build } from 'esbuild'

await build({
  entryPoints: ['src/client.jsx'],
  outfile: 'dist/client.js',
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: ['chrome120', 'edge120'],
  external: ['react', 'react-dom'],
  loader: { '.css': 'text' },
  charset: 'utf8',
  banner: {
    js: 'window.__ModuleLoader__.load({id:"dsh-plugin-updater",factory:require=>{const module={exports:{}};',
  },
  footer: {
    js: 'return module.exports;}});',
  },
})
