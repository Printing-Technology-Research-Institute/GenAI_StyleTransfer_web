/**
 * 前台四步驟精靈：經典 / IP合照，讀取 CatalogStore。
 */
(function (global) {
  /** @type {CatalogConfig} */
  let catalog = CatalogStore.loadCatalog();

  const state = {
    route: "", // classic | ip
    characterId: "",
    ceramicId: "",
    styleId: "",
    ipId: "",
    backgroundId: "",
    outputId: "",
    wizardStep: 1,
    rawResultUrl: "",
    framedResultUrl: "",
    selectedFrameId: "",
  };

  /**
   * 重新載入目錄（從後台回來時用）。
   * @returns {void}
   */
  function reloadCatalog() {
    catalog = CatalogStore.loadCatalog();
  }

  /**
   * @returns {object|null}
   */
  function currentCharacter() {
    return (
      (catalog.characters || []).find((x) => x.id === state.characterId) || null
    );
  }

  /**
   * @param {string} route
   * @returns {number}
   */
  function maxStep(route) {
    if (route === "ip") return 4;
    if (route === "classic") {
      return CatalogStore.characterNeedsCeramics(currentCharacter()) ? 5 : 4;
    }
    return 1;
  }

  /**
   * 經典：1路線 2角色 →（玉器）→ 風格 → 輸出；風格清單為角色專屬。
   * style_only：略過玉器。
   * IP：1路線 2IP 3背景 4輸出
   * @returns {void}
   */
  function renderWizard() {
    reloadCatalog();
    const stepLabel = document.getElementById("wizard-step-label");
    const body = document.getElementById("wizard-body");
    const hint = document.getElementById("wizard-hint");
    if (!body) return;

    const route = state.route;
    const step = state.wizardStep;
    const ch = currentCharacter();
    const needsCeramic = CatalogStore.characterNeedsCeramics(ch);

    if (!route || step === 1) {
      if (stepLabel) stepLabel.textContent = "Step 1 · 大分項";
      if (hint) hint.textContent = "選擇「經典」或「IP合照」";
      body.innerHTML = "";
      body.appendChild(
        choiceGrid(
          [
            { id: "classic", name: "經典", emoji: "🏛️", desc: "角色 →（玉器）→ 風格" },
            { id: "ip", name: "IP合照", emoji: "🤝", desc: "選擇 IP → 背景 → 輸出" },
          ],
          state.route,
          (id) => {
            state.route = id;
            state.wizardStep = 2;
            state.characterId = state.ceramicId = state.styleId = "";
            state.ipId = state.backgroundId = state.outputId = "";
            renderWizard();
            updatePromptPreview();
          }
        )
      );
      syncWizardNav();
      return;
    }

    if (route === "classic") {
      if (step === 2) {
        if (stepLabel) stepLabel.textContent = "Step 2 · 選擇角色（中項目）";
        if (hint) {
          hint.textContent =
            "「與上傳圖片互動」會選玉器；「純風格轉換」只選風格";
        }
        renderItemGrid(
          body,
          CatalogStore.enabledOnly(catalog.characters),
          state.characterId,
          (id) => {
            state.characterId = id;
            state.ceramicId = "";
            state.styleId = "";
            renderWizard();
            updatePromptPreview();
          },
          "emoji"
        );
      } else if (needsCeramic && step === 3) {
        if (stepLabel) stepLabel.textContent = "Step 3 · 選擇玉器／文物";
        if (hint) {
          hint.textContent = ch
            ? "會把玉器圖與上傳照拼成參考圖再送 API，讓生成物件盡量一致"
            : "先選玉器，下一步再選風格";
        }
        renderItemGrid(
          body,
          CatalogStore.enabledOnly(catalog.ceramics),
          state.ceramicId,
          (id) => {
            state.ceramicId = id;
            renderWizard();
            updatePromptPreview();
          },
          "src"
        );
      } else if (
        (needsCeramic && step === 4) ||
        (!needsCeramic && step === 3)
      ) {
        const styleStep = needsCeramic ? 4 : 3;
        if (stepLabel) {
          stepLabel.textContent =
            "Step " + styleStep + " · 選擇風格（此角色專屬）";
        }
        if (hint) {
          hint.textContent =
            "風格清單僅屬於「" +
            ((ch && ch.name) || "此角色") +
            "」，刪除不影響其他角色";
        }
        renderItemGrid(
          body,
          CatalogStore.enabledOnly(CatalogStore.getCharacterStyles(ch)),
          state.styleId,
          (id) => {
            state.styleId = id;
            renderWizard();
            updatePromptPreview();
          },
          "emoji"
        );
      } else {
        const outStep = needsCeramic ? 5 : 4;
        if (stepLabel) stepLabel.textContent = "Step " + outStep + " · 輸出規格";
        if (hint) hint.textContent = "比例會影響生成尺寸（後台可上架）";
        renderOutputGrid(body);
      }
    } else {
      if (step === 2) {
        if (stepLabel) stepLabel.textContent = "Step 2 · 選擇 IP";
        if (hint) hint.textContent = "僅顯示後台有開啟的 IP；各有專屬 prompt";
        renderItemGrid(
          body,
          CatalogStore.enabledOnly(catalog.ips),
          state.ipId,
          (id) => {
            state.ipId = id;
            renderWizard();
            updatePromptPreview();
          },
          "src"
        );
      } else if (step === 3) {
        if (stepLabel) stepLabel.textContent = "Step 3 · 選擇背景";
        if (hint) hint.textContent = "必選一個（含「無」）";
        renderItemGrid(
          body,
          CatalogStore.enabledOnly(catalog.backgrounds),
          state.backgroundId,
          (id) => {
            state.backgroundId = id;
            renderWizard();
            updatePromptPreview();
          },
          "emoji"
        );
      } else {
        if (stepLabel) stepLabel.textContent = "Step 4 · 輸出規格";
        if (hint) hint.textContent = "比例會影響生成尺寸";
        renderOutputGrid(body);
      }
    }
    syncWizardNav();
    syncStepDots();
  }

  /**
   * @param {HTMLElement} body
   */
  function renderOutputGrid(body) {
    const items = CatalogStore.enabledOnly(catalog.outputs).map((o) => ({
      id: o.id,
      name: o.name,
      emoji: "📐",
      desc: o.ratio + (o.apiSize ? " · " + o.apiSize : ""),
    }));
    renderItemGrid(body, items, state.outputId, (id) => {
      state.outputId = id;
      renderWizard();
      updatePromptPreview();
    }, "emoji");
  }

  /**
   * @param {{id:string,name:string,emoji?:string,desc?:string,src?:string}[]} items
   * @param {string} selectedId
   * @param {(id:string)=>void} onPick
   * @returns {HTMLElement}
   */
  function choiceGrid(items, selectedId, onPick) {
    return renderItemGrid(document.createElement("div"), items, selectedId, onPick, "emoji");
  }

  /**
   * @param {HTMLElement} container
   * @param {any[]} items
   * @param {string} selectedId
   * @param {(id:string)=>void} onPick
   * @param {"emoji"|"src"} visual
   * @returns {HTMLElement}
   */
  function renderItemGrid(container, items, selectedId, onPick, visual) {
    container.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "style-grid";
    if (!items.length) {
      container.innerHTML = '<p class="fixed-scene-note">尚無上架項目，請到後台新增並設為「顯示」。</p>';
      return container;
    }
    items.forEach((item) => {
      const btn = document.createElement("div");
      btn.className = "style-btn" + (item.id === selectedId ? " selected" : "");
      if (visual === "src" && item.src) {
        btn.innerHTML = `<img class="ip-thumb" src="${item.src}" alt="${item.name}"><span class="name">${item.name}</span><span class="desc">${item.desc || ""}</span>`;
      } else {
        btn.innerHTML = `<span class="emoji">${item.emoji || "•"}</span><span class="name">${item.name}</span><span class="desc">${item.desc || item.ratio || ""}</span>`;
      }
      btn.onclick = () => onPick(item.id);
      grid.appendChild(btn);
    });
    container.appendChild(grid);
    return container;
  }

  /**
   * @returns {void}
   */
  function syncWizardNav() {
    const back = document.getElementById("wizard-back");
    const next = document.getElementById("wizard-next");
    if (!back || !next) return;
    back.style.visibility = state.wizardStep > 1 ? "visible" : "hidden";
    const atEnd = state.route && state.wizardStep >= maxStep(state.route);
    next.textContent = atEnd ? "完成選擇" : "下一步";
    next.disabled = !canProceed();
  }

  /**
   * @returns {boolean}
   */
  function canProceed() {
    if (state.wizardStep === 1) return !!state.route;
    if (state.route === "classic") {
      const needsCeramic = CatalogStore.characterNeedsCeramics(currentCharacter());
      if (state.wizardStep === 2) return !!state.characterId;
      if (needsCeramic) {
        if (state.wizardStep === 3) return !!state.ceramicId;
        if (state.wizardStep === 4) return !!state.styleId;
        if (state.wizardStep === 5) return !!state.outputId;
      } else {
        if (state.wizardStep === 3) return !!state.styleId;
        if (state.wizardStep === 4) return !!state.outputId;
      }
    }
    if (state.route === "ip") {
      if (state.wizardStep === 2) return !!state.ipId;
      if (state.wizardStep === 3) return !!state.backgroundId;
      if (state.wizardStep === 4) return !!state.outputId;
    }
    return false;
  }

  /**
   * @returns {void}
   */
  function syncStepDots() {
    const d2 = document.getElementById("step2-dot");
    if (d2) d2.classList.toggle("done", !!state.outputId || !!state.route);
  }

  /**
   * @returns {string}
   */
  function buildWizardPrompt() {
    if (state.route === "classic") {
      const ch = currentCharacter();
      const st = CatalogStore.getCharacterStyles(ch).find(
        (x) => x.id === state.styleId
      );
      const out = catalog.outputs.find((x) => x.id === state.outputId);
      if (!ch || !st) return "（請完成經典路線選擇）";
      const parts = [ch.prompt];
      if (CatalogStore.characterNeedsCeramics(ch)) {
        const ce = catalog.ceramics.find((x) => x.id === state.ceramicId);
        if (!ce) return "（請完成經典路線選擇）";
        // 拼圖參考：左＝玉器圖、右＝上傳人像；互動文在前、版面約束在後較不易被風格蓋掉
        parts.push(CatalogStore.getCeramicInteraction(ce, ch.id));
        parts.push(global.CERAMIC_COMPOSITE_PROMPT || "");
      }
      parts.push(st.prompt);
      let p = parts.filter(Boolean).join("\n");
      if (!st.allowText) p += (global.TEXT_REMOVAL_PROMPT || "");
      else p += (global.TEXT_KEEP_PROMPT || "");
      if (out && out.promptSuffix) p += out.promptSuffix;
      return p;
    }
    if (state.route === "ip") {
      const ip = catalog.ips.find((x) => x.id === state.ipId);
      const bg = catalog.backgrounds.find((x) => x.id === state.backgroundId);
      if (!ip || !bg) return "（請完成 IP 路線選擇）";
      // IP 合照：維持簡單提示詞效果，只拼接 IP prompt + 背景（若有）
      let p = ip.prompt || "";
      if (bg.prompt) p += (p ? "，" : "") + bg.prompt;
      return p;
    }
    return "（請先選擇經典或 IP合照）";
  }

  /**
   * @returns {string}
   */
  function buildDisplayName() {
    if (state.route === "classic") {
      const ch = currentCharacter();
      const ce = catalog.ceramics.find((x) => x.id === state.ceramicId);
      const st = CatalogStore.getCharacterStyles(ch).find(
        (x) => x.id === state.styleId
      );
      const out = catalog.outputs.find((x) => x.id === state.outputId);
      const bits = [ch && ch.name];
      if (CatalogStore.characterNeedsCeramics(ch)) bits.push(ce && ce.name);
      bits.push(st && st.name, out && out.name);
      return bits.filter(Boolean).join(" · ");
    }
    if (state.route === "ip") {
      const ip = catalog.ips.find((x) => x.id === state.ipId);
      const bg = catalog.backgrounds.find((x) => x.id === state.backgroundId);
      const out = catalog.outputs.find((x) => x.id === state.outputId);
      return ["IP合照", ip && ip.name, bg && bg.name, out && out.name].filter(Boolean).join(" · ");
    }
    return "";
  }

  /**
   * @returns {{apiSize?:string, ratio?:string, name?:string}|null}
   */
  function getSelectedOutput() {
    return catalog.outputs.find((x) => x.id === state.outputId) || null;
  }

  /**
   * @returns {{src:string,name:string}|null}
   */
  function getSelectedIp() {
    return catalog.ips.find((x) => x.id === state.ipId) || null;
  }

  /**
   * @returns {{src:string,name:string,id:string}|null}
   */
  function getSelectedCeramic() {
    return catalog.ceramics.find((x) => x.id === state.ceramicId) || null;
  }

  /**
   * 經典＋與上傳圖片互動：需玉器拼圖參考。
   * @returns {boolean}
   */
  function usesCeramicComposite() {
    return (
      state.route === "classic" &&
      CatalogStore.characterNeedsCeramics(currentCharacter()) &&
      !!state.ceramicId
    );
  }

  /**
   * @returns {boolean}
   */
  function validateBeforeGenerate() {
    if (!state.route) {
      showError("請先選擇「經典」或「IP合照」");
      return false;
    }
    if (state.route === "classic") {
      const ch = currentCharacter();
      if (!ch || !state.styleId || !state.outputId) {
        showError("請完成經典路線選擇");
        return false;
      }
      if (CatalogStore.characterNeedsCeramics(ch) && !state.ceramicId) {
        showError("請完成：角色 → 玉器 → 風格 → 輸出規格");
        return false;
      }
    }
    if (state.route === "ip") {
      if (!state.ipId || !state.backgroundId || !state.outputId) {
        showError("請完成 IP 路線：IP → 背景 → 輸出規格");
        return false;
      }
    }
    return true;
  }

  /**
   * 渲染結果區外框選項。
   * @returns {void}
   */
  function renderFrameChoices() {
    const wrap = document.getElementById("frame-choices");
    if (!wrap) return;
    wrap.innerHTML = "";
    const none = document.createElement("button");
    none.className = "btn-action" + (!state.selectedFrameId ? " primary" : "");
    none.textContent = "無外框";
    none.onclick = () => {
      state.selectedFrameId = "";
      applyFrameToPreview();
      renderFrameChoices();
    };
    wrap.appendChild(none);
    CatalogStore.enabledOnly(catalog.frames).forEach((f) => {
      const b = document.createElement("button");
      b.className = "btn-action" + (state.selectedFrameId === f.id ? " primary" : "");
      b.textContent = f.name;
      b.onclick = () => {
        state.selectedFrameId = f.id;
        applyFrameToPreview();
        renderFrameChoices();
      };
      wrap.appendChild(b);
    });
  }

  /**
   * 從外框 PNG 透明區偵測「可放圖」視窗（相對 0–1）。
   * @param {HTMLImageElement} fr
   * @returns {{x:number,y:number,w:number,h:number}}
   */
  function detectFrameWindow(fr) {
    const fw = fr.naturalWidth;
    const fh = fr.naturalHeight;
    const c = document.createElement("canvas");
    c.width = fw;
    c.height = fh;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return { x: 0.06, y: 0.08, w: 0.88, h: 0.8 };
    }
    ctx.drawImage(fr, 0, 0);
    const data = ctx.getImageData(0, 0, fw, fh).data;
    const thresh = 60;
    const xL = Math.floor(fw * 0.25);
    const xR = Math.ceil(fw * 0.75);
    const yT = Math.floor(fh * 0.25);
    const yB = Math.ceil(fh * 0.75);
    let y0 = 0;
    let y1 = fh - 1;
    for (let y = 0; y < fh; y++) {
      let s = 0;
      let n = 0;
      for (let x = xL; x < xR; x++) {
        s += data[(y * fw + x) * 4 + 3];
        n++;
      }
      if (s / n < thresh) {
        y0 = y;
        break;
      }
    }
    for (let y = fh - 1; y >= 0; y--) {
      let s = 0;
      let n = 0;
      for (let x = xL; x < xR; x++) {
        s += data[(y * fw + x) * 4 + 3];
        n++;
      }
      if (s / n < thresh) {
        y1 = y;
        break;
      }
    }
    let x0 = 0;
    let x1 = fw - 1;
    for (let x = 0; x < fw; x++) {
      let s = 0;
      let n = 0;
      for (let y = yT; y < yB; y++) {
        s += data[(y * fw + x) * 4 + 3];
        n++;
      }
      if (s / n < thresh) {
        x0 = x;
        break;
      }
    }
    for (let x = fw - 1; x >= 0; x--) {
      let s = 0;
      let n = 0;
      for (let y = yT; y < yB; y++) {
        s += data[(y * fw + x) * 4 + 3];
        n++;
      }
      if (s / n < thresh) {
        x1 = x;
        break;
      }
    }
    const ww = Math.max(1, x1 - x0 + 1);
    const wh = Math.max(1, y1 - y0 + 1);
    return { x: x0 / fw, y: y0 / fh, w: ww / fw, h: wh / fh };
  }

  /**
   * 將結果縮進外框透明窗再疊框（避免上下黃邊蓋住主體）。
   * @returns {Promise<void>}
   */
  async function applyFrameToPreview() {
    const imgEl = document.getElementById("result-img");
    const dl = document.getElementById("dl-btn");
    if (!imgEl || !state.rawResultUrl) return;
    if (!state.selectedFrameId) {
      state.framedResultUrl = "";
      imgEl.src = state.rawResultUrl;
      if (dl) dl.href = state.rawResultUrl;
      return;
    }
    const frame = catalog.frames.find((x) => x.id === state.selectedFrameId);
    if (!frame) return;
    try {
      const base = await loadImg(state.rawResultUrl);
      const fr = await loadImg(frame.src);
      const fw = fr.naturalWidth;
      const fh = fr.naturalHeight;
      const win = frame.window || detectFrameWindow(fr);
      const canvas = document.createElement("canvas");
      canvas.width = fw;
      canvas.height = fh;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("無法建立畫布");

      // 底色取外框角落，避免縮圖後露白縫
      const sample = document.createElement("canvas");
      sample.width = 1;
      sample.height = 1;
      const sctx = sample.getContext("2d");
      if (sctx) {
        sctx.drawImage(fr, 2, 2, 1, 1, 0, 0, 1, 1);
        const p = sctx.getImageData(0, 0, 1, 1).data;
        ctx.fillStyle = "rgb(" + p[0] + "," + p[1] + "," + p[2] + ")";
      } else {
        ctx.fillStyle = "#f5e6a8";
      }
      ctx.fillRect(0, 0, fw, fh);

      const boxX = win.x * fw;
      const boxY = win.y * fh;
      const boxW = win.w * fw;
      const boxH = win.h * fh;
      const bw = base.naturalWidth;
      const bh = base.naturalHeight;
      // contain：整張進窗，不被框邊裁切
      const scale = Math.min(boxW / bw, boxH / bh);
      const dw = bw * scale;
      const dh = bh * scale;
      const dx = boxX + (boxW - dw) / 2;
      const dy = boxY + (boxH - dh) / 2;
      ctx.drawImage(base, dx, dy, dw, dh);
      ctx.drawImage(fr, 0, 0, fw, fh);

      const url = canvas.toDataURL("image/png");
      state.framedResultUrl = url;
      imgEl.src = url;
      if (dl) dl.href = url;
    } catch (e) {
      console.warn(e);
      showError("外框套用失敗：" + (e.message || e));
    }
  }

  /**
   * 載入圖片；優先預載 data URL → fetch→blob。
   * @param {string} src
   * @returns {Promise<HTMLImageElement>}
   */
  async function loadImg(src) {
    if (typeof src === "string" && src.startsWith("data:")) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("無法載入 data URL"));
        img.src = src;
      });
    }
    const embedded =
      (typeof global.REF_DATA_URLS === "object" &&
        global.REF_DATA_URLS &&
        global.REF_DATA_URLS[src]) ||
      (typeof global.IP_DATA_URLS === "object" &&
        global.IP_DATA_URLS &&
        global.IP_DATA_URLS[src]) ||
      null;
    if (embedded) {
      return loadImg(embedded);
    }
    try {
      const res = await fetch(encodeURI(src));
      if (!res.ok) throw new Error("HTTP " + res.status);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      try {
        return await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("無法載入 " + src));
          img.src = objUrl;
        });
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    } catch (e) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("無法載入 " + src));
        img.src = src;
      });
    }
  }

  /**
   * @param {string} url
   * @returns {void}
   */
  function setRawResult(url) {
    state.rawResultUrl = url;
    state.framedResultUrl = "";
    state.selectedFrameId = "";
    renderFrameChoices();
  }

  function wizardBack() {
    if (state.wizardStep > 1) {
      state.wizardStep -= 1;
      if (state.wizardStep === 1) state.route = "";
      renderWizard();
      updatePromptPreview();
    }
  }

  function wizardNext() {
    if (!canProceed()) return;
    const max = maxStep(state.route);
    if (state.wizardStep < max) {
      state.wizardStep += 1;
      renderWizard();
      updatePromptPreview();
    }
  }

  global.Wizard = {
    state,
    renderWizard,
    buildWizardPrompt,
    buildDisplayName,
    getSelectedOutput,
    getSelectedIp,
    getSelectedCeramic,
    usesCeramicComposite,
    validateBeforeGenerate,
    setRawResult,
    applyFrameToPreview,
    renderFrameChoices,
    wizardBack,
    wizardNext,
    reloadCatalog,
  };
})(window);
