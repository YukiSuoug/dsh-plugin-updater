/**
 * 宿主半区的离线烟测：假的 cordis ctx + 假的 pluginManager，
 * 直接调用 /state 路由，确认版本解析、分组、排序都对。
 *
 *   node tools/smoke.mjs
 */
import { apply } from '../index.js'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// 造一个假 profile：放一份 pnpm-lock.yaml，用来验证 git 源的提交比对。
const fakeProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-updater-profile-'))

// 假的 node_modules：验证「打开地址」能不能解析出真实目录与仓库地址
function fakePackage(name, manifest) {
  const dir = path.join(fakeProfile, 'node_modules', ...name.split('/'))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(manifest, null, 2), 'utf8')
  return dir
}
fakePackage('dsh-better-sidebar', {
  name: 'dsh-better-sidebar',
  version: '0.19.1',
  repository: { type: 'git', url: 'git+https://github.com/omdsh-dev/DSH-better-sidebar.git' },
})
fakePackage('dsh-whale-widget', { name: 'dsh-whale-widget', version: '0.3.0' })
fakePackage('dsh-rewind-plugin', {
  name: 'dsh-rewind-plugin',
  version: '0.18.1',
  repository: 'github:omdsh-dev/DSH-better-sidebar',
})
const localCheckout = fakePackage('dsh-moss-layout', { name: 'dsh-moss-layout', version: '0.12.2' })
// 假的「运行中的 DSH」：installAnchor 指向 app-boot 的 package.json（官方就是读它的 version）
const anchorDir = path.join(fakeProfile, 'app', 'node_modules', '@deepseek-ai')
const appBootDir = path.join(anchorDir, 'dsh-app-boot')
fs.mkdirSync(appBootDir, { recursive: true })
fs.writeFileSync(path.join(appBootDir, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh-app-boot', version: '0.2.1-rc.5' }), 'utf8')
const installAnchor = path.join(anchorDir, 'dsh', 'package.json')
fs.mkdirSync(path.dirname(installAnchor), { recursive: true })
fs.writeFileSync(installAnchor, JSON.stringify({ name: '@deepseek-ai/dsh', version: '0.2.1-rc.5' }), 'utf8')

fs.writeFileSync(path.join(fakeProfile, 'pnpm-lock.yaml'), `lockfileVersion: '9.0'

importers:
  .:
    dependencies:
      dsh-rewind-plugin:
        specifier: github:omdsh-dev/DSH-better-sidebar
        version: https://codeload.github.com/omdsh-dev/DSH-better-sidebar/tar.gz/2d736f5496fe97f4bba6af37d99861649b9ef3c0

packages:

  dsh-rewind-plugin@git+https://github.com/omdsh-dev/DSH-better-sidebar.git#2d736f5496fe97f4bba6af37d99861649b9ef3c0:
    resolution: {commit: 2d736f5496fe97f4bba6af37d99861649b9ef3c0, repo: https://github.com/omdsh-dev/DSH-better-sidebar.git, type: git}

  dsh-git-stale@git+https://github.com/omdsh-dev/DSH-better-sidebar.git#0000000000000000000000000000000000000000:
    resolution: {commit: 0000000000000000000000000000000000000000, repo: https://github.com/omdsh-dev/DSH-better-sidebar.git, type: git}
`, 'utf8')

const MOCK_BUNDLES = [
  { name: 'dsh-whale-widget', version: '0.3.0', source: 'dsh-whale-widget@^0.3.0', installed: true, enabled: true, removable: true, official: false, meta: { title: '余额鲸鱼' } },
  { name: 'dsh-better-sidebar', version: '0.19.1', source: 'dsh-better-sidebar@^0.19.1', installed: true, enabled: true, removable: true, official: false, meta: { title: { zh: '更好的侧栏', en: 'Better sidebar' } } },
  { name: 'dsh-moss-layout', version: '0.12.2', source: 'link:/opt/dsh-plugins/dsh-moss-layout', installed: true, enabled: true, removable: true, official: false, meta: {} },
  { name: 'dsh-rewind-plugin', version: '0.18.1', source: 'github:omdsh-dev/DSH-better-sidebar', installed: true, enabled: false, removable: true, official: false },
  { name: 'dsh-git-stale', version: '1.0.0', source: 'git+https://github.com/omdsh-dev/DSH-better-sidebar.git#0000000000000000000000000000000000000000', installed: true, enabled: true, removable: true, official: false, meta: { title: '过期 Git 快照' } },
  { name: '@deepseek-ai/dsh-base', version: '0.2.1-rc.5', installed: true, enabled: true, removable: false, official: true },
  { name: 'not-installed-thing', version: '1.0.0', source: 'not-installed-thing@^1.0.0', installed: false, enabled: false, removable: false, official: false },
]

function mockManager() {
  return {
    profile: { dir: fakeProfile, installAnchor },
    async registries() {
      return { registry: null, fallbackRegistries: [], resolved: 'https://registry.npmmirror.com' }
    },
    async listBundles() {
      return MOCK_BUNDLES
    },
    async removeBundle() { return { application: 'applied' } },
    async installBundle() { return { application: 'applied', packageResult: { exitCode: 0, output: 'mock' } } },
    async cancelInstall() { return { status: 'not-running' } },
  }
}

const routes = []
const fakeManager = mockManager()

const ctx = {
  get(name) {
    if (name === 'pluginManager') return fakeManager
    return undefined
  },
  inject(names, callback) {
    callback(ctx)
  },
  effect(fn) {
    const dispose = fn()
    return () => { if (typeof dispose === 'function') dispose() }
  },
  webServer: {
    register(route) {
      routes.push(route)
      return () => {}
    },
  },
}

apply(ctx)
console.log('routes registered:', routes.map((route) => `${route.kind} ${route.path}`).join(', '))

function fakeRequest(method, url, body) {
  const listeners = {}
  return {
    method,
    url,
    headers: { host: '127.0.0.1:1', 'sec-fetch-site': 'same-origin' },
    on(event, handler) {
      listeners[event] = handler
      return this
    },
    destroy() {},
    start() {
      if (body !== undefined) listeners.data?.(Buffer.from(JSON.stringify(body)))
      listeners.end?.()
    },
  }
}

function run(method, url, body) {
  return new Promise((resolve, reject) => {
    let status = 0
    const chunks = []
    const response = {
      writeHead(code) { status = code },
      end(payload) { resolve({ status, body: payload === undefined ? null : JSON.parse(payload) }) },
      writeHeadError(error) { reject(error) },
    }
    const request = fakeRequest(method, url, body)
    routes[0].handler(request, response).catch(reject)
    request.start()
  })
}

const started = Date.now()
const state = await run('GET', '/dsh-plugin-updater/api/state?refresh=1')
console.log(`\n/state ${state.status} in ${Date.now() - started}ms`)
if (state.body.ok !== true) {
  console.log(JSON.stringify(state.body, null, 2))
  process.exit(1)
}
console.log('registries:', state.body.registries.join(', '))
console.log('counts:', JSON.stringify(state.body.counts))
for (const row of state.body.rows) {
  const open = row.open === null ? '—' : `${row.open.kind}:${row.open.target}`;
  console.log(
    `  ${String(row.status).padEnd(8)} ${(row.enabled ? 'on ' : 'off')} ${row.name.padEnd(30)} ${String(row.version).padEnd(12)} -> ${String(row.latest).padEnd(12)} [${row.kind}] ${row.note}`,
  );
  const compat = row.compat === null || row.compat === undefined
    ? '—'
    : row.compat.ok === true
      ? '兼容'
      : `不兼容(${Object.entries(row.compat.requirements).map(([k, v]) => `${k} ${v}`).join(', ')})`;
  console.log(`           open => ${open}    compat => ${compat}`);
}
console.log('runtime:', state.body.runtime, '| incompatible:', state.body.counts.incompatible);
console.log('group counts:', JSON.stringify({ enabled: state.body.counts.enabled, disabled: state.body.counts.disabled }));
console.log('source options:', state.body.sources.options.map((option) => `${option.label} <${option.url}>`).join(' | '));
console.log('local checkout dir:', localCheckout);

// —— 指定安装源：只看 npm 官方源 ——
const pinned = await run('GET', '/dsh-plugin-updater/api/state?refresh=1&registry=' + encodeURIComponent('https://registry.npmjs.org'));
console.log(
  `\n/state(官方源) ${pinned.status} selected=${pinned.body.sources.selected} asked=${pinned.body.sources.asked[0]}`,
);
for (const row of pinned.body.rows.filter((item) => item.kind === 'registry')) {
  console.log(`  ${row.name.padEnd(30)} ${row.version} -> ${row.latest} @ ${row.registry}`);
}

// 非法地址必须被拒
const bad = await run('GET', '/dsh-plugin-updater/api/state?registry=' + encodeURIComponent('ftp://x.example'));
console.log(`/state(非法源) ${bad.status}`, JSON.stringify(bad.body.error));

// /open 不存在的插件应当 404（不会真的去打开东西）
const missingOpen = await run('POST', '/dsh-plugin-updater/api/open', { name: 'nope-nope' });
console.log(`/open(nope) ${missingOpen.status}`, JSON.stringify(missingOpen.body));

// —— 更新任务：remove → install → done ——
const update = await run('POST', '/dsh-plugin-updater/api/update', { name: 'dsh-whale-widget' })
console.log(`\n/update ${update.status}`, JSON.stringify(update.body.job ? { id: update.body.job.id, stage: update.body.job.stage } : update.body))
let job = update.body.job
for (let attempt = 0; attempt < 30 && job !== undefined && job.state === 'running'; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const polled = await run('GET', `/dsh-plugin-updater/api/job?id=${encodeURIComponent(job.id)}`)
  job = polled.body.job
}
console.log('job final:', JSON.stringify({ state: job?.state, message: job?.message, stage: job?.stage }, null, 0))

// 不可卸载的插件必须被拒
const refused = await run('POST', '/dsh-plugin-updater/api/update', { name: '@deepseek-ai/dsh-base' })
console.log(`/update(shipped) ${refused.status}`, JSON.stringify(refused.body))
