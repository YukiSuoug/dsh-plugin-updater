/**
 * 兼容性判定的回归测试：范围匹配必须与官方
 * `semver.satisfies(v, range, { includePrerelease: true })` 一致，
 * 判定规则必须与 `evaluatePluginCompatibility` 一致。
 *
 *   node tools/check-compat.mjs
 */
import { satisfiesVersion, evaluateCompat } from '../index.js'

const RUNTIME = '0.2.1-rc.5'

const RANGE_CASES = [
  // [运行时版本, 范围, 期望]
  ['0.2.1-rc.5', '>=0.2.1-rc.2 <0.3.0', true],
  ['0.2.1-rc.5', '^0.2.0', true],
  ['0.2.1-rc.5', '^0.3.0', false],
  ['0.2.1-rc.5', '=0.2.1-rc.2 || >=0.2.1-rc.2 <0.2.2-0', true],
  ['0.2.1-rc.5', '>=0.2.1-rc.6', false],
  ['0.2.1-rc.5', '', false],
  ['0.2.1', '~0.2.0', true],
  // ~0.2.0 = >=0.2.0 <0.3.0，允许补丁位变化（常被误以为只到 0.2.0）
  ['0.2.2', '~0.2.0', true],
  ['0.3.0', '~0.2.0', false],
  ['0.3.0', '^0.2.0', false],
  ['0.3.0-0', '^0.2.0', false],
  ['0.2.9', '^0.2.0', true],
  ['0.0.3', '^0.0.3', true],
  ['0.0.4', '^0.0.3', false],
  ['0.0.3', '0.0.x', true],
  ['0.0.3', '0.x', true],
  ['1.2.3', '*', true],
  ['1.2.3', '>=1.2.3-alpha', true],
  ['1.2.3', '>1.2.3', false],
  ['1.2.4', '>1.2.3 <2.0.0', true],
  ['2.0.0', '>1.2.3 <2.0.0', false],
  ['0.2.1-rc.5', '0.2.1', false],
  ['0.2.1', '0.2.1', true],
]

let failed = 0
for (const [version, range, expected] of RANGE_CASES) {
  const actual = satisfiesVersion(version, range)
  const ok = actual === expected
  if (!ok) failed += 1
  console.log(`${ok ? '✓' : '✗'} ${version.padEnd(12)} ${range.padEnd(42)} => ${actual}${ok ? '' : ` (期望 ${expected})`}`)
}

const COMPAT_CASES = [
  [
    'engines.dsh 满足',
    { name: 'x', version: '1.0.0', engines: { dsh: '>=0.2.1-rc.2 <0.3.0' } },
    { ok: true },
  ],
  [
    'engines.dsh 不满足',
    { name: 'x', version: '1.0.0', engines: { dsh: '>=0.3.0' } },
    { ok: false, requirements: { 'engines.dsh': '>=0.3.0' } },
  ],
  [
    'engines.dsh 优先于 peerDependencies（peer 不参与）',
    { name: 'x', version: '1.0.0', engines: { dsh: '^0.2.0' }, peerDependencies: { '@deepseek-ai/dsh': '^9.9.9' } },
    { ok: true },
  ],
  [
    // 关键陷阱：0.2.1-rc.5 在 0.2.1 之前，所以 ^0.2.1 不含任何 rc。
    // 官方 evaluatePluginCompatibility 同样判为不满足——界面上显示「不兼容」是准的。
    'peer ^0.2.1 不含 0.2.1-rc.5（rc 在正式版之前）',
    { name: 'x', version: '1.0.0', peerDependencies: { '@deepseek-ai/dsh': '^0.2.1', react: '^99' } },
    { ok: false, requirements: { '@deepseek-ai/dsh': '^0.2.1' } },
  ],
  [
    'peer 带 rc 范围才容纳 rc 运行时（真实插件写法）',
    { name: 'x', version: '1.0.0', peerDependencies: { '@deepseek-ai/dsh': '^0.2.1-rc.1', react: '^99' } },
    { ok: true },
  ],
  [
    'peer 不满足（只报 DSH 系）',
    { name: 'x', version: '1.0.0', peerDependencies: { '@deepseek-ai/dsh-agent': '^0.3.0', react: '^99' } },
    { ok: false, requirements: { '@deepseek-ai/dsh-agent': '^0.3.0' } },
  ],
  [
    'workspace:* 视为当前运行时',
    { name: 'x', version: '1.0.0', peerDependencies: { '@deepseek-ai/dsh': 'workspace:*' } },
    { ok: true },
  ],
  ['没有任何约束', { name: 'x', version: '1.0.0' }, { ok: true }],
  ['运行时版本未知', { name: 'x', version: '1.0.0', engines: { dsh: '>=9' } }, null, ''],
]

for (const [label, manifest, expected, runtime] of COMPAT_CASES) {
  const actual = evaluateCompat(manifest, runtime === undefined ? RUNTIME : runtime)
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failed += 1
  console.log(`${ok ? '✓' : '✗'} ${label.padEnd(40)} => ${JSON.stringify(actual)}${ok ? '' : ` (期望 ${JSON.stringify(expected)})`}`)
}

if (failed > 0) {
  console.error(`\n${failed} 个用例失败`)
  process.exit(1)
}
console.log(`\n全部 ${RANGE_CASES.length + COMPAT_CASES.length} 个用例通过`)
