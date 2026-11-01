/**
 * dsh-plugin-updater —— 宿主半区。
 *
 * 职责只有两件事：
 *   1. 查出「已安装插件的当前版本」与「注册表 / git 上的最新版本」，供插件页的
 *      「更新」标签页展示；
 *   2. 把一次更新编排成「先卸载 → 再装新版」，复用官方 `pluginManager` 服务
 *      （@deepseek-ai/dsh-plugin-manager），也就是「添加插件」对话框背后那套
 *      pnpm 管线：同样的源顺序、源回退、构建脚本审批、文件回滚。
 *
 * 为什么不直接用 `installBundle` 覆盖已安装的包：
 * 该服务在 HMR（桌面端 profile 的 patchReload: live）存在时，对已是依赖的包
 * 直接抛 `already-installed`。官方的显式更新同样是「先 remove 再 install」，
 * 这里保持一致，并在确认框里把「装失败会处于未安装状态」讲清楚。
 *
 * 浏览器半区在 dist/client.js，两者只通过本文件的 HTTP 路由通信，不依赖
 * typert 远程契约，因此 DSH 小版本升级不会把它打断。
 */

import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** 插件名，与 package.json / cordis.patch.yml 保持一致。 */
export const name = 'dsh-plugin-updater'

/** 浏览器半区要用的宿主服务。 */
export const inject = ['webServer']

const ROUTE = '/dsh-plugin-updater/api'
const OFFICIAL_REGISTRY = 'https://registry.npmjs.org'
const MIRROR_REGISTRY = 'https://registry.npmmirror.com'
const CACHE_TTL = 5 * 60 * 1000
const REQUEST_TIMEOUT = 8000
const GIT_TIMEOUT = 8000
const MAX_BODY = 1 << 20

function dshHome() {
  return process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
}

function cacheFile() {
  return path.join(dshHome(), 'dsh-plugin-updater', 'cache.json')
}

// ---------------------------------------------------------------------------
// SemVer（只做比较，不引入依赖）
// ---------------------------------------------------------------------------

const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/

/** 解析成可比较的结构；不是 SemVer 时返回 null。 */
function parseVersion(input) {
  const match = SEMVER.exec(String(input == null ? '' : input).trim())
  if (!match) return null
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    pre: match[4] === undefined ? [] : match[4].split('.'),
  }
}

/** 预发布标识段的比较：数字段按数值，其余按字典序，短者优先（1.0.0-a < 1.0.0-a.1）。 */
function comparePre(a, b) {
  if (a.length === 0 && b.length === 0) return 0
  if (a.length === 0) return 1
  if (b.length === 0) return -1
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    const left = a[index]
    const right = b[index]
    if (left === undefined) return -1
    if (right === undefined) return 1
    const leftNumeric = /^\d+$/.test(left)
    const rightNumeric = /^\d+$/.test(right)
    if (leftNumeric && rightNumeric) {
      const diff = Number(left) - Number(right)
      if (diff !== 0) return diff < 0 ? -1 : 1
      continue
    }
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1
    if (left !== right) return left < right ? -1 : 1
  }
  return 0
}

/** 语义化比较：a > b 返回 1，a < b 返回 -1，相等返回 0，任一侧不可解析返回 null。 */
function compareVersions(a, b) {
  const left = parseVersion(a)
  const right = parseVersion(b)
  if (!left || !right) return null
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] > right[key] ? 1 : -1
  }
  return comparePre(left.pre, right.pre)
}

/** 是否预发布版本（含 beta / rc 之类）。 */
function isPrerelease(version) {
  const parsed = parseVersion(version)
  return parsed !== null && parsed.pre.length > 0
}

// ---------------------------------------------------------------------------
// 版本范围匹配（只为 DSH 兼容性判定服务）
//
// 官方用的是 `semver.satisfies(v, range, { includePrerelease: true })`。
// includePrerelease 让「预发布能不能匹配普通范围」这条最麻烦的规则消失了，
// 剩下的就是分段比较，所以这里不引 semver 依赖，自己算。
// ---------------------------------------------------------------------------

/** 解析 `1.2.3` / `1.2` / `1` / `1.x` 这类片段；不可解析返回 null。 */
function parsePartial(text) {
  const match = /^v?(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-([0-9A-Za-z.-]+))?$/.exec(String(text).trim())
  if (match === null) return null
  const num = (value) => (value === undefined || value === 'x' || value === 'X' || value === '*' ? null : Number(value))
  return {
    major: num(match[1]),
    minor: num(match[2]),
    patch: num(match[3]),
    pre: match[4] === undefined ? [] : match[4].split('.'),
  }
}

/** 把片段补成完整版本（缺的位当 0）。 */
function fillVersion(partial, prerelease) {
  return {
    major: partial.major ?? 0,
    minor: partial.minor ?? 0,
    patch: partial.patch ?? 0,
    pre: prerelease ? ['0'] : (partial.pre || []),
  }
}

function compareParsed(a, b) {
  for (const key of ['major', 'minor', 'patch']) {
    if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1
  }
  return comparePre(a.pre, b.pre)
}

