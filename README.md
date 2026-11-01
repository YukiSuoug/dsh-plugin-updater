# dsh-plugin-updater

给 DeepSeek Harness 补上官方一直缺的那一环：**检查插件有没有新版本，并在插件页里一键更新**。

官方 `@deepseek-ai/dsh-client-ui-plugin-market` 的 README 里写着「没有升级操作——可用更新只显示为状态」；
官方 `@deepseek-ai/dsh-plugin-manager` 又对已安装的包直接抛 `already-installed`（HMR 下）。
结果就是社区插件只能「去 GitHub 看 → 卸载 → 重装」。

本插件做的事：把这一步压成一次点击，并且**复用官方那套 pnpm 管线**（`inspect` / 源回退 / 镜像 /
构建脚本审批 / 失败回滚），而不是自己造一个下载器。

## 装在哪

浏览器半区 = 插件页的第三个标签页「更新」，排在「已安装 / 发现」之后。
宿主半区 = `/dsh-plugin-updater/api/*` 三个只服务本机的接口。

## 安装

方式一（推荐，与「添加插件」完全同一条路）：DSH 侧栏 → **插件** → **添加插件** →「本地目录路径」填

```
D:\1\AI\dshp\dsh-plugin-updater
```

方式二（命令行，直接从这个仓库装）：

```sh
dsh plugin --profile desktop add github:YukiSuoug/dsh-plugin-updater
```

方式三（本地开发，改完代码即时生效）：

```sh
dsh plugin --profile desktop add link:D:/1/AI/dshp/dsh-plugin-updater
```

装完打开 **插件 → 更新**。

## 怎么判断「有没有新版本」

| 安装来源（`listBundles().source`） | 判定方式 |
| --- | --- |
| 注册表包（`name` / `name@^1.2.3`） | 依次问 pnpm 配置的源 → `registry.npmjs.org` → `registry.npmmirror.com`，读 `dist-tags`，比 SemVer |
| Git 源（`git+…` / `github:…`） | `git ls-remote <repo> HEAD` 与 `pnpm-lock.yaml` 里锁定的 commit 比对 |
| 本地目录（`link:` / `file:`） | 没有远程版本，标「本地目录」 |
| 压缩包地址 | 无法比对，提供「重装」 |
| 随 DSH 提供（无 `source`） | 跳过，写明由 DSH 自己更新 |

注册表结果缓存 5 分钟（落盘在 `$DSH_HOME/dsh-plugin-updater/cache.json`），
重开窗口也是热的；点「刷新」强制重查。

## 安装源（可选镜像 / 直连 / 自定义）

页面右上角有一个 **安装源** 下拉，语义与官方「添加插件」对话框一致：

| 选项 | 含义 |
| --- | --- |
| **自动**（默认） | 跟随 pnpm 配置，按「pnpm 指向的源 → npm 官方源 → 中国大陆镜像源」依次尝试 |
| **npm 官方源** | `registry.npmjs.org` |
| **中国大陆镜像源** | `registry.npmmirror.com` |
| 宿主配置的其它源 | `pluginManager.registries()` 里列出的（含私有源），显示为主机名 |
| **自定义地址** | 自己填 `http://` / `https://` 地址；需要登录的源请把凭据放在本机 `~/.npmrc` |

- 选项不是写死的：`/state` 返回的 `sources.options` 由宿主 `pluginManager.registries()` 生成，所以宿主配了私有源也会出现在列表里。
- **检查和安装用同一个源**：换源会立刻按新源重查（绕过 5 分钟缓存），更新时把 `registry` 一起传给 `installBundle`，
  装的就是你看到那个源里的版本。
- 选定源排第一个问，其余源仍作为兜底——镜像还没同步时不会白跑一趟。
- 选择记在浏览器 `localStorage`（`dsh-plugin-updater:source:v1`），下次打开还是它；自定义地址单独存一份草稿。
- 更新确认框里会写明这次要用哪个源（名字 · 主机）。

## 分类与「打开地址」

- 列表按 `enabled` 分成 **已启用 / 已停用** 两组，各带数量；某一组为空就不显示。
  分组内部仍按「有更新 > 查询失败 > 可重装 > 已最新 > 本地/随包」排序。
- 每行右侧一个图标按钮，按安装方式决定打开什么：

  | 安装方式 | 图标 | 打开 |
  | --- | --- | --- |
  | 本地目录（`link:` / `file:`） | 文件夹 | `node_modules/<pkg>` 的**真实路径**（`fs.realpathSync` 解掉软链，就是你的开发目录） |
  | 远程（注册表 / Git / 压缩包） | 外链 | 包的 `package.json` 里 `repository` → 退回 `homepage` / `bugs.url` → 再退回 npm 页面 |

  仓库地址会先洗一遍：`git+https://…git`、`git@github.com:o/r`、`github:o/r` 都归一成 `https://…`。

打开方式：Windows 文件夹用 `explorer.exe`、网址用 `rundll32.exe url.dll,FileProtocolHandler`；
macOS 用 `open`，Linux 用 `xdg-open`。只接受 http(s) 网址和已安装包的真实目录，`file://`、`javascript:` 一律拒绝。

## 一键更新做了什么```
removeBundle(name)  →  installBundle('name@<最新>', { enabled: 原启用状态, saveExact: false, registry: 查出该版本的源 })
```

- 必须**先卸载**：`installBundle` 在 HMR 存在时对已是依赖的包会直接拒绝，官方「显式更新」也是这么做的。
- 装新版时传回**原来的启用状态**，所以关着的插件更新后还是关着的。
- 指定 `registry` 为「查出这个版本的那个源」，避免官方源查到、镜像装不到。
- 确认框里明确写了风险：**新版装失败时插件会处于未安装状态**，可以在同一个弹窗里点「重试」。
- 进度（卸载中 / 安装中）、pnpm 输出、取消（`cancelInstall`）、失败原因（网络 / 构建脚本被拦 / 版本与 DSH 不兼容）
  都在弹窗里；更新完成后列表自动刷新。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/dsh-plugin-updater/api/state[?refresh=1][&registry=<url>]` | 已安装插件 + 当前/最新版本；`registry` 指定先问哪个源 |
| POST | `/dsh-plugin-updater/api/update` | `{ name }` → 起一个更新任务 |
| GET | `/dsh-plugin-updater/api/job?id=` | 轮询任务状态与输出 |
| POST | `/dsh-plugin-updater/api/cancel` | `{ id }` → 取消 |
| POST | `/dsh-plugin-updater/api/open` | `{ name }` → 打开本地目录或仓库地址 |

写接口只接受同源请求（`sec-fetch-site: cross-site` 一律 403），因为更新会改 profile 文件。

## 开发

```sh
npm install          # esbuild
npm run build        # src/client.jsx -> dist/client.js
node tools/smoke.mjs        # 宿主半区：假 ctx + 假 pluginManager 跑 /state 与更新全流程
node tools/check-client.mjs  # 浏览器半区：模拟 __ModuleLoader__ 验证导出与 slot 注册
```

`dist/client.js` 是构建产物，改 `src/` 后必须重新 build 再重启 DSH。

## 已知限制

- 本地 `link:` 开发插件没有「远程版本」概念，只能标为本地目录。
- 别名安装（`foo@npm:bar@1.2.3`）不参与版本比对，提示手动更换。
- 注册表查询走 Node `fetch`，不读 pnpm 的代理配置；企业代理环境下可能查不到（安装本身仍走 pnpm，不受影响）。
- 一次只允许一个更新任务（官方管线本身也用文件锁串行）。
