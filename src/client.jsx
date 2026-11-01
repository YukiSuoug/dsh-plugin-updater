import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import css from "./styles.css";

export const name = "dsh-plugin-updater";
/** 依赖的浏览器服务：slot 注册表（plugins.tab 由插件管理页声明）。 */
export const inject = ["slots"];

const ENDPOINT = "/dsh-plugin-updater/api";

/** 文案（本插件面向中文界面，文案集中在常量里便于以后本地化）。 */
const T = {
  title: "更新",
  heading: "插件更新",
  subtitle: "检查已安装插件在注册表 / Git 上的最新版本，一键重装升级。",
  refresh: "刷新",
  refreshing: "检查中…",
  checkedAt: (time) => `上次检查 ${time}`,
  never: "尚未检查",
  allFresh: "全部已是最新",
  summaryUpdates: (count) => `${count} 个插件有新版本`,
  summaryTotal: (count) => `共 ${count} 个已安装插件`,
  empty: "没有可管理的插件。",
  retry: "重试",
  update: "更新",
  reinstall: "重装",
  confirmTitle: (title) => `更新 ${title}`,
  confirmHint: "更新会先用同一套 pnpm 管线卸载旧版本，再安装新版本。",
  confirmRisk: "若新版本安装失败，这个插件会处于「未安装」状态，可以在这里点重试重新装上。",
  confirmSource: "安装源",
  confirmEnabledOff: "这个插件当前是关闭的，更新后仍保持关闭。",
  cancel: "取消",
  start: "开始更新",
  running: "更新中…",
  close: "关闭",
  details: "查看输出",
  stopped: "已取消",
  failedTitle: "更新失败",
  statusLatest: "已是最新",
  statusLocal: "本地目录",
  statusManual: "需手动",
  statusSkipped: "随 DSH 提供",
  statusError: "查询失败",
  tagOfficial: "官方",
  tagOff: "已关闭",
  tagIncompatible: "不兼容",
  compatNeed: "新版要求",
  compatBlocked: "新版与当前 DSH 不兼容，已禁用更新",
  compatDetail: (need, runtime) => `新版要求 ${need}，当前 DSH ${runtime}。已在本机 compatibility.json 授权过的，请到插件页用「添加插件」手动安装。`,
  groupEnabled: "已启用",
  groupDisabled: "已停用",
  openFolder: "打开本地文件夹",
  openRepo: "打开仓库",
  source: "安装源",
  sourceAuto: "自动",
  sourceAutoHint: "跟随 pnpm 配置，依次尝试",
  sourceCustom: "自定义地址",
  sourceCustomHint: "填写内网或私有 npm 源地址，以 http:// 或 https:// 开头；需要登录的源请把凭据放在本机 ~/.npmrc 里。",
  sourceInvalid: "地址必须以 http:// 或 https:// 开头",
  sourcePick: "选择安装源",
};

const SOURCE_KEY = "dsh-plugin-updater:source:v1";
const CUSTOM_KEY = "dsh-plugin-updater:custom:v1";

function readStored(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStored(key, value) {
  try {
    if (value === "") localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // 隐私模式下写不了，只是记不住选择
  }
}

/** 只显示主机名，选项里不重复显示协议。 */
function hostOf(url) {
  return String(url || "").replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

/** 文件夹图标（本地安装）。 */
function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h3.9a1.5 1.5 0 0 1 1.2.6L11 8.2h8.5A1.5 1.5 0 0 1 21 9.7v7.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />
    </svg>
  );
}

/** 外链图标（远程仓库 / npm 页面）。 */
function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.5 13.5a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1" />
      <path d="M13.5 10.5a4.5 4.5 0 0 0-6.4 0l-2.6 2.6a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1" />
    </svg>
  );
}