/** 单个比较符：`^` `~` `>=` `<=` `>` `<` `=` 或裸版本。 */
function matchesComparator(version, token) {
  const match = /^(\^|~|>=|<=|>|<|=)?\s*(.+)$/.exec(token)
  if (match === null) return false
  const operator = match[1] || '='
  const partial = parsePartial(match[2])
  if (partial === null) return false
  const lower = fillVersion(partial, false)

  if (operator === '=') {
    if (partial.major === null) return true
    if (partial.minor === null) {
      return version.major === partial.major
    }
    if (partial.patch === null) {
      return version.major === partial.major && version.minor === partial.minor
    }
    return compareParsed(version, lower) === 0
  }
  if (operator === '>=') return compareParsed(version, lower) >= 0
  if (operator === '>') return compareParsed(version, lower) > 0
  if (operator === '<=') return compareParsed(version, lower) <= 0
  if (operator === '<') return compareParsed(version, lower) < 0

  // ^ 与 ~：先满足下界，再卡上界。上界用 `-0` 表示「不含该版本的预发布」。
  if (compareParsed(version, lower) < 0) return false
  if (operator === '^') {
    if (partial.major === null) return true
    let upper
    if (partial.major > 0) upper = { major: partial.major + 1, minor: 0, patch: 0, pre: ['0'] }
    else if (partial.minor === null) upper = { major: 1, minor: 0, patch: 0, pre: ['0'] }
    else if (partial.minor > 0) upper = { major: 0, minor: partial.minor + 1, patch: 0, pre: ['0'] }
    else if (partial.patch === null) upper = { major: 0, minor: 1, patch: 0, pre: ['0'] }
    else upper = { major: 0, minor: 0, patch: partial.patch + 1, pre: ['0'] }
    return compareParsed(version, upper) < 0
  }
  // ~
  if (partial.major === null) return true
  const upper = partial.minor === null
    ? { major: partial.major + 1, minor: 0, patch: 0, pre: ['0'] }
    : { major: partial.major, minor: partial.minor + 1, patch: 0, pre: ['0'] }
  return compareParsed(version, upper) < 0
}

/** 范围匹配：支持 `||`、空格 AND、通配符，等价于 semver.satisfies(..., { includePrerelease: true })。 */
export function satisfiesVersion(version, range) {
  const parsed = parseVersion(version)
  const text = String(range == null ? '' : range).trim()
  if (parsed === null || text === '') return false
  return text.split('||').some((chunk) => {
    const tokens = chunk.trim().split(/\s+/).filter((token) => token !== '')
    if (tokens.length === 0) return false
    return tokens.every((token) => matchesComparator(parsed, token))
  })
}

// ---------------------------------------------------------------------------
// DSH 版本兼容性：与官方 evaluatePluginCompatibility 同一套规则
//   · 有 engines.dsh → 只看它
//   · 否则看 peerDependencies 里所有 @deepseek-ai/dsh / @deepseek-ai/dsh-* 
// ---------------------------------------------------------------------------

/** 运行中的 DSH 版本：官方取的是 @deepseek-ai/dsh-app-boot 的 version，各包版本同步。 */
function readRuntimeVersion(service) {
  const candidates = []
  try {
    const anchor = service?.profile?.installAnchor
    if (typeof anchor === 'string' && anchor !== '') {
      candidates.push(anchor)
      candidates.push(path.join(path.dirname(anchor), 'dsh-app-boot', 'package.json'))
    }
  } catch {
    // profileContext 不可读就试别的
  }
  for (const file of candidates) {
    try {
      const version = JSON.parse(fs.readFileSync(file, 'utf8')).version
      if (typeof version === 'string' && /^\d+\.\d+/.test(version)) return version
    } catch {
      // 换下一个候选
    }
  }
  return ''
}

/**
 * 判断「目标版本」能不能跑在当前 DSH 上。
 * @returns {{ok: true}|{ok: false, requirements: Record<string,string>}|null} null 表示无法判断
 */
export function evaluateCompat(manifest, runtimeVersion) {
  if (runtimeVersion === '' || manifest === null || typeof manifest !== 'object') return null
  const engines = manifest.engines !== null && typeof manifest.engines === 'object' ? manifest.engines : {}
  if (typeof engines.dsh === 'string') {
    return satisfiesVersion(runtimeVersion, engines.dsh)
      ? { ok: true }
      : { ok: false, requirements: { 'engines.dsh': engines.dsh } }
  }
  const peers = manifest.peerDependencies !== null && typeof manifest.peerDependencies === 'object'
    ? manifest.peerDependencies
    : {}
  const requirements = {}
  for (const [name, range] of Object.entries(peers)) {
    if (typeof range !== 'string') continue
    if (name !== '@deepseek-ai/dsh' && !name.startsWith('@deepseek-ai/dsh-')) continue
    const effective = range.startsWith('workspace:') ? runtimeVersion : range
    if (!satisfiesVersion(runtimeVersion, effective)) requirements[name] = range
  }
  return Object.keys(requirements).length === 0 ? { ok: true } : { ok: false, requirements }
}

// ---------------------------------------------------------------------------
// spec 解析：把 listBundles 给的 source 归类
// ---------------------------------------------------------------------------

