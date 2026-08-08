(() => {
  "use strict";
  const STORAGE_KEY = "editorsTeam.editors.v1";
  const DEFAULT_AVATAR = "./assets/images/default-avatar.svg";
  let editorsData = [];

  function escapeText(value) {
    return String(value ?? "").replace(/[&<>'"]/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[char]);
  }

  function safeUrl(value) {
    const url = String(value || "").trim();
    if (!url) return "";
    try {
      const parsed = new URL(url, window.location.href);
      return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
    } catch (_) { return ""; }
  }

  function normalizeEditor(editor, index) {
    return {
      id: String(editor.id || `editor-${Date.now()}-${index}`),
      fullName: String(editor.fullName || "بدون نام"),
      badge: String(editor.badge || "ادیتور"),
      age: String(editor.age || "—"),
      specialty: String(editor.specialty || "—"),
      city: String(editor.city || "—"),
      bio: String(editor.bio || ""),
      image: String(editor.image || DEFAULT_AVATAR),
      verified: Boolean(editor.verified),
      online: Boolean(editor.online),
      rating: String(editor.rating || "—"),
      projects: String(editor.projects || "۰"),
      portfolioImages: Array.isArray(editor.portfolioImages) ? editor.portfolioImages.filter(Boolean).map(String) : [],
      portfolioMedia: Array.isArray(editor.portfolioMedia) ? editor.portfolioMedia.filter(Boolean).map(item => {
        if (typeof item === "string") return {src:item,type:/\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(item)?"video":"image"};
        const src=String(item?.src||"");
        return {src,type:item?.type==="video"?"video":"image",title:String(item?.title||"")};
      }).filter(item=>item.src) : [],
      active: editor.active !== false,
      order: Number(editor.order ?? index + 1)
    };
  }

  function readEditorsBackup() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value.map(normalizeEditor) : [];
    } catch (_) { return []; }
  }

  async function loadEditors() {
    try {
      const response = await fetch("./data/editors.json?v=6.2.0", { cache: "no-cache" });
      if (!response.ok) throw new Error("editors.json not found");
      const value = await response.json();
      if (!Array.isArray(value)) throw new Error("editors.json invalid");
      editorsData = value.map(normalizeEditor);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (_) {
      editorsData = readEditorsBackup();
    }
  }

  function info(icon, label, value) {
    return `<div class="editor-info-item"><span class="editor-info-icon">${icon}</span><span><small>${label}</small><b>${escapeText(value)}</b></span></div>`;
  }

  function renderEditors() {
    const list = document.getElementById("editorsList");
    if (!list) return;
    const visible = editorsData.filter(item => item.active).sort((a,b) => a.order - b.order);
    if (!visible.length) {
      list.innerHTML = '<div class="empty">هنوز ادیتوری ثبت نشده است.</div>';
      return;
    }
    list.innerHTML = visible.map(editor => {
      const mediaCount = editor.portfolioMedia.length || editor.portfolioImages.length;
      const portfolio = mediaCount
        ? `<a class="editor-portfolio" href="./portfolio.html?id=${encodeURIComponent(editor.id)}" data-editor-id="${escapeText(editor.id)}">مشاهده نمونه‌کارها <span>◀</span></a>`
        : `<span class="editor-portfolio disabled">نمونه‌کاری ثبت نشده</span>`;
      return `<article class="editor-card">
        <div class="editor-header">
          <div class="editor-avatar-wrap">
            <img class="editor-avatar" src="${escapeText(editor.image)}" alt="تصویر ${escapeText(editor.fullName)}" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}'">
            <span class="editor-status ${editor.online ? "online" : "offline"}" title="${editor.online ? "آنلاین" : "آفلاین"}"></span>
          </div>
          <div class="editor-heading">
            <div class="editor-identity"><h3>${escapeText(editor.fullName)} ${editor.verified ? '<span class="verified" title="عضو تأییدشده">✓</span>' : ''}</h3><p class="editor-badge">${escapeText(editor.badge)}</p></div>
            <div class="editor-score"><span>★ ${escapeText(editor.rating)}</span><small>${escapeText(editor.projects)} پروژه</small></div>
          </div>
        </div>
        <div class="editor-main">
          ${editor.bio ? `<p class="editor-bio">${escapeText(editor.bio)}</p>` : ""}
          <div class="editor-details">
            ${info("🎂", "سن", editor.age + (editor.age !== "—" ? " سال" : ""))}
            ${info("💼", "حوزه کاری", editor.specialty)}
            ${info("📍", "شهر", editor.city)}
          </div>
        </div>
        <div class="editor-action">${portfolio}</div>
      </article>`;
    }).join("");
  }


  document.addEventListener("click", event => {
    const link = event.target.closest("a.editor-portfolio[data-editor-id]");
    if (!link) return;
    const editor = editorsData.find(item => String(item.id) === String(link.dataset.editorId));
    if (!editor) return;
    try {
      sessionStorage.setItem("editorsTeam.selectedEditor", JSON.stringify(editor));
    } catch (_) {}
  });

  async function initializeEditors() { await loadEditors(); renderEditors(); }
  window.renderEditors = renderEditors;
  window.EditorsStore = { STORAGE_KEY, loadEditors, renderEditors };
  document.addEventListener("DOMContentLoaded", initializeEditors);
})();
