import { build } from 'esbuild'
import fs from 'node:fs'

// 模块 id 必须等于包名（dsh-client-modules 的契约）。从 package.json 取，
// 以后改名（比如发布成 @scope/…）只用改一处。
const manifest = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const id = JSON.stringify(manifest.name)

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
    js: `window.__ModuleLoader__.load({id:${id},factory:require=>{const module={exports:{}};`,
  },
  footer: {
    js: 'return module.exports;}});',
  },
})