function errorText(payload, fallback) {
  if (payload === null || payload === undefined) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.error === "string") return payload.error;
  if (payload.error !== null && typeof payload.error === "object") {
    if (typeof payload.error.message === "string") return payload.error.message;
    if (typeof payload.error.code === "string") return payload.error.code;
  }
  return fallback;
}

async function call(path, init) {
  const response = await fetch(`${ENDPOINT}${path}`, { cache: "no-store", ...init });
  let body = null;
  try {
    body = await response.json();
  } catch {
    throw new Error(`HTTP ${response.status}`);
  }
  if (!response.ok || body?.ok === false) {
    throw new Error(errorText(body, `HTTP ${response.status}`));
  }
  return body;
}

function postJson(path, payload) {
  return call(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function clockText(timestamp) {
  if (typeof timestamp !== "number" || timestamp <= 0) return "";
  const date = new Date(timestamp);
  const sameDay = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return time;
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${time}`;
}

/** 行排序：有更新 > 查询失败 > 可重装 > 已最新 > 本地/随包。同类按标题。 */
function sortRows(rows) {
  const weight = (row) => {
    if (row.status === "update") return 0;
    if (row.status === "error") return 1;
    if (row.status === "manual") return 2;
    if (row.status === "latest") return 3;
    if (row.status === "local") return 4;
    return 5;
  };
  return [...rows].sort((a, b) => {
    const diff = weight(a) - weight(b);
    if (diff !== 0) return diff;
    return String(a.title || a.name).localeCompare(String(b.title || b.name), "zh-CN");
  });
}

/** 把兼容性要求拼成一行字：`engines.dsh >=0.3.0`。 */
function compatText(compat) {
  if (compat === null || compat === undefined || compat.ok !== false) return "";
  return Object.entries(compat.requirements || {})
    .map(([key, value]) => `${key} ${value}`)
    .join("、");
}

function RowAction({ row, runtime, onUpdate }) {
  const incompatible = row.compat !== null && row.compat !== undefined && row.compat.ok === false;
  if (row.status === "update" || (row.status === "manual" && row.updatable === true)) {
    const label = row.status === "update" ? T.update : T.reinstall;
    if (incompatible) {
      return (
        <button
          type="button"
          className="pu-btn"
          disabled
          title={T.compatDetail(compatText(row.compat), runtime)}
        >
          {label}
        </button>
      );
    }
    return (
      <button
        type="button"
        className="pu-btn pu-btn-primary"
        onClick={() => onUpdate(row)}
        title={row.note || ""}
      >
        {label}
      </button>
    );
  }
  const text = row.status === "local"
    ? T.statusLocal
    : row.status === "latest"
      ? T.statusLatest
      : row.status === "error"
        ? T.statusError
        : T.statusSkipped;
  const tone = row.status === "error" ? " pu-state-error" : "";
  return <span className={`pu-state${tone}`} title={row.note || ""}>{text}</span>;
}

function UpdateRow({ row, runtime, onUpdate, onOpen, busy }) {
  const initial = String(row.title || row.name || "?").trim().slice(0, 1).toUpperCase();
  const target = row.latest || "";
  const showArrow = target !== "" && target !== row.version && row.status !== "manual";
  const openLabel = row.open?.kind === "folder" ? T.openFolder : T.openRepo;
  const incompatible = row.compat !== null && row.compat !== undefined && row.compat.ok === false;
  return (
    <div className={`pu-row${row.status === "update" ? " is-update" : ""}${busy ? " is-busy" : ""}`}>
      <div className="pu-icon">
        {row.icon ? <img src={row.icon} alt="" draggable={false} /> : <span>{initial}</span>}
      </div>
      <div className="pu-main">
        <div className="pu-rowhead">
          <span className="pu-title">{row.title || row.name}</span>
          {row.official ? <span className="pu-tag">{T.tagOfficial}</span> : null}
          {row.enabled === false ? <span className="pu-tag pu-tag-muted">{T.tagOff}</span> : null}
          {incompatible ? (
            <span
              className="pu-tag pu-tag-warn"
              title={T.compatDetail(compatText(row.compat), runtime)}
            >
              {T.tagIncompatible}
            </span>
          ) : null}
        </div>
        <div className="pu-sub">
          <code>{row.name}</code>
          {row.note ? <><span className="pu-dot">·</span><span className="pu-note">{row.note}</span></> : null}
        </div>
      </div>
      <div className="pu-versions">
        <code className="pu-v-old">{row.version || "—"}</code>
        {showArrow ? <><span className="pu-arrow">→</span><code className="pu-v-new">{target}</code></> : null}
      </div>
      <div className="pu-actions">
        {row.open ? (
          <button
            type="button"
            className="pu-icon-btn"
            title={`${openLabel}：${row.open.target}`}
            aria-label={openLabel}
            onClick={() => onOpen(row)}
          >
            {row.open.kind === "folder" ? <FolderIcon /> : <LinkIcon />}
          </button>
        ) : null}
        <RowAction row={row} runtime={runtime} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * 安装源选择器：与官方「添加插件」对话框同一套语义——
 * 自动 / npm 官方源 / 中国大陆镜像源 / 宿主配置的其它源 / 自定义地址。
 */
function SourcePicker({ options, source, onChoose, disabled }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => readStored(CUSTOM_KEY));
  const [error, setError] = useState("");

  const known = options.some((option) => option.url === source);
  const label = source === ""
    ? T.sourceAuto
    : (options.find((option) => option.url === source)?.label || hostOf(source));
  const isCustom = source !== "" && !known;

  function submitCustom() {
    const value = draft.trim().replace(/\/+$/, "");
    if (!/^https?:\/\/[^\s]+$/i.test(value)) {
      setError(T.sourceInvalid);
      return;
    }
    setError("");
    writeStored(CUSTOM_KEY, value);
    setOpen(false);
    onChoose(value);
  }

  return (
    <div className="pu-source">
      <button
        type="button"
        className="pu-btn pu-source-btn"
        aria-haspopup="true"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="pu-source-tag">{T.source}</span>
        <span className="pu-source-name">{label}</span>
        <Chevron />
      </button>
      {open ? (
        <>
          <div className="pu-popover-mask" onClick={() => setOpen(false)} />
          <div className="pu-popover" role="radiogroup" aria-label={T.sourcePick}>
            <label className={`pu-option${source === "" ? " is-active" : ""}`}>
              <input
                type="radio"
                checked={source === ""}
                onChange={() => { setOpen(false); onChoose(""); }}
              />
              <span className="pu-option-main">
                <span className="pu-option-title">{T.sourceAuto}</span>
                <span className="pu-option-hint">{T.sourceAutoHint}</span>
              </span>
            </label>
            {options.map((option) => (
              <label className={`pu-option${source === option.url ? " is-active" : ""}`} key={option.url}>
                <input
                  type="radio"
                  checked={source === option.url}
                  onChange={() => { setOpen(false); onChoose(option.url); }}
                />
                <span className="pu-option-main">
                  <span className="pu-option-title">
                    {option.label}
                    <code className="pu-option-host">{hostOf(option.url)}</code>
                  </span>
                </span>
              </label>
            ))}
            <div className={`pu-option pu-option-custom${isCustom ? " is-active" : ""}`}>
              <input
                type="radio"
                checked={isCustom}
                onChange={() => setDraft(source !== "" && !known ? source : draft)}
                aria-label={T.sourceCustom}
              />
              <div className="pu-option-main">
                <span className="pu-option-title">{T.sourceCustom}</span>
                <input
                  type="text"
                  className={`pu-input${error !== "" ? " is-invalid" : ""}`}
                  placeholder="https://npm.example.com/"
                  value={draft}
                  onChange={(event) => { setDraft(event.target.value); setError(""); }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitCustom();
                    }
                  }}
                />
                <p className="pu-option-hint">{T.sourceCustomHint}</p>
                {error !== "" ? <p className="pu-option-error">{error}</p> : null}
                <button type="button" className="pu-btn pu-btn-primary pu-option-apply" onClick={submitCustom}>
                  使用这个地址
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Output({ text }) {  if (typeof text !== "string" || text.trim() === "") return null;
  const tail = text.split("\n").slice(-400).join("\n");
  return (
    <details className="pu-output">
      <summary>{T.details}</summary>
      <pre>{tail}</pre>
    </details>
  );
}

function Dialog({ dialog, onCancel, onConfirm, onClose, labelOf, runtime }) {
  if (dialog === null) return null;
  const { row, mode, job } = dialog;
  const title = row.title || row.name;
  const sourceText = row.registry ? labelOf(row.registry) : T.sourceAuto;

  let body = null;
  if (mode === "confirm") {
    body = (
      <>
        <div className="pu-dialog-versions">
          <code className="pu-v-old">{row.version || "—"}</code>
          {row.latest ? <><span className="pu-arrow">→</span><code className="pu-v-new">{row.latest}</code></> : null}
        </div>
        <p className="pu-dialog-text">{T.confirmHint}</p>
        {row.compat !== null && row.compat !== undefined && row.compat.ok === false ? (
          <p className="pu-dialog-warn">{T.compatDetail(compatText(row.compat), runtime)}</p>
        ) : null}
        <p className="pu-dialog-warn">{T.confirmRisk}</p>
        {row.enabled === false ? <p className="pu-dialog-text">{T.confirmEnabledOff}</p> : null}
        <p className="pu-dialog-meta">
          <span>{T.confirmSource}</span>
          <code>{sourceText}</code>
        </p>
      </>
    );
  } else if (mode === "running") {
    body = (
      <>
        <div className="pu-progress">
          <span className="pu-spinner" aria-hidden="true" />
          <span>{job?.stageText || T.running}</span>
        </div>
        <Output text={job?.output} />
      </>
    );
  } else if (mode === "done") {
    body = (
      <>
        <p className="pu-dialog-ok">{job?.message || ""}</p>
        <Output text={job?.output} />
      </>
    );
  } else if (mode === "cancelled") {
    body = <p className="pu-dialog-warn">{job?.message || T.stopped}</p>;
  } else {
    body = (
      <>
        <p className="pu-dialog-error">{job?.message || dialog.message || T.failedTitle}</p>
        <Output text={job?.output} />
      </>
    );
  }

  const running = mode === "running";
  const footer = mode === "confirm" ? (
    <>
      <button type="button" className="pu-btn" onClick={onClose}>{T.cancel}</button>
      <button type="button" className="pu-btn pu-btn-primary" onClick={onConfirm}>{T.start}</button>
    </>
  ) : running ? (
    <button type="button" className="pu-btn" onClick={onCancel}>{T.cancel}</button>
  ) : mode === "failed" ? (
    <>
      <button type="button" className="pu-btn" onClick={onClose}>{T.close}</button>
      <button type="button" className="pu-btn pu-btn-primary" onClick={onConfirm}>{T.retry}</button>
    </>
  ) : (
    <button type="button" className="pu-btn pu-btn-primary" onClick={onClose}>{T.close}</button>
  );

  // 传送到 body：插件页容器可能有 transform/堆叠上下文，直接 fixed 定位会被关在里面
  return createPortal(
    <div
      className="pu-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !running) onClose();
      }}
    >
      <div className="pu-dialog" role="dialog" aria-modal="true" aria-label={T.confirmTitle(title)}>
        <header className="pu-dialog-head">
          <h3>{mode === "confirm" ? T.confirmTitle(title) : title}</h3>
          <button
            type="button"
            className="pu-dialog-close"
            aria-label={T.close}
            onClick={onClose}
            disabled={running}
          >
            ×
          </button>
        </header>
        <div className="pu-dialog-body">{body}</div>
        <footer className="pu-dialog-foot">{footer}</footer>
      </div>
    </div>,
    document.body,
  );
}

export function UpdatesTab() {
  const [state, setState] = useState({ phase: "loading", data: null, error: "" });
  const [dialog, setDialog] = useState(null);
  const [source, setSource] = useState(() => readStored(SOURCE_KEY));
  const sourceRef = useRef(source);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async (refresh, wanted) => {
    const registry = wanted === undefined ? sourceRef.current : wanted;
    setState((prev) => ({ phase: prev.data === null ? "loading" : "refreshing", data: prev.data, error: "" }));
    try {
      const query = `${refresh ? "?refresh=1" : "?"}${registry === "" ? "" : `registry=${encodeURIComponent(registry)}`}`;
      const data = await call(`/state${query}`);
      if (!mounted.current) return;
      setState({ phase: "ready", data, error: "" });
    } catch (error) {
      if (!mounted.current) return;
      setState((prev) => ({
        phase: prev.data === null ? "error" : "ready",
        data: prev.data,
        error: String(error?.message || error),
      }));
    }
  }, []);

  useEffect(() => { void load(false); }, [load]);

  /** 换源：记住选择并立刻按新源重查（不用缓存，否则看着没反应）。 */
  const chooseSource = useCallback((next) => {
    if (next === sourceRef.current) return;
    sourceRef.current = next;
    setSource(next);
    writeStored(SOURCE_KEY, next);
    void load(true, next);
  }, [load]);

  const startUpdate = useCallback(async (row) => {
    setDialog({ row, mode: "running", job: null, message: "" });
    try {
      const answer = await postJson("/update", { name: row.name, registry: sourceRef.current });
      if (!mounted.current) return;
      setDialog((prev) => (prev === null ? prev : { ...prev, job: answer.job }));
    } catch (error) {
      if (!mounted.current) return;
      setDialog((prev) => (prev === null ? prev : { ...prev, mode: "failed", message: String(error?.message || error) }));
    }
  }, []);

  const jobId = dialog?.mode === "running" ? dialog.job?.id : undefined;

  useEffect(() => {
    if (jobId === undefined) return undefined;
    let stopped = false;
    const poll = async () => {
      try {
        const answer = await call(`/job?id=${encodeURIComponent(jobId)}`);
        if (stopped || !mounted.current) return;
        const job = answer.job;
        setDialog((prev) => {
          if (prev === null || prev.job?.id !== job.id) return prev;
          if (job.state === "running") return { ...prev, job };
          return { ...prev, job, mode: job.state === "done" ? "done" : job.state };
        });
        if (job.state !== "running") {
          stopped = true;
          void load(false);
        }
      } catch {
        // 单次轮询失败不算失败，下一个 tick 再来
      }
    };
    void poll();
    const timer = setInterval(poll, 800);
    return () => { stopped = true; clearInterval(timer); };
  }, [jobId, load]);

  const requestCancel = useCallback(async () => {
    const id = dialog?.job?.id;
    if (id === undefined) return;
    try {
      await postJson("/cancel", { id });
    } catch {
      // 任务可能刚好结束
    }
  }, []);

  const [notice, setNotice] = useState("");

  const openTarget = useCallback(async (row) => {
    setNotice("");
    try {
      await postJson("/open", { name: row.name });
    } catch (error) {
      setNotice(String(error?.message || error));
    }
  }, []);

  const data = state.data;
  const rows = data?.rows ? sortRows(data.rows) : [];
  const counts = data?.counts || { total: 0, updates: 0 };
  const busy = dialog !== null && dialog.mode === "running";

  /** 把注册表地址翻成「名字 · 主机」，选项里没有就是自定义源。 */
  const labelOf = useCallback((url) => {
    const options = data?.sources?.options || [];
    const host = hostOf(url);
    const label = options.find((option) => option.url === url)?.label || "";
    return label !== "" && label !== host ? `${label} · ${host}` : host;
  }, [data]);

  // 按启用状态分类；空分组不渲染（全启用时不会多出一个「已停用 0」）
  const groups = useMemo(() => {
    const enabled = rows.filter((row) => row.enabled === true);
    const disabled = rows.filter((row) => row.enabled !== true);
    return [
      { key: "enabled", title: T.groupEnabled, items: enabled },
      { key: "disabled", title: T.groupDisabled, items: disabled },
    ].filter((group) => group.items.length > 0);
  }, [rows]);

  return (
    <div className="pu-root">
      <header className="pu-head">
        <div className="pu-head-main">
          <h2>{T.heading}</h2>
          <p>{T.subtitle}</p>
        </div>
        <div className="pu-head-actions">
          <span className="pu-checked">
            {data?.checkedAt ? T.checkedAt(clockText(data.checkedAt)) : T.never}
          </span>
          <SourcePicker
            options={data?.sources?.options || []}
            source={source}
            onChoose={chooseSource}
            disabled={busy}
          />
          <button
            type="button"
            className="pu-btn"
            onClick={() => void load(true)}
            disabled={state.phase === "loading" || state.phase === "refreshing" || busy}
          >
            {state.phase === "refreshing" ? T.refreshing : T.refresh}
          </button>
        </div>
      </header>

      {state.error !== "" ? (
        <div className="pu-banner pu-banner-error">
          <span>{state.error}</span>
          <button type="button" className="pu-btn" onClick={() => void load(true)}>{T.retry}</button>
        </div>
      ) : null}

      {notice !== "" ? (
        <div className="pu-banner pu-banner-error">
          <span>{notice}</span>
          <button type="button" className="pu-btn" onClick={() => setNotice("")}>{T.close}</button>
        </div>
      ) : null}

      {state.phase === "loading" ? (
        <div className="pu-skeleton">
          <div className="pu-skeleton-line" />
          <div className="pu-skeleton-line" />
          <div className="pu-skeleton-line" />
        </div>
      ) : rows.length === 0 ? (
        <div className="pu-empty">{state.phase === "error" ? state.error : T.empty}</div>
      ) : (
        <>
          <div className="pu-summary">
            <strong className={counts.updates > 0 ? "pu-summary-hot" : ""}>
              {counts.updates > 0 ? T.summaryUpdates(counts.updates) : T.allFresh}
            </strong>
            <span>{T.summaryTotal(counts.total)}</span>
          </div>
          {groups.map((group) => (
            <section className="pu-group" key={group.key}>
              <h3 className="pu-group-head">
                <span>{group.title}</span>
                <span className="pu-group-count">{group.items.length}</span>
              </h3>
              <div className="pu-list">
                {group.items.map((row) => (
                  <UpdateRow
                    key={row.name}
                    row={row}
                    runtime={data?.runtime || ""}
                    busy={busy && dialog?.row?.name === row.name}
                    onUpdate={(target) => setDialog({ row: target, mode: "confirm", job: null, message: "" })}
                    onOpen={(target) => void openTarget(target)}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      <Dialog
        dialog={dialog}
        onCancel={() => void requestCancel()}
        onConfirm={() => { const row = dialog?.row; if (row) void startUpdate(row); }}
        onClose={() => setDialog(null)}
        labelOf={labelOf}
        runtime={data?.runtime || ""}
      />
    </div>
  );
}

export function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.dshPlugin = name;
    style.textContent = css;
    document.head.appendChild(style);
    return () => style.remove();
  }, "dsh-plugin-updater: styles");

  ctx.effect(() => ctx.slots.inject("plugins.tab", () => ctx.slots.register({
    name: "plugins.tab",
    id: "updater",
    label: () => T.title,
  }, UpdatesTab)), "dsh-plugin-updater: updates tab");
}
