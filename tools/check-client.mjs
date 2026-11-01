/**
 * 浏览器半区的「能不能被 DSH 加载」检查：
 * 用假的 window.__ModuleLoader__ + 假的 require('react') 把 dist/client.js 跑一遍，
 * 再调 apply(fakeCtx)，确认它真的注册了 plugins.tab。
 *
 *   node tools/check-client.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const file = path.join(here, '..', 'dist', 'client.js')
const source = fs.readFileSync(file, 'utf8')

let captured = null
globalThis.window = {
  __ModuleLoader__: {
    load(entry) {
      captured = entry
    },
  },
}

// 极简 DOM 桩：只够 apply() 注入 <style>
const head = { children: [], appendChild(node) { this.children.push(node); return node } }
globalThis.document = {
  head,
  createElement(tag) {
    return { tag, textContent: '', dataset: {}, remove() {} }
  },
}

// 极简 React 桩：模块求值期只会用到 createElement 的引用，不会真的渲染。
const noop = () => undefined
const React = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, noop],
  useEffect: noop,
  useRef: (value) => ({ current: value }),
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  Fragment: 'Fragment',
}

function requireModule(specifier) {
  if (specifier === 'react') return React
  if (specifier === 'react-dom') return { createPortal: (node) => node, render: () => undefined }
  if (specifier === 'react/jsx-runtime') {
    return {
      jsx: React.createElement,
      jsxs: React.createElement,
      Fragment: 'Fragment',
    }
  }
  throw new Error(`意外的模块依赖：${specifier}`)
}

// 以 CommonJS 方式执行（文件末尾由 build banner/footer 包成 factory）
new Function('require', 'module', 'exports', source)(
  requireModule,
  { exports: {} },
  {},
)

if (captured === null) {
  console.error('✗ client.js 没有调用 window.__ModuleLoader__.load')
  process.exit(1)
}
if (captured.id !== 'dsh-plugin-updater') {
  console.error(`✗ 模块 id 不对：${captured.id}`)
  process.exit(1)
}

const exportsObject = captured.factory(requireModule)
for (const key of ['name', 'inject', 'apply', 'UpdatesTab']) {
  if (exportsObject[key] === undefined) {
    console.error(`✗ 缺少导出 ${key}`)
    process.exit(1)
  }
}
console.log('✓ 模块导出齐全：', Object.keys(exportsObject).join(', '))

const registered = []
const injected = []
const fakeCtx = {
  effect(fn) {
    const dispose = fn()
    return () => { if (typeof dispose === 'function') dispose() }
  },
  slots: {
    inject(name, callback) {
      injected.push(name)
      return callback()
    },
    register(options, component) {
      registered.push({ options, component })
      return () => {}
    },
  },
}

exportsObject.apply(fakeCtx)
console.log('✓ slots.inject:', injected.join(', '))
for (const entry of registered) {
  console.log(`✓ slots.register: ${entry.options.name} id=${entry.options.id} label=${entry.options.label?.()}`)
}
if (registered.length !== 1 || injected[0] !== 'plugins.tab') {
  console.error('✗ 没有注册 plugins.tab')
  process.exit(1)
}
const size = fs.statSync(file).size
console.log(`✓ dist/client.js ${(size / 1024).toFixed(1)} KB`)