const GIT_PREFIX = /^(?:git\+|git:)/i
const GIT_HOST_SHORTHAND = /^(?:github:|gitlab:|bitbucket:)/
const TARBALL = /^https?:\/\/[^\s]+\.(?:tgz|tar\.gz|tar)(?:[?#].*)?$/i

/**
 * 把 `pnpm add` 接受的 spec 拆成 {kind, name, range, url}。
 * @param source listBundles 给出的 source（本地路径已由宿主转成绝对路径）。
 * @param fallbackName 没有 source 时用来兜底的名字。
 */
export function parseSource(source, fallbackName) {
  const raw = typeof source === 'string' ? source.trim() : ''
  if (raw === '') return { kind: 'shipped', name: fallbackName }
  if (/^(?:link|file):/i.test(raw)) {
    return { kind: 'local', name: fallbackName, path: raw.replace(/^(?:link|file):/i, '') }
  }
  if (path.isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw) || /^\.{1,2}[\\/]/.test(raw)) {
    return { kind: 'local', name: fallbackName, path: raw }
  }
  if (TARBALL.test(raw)) return { kind: 'tarball', name: fallbackName, url: raw }
  if (GIT_PREFIX.test(raw) || GIT_HOST_SHORTHAND.test(raw) || /\.git(?:#.*)?$/i.test(raw)) {
    return { kind: 'git', name: fallbackName, url: raw }
  }
  if (/^[^\s@/]+\/[^\s@/]+(?:#.*)?$/.test(raw)) {
    // pnpm 也接受 `owner/repo` 这种 GitHub 简写
    return { kind: 'git', name: fallbackName, url: `https://github.com/${raw}` }
  }
  if (/^https?:\/\//i.test(raw)) return { kind: 'tarball', name: fallbackName, url: raw }
  const alias = /^((?:@[^/@]+\/)?[^@]+)@npm:(.+)$/.exec(raw)
  if (alias !== null) return { kind: 'alias', name: alias[1], range: alias[2] }
  // 包名形态校验：万一宿主给的只有版本范围（`^1.2.3`），用已知包名兜底
  const packageLike = (value) => /^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i.test(value)
  const at = raw.lastIndexOf('@')
  if (at > 0) {
    const spec = raw.slice(0, at)
    if (packageLike(spec)) return { kind: 'registry', name: spec, range: raw.slice(at + 1) }
  }
  if (packageLike(raw)) return { kind: 'registry', name: raw, range: '' }
  return { kind: 'registry', name: fallbackName, range: raw }
}

/** 去掉 git spec 的前缀与片段，得到可以 `git ls-remote` 的地址。 */
function gitRemoteUrl(spec) {
  let url = String(spec || '').replace(GIT_PREFIX, '').replace(GIT_HOST_SHORTHAND, '')
  url = url.split('#')[0]
  if (/^(?:github|gitlab|bitbucket):/i.test(String(spec || ''))) {
    return `https://github.com/${url}`
  }
  return url
}

// ---------------------------------------------------------------------------
// 注册表查询
// ---------------------------------------------------------------------------

/** 按顺序问注册表；第一个给出该包的就赢。 */
async function fetchManifest(registry, packageName, signal) {
  const url = `${registry.replace(/\/+$/, '')}/${packageName.replace('/', '%2F')}`
  const response = await fetch(url, {
    signal,
    headers: {
      accept: 'application/vnd.npm.install-v1+json, application/json',
      'user-agent': 'dsh-plugin-updater',
    },
  })
  if (response.status === 404) return { missing: true }
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const body = await response.json()
  if (body === null || typeof body !== 'object' || body.versions === undefined) {
    return { missing: true }
  }
  return { manifest: body }
}

/**
 * 选出应当更新的目标版本。
 * `dist-tags.latest` 优先；若 latest 不比当前新（预发布通道常见的滞后），
 * 退回到「比当前版本更高的最大版本」。
 */
function pickTarget(manifest, currentVersion) {
  const tags = manifest['dist-tags'] || {}
  const versions = Object.keys(manifest.versions || {})
  const latest = typeof tags.latest === 'string' ? tags.latest : ''
  if (latest !== '' && compareVersions(latest, currentVersion) === 1) {
    return { version: latest, channel: 'latest' }
  }
  if (latest === '') {
    const highest = versions.reduce((best, version) => {
      if (compareVersions(version, currentVersion) !== 1) return best
      if (best === '') return version
      return compareVersions(version, best) === 1 ? version : best
    }, '')
    if (highest !== '') return { version: highest, channel: 'highest' }
    return null
  }
  return null
}

/**
 * 查一个包的最新版本。
 * @returns {{version: string, channel: string, registry: string}|{error: string}}
 */
async function resolveLatest(packageName, currentVersion, registries) {
  const problems = []
  for (const registry of registries) {
    try {
      const answer = await fetchManifest(registry, packageName, AbortSignal.timeout(REQUEST_TIMEOUT))
      if (answer.missing === true) {
        problems.push(`${registry} 没有这个包`)
        continue
      }
      const target = pickTarget(answer.manifest, currentVersion)
      if (target === null) return { version: '', channel: 'latest', registry }
      return {
        ...target,
        registry,
        entry: answer.manifest.versions[target.version] || null,
      }
    } catch (error) {
      const reason = error?.name === 'TimeoutError' || error?.name === 'AbortError'
        ? '超时'
        : String(error?.message || error)
      problems.push(`${registry} ${reason}`)
    }
  }
  return { error: problems.join('；') || '没有可用的注册表' }
}

/** 注册表清单：宿主配置的（含 pnpm 实际指向的那个）在前，公共源兜底。 */
async function registryOrder(manager) {
  const ordered = []
  try {
    const configured = await manager.registries()
    for (const url of [configured?.registry, configured?.resolved, ...(configured?.fallbackRegistries || [])]) {
      if (typeof url === 'string' && url.trim() !== '') ordered.push(url.trim().replace(/\/+$/, ''))
    }
  } catch {
    // 拿不到配置就用公共源
  }
  for (const url of [OFFICIAL_REGISTRY, MIRROR_REGISTRY]) {
    if (!ordered.includes(url)) ordered.push(url)
  }
  return [...new Set(ordered)]
}

/** 给注册表一个显示名：与官方安装对话框一致，公共源用中文名，其余显示主机名。 */
function registryLabel(url) {
  const clean = String(url || '').replace(/\/+$/, '')
  if (clean === OFFICIAL_REGISTRY) return 'npm 官方源'
  if (clean === MIRROR_REGISTRY) return '中国大陆镜像源'
  try {
    return new URL(clean).host
  } catch {
    return clean
  }
}

/** 校验用户填的自定义地址：只接受 http(s)，去掉尾部斜杠。 */
function validRegistry(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (raw === '') return ''
  if (!/^https?:\/\/[^\s]+$/i.test(raw)) return null
  return raw.replace(/\/+$/, '')
}

// ---------------------------------------------------------------------------
// git 源：比对锁定提交与远端 HEAD
// ---------------------------------------------------------------------------

function readLockCommit(profileDir, packageName) {
  if (!profileDir) return ''
  try {
    const lines = fs.readFileSync(path.join(profileDir, 'pnpm-lock.yaml'), 'utf8').split(/\r?\n/)
    const prefix = `  ${packageName}@`
    let inside = false
    for (const line of lines) {
      // packages 段的条目都是「恰好两空格 + key」，遇到下一个条目就离开当前块
      if (/^ {2}\S/.test(line)) {
        inside = line.startsWith(prefix)
        continue
      }
      if (!inside) continue
      const match = /commit:\s*'?([0-9a-f]{7,40})/.exec(line)
      if (match !== null) return match[1]
    }
    return ''
  } catch {
    return ''
  }
}

function lsRemoteHead(url) {
  return new Promise((resolve) => {
    try {
      execFile('git', ['ls-remote', url, 'HEAD'], { timeout: GIT_TIMEOUT, windowsHide: true }, (error, stdout) => {
        if (error) {
          resolve({ error: '无法访问仓库（git ls-remote 失败）' })
          return
        }
        const match = /^([0-9a-f]{7,40})\s/m.exec(String(stdout))
        resolve(match === null ? { error: '仓库没有 HEAD' } : { commit: match[1] })
      })
    } catch (error) {
      resolve({ error: String(error?.message || error) })
    }
  })
}

// ---------------------------------------------------------------------------
// 版本缓存（进程内 + $DSH_HOME 落盘，重开窗口也还是热的）
// ---------------------------------------------------------------------------

function readCache() {
  try {
    const parsed = JSON.parse(fs.readFileSync(cacheFile(), 'utf8'))
    if (parsed !== null && typeof parsed === 'object' && parsed.entries) return parsed
  } catch {
    // 没有缓存是正常起点
  }
  return { entries: {} }
}

function writeCache(cache) {
  try {
    const file = cacheFile()
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(cache), 'utf8')
  } catch {
    // 写不了缓存只影响下次的耗时
  }
}

function cacheKey(packageName, version) {
  return `${packageName}@${version}`
}

// ---------------------------------------------------------------------------
// 展示用的小工具
// ---------------------------------------------------------------------------

function pickText(value) {
  if (typeof value === 'string') return value
  if (value !== null && typeof value === 'object') {
    for (const key of ['zh', 'zh-CN', 'en']) {
      if (typeof value[key] === 'string' && value[key] !== '') return value[key]
    }
    const first = Object.values(value).find((item) => typeof item === 'string')
    if (typeof first === 'string') return first
  }
  return ''
}

function bundleTitle(bundle) {
  const fromMeta = pickText(bundle?.meta?.title)
  if (fromMeta !== '') return fromMeta
  return bundle?.name || ''
}

function bundleDescription(bundle) {
  const fromMeta = pickText(bundle?.meta?.description)
  if (fromMeta !== '') return fromMeta
  return typeof bundle?.description === 'string' ? bundle.description : ''
}

// ---------------------------------------------------------------------------
// 「打开地址」：本地装的给文件夹，远程装的给仓库
// ---------------------------------------------------------------------------

/** 把 package.json 里的 repository 字段洗成可打开的 http(s) 地址。 */
function normalizeRepoUrl(value) {
  let url = typeof value === 'string' ? value.trim() : ''
  if (url === '') return ''
  url = url.replace(/^git\+/, '')
  url = url.replace(/^git@([^:]+):/, 'https://$1/')
  url = url.replace(/^github:/, 'https://github.com/')
  url = url.replace(/^gitlab:/, 'https://gitlab.com/')
  url = url.replace(/^bitbucket:/, 'https://bitbucket.org/')
  url = url.replace(/^git:\/\//, 'https://')
  url = url.replace(/\.git(?:#.*)?$/, '')
  url = url.split('#')[0]
  if (!/^https?:\/\/[^\s]+$/i.test(url)) return ''
  return url
}

/** 读 profile 里已安装的包：目录（解掉软链）与 manifest。 */
function readInstalled(profileDir, packageName) {
  if (profileDir === '') return { dir: '', manifest: null }
  const entry = path.join(profileDir, 'node_modules', ...packageName.split('/'))
  let dir = ''
  try {
    dir = fs.realpathSync(entry)
  } catch {
    return { dir: '', manifest: null }
  }
  try {
    return { dir, manifest: JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) }
  } catch {
    return { dir, manifest: null }
  }
}

/**
 * 决定这一行「打开地址」该打开什么。
 * 本地装的（link/file）→ 真实目录；远程装的 → package.json 的仓库地址，没有就退回 npm 页面。
 */
function resolveOpenTarget(kind, name, source, installed) {
  if (kind === 'local') {
    // 优先真实目录（软链解开后的开发目录）；解不出就退回 source 里写的路径，
    // 至少让用户能打开「它以为的那个目录」，而不是整个按钮消失。
    if (installed.dir !== '') return { kind: 'folder', target: installed.dir }
    const declared = typeof source === 'string' ? source.replace(/^(?:link|file):/i, '') : ''
    if (declared !== '' && path.isAbsolute(declared)) return { kind: 'folder', target: declared }
    return null
  }
  if (kind === 'shipped') return null
  const manifest = installed.manifest || {}
  const repository = manifest.repository
  const repositoryUrl = normalizeRepoUrl(
    typeof repository === 'string' ? repository : repository?.url,
  )
  const homepage = normalizeRepoUrl(manifest.homepage)
  const bugs = normalizeRepoUrl(manifest.bugs?.url)
  const fromSource = kind === 'git' ? normalizeRepoUrl(source) : ''
  const url = repositoryUrl || fromSource || homepage || bugs
  if (url !== '') return { kind: 'url', target: url }
  if (kind === 'registry') {
    return { kind: 'url', target: `https://www.npmjs.com/package/${name}` }
  }
  return null
}

/**
 * 宿主代码指纹：用来判断「DSH 里跑着的还是不是磁盘上这份代码」。
 *
 * 不能只靠 package.json 的版本号——那个是**读磁盘**得到的，界面上改了版本号，
 * 进程里跑的可能还是启动时 import 进来的旧模块。所以取自身文件内容的哈希：
 * 只要 index.js 变了，这个值一定变，忘了手改也不会骗人。
 */
const HOST_REV = (() => {
  try {
    const self = fs.readFileSync(fileURLToPath(import.meta.url))
    return createHash('sha1').update(self).digest('hex').slice(0, 7)
  } catch {
    return 'unknown'
  }
})()

/**
 * 拿 Electron 的 shell（DSH 桌面端才有）。
 * `shell.openPath` 是应用打开本地目录的标准入口：主进程直接和系统交互，
 * 能处理前台窗口、提权、已有 shell 进程这些用 spawn 外部命令时会静默失败的场景。
 */
async function electronShell() {
  if (process.versions.electron === undefined) return null
  try {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const electron = require('electron')
    const shell = electron === null || electron === undefined ? null : electron.shell
    if (shell === null || shell === undefined) return null
    if (typeof shell.openPath !== 'function') return null
    return shell
  } catch {
    return null
  }
}

/**
 * 跑一个启动命令，只要不是「命令不存在」就认为交出去了。
 * @param hideConsole 只对 cmd.exe 这类**控制台**程序设为 true。explorer.exe / rundll32.exe
 *   是 GUI 子系统程序，没有控制台可隐藏；给它们带 `windowsHide` 会变成
 *   `STARTF_USESHOWWINDOW + SW_HIDE`，explorer 可能因此把窗口开成隐藏的 —— 表现就是「点了没反应」。
 */
function spawnOpener(command, args, hideConsole) {
  return new Promise((resolve) => {
    try {
      execFile(command, args, { windowsHide: hideConsole === true, timeout: 8000 }, (error) => {
        if (error === null) {
          resolve({ ok: true, via: command })
          return
        }
        // explorer.exe 正常交接也会返回 1，别把它当失败，否则会再开一个窗口
        if (error.code === 1 && /explorer/i.test(command)) {
          resolve({ ok: true, via: `${command}（退出码 1，正常）` })
          return
        }
        resolve({
          ok: false,
          code: error.code === undefined ? '' : String(error.code),
          message: `${command} 退出码 ${error.code === undefined ? '?' : error.code}`,
        })
      })
    } catch (error) {
      resolve({ ok: false, code: 'throw', message: String(error?.message || error) })
    }
  })
}

/**
 * 交给操作系统打开。只接受目录与 http(s) 地址。
 *
 * 优先级：Electron shell（桌面端） → ShellExecute 入口 → explorer.exe。
 * 裸 spawn 的分支只为「非 Electron 环境」和「Electron shell 不可用」兜底。
 *
 * @returns {{ok: true, via: string}|{ok: false, error: string}}
 */
export async function openExternal(target, kind) {
  const isUrl = kind === 'url'
  if (isUrl && !/^https?:\/\//i.test(target)) {
    return { ok: false, error: '只允许打开 http(s) 地址' }
  }
  if (!isUrl) {
    try {
      if (!fs.statSync(target).isDirectory()) return { ok: false, error: '目标不是目录' }
    } catch {
      return { ok: false, error: '目录不存在（插件可能已卸载）' }
    }
  }

  const failures = []
  const shell = await electronShell()
  if (shell !== null) {
    try {
      if (isUrl) {
        await shell.openExternal(target)
        return { ok: true, via: 'electron.shell.openExternal' }
      }
      // openPath 用空字符串表示成功，否则是被交给系统的错误说明
      const problem = await shell.openPath(target)
      if (problem === '' || problem === undefined || problem === null) {
        return { ok: true, via: 'electron.shell.openPath' }
      }
      failures.push(`electron.shell.openPath: ${String(problem)}`)
    } catch (error) {
      failures.push(`electron.shell.openPath: ${String(error?.message || error)}`)
    }
  }

  // 目录优先用 explorer.exe（原生方式）；网址优先用协议处理器。
  // 第三个字段：是否隐藏控制台窗口（只有 cmd.exe 需要）。
  const attempts = []
  if (process.platform === 'win32') {
    if (isUrl) {
      attempts.push(['rundll32.exe', ['url.dll,FileProtocolHandler', target], false])
      attempts.push(['cmd.exe', ['/c', 'start', '', target], true])
    } else {
      attempts.push(['explorer.exe', [target], false])
      attempts.push(['rundll32.exe', ['url.dll,FileProtocolHandler', target], false])
      attempts.push(['cmd.exe', ['/c', 'start', '', target], true])
    }
  } else if (process.platform === 'darwin') {
    attempts.push(['open', [target], false])
  } else {
    attempts.push(['xdg-open', [target], false])
  }

  for (const [command, args, hideConsole] of attempts) {
    const result = await spawnOpener(command, args, hideConsole)
    if (result.ok) return { ok: true, via: result.via }
    failures.push(result.message)
  }
  return { ok: false, error: `系统没有响应打开请求（${failures.join('；')}）` }
}

// ---------------------------------------------------------------------------
// 更新任务
// ---------------------------------------------------------------------------

const RESTART_TEXT = {
  'no-hmr': '当前 profile 没有开 HMR，重启 DSH 后生效',
  'package-moved': '包位置变了，重启 DSH 后生效',
  'host-module': '宿主模块有变化，重启 DSH 后生效',
  'unmanaged-plugin': '有未被管理的插件行，重启 DSH 后生效',
  'module-comparison': '模块与之前不同，重启 DSH 后生效',
}

const ERROR_TEXT = {
  'management-required': '当前 profile 不允许管理插件',
  unaddressable: '这个插件无法按包名定位',
  'unknown-plugin': '找不到这个插件',
  'invalid-spec': '安装 spec 无效',
  'already-installed': '该包已被占用，卸载不彻底',
  'ambiguous-install': '同名包有歧义',
  'not-bundle': '新版本不再声明插件组合包',
  'not-removable': '这个插件不可卸载（随 DSH 提供）',
  'stop-profile': '需要先停掉正在运行的 DSH 才能替换',
  'bundle-in-use': '插件仍在运行中，无法替换',
  'stale-approval': '构建脚本审批已过期，请重试',
  'operation-error': '操作失败',
}

function describeFailure(result) {
  const error = result?.error
  if (error === undefined) {
    if (result?.packageResult?.kind === 'build-blocked') {
      return 'pnpm 拦下了依赖的构建脚本：在 profile 的 pnpm-workspace.yaml 里允许后重试'
    }
    return '安装失败'
  }
  if (error.code === 'incompatible-version') {
    const detail = (error.incompatible || [])
      .map((item) => `${item.name}@${item.version} 要求 ${Object.entries(item.requirements || {}).map(([key, value]) => `${key} ${value}`).join('、')}`)
      .join('；')
    return `新版本与当前 DSH 不兼容${detail === '' ? '' : `：${detail}`}`
  }
  const base = ERROR_TEXT[error.code] || error.code
  const kind = result?.packageResult?.kind
  const kindText = kind === undefined ? '' : `（pnpm：${kind}）`
  return `${base}${kindText}${error.diagnostic ? `：${error.diagnostic}` : ''}`
}

// ---------------------------------------------------------------------------
// 插件主体
// ---------------------------------------------------------------------------

export function apply(ctx) {
  /** 正在跑的任务：id -> job。同一时刻只允许一个。 */
  const jobs = new Map()
  let sequence = 0

  const manager = () => ctx.get('pluginManager')

  function writeJson(response, status, body) {
    const payload = JSON.stringify(body)
    response.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(payload),
    })
    response.end(payload)
  }

  /** 跨站写请求一律拒绝：更新会动 profile 文件。 */
  function crossSite(request) {
    const headers = request.headers || {}
    const site = String(headers['sec-fetch-site'] || '').toLowerCase()
    if (site === 'cross-site') return true
    const origin = headers.origin
    if (typeof origin === 'string' && origin !== '' && origin !== 'null') {
      try {
        const host = String(headers.host || '')
        if (new URL(origin).host.toLowerCase() !== host.toLowerCase()) return true
      } catch {
        return true
      }
    }
    return false
  }

  function readBody(request) {
    return new Promise((resolve, reject) => {
      const chunks = []
      let size = 0
      request.on('data', (chunk) => {
        size += chunk.length
        if (size > MAX_BODY) {
          reject(new Error('请求体过大'))
          request.destroy()
          return
        }
        chunks.push(chunk)
      })
      request.on('end', () => {
        if (chunks.length === 0) {
          resolve({})
          return
        }
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
        } catch {
          reject(new Error('请求体不是合法 JSON'))
        }
      })
      request.on('error', reject)
    })
  }

  /** 组装「已安装插件 + 是否有新版」的完整快照。 */
  async function buildState(force, preferred) {
    const service = manager()
    if (service === undefined) {
      return { ok: false, error: { code: 'no-manager', message: '当前 profile 没有插件管理服务，无法检查更新' } }
    }
    const bundles = await service.listBundles()
    const baseOrder = await registryOrder(service)
    const requested = typeof preferred === 'string' ? validRegistry(preferred) : ''
    if (requested === null) {
      return { ok: false, error: { code: 'invalid-registry', message: '安装源必须是 http:// 或 https:// 开头的地址' } }
    }
    // 选定源永远排第一个问，其余保留为兜底（镜像没同步时仍能给出结果）
    const registries = requested === ''
      ? baseOrder
      : [requested, ...baseOrder.filter((url) => url !== requested)]
    const profileDir = (() => {
      try {
        return service.profile?.dir || ''
      } catch {
        return ''
      }
    })()
    const cache = readCache()
    const now = Date.now()
    const runtimeVersion = readRuntimeVersion(service)
    const rows = []
    let dirty = false

    for (const bundle of bundles) {
      if (bundle.installed !== true) continue
      const source = typeof bundle.source === 'string' ? bundle.source : ''
      const version = typeof bundle.version === 'string' ? bundle.version : ''
      const parsed = parseSource(source, bundle.name)
      const installed = readInstalled(profileDir, bundle.name)
      const row = {
        name: bundle.name,
        title: bundleTitle(bundle),
        description: bundleDescription(bundle),
        icon: typeof bundle.meta?.icon === 'string' ? bundle.meta.icon : '',
        version,
        enabled: bundle.enabled === true,
        official: bundle.official === true,
        removable: bundle.removable === true,
        source,
        kind: parsed.kind,
        latest: '',
        registry: '',
        target: '',
        status: 'skipped',
        note: '',
        updatable: false,
        compat: null,
        open: resolveOpenTarget(parsed.kind, bundle.name, source, installed),
      }

      if (parsed.kind === 'shipped') {
        row.note = '随 DSH 提供，由 DSH 自己更新'
        rows.push(row)
        continue
      }
      if (parsed.kind === 'local') {
        row.status = 'local'
        row.note = '本地目录链接，没有远程版本可拉'
        rows.push(row)
        continue
      }
      if (parsed.kind === 'git' || parsed.kind === 'tarball') {
        row.status = 'manual'
        if (parsed.kind === 'tarball') {
          row.note = '压缩包地址，无法比对版本'
          row.target = source
          row.updatable = bundle.removable === true
        } else {
          const cached = cache.entries[`git:${bundle.name}`]
          const fresh = force !== true && cached !== undefined && now - cached.at < CACHE_TTL
          let remote = ''
          let note = ''
          if (fresh) {
            remote = cached.commit || ''
          } else {
            const answer = await lsRemoteHead(gitRemoteUrl(source))
            if (answer.commit !== undefined) {
              remote = answer.commit
              cache.entries[`git:${bundle.name}`] = { commit: remote, at: now }
              dirty = true
            } else {
              note = answer.error || ''
            }
          }
          const installed = readLockCommit(profileDir, bundle.name)
          row.target = source
          row.updatable = bundle.removable === true
          if (remote !== '' && installed !== '' && remote.slice(0, 7) === installed.slice(0, 7)) {
            row.status = 'latest'
            row.note = '与远端提交一致'
          } else if (remote !== '' && installed !== '') {
            row.status = 'update'
            row.note = `远端有新提交 ${remote.slice(0, 7)}（本地 ${installed.slice(0, 7)}）`
          } else if (remote !== '') {
            row.status = 'manual'
            row.note = `Git 源，远端 HEAD ${remote.slice(0, 7)}，无法读本地提交，可重装`
          } else {
            row.status = 'manual'
            row.note = note !== '' ? `Git 源（${note}），可重装最新提交` : 'Git 源，无法比对提交，可重装最新提交'
          }
        }
        rows.push(row)
        continue
      }
      if (parsed.kind === 'alias') {
        row.note = '以别名安装，请在插件页手动更换'
        rows.push(row)
        continue
      }

      // 注册表包
      const key = cacheKey(parsed.name, version)
      const cached = cache.entries[key]
      // 缓存要跟运行版本绑定：DSH 升级后兼容性结论可能变
      const fresh = force !== true && cached !== undefined && now - cached.at < CACHE_TTL
        && cached.runtime === runtimeVersion
      if (fresh) {
        row.latest = cached.latest || ''
        row.registry = cached.registry || ''
        row.note = cached.note || ''
        row.compat = cached.compat === undefined ? null : cached.compat
      } else {
        const answer = await resolveLatest(parsed.name, version, registries)
        if (answer.error !== undefined) {
          row.status = 'error'
          row.note = `查询失败：${answer.error}`
          rows.push(row)
          continue
        }
        row.latest = answer.version
        row.registry = answer.registry
        row.compat = answer.version === '' ? null : evaluateCompat(answer.entry, runtimeVersion)
        cache.entries[key] = {
          latest: answer.version,
          registry: answer.registry,
          compat: row.compat,
          runtime: runtimeVersion,
          at: now,
        }
        dirty = true
      }
      if (row.latest === '') {
        row.status = 'latest'
        row.note = '已是最新版本'
      } else if (compareVersions(row.latest, version) === 1) {
        row.status = 'update'
        row.target = `${parsed.name}@${row.latest}`
        row.updatable = bundle.removable === true
        const base = isPrerelease(row.latest) ? '有新版本（预发布通道）' : '有新版本'
        row.note = row.compat !== null && row.compat.ok === false
          ? `${base}，但与当前 DSH ${runtimeVersion} 不兼容`
          : base
      } else {
        row.status = 'latest'
        row.note = '已是最新版本'
      }
      rows.push(row)
    }

    if (dirty) writeCache(cache)

    const counts = {
      total: rows.length,
      updates: rows.filter((row) => row.status === 'update').length,
      latest: rows.filter((row) => row.status === 'latest').length,
      local: rows.filter((row) => row.status === 'local').length,
      errors: rows.filter((row) => row.status === 'error').length,
      enabled: rows.filter((row) => row.enabled === true).length,
      disabled: rows.filter((row) => row.enabled !== true).length,
      incompatible: rows.filter((row) => row.compat !== null && row.compat.ok === false).length,
    }
    const sources = {
      selected: requested,
      options: baseOrder.map((url) => ({ url, label: registryLabel(url) })),
      asked: registries,
    }
    return { ok: true, checkedAt: now, runtime: runtimeVersion, hostRev: HOST_REV, registries, sources, counts, rows }
  }

  /** 真正执行一次更新：先卸载，再以同一启用状态装目标版本。 */
  async function runJob(job) {
    const service = manager()
    if (service === undefined) {
      job.state = 'failed'
      job.message = '插件管理服务不可用'
      job.finishedAt = Date.now()
      return
    }
    try {
      job.stage = 'remove'
      job.stageText = '正在卸载旧版本'
      const removed = await service.removeBundle(job.name)
      if (removed?.application === 'failed') {
        job.state = 'failed'
        job.message = `卸载旧版本失败：${describeFailure(removed).replace(/^安装失败/, '操作失败')}`
        job.output = removed?.packageResult?.output || ''
        job.finishedAt = Date.now()
        return
      }
      if (job.cancelRequested === true) {
        job.state = 'cancelled'
        job.message = '已取消（旧版本已卸载，请重新安装）'
        job.finishedAt = Date.now()
        return
      }

      job.stage = 'install'
      job.stageText = '正在下载并安装新版本'
      const installed = await service.installBundle(job.target, {
        enabled: job.wasEnabled,
        requestId: job.id,
        saveExact: false,
        ...job.registry === '' ? {} : { registry: job.registry },
      })
      job.output = installed?.packageResult?.output || ''
      job.restart = installed?.restartReason === undefined ? '' : (RESTART_TEXT[installed.restartReason] || '需要重启 DSH')

      if (installed?.application === 'cancelled') {
        job.state = 'cancelled'
        job.message = '已取消（profile 文件已恢复，插件可能处于未安装状态）'
      } else if (installed?.application === 'failed') {
        job.state = 'failed'
        job.message = describeFailure(installed)
      } else {
        job.state = 'done'
        job.version = installed?.packageResult?.version || job.target
        job.message = job.restart === ''
          ? `已更新到 ${job.to === '' ? '最新版本' : job.to}`
          : `已更新到 ${job.to === '' ? '最新版本' : job.to}，${job.restart}`
      }
    } catch (error) {
      job.state = 'failed'
      job.message = String(error?.message || error)
    } finally {
      job.finishedAt = Date.now()
      job.stage = 'finished'
    }
  }

  function jobSnapshot(job) {
    return {
      id: job.id,
      name: job.name,
      title: job.title,
      from: job.from,
      to: job.to,
      stage: job.stage,
      stageText: job.stageText,
      state: job.state,
      message: job.message,
      restart: job.restart || '',
      output: job.output || '',
      startedAt: job.startedAt,
      finishedAt: job.finishedAt || 0,
    }
  }

  function activeJob() {
    for (const job of jobs.values()) {
      if (job.state === 'running') return job
    }
    return null
  }

  async function handle(method, request, response, query) {
    if (method === 'state') {
      const state = await buildState(query.get('refresh') === '1', query.get('registry') || '')
      writeJson(response, state.ok === true ? 200 : 400, state)
      return
    }
    if (method === 'update') {
      if (request.method !== 'POST') {
        writeJson(response, 405, { ok: false, error: '只接受 POST' })
        return
      }
      if (crossSite(request)) {
        writeJson(response, 403, { ok: false, error: '跨站请求被拒绝' })
        return
      }
      if (activeJob() !== null) {
        writeJson(response, 409, { ok: false, error: '已有更新任务在进行中' })
        return
      }
      const body = await readBody(request)
      const targetName = typeof body.name === 'string' ? body.name.trim() : ''
      if (targetName === '') {
        writeJson(response, 400, { ok: false, error: '缺少插件名' })
        return
      }
      // 用户在页面上选的安装源（空 = 自动），既用于查版本也用于装包
      const wanted = typeof body.registry === 'string' ? validRegistry(body.registry) : ''
      if (wanted === null) {
        writeJson(response, 400, { ok: false, error: '安装源必须是 http:// 或 https:// 开头的地址' })
        return
      }
      // 指定了源就现场重查一次，避免拿另一个源的缓存版本去装
      const current = await buildState(wanted !== '', wanted)
      if (current.ok !== true) {
        writeJson(response, 400, current)
        return
      }
      const row = current.rows.find((item) => item.name === targetName)
      if (row === undefined) {
        writeJson(response, 404, { ok: false, error: '找不到这个插件' })
        return
      }
      if (row.removable !== true) {
        writeJson(response, 400, { ok: false, error: '这个插件不可卸载，无法通过重装更新' })
        return
      }
      if (row.updatable !== true && row.status !== 'manual') {
        writeJson(response, 400, { ok: false, error: '这个插件当前没有可用的更新' })
        return
      }
      if (row.compat !== null && row.compat.ok === false) {
        const need = Object.entries(row.compat.requirements || {})
          .map(([key, value]) => `${key} ${value}`)
          .join('、')
        const runtime = current.runtime ? `当前 DSH ${current.runtime}` : '当前 DSH'
        writeJson(response, 400, {
          ok: false,
          error: `新版与${runtime}不兼容（要求 ${need}）。已在本机 compatibility.json 授权过的，请到插件页用「添加插件」手动安装。`,
        })
        return
      }
      const target = typeof row.target === 'string' && row.target !== ''
        ? row.target
        : (typeof body.target === 'string' ? body.target : '')
      if (target === '') {
        writeJson(response, 400, { ok: false, error: '没有可安装的目标版本' })
        return
      }
      sequence += 1
      const job = {
        id: `upd-${Date.now()}-${sequence}`,
        name: row.name,
        title: row.title,
        from: row.version,
        to: row.latest,
        target,
        registry: wanted !== '' ? wanted : (row.registry || ''),
        wasEnabled: row.enabled,
        state: 'running',
        stage: 'start',
        stageText: '准备中',
        message: '',
        restart: '',
        output: '',
        cancelRequested: false,
        startedAt: Date.now(),
        finishedAt: 0,
      }
      jobs.set(job.id, job)
      // 只留最近 20 条，避免长会话里无限增长
      if (jobs.size > 20) {
        for (const [id, item] of jobs) {
          if (item.state !== 'running' && jobs.size > 20) jobs.delete(id)
        }
      }
      void runJob(job)
      writeJson(response, 200, { ok: true, job: jobSnapshot(job) })
      return
    }
    if (method === 'job') {
      const id = query.get('id') || ''
      const job = jobs.get(id)
      if (job === undefined) {
        writeJson(response, 404, { ok: false, error: '任务不存在' })
        return
      }
      writeJson(response, 200, { ok: true, job: jobSnapshot(job) })
      return
    }
    if (method === 'cancel') {
      if (request.method !== 'POST') {
        writeJson(response, 405, { ok: false, error: '只接受 POST' })
        return
      }
      if (crossSite(request)) {
        writeJson(response, 403, { ok: false, error: '跨站请求被拒绝' })
        return
      }
      const body = await readBody(request)
      const id = typeof body.id === 'string' ? body.id : ''
      const job = jobs.get(id)
      if (job === undefined) {
        writeJson(response, 404, { ok: false, error: '任务不存在' })
        return
      }
      job.cancelRequested = true
      const service = manager()
      let answer = { status: 'not-running' }
      try {
        if (service !== undefined) answer = await service.cancelInstall(job.id)
      } catch (error) {
        answer = { status: 'not-running', message: String(error?.message || error) }
      }
      writeJson(response, 200, { ok: true, status: answer?.status || 'not-running' })
      return
    }
    if (method === 'open') {
      if (request.method !== 'POST') {
        writeJson(response, 405, { ok: false, error: '只接受 POST' })
        return
      }
      if (crossSite(request)) {
        writeJson(response, 403, { ok: false, error: '跨站请求被拒绝' })
        return
      }
      const body = await readBody(request)
      const targetName = typeof body.name === 'string' ? body.name.trim() : ''
      if (targetName === '') {
        writeJson(response, 400, { ok: false, error: '缺少插件名' })
        return
      }
      const service = manager()
      if (service === undefined) {
        writeJson(response, 400, { ok: false, error: '插件管理服务不可用' })
        return
      }
      const bundles = await service.listBundles()
      const bundle = bundles.find((item) => item.name === targetName && item.installed === true)
      if (bundle === undefined) {
        writeJson(response, 404, { ok: false, error: '找不到这个插件' })
        return
      }
      const profileDir = (() => {
        try {
          return service.profile?.dir || ''
        } catch {
          return ''
        }
      })()
      const source = typeof bundle.source === 'string' ? bundle.source : ''
      const parsed = parseSource(source, bundle.name)
      const open = resolveOpenTarget(parsed.kind, bundle.name, source, readInstalled(profileDir, bundle.name))
      if (open === null) {
        writeJson(response, 400, { ok: false, error: '这个插件没有可打开的地址' })
        return
      }
      const opened = await openExternal(open.target, open.kind)
      if (opened.ok === true) {
        writeJson(response, 200, { ok: true, kind: open.kind, target: open.target, via: opened.via })
      } else {
        // 把「想打开什么」一起带回去：界面上能直接看出是路径不对还是命令失败
        writeJson(response, 500, {
          ok: false,
          error: `${opened.error}\n目标：${open.target}`,
          target: open.target,
          kind: open.kind,
        })
      }
      return
    }
    writeJson(response, 404, { ok: false, error: '未知接口' })
  }

  ctx.inject(['webServer'], (ctx) => {
    ctx.effect(() => ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler: async (request, response) => {
        try {
          const url = new URL(request.url || '/', 'http://dsh.internal')
          const method = url.pathname.startsWith(`${ROUTE}/`) ? url.pathname.slice(ROUTE.length + 1) : ''
          if (method === '' || method.includes('/')) {
            writeJson(response, 404, { ok: false, error: '未知接口' })
            return
          }
          await handle(method, request, response, url.searchParams)
        } catch (error) {
          try {
            writeJson(response, 500, { ok: false, error: String(error?.message || error) })
          } catch {
            // 响应可能已经写过了
          }
        }
      },
    }), 'dsh-plugin-updater: routes')
  })
}
