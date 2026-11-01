window.__ModuleLoader__.load({id:"dsh-plugin-updater",factory:require=>{const module={exports:{}};
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.jsx
var client_exports = {};
__export(client_exports, {
  UpdatesTab: () => UpdatesTab,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_exports);
var import_react = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");

// src/styles.css
var styles_default = '/* dsh-plugin-updater —— 插件页「更新」标签页样式。\n   全部走 DSH 主题令牌（--dsw-alias-*），浅色/深色自动跟随；令牌缺失时逐级兜底。 */\n\n.pu-root {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n  padding: 18px 20px 28px;\n  height: 100%;\n  box-sizing: border-box;\n  overflow-y: auto;\n  color: var(--dsw-alias-label-primary, inherit);\n  font-size: 13px;\n  line-height: 1.55;\n}\n\n/* ---------- 头部 ---------- */\n\n.pu-head {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 16px;\n}\n\n.pu-head-main h2 {\n  margin: 0;\n  font-size: 15px;\n  font-weight: 600;\n  letter-spacing: 0.2px;\n}\n\n.pu-head-main p {\n  margin: 3px 0 0;\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  font-size: 12px;\n}\n\n.pu-head-actions {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  flex: none;\n  flex-wrap: wrap;\n  justify-content: flex-end;\n  padding-top: 2px;\n}\n\n.pu-checked {\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  font-size: 11.5px;\n  white-space: nowrap;\n}\n\n/* 宿主半区代码版本：一眼看出跑的是不是新代码 */\n.pu-hostrev {\n  padding: 0 5px;\n  border-radius: var(--dsw-radius-xs, 4px);\n  border: 1px dashed var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.28));\n  color: var(--dsw-alias-label-dimmed, rgba(128, 128, 128, 0.7));\n  font-size: 10.5px;\n  line-height: 16px;\n  white-space: nowrap;\n  cursor: help;\n}\n\n/* ---------- 按钮 ---------- */\n\n.pu-btn {\n  appearance: none;\n  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.28));\n  background: transparent;\n  color: var(--dsw-alias-label-primary, inherit);\n  border-radius: var(--dsw-radius-md, 8px);\n  padding: 5px 12px;\n  font-size: 12.5px;\n  line-height: 1.4;\n  cursor: pointer;\n  transition: background-color 120ms ease, border-color 120ms ease, opacity 120ms ease;\n}\n\n.pu-btn:hover:not(:disabled) {\n  background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12));\n}\n\n.pu-btn:disabled {\n  opacity: 0.5;\n  cursor: default;\n}\n\n.pu-btn:focus-visible {\n  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe);\n  outline-offset: 1px;\n}\n\n.pu-btn-primary {\n  background: var(--dsw-alias-button-primary-fill, #4d6bfe);\n  border-color: transparent;\n  color: var(--dsw-alias-label-primary-foreground, #fff);\n  font-weight: 500;\n}\n\n.pu-btn-primary:hover:not(:disabled) {\n  background: var(--dsw-alias-button-primary-hover, #3f5ae0);\n}\n\n/* ---------- 摘要 ---------- */\n\n.pu-summary {\n  display: flex;\n  align-items: baseline;\n  gap: 10px;\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  font-size: 12px;\n}\n\n.pu-summary strong {\n  color: var(--dsw-alias-label-secondary, inherit);\n  font-weight: 600;\n  font-size: 12.5px;\n}\n\n.pu-summary-hot {\n  color: var(--dsw-alias-link, #4d6bfe) !important;\n}\n\n/* ---------- 列表 ---------- */\n\n.pu-group {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n}\n\n.pu-group-head {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin: 2px 0 0;\n  padding: 0 2px;\n  font-size: 11.5px;\n  font-weight: 600;\n  letter-spacing: 0.3px;\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n}\n\n.pu-group-count {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 16px;\n  height: 16px;\n  padding: 0 4px;\n  border-radius: 8px;\n  background: var(--dsw-alias-bg-skeleton, rgba(128, 128, 128, 0.14));\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  font-size: 10.5px;\n  font-weight: 500;\n  font-variant-numeric: tabular-nums;\n}\n\n.pu-list {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.pu-row {\n  position: relative;\n  display: grid;\n  grid-template-columns: 32px minmax(0, 1fr) auto auto;\n  align-items: center;\n  gap: 12px;\n  padding: 10px 12px;\n  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.22));\n  border-radius: var(--dsw-radius-lg, 10px);\n  background: var(--dsw-alias-bg-layer-1, rgba(128, 128, 128, 0.04));\n  transition: border-color 120ms ease, background-color 120ms ease;\n}\n\n.pu-row:hover {\n  border-color: var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.34));\n}\n\n.pu-row.is-update {\n  border-color: var(--dsw-alias-state-business-tertiary, rgba(77, 107, 254, 0.35));\n  background: var(--dsw-alias-bg-layer-2, rgba(77, 107, 254, 0.05));\n}\n\n.pu-icon {\n  width: 32px;\n  height: 32px;\n  border-radius: var(--dsw-radius-md, 8px);\n  overflow: hidden;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: var(--dsw-alias-bg-skeleton, rgba(128, 128, 128, 0.12));\n  color: var(--dsw-alias-label-secondary, inherit);\n  font-size: 14px;\n  font-weight: 600;\n  flex: none;\n}\n\n.pu-icon img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  display: block;\n}\n\n.pu-main {\n  min-width: 0;\n}\n\n.pu-rowhead {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  min-width: 0;\n}\n\n.pu-title {\n  font-weight: 600;\n  font-size: 13px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.pu-tag {\n  flex: none;\n  padding: 0 5px;\n  border-radius: var(--dsw-radius-xs, 4px);\n  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.28));\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  font-size: 10.5px;\n  line-height: 16px;\n}\n\n.pu-tag-muted {\n  opacity: 0.75;\n}\n\n/* 与当前 DSH 不兼容：更新按钮会被禁用，这个标签负责说明原因 */\n.pu-tag-warn {\n  border-color: var(--dsw-alias-state-warn-tertiary, rgba(245, 165, 36, 0.5));\n  color: var(--dsw-alias-state-warn-label, #b7791f);\n  cursor: help;\n}\n\n.pu-sub {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-top: 2px;\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  font-size: 11.5px;\n  min-width: 0;\n}\n\n.pu-sub code {\n  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Consolas, monospace);\n  font-size: 11px;\n  color: var(--dsw-alias-label-secondary, inherit);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.pu-dot {\n  opacity: 0.5;\n}\n\n.pu-note {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.pu-versions {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  flex: none;\n  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Consolas, monospace);\n  font-size: 11.5px;\n}\n\n.pu-v-old {\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n}\n\n.pu-v-new {\n  color: var(--dsw-alias-link, #4d6bfe);\n  font-weight: 600;\n}\n\n.pu-arrow {\n  color: var(--dsw-alias-label-dimmed, rgba(128, 128, 128, 0.6));\n  font-size: 11px;\n}\n\n.pu-actions {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 6px;\n  min-width: 64px;\n  flex: none;\n}\n\n/* 「打开地址」：本地装的是文件夹图标，远程装的是外链图标 */\n.pu-icon-btn {\n  appearance: none;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 26px;\n  height: 26px;\n  padding: 0;\n  flex: none;\n  border: 1px solid transparent;\n  border-radius: var(--dsw-radius-md, 8px);\n  background: transparent;\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  cursor: pointer;\n  transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;\n}\n\n.pu-icon-btn:hover {\n  background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12));\n  border-color: var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.28));\n  color: var(--dsw-alias-label-primary, inherit);\n}\n\n.pu-icon-btn:focus-visible {\n  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-alias-brand-primary, #4d6bfe);\n  outline-offset: 1px;\n}\n\n.pu-state {\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  font-size: 11.5px;\n  white-space: nowrap;\n}\n\n.pu-state-error {\n  color: var(--dsw-alias-state-error-primary, #e5484d);\n}\n\n.pu-row.is-busy {\n  opacity: 0.55;\n}\n\n/* ---------- 骨架 / 空态 ---------- */\n\n.pu-skeleton {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.pu-skeleton-line {\n  height: 52px;\n  border-radius: var(--dsw-radius-lg, 10px);\n  background: var(--dsw-alias-bg-skeleton, rgba(128, 128, 128, 0.12));\n  animation: pu-breathe 1.6s ease-in-out infinite;\n}\n\n@keyframes pu-breathe {\n  0%, 100% { opacity: 0.55; }\n  50% { opacity: 0.9; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .pu-skeleton-line { animation: none; }\n}\n\n.pu-empty {\n  padding: 24px 0;\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  font-size: 12.5px;\n  text-align: center;\n}\n\n.pu-banner {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 8px 12px;\n  border-radius: var(--dsw-radius-md, 8px);\n  font-size: 12px;\n}\n\n.pu-banner-error {\n  border: 1px solid var(--dsw-alias-state-error-secondary, rgba(229, 72, 77, 0.4));\n  background: var(--dsw-alias-state-error-tertiary, rgba(229, 72, 77, 0.1));\n  color: var(--dsw-alias-state-error-primary, #e5484d);\n}\n\n/* 打开成功也要有回执：否则「窗口在后面」和「根本没事发生」无法区分 */\n.pu-banner-ok {\n  border: 1px solid var(--dsw-alias-state-success-secondary, rgba(47, 158, 68, 0.35));\n  background: var(--dsw-alias-state-success-tertiary, rgba(47, 158, 68, 0.1));\n  color: var(--dsw-alias-state-success-primary, #2f9e44);\n}\n\n/* ---------- 安装源选择器 ---------- */\n\n.pu-source {\n  position: relative;\n  display: inline-flex;\n}\n\n.pu-source-btn {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  max-width: 230px;\n}\n\n.pu-source-tag {\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  font-size: 11.5px;\n}\n\n.pu-source-name {\n  font-weight: 500;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.pu-popover-mask {\n  position: fixed;\n  inset: 0;\n  z-index: 30;\n}\n\n.pu-popover {\n  position: absolute;\n  top: calc(100% + 6px);\n  right: 0;\n  z-index: 31;\n  width: 344px;\n  max-width: min(344px, calc(100vw - 48px));\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  padding: 6px;\n  border-radius: var(--dsw-radius-lg, 10px);\n  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.28));\n  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff));\n  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);\n  color: var(--dsw-alias-label-primary, inherit);\n}\n\n.pu-option {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  padding: 8px;\n  border-radius: var(--dsw-radius-md, 8px);\n  cursor: pointer;\n}\n\n.pu-option:hover {\n  background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12));\n}\n\n.pu-option.is-active {\n  background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.12));\n}\n\n.pu-option input[type="radio"] {\n  margin: 2px 0 0;\n  width: 13px;\n  height: 13px;\n  flex: none;\n  accent-color: var(--dsw-alias-brand-primary, #4d6bfe);\n  cursor: pointer;\n}\n\n.pu-option-custom {\n  cursor: default;\n  flex-direction: row;\n}\n\n.pu-option-main {\n  display: flex;\n  flex-direction: column;\n  gap: 5px;\n  min-width: 0;\n  flex: 1;\n}\n\n.pu-option-title {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  font-size: 12.5px;\n  font-weight: 500;\n}\n\n.pu-option-host {\n  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Consolas, monospace);\n  font-size: 11px;\n  font-weight: 400;\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n}\n\n.pu-option-hint {\n  margin: 0;\n  font-size: 11px;\n  line-height: 1.55;\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n}\n\n.pu-option-error {\n  margin: 0;\n  font-size: 11px;\n  color: var(--dsw-alias-state-error-primary, #e5484d);\n}\n\n.pu-input {\n  width: 100%;\n  box-sizing: border-box;\n  padding: 5px 8px;\n  border-radius: var(--dsw-radius-md, 8px);\n  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.28));\n  background: var(--dsw-alias-bg-layer-1, rgba(128, 128, 128, 0.05));\n  color: var(--dsw-alias-label-primary, inherit);\n  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Consolas, monospace);\n  font-size: 11.5px;\n  outline: none;\n}\n\n.pu-input::placeholder {\n  color: var(--dsw-alias-label-dimmed, rgba(128, 128, 128, 0.6));\n}\n\n.pu-input:focus {\n  border-color: var(--dsw-alias-brand-primary, #4d6bfe);\n}\n\n.pu-input.is-invalid {\n  border-color: var(--dsw-alias-state-error-primary, #e5484d);\n}\n\n.pu-option-apply {\n  align-self: flex-start;\n  margin-top: 1px;\n  padding: 4px 10px;\n  font-size: 12px;\n}\n\n/* ---------- 弹窗 ---------- */\n\n.pu-overlay {\n  position: fixed;\n  inset: 0;\n  z-index: 900;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 24px;\n  background: var(--dsw-alias-bg-mask-2, rgba(0, 0, 0, 0.45));\n  backdrop-filter: blur(2px);\n}\n\n.pu-dialog {\n  width: min(520px, 100%);\n  max-height: 100%;\n  display: flex;\n  flex-direction: column;\n  border-radius: var(--dsw-radius-xl, 14px);\n  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.28));\n  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #fff));\n  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);\n  color: var(--dsw-alias-label-primary, inherit);\n  overflow: hidden;\n}\n\n.pu-dialog-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 14px 16px;\n  border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.2));\n}\n\n.pu-dialog-head h3 {\n  margin: 0;\n  font-size: 14px;\n  font-weight: 600;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.pu-dialog-close {\n  appearance: none;\n  border: none;\n  background: transparent;\n  color: var(--dsw-alias-label-tertiary, inherit);\n  font-size: 18px;\n  line-height: 1;\n  padding: 2px 6px;\n  border-radius: var(--dsw-radius-xs, 4px);\n  cursor: pointer;\n}\n\n.pu-dialog-close:hover:not(:disabled) {\n  background: var(--dsw-alias-interactive-bg-hover, rgba(128, 128, 128, 0.14));\n}\n\n.pu-dialog-close:disabled {\n  opacity: 0.4;\n  cursor: default;\n}\n\n.pu-dialog-body {\n  padding: 16px;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  overflow-y: auto;\n}\n\n.pu-dialog-versions {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Consolas, monospace);\n  font-size: 13px;\n}\n\n.pu-dialog-text {\n  margin: 0;\n  color: var(--dsw-alias-label-secondary, inherit);\n  font-size: 12.5px;\n}\n\n.pu-dialog-warn {\n  margin: 0;\n  padding: 8px 10px;\n  border-radius: var(--dsw-radius-md, 8px);\n  border: 1px solid var(--dsw-alias-state-warn-tertiary, rgba(245, 165, 36, 0.4));\n  background: var(--dsw-alias-state-warn-tertiary, rgba(245, 165, 36, 0.1));\n  color: var(--dsw-alias-state-warn-label, #b7791f);\n  font-size: 12px;\n}\n\n.pu-dialog-meta {\n  margin: 0;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  font-size: 11.5px;\n}\n\n.pu-dialog-meta code {\n  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Consolas, monospace);\n  color: var(--dsw-alias-label-secondary, inherit);\n  word-break: break-all;\n}\n\n.pu-progress {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  font-size: 12.5px;\n  color: var(--dsw-alias-label-secondary, inherit);\n}\n\n.pu-spinner {\n  width: 14px;\n  height: 14px;\n  flex: none;\n  border-radius: 50%;\n  border: 2px solid var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.35));\n  border-top-color: var(--dsw-alias-brand-primary, #4d6bfe);\n  animation: pu-spin 0.9s linear infinite;\n}\n\n@keyframes pu-spin {\n  to { transform: rotate(360deg); }\n}\n\n.pu-dialog-ok {\n  margin: 0;\n  color: var(--dsw-alias-state-success-primary, #2f9e44);\n  font-size: 12.5px;\n  font-weight: 500;\n}\n\n.pu-dialog-error {\n  margin: 0;\n  color: var(--dsw-alias-state-error-primary, #e5484d);\n  font-size: 12.5px;\n}\n\n.pu-output {\n  border: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.2));\n  border-radius: var(--dsw-radius-md, 8px);\n  background: var(--dsw-alias-markdown-code-block, rgba(128, 128, 128, 0.06));\n  font-size: 11.5px;\n}\n\n.pu-output summary {\n  padding: 6px 10px;\n  cursor: pointer;\n  color: var(--dsw-alias-label-tertiary, rgba(128, 128, 128, 0.9));\n  user-select: none;\n}\n\n.pu-output pre {\n  margin: 0;\n  padding: 8px 10px 10px;\n  max-height: 220px;\n  overflow: auto;\n  font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Consolas, monospace);\n  font-size: 11px;\n  line-height: 1.5;\n  color: var(--dsw-alias-label-secondary, inherit);\n  white-space: pre-wrap;\n  word-break: break-all;\n}\n\n.pu-dialog-foot {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 8px;\n  padding: 12px 16px;\n  border-top: 1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.2));\n}\n';

// src/client.jsx
var name = "dsh-plugin-updater";
var inject = ["slots"];
var ENDPOINT = "/dsh-plugin-updater/api";
var T = {
  title: "更新",
  heading: "插件更新",
  subtitle: "检查已安装插件在注册表 / Git 上的最新版本，一键重装升级。",
  refresh: "刷新",
  refreshing: "检查中…",
  checkedAt: (time) => `上次检查 ${time}`,
  never: "尚未检查",
  hostRev: (rev) => `宿主 ${rev}`,
  hostRevHint: "宿主半区代码的版本号。若它比 package.json 的版本旧，说明 DSH 里跑着的还是旧代码——重启 DSH 才生效。",
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
  sourcePick: "选择安装源"
};
var SOURCE_KEY = "dsh-plugin-updater:source:v1";
var CUSTOM_KEY = "dsh-plugin-updater:custom:v1";
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
  }
}
function hostOf(url) {
  return String(url || "").replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}
function FolderIcon() {
  return /* @__PURE__ */ import_react.default.createElement(
    "svg",
    {
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    /* @__PURE__ */ import_react.default.createElement("path", { d: "M3 7.5A1.5 1.5 0 0 1 4.5 6h3.9a1.5 1.5 0 0 1 1.2.6L11 8.2h8.5A1.5 1.5 0 0 1 21 9.7v7.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" })
  );
}
function LinkIcon() {
  return /* @__PURE__ */ import_react.default.createElement(
    "svg",
    {
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    /* @__PURE__ */ import_react.default.createElement("path", { d: "M10.5 13.5a4.5 4.5 0 0 0 6.4 0l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1" }),
    /* @__PURE__ */ import_react.default.createElement("path", { d: "M13.5 10.5a4.5 4.5 0 0 0-6.4 0l-2.6 2.6a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1" })
  );
}
function errorText(payload, fallback) {
  if (payload === null || payload === void 0) return fallback;
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
    body: JSON.stringify(payload)
  });
}
function clockText(timestamp) {
  if (typeof timestamp !== "number" || timestamp <= 0) return "";
  const date = new Date(timestamp);
  const sameDay = date.toDateString() === (/* @__PURE__ */ new Date()).toDateString();
  const time = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return time;
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${time}`;
}
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
function compatText(compat) {
  if (compat === null || compat === void 0 || compat.ok !== false) return "";
  return Object.entries(compat.requirements || {}).map(([key, value]) => `${key} ${value}`).join("、");
}
function RowAction({ row, runtime, onUpdate }) {
  const incompatible = row.compat !== null && row.compat !== void 0 && row.compat.ok === false;
  if (row.status === "update" || row.status === "manual" && row.updatable === true) {
    const label = row.status === "update" ? T.update : T.reinstall;
    if (incompatible) {
      return /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          type: "button",
          className: "pu-btn",
          disabled: true,
          title: T.compatDetail(compatText(row.compat), runtime)
        },
        label
      );
    }
    return /* @__PURE__ */ import_react.default.createElement(
      "button",
      {
        type: "button",
        className: "pu-btn pu-btn-primary",
        onClick: () => onUpdate(row),
        title: row.note || ""
      },
      label
    );
  }
  const text = row.status === "local" ? T.statusLocal : row.status === "latest" ? T.statusLatest : row.status === "error" ? T.statusError : T.statusSkipped;
  const tone = row.status === "error" ? " pu-state-error" : "";
  return /* @__PURE__ */ import_react.default.createElement("span", { className: `pu-state${tone}`, title: row.note || "" }, text);
}
function UpdateRow({ row, runtime, onUpdate, onOpen, busy }) {
  const initial = String(row.title || row.name || "?").trim().slice(0, 1).toUpperCase();
  const target = row.latest || "";
  const showArrow = target !== "" && target !== row.version && row.status !== "manual";
  const openLabel = row.open?.kind === "folder" ? T.openFolder : T.openRepo;
  const incompatible = row.compat !== null && row.compat !== void 0 && row.compat.ok === false;
  return /* @__PURE__ */ import_react.default.createElement("div", { className: `pu-row${row.status === "update" ? " is-update" : ""}${busy ? " is-busy" : ""}` }, /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-icon" }, row.icon ? /* @__PURE__ */ import_react.default.createElement("img", { src: row.icon, alt: "", draggable: false }) : /* @__PURE__ */ import_react.default.createElement("span", null, initial)), /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-main" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-rowhead" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-title" }, row.title || row.name), row.official ? /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-tag" }, T.tagOfficial) : null, row.enabled === false ? /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-tag pu-tag-muted" }, T.tagOff) : null, incompatible ? /* @__PURE__ */ import_react.default.createElement(
    "span",
    {
      className: "pu-tag pu-tag-warn",
      title: T.compatDetail(compatText(row.compat), runtime)
    },
    T.tagIncompatible
  ) : null), /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-sub" }, /* @__PURE__ */ import_react.default.createElement("code", null, row.name), row.note ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-dot" }, "·"), /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-note" }, row.note)) : null)), /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-versions" }, /* @__PURE__ */ import_react.default.createElement("code", { className: "pu-v-old" }, row.version || "—"), showArrow ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-arrow" }, "→"), /* @__PURE__ */ import_react.default.createElement("code", { className: "pu-v-new" }, target)) : null), /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-actions" }, row.open ? /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      type: "button",
      className: "pu-icon-btn",
      title: `${openLabel}：${row.open.target}`,
      "aria-label": openLabel,
      onClick: () => onOpen(row)
    },
    row.open.kind === "folder" ? /* @__PURE__ */ import_react.default.createElement(FolderIcon, null) : /* @__PURE__ */ import_react.default.createElement(LinkIcon, null)
  ) : null, /* @__PURE__ */ import_react.default.createElement(RowAction, { row, runtime, onUpdate })));
}
function Chevron() {
  return /* @__PURE__ */ import_react.default.createElement(
    "svg",
    {
      width: "10",
      height: "10",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.4",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    /* @__PURE__ */ import_react.default.createElement("path", { d: "M6 9l6 6 6-6" })
  );
}
function SourcePicker({ options, source, onChoose, disabled }) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const [draft, setDraft] = (0, import_react.useState)(() => readStored(CUSTOM_KEY));
  const [error, setError] = (0, import_react.useState)("");
  const known = options.some((option) => option.url === source);
  const label = source === "" ? T.sourceAuto : options.find((option) => option.url === source)?.label || hostOf(source);
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
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-source" }, /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      type: "button",
      className: "pu-btn pu-source-btn",
      "aria-haspopup": "true",
      "aria-expanded": open,
      disabled,
      onClick: () => setOpen((value) => !value)
    },
    /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-source-tag" }, T.source),
    /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-source-name" }, label),
    /* @__PURE__ */ import_react.default.createElement(Chevron, null)
  ), open ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-popover-mask", onClick: () => setOpen(false) }), /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-popover", role: "radiogroup", "aria-label": T.sourcePick }, /* @__PURE__ */ import_react.default.createElement("label", { className: `pu-option${source === "" ? " is-active" : ""}` }, /* @__PURE__ */ import_react.default.createElement(
    "input",
    {
      type: "radio",
      checked: source === "",
      onChange: () => {
        setOpen(false);
        onChoose("");
      }
    }
  ), /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-option-main" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-option-title" }, T.sourceAuto), /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-option-hint" }, T.sourceAutoHint))), options.map((option) => /* @__PURE__ */ import_react.default.createElement("label", { className: `pu-option${source === option.url ? " is-active" : ""}`, key: option.url }, /* @__PURE__ */ import_react.default.createElement(
    "input",
    {
      type: "radio",
      checked: source === option.url,
      onChange: () => {
        setOpen(false);
        onChoose(option.url);
      }
    }
  ), /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-option-main" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-option-title" }, option.label, /* @__PURE__ */ import_react.default.createElement("code", { className: "pu-option-host" }, hostOf(option.url)))))), /* @__PURE__ */ import_react.default.createElement("div", { className: `pu-option pu-option-custom${isCustom ? " is-active" : ""}` }, /* @__PURE__ */ import_react.default.createElement(
    "input",
    {
      type: "radio",
      checked: isCustom,
      onChange: () => setDraft(source !== "" && !known ? source : draft),
      "aria-label": T.sourceCustom
    }
  ), /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-option-main" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-option-title" }, T.sourceCustom), /* @__PURE__ */ import_react.default.createElement(
    "input",
    {
      type: "text",
      className: `pu-input${error !== "" ? " is-invalid" : ""}`,
      placeholder: "https://npm.example.com/",
      value: draft,
      onChange: (event) => {
        setDraft(event.target.value);
        setError("");
      },
      onKeyDown: (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submitCustom();
        }
      }
    }
  ), /* @__PURE__ */ import_react.default.createElement("p", { className: "pu-option-hint" }, T.sourceCustomHint), error !== "" ? /* @__PURE__ */ import_react.default.createElement("p", { className: "pu-option-error" }, error) : null, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "pu-btn pu-btn-primary pu-option-apply", onClick: submitCustom }, "使用这个地址"))))) : null);
}
function Output({ text }) {
  if (typeof text !== "string" || text.trim() === "") return null;
  const tail = text.split("\n").slice(-400).join("\n");
  return /* @__PURE__ */ import_react.default.createElement("details", { className: "pu-output" }, /* @__PURE__ */ import_react.default.createElement("summary", null, T.details), /* @__PURE__ */ import_react.default.createElement("pre", null, tail));
}
function Dialog({ dialog, onCancel, onConfirm, onClose, labelOf, runtime }) {
  if (dialog === null) return null;
  const { row, mode, job } = dialog;
  const title = row.title || row.name;
  const sourceText = row.registry ? labelOf(row.registry) : T.sourceAuto;
  let body = null;
  if (mode === "confirm") {
    body = /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-dialog-versions" }, /* @__PURE__ */ import_react.default.createElement("code", { className: "pu-v-old" }, row.version || "—"), row.latest ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-arrow" }, "→"), /* @__PURE__ */ import_react.default.createElement("code", { className: "pu-v-new" }, row.latest)) : null), /* @__PURE__ */ import_react.default.createElement("p", { className: "pu-dialog-text" }, T.confirmHint), row.compat !== null && row.compat !== void 0 && row.compat.ok === false ? /* @__PURE__ */ import_react.default.createElement("p", { className: "pu-dialog-warn" }, T.compatDetail(compatText(row.compat), runtime)) : null, /* @__PURE__ */ import_react.default.createElement("p", { className: "pu-dialog-warn" }, T.confirmRisk), row.enabled === false ? /* @__PURE__ */ import_react.default.createElement("p", { className: "pu-dialog-text" }, T.confirmEnabledOff) : null, /* @__PURE__ */ import_react.default.createElement("p", { className: "pu-dialog-meta" }, /* @__PURE__ */ import_react.default.createElement("span", null, T.confirmSource), /* @__PURE__ */ import_react.default.createElement("code", null, sourceText)));
  } else if (mode === "running") {
    body = /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-progress" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-spinner", "aria-hidden": "true" }), /* @__PURE__ */ import_react.default.createElement("span", null, job?.stageText || T.running)), /* @__PURE__ */ import_react.default.createElement(Output, { text: job?.output }));
  } else if (mode === "done") {
    body = /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "pu-dialog-ok" }, job?.message || ""), /* @__PURE__ */ import_react.default.createElement(Output, { text: job?.output }));
  } else if (mode === "cancelled") {
    body = /* @__PURE__ */ import_react.default.createElement("p", { className: "pu-dialog-warn" }, job?.message || T.stopped);
  } else {
    body = /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("p", { className: "pu-dialog-error" }, job?.message || dialog.message || T.failedTitle), /* @__PURE__ */ import_react.default.createElement(Output, { text: job?.output }));
  }
  const running = mode === "running";
  const footer = mode === "confirm" ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "pu-btn", onClick: onClose }, T.cancel), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "pu-btn pu-btn-primary", onClick: onConfirm }, T.start)) : running ? /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "pu-btn", onClick: onCancel }, T.cancel) : mode === "failed" ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "pu-btn", onClick: onClose }, T.close), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "pu-btn pu-btn-primary", onClick: onConfirm }, T.retry)) : /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "pu-btn pu-btn-primary", onClick: onClose }, T.close);
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ import_react.default.createElement(
      "div",
      {
        className: "pu-overlay",
        role: "presentation",
        onClick: (event) => {
          if (event.target === event.currentTarget && !running) onClose();
        }
      },
      /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-dialog", role: "dialog", "aria-modal": "true", "aria-label": T.confirmTitle(title) }, /* @__PURE__ */ import_react.default.createElement("header", { className: "pu-dialog-head" }, /* @__PURE__ */ import_react.default.createElement("h3", null, mode === "confirm" ? T.confirmTitle(title) : title), /* @__PURE__ */ import_react.default.createElement(
        "button",
        {
          type: "button",
          className: "pu-dialog-close",
          "aria-label": T.close,
          onClick: onClose,
          disabled: running
        },
        "×"
      )), /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-dialog-body" }, body), /* @__PURE__ */ import_react.default.createElement("footer", { className: "pu-dialog-foot" }, footer))
    ),
    document.body
  );
}
function UpdatesTab() {
  const [state, setState] = (0, import_react.useState)({ phase: "loading", data: null, error: "" });
  const [dialog, setDialog] = (0, import_react.useState)(null);
  const [source, setSource] = (0, import_react.useState)(() => readStored(SOURCE_KEY));
  const sourceRef = (0, import_react.useRef)(source);
  const mounted = (0, import_react.useRef)(true);
  (0, import_react.useEffect)(() => () => {
    mounted.current = false;
  }, []);
  const load = (0, import_react.useCallback)(async (refresh, wanted) => {
    const registry = wanted === void 0 ? sourceRef.current : wanted;
    setState((prev) => ({ phase: prev.data === null ? "loading" : "refreshing", data: prev.data, error: "" }));
    try {
      const query = `${refresh ? "?refresh=1" : "?"}${registry === "" ? "" : `registry=${encodeURIComponent(registry)}`}`;
      const data2 = await call(`/state${query}`);
      if (!mounted.current) return;
      setState({ phase: "ready", data: data2, error: "" });
    } catch (error) {
      if (!mounted.current) return;
      setState((prev) => ({
        phase: prev.data === null ? "error" : "ready",
        data: prev.data,
        error: String(error?.message || error)
      }));
    }
  }, []);
  (0, import_react.useEffect)(() => {
    void load(false);
  }, [load]);
  const chooseSource = (0, import_react.useCallback)((next) => {
    if (next === sourceRef.current) return;
    sourceRef.current = next;
    setSource(next);
    writeStored(SOURCE_KEY, next);
    void load(true, next);
  }, [load]);
  const startUpdate = (0, import_react.useCallback)(async (row) => {
    setDialog({ row, mode: "running", job: null, message: "" });
    try {
      const answer = await postJson("/update", { name: row.name, registry: sourceRef.current });
      if (!mounted.current) return;
      setDialog((prev) => prev === null ? prev : { ...prev, job: answer.job });
    } catch (error) {
      if (!mounted.current) return;
      setDialog((prev) => prev === null ? prev : { ...prev, mode: "failed", message: String(error?.message || error) });
    }
  }, []);
  const jobId = dialog?.mode === "running" ? dialog.job?.id : void 0;
  (0, import_react.useEffect)(() => {
    if (jobId === void 0) return void 0;
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
      }
    };
    void poll();
    const timer = setInterval(poll, 800);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [jobId, load]);
  const requestCancel = (0, import_react.useCallback)(async () => {
    const id = dialog?.job?.id;
    if (id === void 0) return;
    try {
      await postJson("/cancel", { id });
    } catch {
    }
  }, []);
  const [notice, setNotice] = (0, import_react.useState)(null);
  const openTarget = (0, import_react.useCallback)(async (row) => {
    setNotice(null);
    try {
      const answer = await postJson("/open", { name: row.name });
      setNotice({
        kind: "ok",
        text: `已交给系统打开：${answer.target || row.open?.target || row.name}${answer.via ? `（${answer.via}）` : ""}`
      });
    } catch (error) {
      setNotice({ kind: "error", text: String(error?.message || error) });
    }
  }, []);
  const data = state.data;
  const rows = data?.rows ? sortRows(data.rows) : [];
  const counts = data?.counts || { total: 0, updates: 0 };
  const busy = dialog !== null && dialog.mode === "running";
  const labelOf = (0, import_react.useCallback)((url) => {
    const options = data?.sources?.options || [];
    const host = hostOf(url);
    const label = options.find((option) => option.url === url)?.label || "";
    return label !== "" && label !== host ? `${label} · ${host}` : host;
  }, [data]);
  const groups = (0, import_react.useMemo)(() => {
    const enabled = rows.filter((row) => row.enabled === true);
    const disabled = rows.filter((row) => row.enabled !== true);
    return [
      { key: "enabled", title: T.groupEnabled, items: enabled },
      { key: "disabled", title: T.groupDisabled, items: disabled }
    ].filter((group) => group.items.length > 0);
  }, [rows]);
  return /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-root" }, /* @__PURE__ */ import_react.default.createElement("header", { className: "pu-head" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-head-main" }, /* @__PURE__ */ import_react.default.createElement("h2", null, T.heading), /* @__PURE__ */ import_react.default.createElement("p", null, T.subtitle)), /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-head-actions" }, /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-checked" }, data?.checkedAt ? T.checkedAt(clockText(data.checkedAt)) : T.never), /* @__PURE__ */ import_react.default.createElement(
    "span",
    {
      className: "pu-hostrev",
      title: T.hostRevHint
    },
    T.hostRev(data?.hostRev || "?")
  ), /* @__PURE__ */ import_react.default.createElement(
    SourcePicker,
    {
      options: data?.sources?.options || [],
      source,
      onChoose: chooseSource,
      disabled: busy
    }
  ), /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      type: "button",
      className: "pu-btn",
      onClick: () => void load(true),
      disabled: state.phase === "loading" || state.phase === "refreshing" || busy
    },
    state.phase === "refreshing" ? T.refreshing : T.refresh
  ))), state.error !== "" ? /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-banner pu-banner-error" }, /* @__PURE__ */ import_react.default.createElement("span", null, state.error), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "pu-btn", onClick: () => void load(true) }, T.retry)) : null, notice !== null ? /* @__PURE__ */ import_react.default.createElement("div", { className: `pu-banner ${notice.kind === "ok" ? "pu-banner-ok" : "pu-banner-error"}` }, /* @__PURE__ */ import_react.default.createElement("span", null, notice.text), /* @__PURE__ */ import_react.default.createElement("button", { type: "button", className: "pu-btn", onClick: () => setNotice(null) }, T.close)) : null, state.phase === "loading" ? /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-skeleton" }, /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-skeleton-line" }), /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-skeleton-line" }), /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-skeleton-line" })) : rows.length === 0 ? /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-empty" }, state.phase === "error" ? state.error : T.empty) : /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-summary" }, /* @__PURE__ */ import_react.default.createElement("strong", { className: counts.updates > 0 ? "pu-summary-hot" : "" }, counts.updates > 0 ? T.summaryUpdates(counts.updates) : T.allFresh), /* @__PURE__ */ import_react.default.createElement("span", null, T.summaryTotal(counts.total))), groups.map((group) => /* @__PURE__ */ import_react.default.createElement("section", { className: "pu-group", key: group.key }, /* @__PURE__ */ import_react.default.createElement("h3", { className: "pu-group-head" }, /* @__PURE__ */ import_react.default.createElement("span", null, group.title), /* @__PURE__ */ import_react.default.createElement("span", { className: "pu-group-count" }, group.items.length)), /* @__PURE__ */ import_react.default.createElement("div", { className: "pu-list" }, group.items.map((row) => /* @__PURE__ */ import_react.default.createElement(
    UpdateRow,
    {
      key: row.name,
      row,
      runtime: data?.runtime || "",
      busy: busy && dialog?.row?.name === row.name,
      onUpdate: (target) => setDialog({ row: target, mode: "confirm", job: null, message: "" }),
      onOpen: (target) => void openTarget(target)
    }
  )))))), /* @__PURE__ */ import_react.default.createElement(
    Dialog,
    {
      dialog,
      onCancel: () => void requestCancel(),
      onConfirm: () => {
        const row = dialog?.row;
        if (row) void startUpdate(row);
      },
      onClose: () => setDialog(null),
      labelOf,
      runtime: data?.runtime || ""
    }
  ));
}
function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.dshPlugin = name;
    style.textContent = styles_default;
    document.head.appendChild(style);
    return () => style.remove();
  }, "dsh-plugin-updater: styles");
  ctx.effect(() => ctx.slots.inject("plugins.tab", () => ctx.slots.register({
    name: "plugins.tab",
    id: "updater",
    label: () => T.title
  }, UpdatesTab)), "dsh-plugin-updater: updates tab");
}
return module.exports;}});
