/**
 * 風格魔法師目錄設定：預設資料 + localStorage CRUD。
 * 前台／後台共用。
 */
(function (global) {
  /** v3：含陶偶／人面／大碗／甕等預設玉器庫 */
  const STORAGE_KEY = "style_wizard_catalog_v3";

  /** 內建玉器互動文案修訂號；升號時會覆寫內建件的 interactions（自訂角色 key 保留）。 */
  const CERAMIC_INTERACTION_REV = 3;

  /** @type {CatalogConfig} */
  const DEFAULT_CATALOG = {
    version: 3,
    characters: [
      {
        id: "archaeologist",
        name: "考古學家",
        emoji: "🏺",
        desc: "穿考古服探索遺跡",
        /** @type {"artifact"|"style_only"} 與上傳圖片互動 / 純風格轉換 */
        flow: "artifact",
        enabled: true,
        prompt:
          "Transform the person into an adventurous archaeologist. Keep the face and identity recognizable. Wear authentic archaeological field clothing with explorer hat, excavation tools, and field notebook. Ancient relic excavation atmosphere.",
      },
      {
        id: "prehistoric",
        name: "原始人",
        emoji: "🔥",
        desc: "陶器與玉器文化",
        flow: "artifact",
        enabled: true,
        prompt:
          "Transform the person into a prehistoric tribal human of Neolithic Taiwan. Keep the face and identity recognizable. Wear simple woven natural-fiber clothing. Prehistoric settlement atmosphere.",
      },
      {
        id: "style_transfer",
        name: "風格轉換",
        emoji: "🎨",
        desc: "單純風格轉換，不需玉器",
        flow: "style_only",
        enabled: true,
        prompt:
          "Keep the person's face and identity recognizable. Apply the selected art style to the photo. Do not add archaeological props or jade artifacts.",
      },
    ],
    /**
     * 共用玉器庫。互動情境依角色存在 interactions[角色id]，
     * 需寫完整場景（勿只寫「使用」）。
     */
    ceramics: [
      {
        id: "ceramics",
        name: "陶器",
        src: "img/ChatGPT/ceramics.jpg",
        enabled: true,
        interactions: {
          archaeologist:
            "Dig-site scene: the archaeologist has just excavated the LEFT-panel pottery artifact from the soil (soil dust OK). The pottery in frame must match the LEFT reference exactly—same vessel shape and texture. Keep facial identity recognizable.",
          prehistoric:
            "Neolithic settlement: the person holds or uses the LEFT-panel pottery artifact in daily life near a hearth. The pottery must match the LEFT reference exactly—same vessel shape and texture, not a different pot. Keep facial identity recognizable.",
        },
      },
      {
        id: "fe",
        name: "鐵器",
        src: "img/ChatGPT/Fe.jpg",
        enabled: true,
        interactions: {
          archaeologist:
            "Dig-site scene: the archaeologist has just unearthed the LEFT-panel metal ritual artifact (the exact bronze/iron object in the reference—bell-like or patterned metal piece, NOT an axe or modern tool). Show that same object clearly as a fresh find. Keep facial identity recognizable.",
          prehistoric:
            "Prehistoric settlement: the person is holding or displaying the LEFT-panel metal ritual artifact—the exact same object as the reference photo (shape, greenish-brown patina, circular/geometric relief patterns). Do NOT replace it with an axe, knife, or other tool. The reference artifact must be large and clearly visible in the person's hands or beside them. Keep facial identity recognizable.",
        },
      },
      {
        id: "jade",
        name: "玉器",
        src: "img/ChatGPT/jade.jpg",
        enabled: true,
        interactions: {
          archaeologist:
            "Dig-site scene: the archaeologist has just excavated the LEFT-panel jade artifact. The jade must match the LEFT reference exactly (same carving/pendant shape and color). Keep facial identity recognizable.",
          prehistoric:
            "Neolithic scene: the person wears or holds the LEFT-panel jade artifact as adornment. The jade must match the LEFT reference exactly—same shape and color, not a different ornament. Keep facial identity recognizable.",
        },
      },
      {
        id: "clay_idol",
        name: "陶偶神像",
        src: "img/ChatGPT/clay_idol.jpg",
        enabled: true,
        interactions: {
          archaeologist:
            "Dig-site scene: the archaeologist has just excavated the LEFT-panel prehistoric clay idol figurine from the soil. Show the exact same terracotta idol (coarse clay body, white quartz stone inlays for eyes and body, snout-like face, bottom opening). Keep facial identity recognizable.",
          prehistoric:
            "Neolithic tribal ritual scene: the prehistoric person is solemnly holding or presenting the LEFT-panel clay idol as a sacred guardian figure that connects to spirits, ancestors, or nature. " +
            "This is a ritual clay figurine for prayer and protection—used in tribal ceremonies to pray for successful hunting or a good harvest—NOT a toy, pot, or everyday tool. " +
            "The idol MUST match the LEFT reference exactly: coarse reddish-brown to dark terracotta clay, cylindrical body flaring at the base, ear-like top protrusions, snout-like face, and carefully embedded rough white quartz stones (eyes, snout, body rows)—craftsmanship that shows high spiritual or religious value. " +
            "Keep the idol large and clearly visible in the person's hands or on a small ritual altar beside them. Soft firelight or settlement atmosphere. Keep facial identity recognizable.",
        },
      },
      {
        id: "face_pottery",
        name: "人面陶飾",
        src: "img/ChatGPT/face_pottery.jpg",
        enabled: true,
        interactions: {
          archaeologist:
            "Dig-site scene: the archaeologist has just excavated the LEFT-panel clay human-face pottery fragment from the soil. Show the exact same partial face appliqué (coarse light clay, bulging round eyes with slits, bulbous nose, brow ridge, dotted crown band). Keep facial identity recognizable.",
          prehistoric:
            "Neolithic pottery workshop / ritual crafting scene: the prehistoric person is making a sacred human-face pottery decoration—actively sculpting, pressing, or attaching the face appliqué onto a vessel or clay slab. " +
            "The LEFT panel is only a partial face fragment (reference for the face design being crafted), not a complete idol or finished pot. " +
            "Show the craft process clearly: wet clay, shaping tools, hands working the face details. The face being made MUST match the LEFT reference exactly—coarse light gray/tan clay, protruding circular eyes with horizontal slits, bulbous nose, thick brow ridge, and a band of small circular indentations above the brow. " +
            "Context: human-face decoration gives pottery sacred meaning for tribal rites, shamanic/religious activity, or spiritual ceremonies—a ritual vessel ornament, not casual craft. Settlement or workshop atmosphere. Keep facial identity recognizable.",
        },
      },
      {
        id: "large_bowl",
        name: "大陶碗",
        src: "img/ChatGPT/large_bowl.jpg",
        enabled: true,
        interactions: {
          archaeologist:
            "Dig-site scene: the archaeologist has just excavated the LEFT-panel large coarse earthenware bowl from the soil. Show the exact same wide conical cooking bowl (light tan/ochre grit clay, uneven rim, possible rim holes, soot stains near base). Keep facial identity recognizable.",
          prehistoric:
            "Neolithic settlement cooking scene: the prehistoric person is using the LEFT-panel large bowl to cook or heat food—over a hearth fire, hot stones, or simmering stew. " +
            "Show clear cooking/heating action: fire or embers, steam or food inside the bowl, the person tending or lifting the vessel. " +
            "The bowl MUST match the LEFT reference exactly: large wide-mouthed conical earthenware, coarse sandy tan/ochre clay, rugged texture, uneven chipped rim, steep sloping sides, darker soot-like stains near the bottom from fire use. " +
            "This is a practical cooking vessel for heating food, not a ritual idol. Dwelling or outdoor hearth atmosphere. Keep facial identity recognizable.",
        },
      },
      {
        id: "storage_urn",
        name: "夾砂粗紅陶甕",
        src: "img/ChatGPT/storage_urn.jpg",
        enabled: true,
        interactions: {
          archaeologist:
            "Dig-site / museum-context excavation scene: the archaeologist carefully studies the LEFT-panel large coarse sandy red pottery jar (甕). " +
            "Show the exact same wide-mouthed bulbous urn form—coarse reddish-brown grit clay, thick rim, body tapering to a circular pedestal base. " +
            "Scholars note this type may first have been a settlement storage jar for grain or water, later reused as a sacred burial urn (棺具) for the soul’s rest. Keep facial identity recognizable.",
          prehistoric:
            "Neolithic settlement storage scene: the prehistoric person is using the LEFT-panel large coarse sandy red pottery jar as a practical household vessel—pouring or storing grain, cereals, or water. " +
            "Show clear storage action: grain baskets nearby, filling or sealing the jar, dwelling or granary atmosphere. " +
            "The jar MUST match the LEFT reference exactly: large wide-mouthed bulbous urn, coarse sandy reddish pottery (夾砂粗紅陶), thick rim, rugged textured clay, body narrowing to a round pedestal-like base. " +
            "Do NOT show modern museum stands, white plaster fills, or plexiglass supports—depict it as a complete living vessel in daily use. " +
            "Cultural note (subtle, not text on image): such jars could later become sacred burial urns, but this scene is daily storage first. Keep facial identity recognizable.",
        },
      },
    ],
    styles: [
      {
        id: "realistic",
        name: "寫實風",
        emoji: "📷",
        enabled: true,
        allowText: false,
        prompt:
          "Photorealistic documentary photography, museum-quality realism, natural cinematic lighting, preserve exact facial identity, anatomically correct hands.",
      },
      {
        id: "anime",
        name: "動畫風",
        emoji: "🎬",
        enabled: true,
        allowText: false,
        prompt:
          "Animated movie style, cinematic anime lighting, detailed animated film quality, keep the face recognizable.",
      },
      {
        id: "illustration",
        name: "插畫風",
        emoji: "🎨",
        enabled: true,
        allowText: false,
        prompt:
          "Trendy Japanese illustration, hand drawn doodle style, loose sketch lines, pastel colors, Threads trending illustration style, keep facial identity recognizable.",
      },
      {
        id: "ugly",
        name: "醜陋塗鴉",
        emoji: "🖍️",
        enabled: true,
        allowText: true,
        prompt:
          "Redraw as an intentionally ugly and hilarious doodle. Bad MS Paint sketch, messy scribbles, awkward anatomy, childlike drawing quality. Funny internet meme energy. Do not make it beautiful or realistic.",
      },
      {
        id: "scribble",
        name: "潦草速寫",
        emoji: "✏️",
        enabled: true,
        allowText: false,
        prompt:
          "Redraw as a naive messy dark-blue ballpoint-pen sketchbook doodle on white paper. Dense chaotic scribbles for hair and dark areas, simplified faces, sparse colored-pencil accents. Childlike amateur notebook doodle.",
      },
      {
        id: "japan_illustration",
        name: "手繪插畫",
        emoji: "🎨",
        enabled: true,
        allowText: false,
        prompt:
          "Trendy Japanese illustration artwork. Half body, dynamic pose, hand drawn doodle style, pastel colors, manga rough sketch, minimal white background, keep facial identity.",
      },
      {
        id: "ghibli",
        name: "日系動畫",
        emoji: "🌿",
        enabled: true,
        allowText: false,
        prompt:
          "Studio Ghibli inspired animated film frame. Warm cinematic lighting, hand painted anime background, soft emotional atmosphere, keep people recognizable.",
      },
      {
        id: "japan_handdrawn",
        name: "日系手繪",
        emoji: "🖍️",
        enabled: true,
        allowText: false,
        prompt:
          "可愛簡單像學生親手畫的彩色手繪插畫，白底，全身入鏡，手繪塗鴉填色，粉色腮紅，直式紀念相片構圖，保留人物辨識特徵。",
      },
      {
        id: "visual_poster",
        name: "視覺海報",
        emoji: "🖼️",
        enabled: true,
        allowText: false,
        prompt:
          "流行視覺編輯藝術海報，賽璐珞平塗色塊，禁止任何文字，人物為設計元素，大膽色塊背景，原創時裝與配件，禁止寫實與3D。",
      },
    ],
    ips: [
      {
        id: "rock_ip",
        name: "石人 IP",
        src: "IP/IP.png",
        enabled: true,
        prompt:
          "銀杏主題，搭配IP合照，不要有濾鏡擺拍的感覺 ，保留原圖的動作、構圖和衣服細節，背景在銀杏森林裡一起散步，人物角色半身照，手指不要變形，保持臉型",
      },
      {
        id: "omu",
        name: "Omu",
        src: "IP/Omu.png",
        enabled: true,
        prompt:
          "銀杏主題，畫面中只能出現一隻 Omu（與參考圖同一隻，外形一致），不要複製成兩隻或多隻。不要有濾鏡擺拍的感覺，保留原圖人物的動作、構圖和衣服細節，背景在銀杏森林裡一起散步，人物與 Omu 半身合照，手指不要變形，保持臉型",
        promptRev: 2,
      },
    ],
    backgrounds: [
      {
        id: "none",
        name: "無",
        emoji: "∅",
        enabled: true,
        prompt: "",
      },
      {
        id: "ginkgo",
        name: "銀杏森林",
        emoji: "🍂",
        enabled: true,
        prompt:
          "背景在銀杏森林裡一起散步，金黃銀杏葉鋪地，溫暖自然光，不要有濾鏡擺拍的感覺。",
      },
      {
        id: "garden",
        name: "夢幻花園",
        emoji: "🌸",
        enabled: true,
        prompt:
          "Replace the background with a dreamy blooming flower garden bathed in soft natural sunlight.",
      },
      {
        id: "night_city",
        name: "璀璨夜景",
        emoji: "🌃",
        enabled: true,
        prompt:
          "Replace the background with a glittering city skyline at night, warm bokeh lights.",
      },
    ],
    frames: [
      {
        id: "frame1",
        name: "外框 1（直式）",
        src: "img/ChatGPT/frame1.png",
        enabled: true,
        /** 外框約 2:3；透明窗約 3:4（相對外框比例） */
        recommendRatio: "3:4",
        window: { x: 0.055, y: 0.081, w: 0.89, h: 0.796 },
      },
      {
        id: "frame2",
        name: "外框 2（考古）",
        src: "img/ChatGPT/frame2.png",
        enabled: true,
        recommendRatio: "3:4",
        /** 中間白底已去背；窗約 3:4 */
        window: { x: 0.066, y: 0.088, w: 0.868, h: 0.78 },
      },
    ],
    outputs: [
      {
        id: "portrait_34",
        name: "直式海報（配外框）",
        ratio: "3:4",
        apiSize: "1024x1360",
        enabled: true,
        promptSuffix:
          "\nOutput image composition: vertical portrait orientation, aspect ratio 3:4.\nKeep subject and props fully inside a safe margin (about 8% from edges).\nOptimized for framed poster print (fits frame1 inner window).",
      },
      {
        id: "portrait_23",
        name: "直式 2:3",
        ratio: "2:3",
        apiSize: "1024x1536",
        enabled: true,
        promptSuffix:
          "\nOutput image composition: vertical portrait orientation, aspect ratio 2:3.\nKeep subject and props inside safe margins.\nMatches outer frame1 sheet ratio.",
      },
      {
        id: "postcard",
        name: "明信片（橫式）",
        ratio: "4:3",
        apiSize: "1360x1024",
        enabled: true,
        promptSuffix:
          "\nOutput image composition: horizontal landscape orientation, aspect ratio 4:3.\nWide composition. Subject centered.\nOptimized for postcard print format. (Not ideal for frame1 vertical frame.)",
      },
      {
        id: "badge",
        name: "胸章",
        ratio: "1:1",
        apiSize: "1024x1024",
        enabled: true,
        promptSuffix:
          "\nOutput image composition: perfect square format, aspect ratio 1:1.\nSubject tightly centered.\nOptimized for badge print.",
      },
    ],
  };

  /**
   * 風格預設清單的深拷貝（給每個角色獨立一份）。
   * @returns {object[]}
   */
  function cloneStylePresets() {
    return JSON.parse(JSON.stringify(DEFAULT_CATALOG.styles || []));
  }

  /**
   * 玉器／文物預設清單的深拷貝（後台新增時下拉填入）。
   * @returns {object[]}
   */
  function cloneCeramicPresets() {
    return JSON.parse(JSON.stringify(DEFAULT_CATALOG.ceramics || []));
  }

  /**
   * @returns {CatalogConfig}
   */
  function cloneDefault() {
    /** @type {CatalogConfig} */
    const data = JSON.parse(JSON.stringify(DEFAULT_CATALOG));
    data.characters = (data.characters || []).map((ch) =>
      normalizeCharacter(ch, data.styles)
    );
    return data;
  }

  /**
   * @returns {CatalogConfig}
   */
  function loadCatalog() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneDefault();
      const parsed = JSON.parse(raw);
      return mergeWithDefault(parsed);
    } catch (e) {
      console.warn("loadCatalog failed", e);
      return cloneDefault();
    }
  }

  /**
   * @param {CatalogConfig} data
   */
  function saveCatalog(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function resetCatalog() {
    const data = cloneDefault();
    saveCatalog(data);
    return data;
  }

  /**
   * 取得某玉器在指定角色下的互動情境 prompt。
   * @param {{interactions?:Record<string,string>,prompt?:string,name?:string}|null} ceramic
   * @param {string} characterId
   * @returns {string}
   */
  function getCeramicInteraction(ceramic, characterId) {
    if (!ceramic) return "";
    const map = ceramic.interactions || {};
    if (characterId && map[characterId]) return String(map[characterId]);
    if (ceramic.prompt) return String(ceramic.prompt);
    return ceramic.name ? String(ceramic.name) : "";
  }

  /**
   * @param {object} ch
   * @param {object[]} [styleSeed]
   * @returns {object}
   */
  function normalizeCharacter(ch, styleSeed) {
    if (!ch || typeof ch !== "object") return ch;
    const seed = Array.isArray(styleSeed) ? styleSeed : DEFAULT_CATALOG.styles;
    /** @type {"artifact"|"style_only"} */
    let flow = ch.flow === "style_only" ? "style_only" : "artifact";
    // 舊資料：名稱像風格轉換且未設 flow → 視為純風格
    if (
      ch.flow == null &&
      typeof ch.name === "string" &&
      /風格轉換/.test(ch.name)
    ) {
      flow = "style_only";
    }
    const styles =
      Array.isArray(ch.styles) && ch.styles.length
        ? ch.styles
        : JSON.parse(JSON.stringify(seed || []));
    const next = {
      ...ch,
      enabled: ch.enabled !== false,
      flow,
      styles,
    };
    delete next.interactionTemplate;
    return next;
  }

  /**
   * 角色是否需要玉器步驟。
   * @param {{flow?:string}|null} ch
   * @returns {boolean}
   */
  function characterNeedsCeramics(ch) {
    return !!(ch && ch.flow !== "style_only");
  }

  /**
   * 取得角色專屬風格清單。
   * @param {{styles?:object[]}|null} ch
   * @returns {object[]}
   */
  function getCharacterStyles(ch) {
    if (!ch) return [];
    if (Array.isArray(ch.styles)) return ch.styles;
    return [];
  }

  /**
   * @param {object} ce
   * @returns {object}
   */
  function normalizeCeramic(ce) {
    if (!ce || typeof ce !== "object") return ce;
    const def = DEFAULT_CATALOG.ceramics.find((c) => c.id === ce.id);
    const stale =
      !ce.interactionRev || ce.interactionRev < CERAMIC_INTERACTION_REV;
    /** @type {Record<string,string>} */
    let interactions = {};
    if (def && def.interactions && stale) {
      // 內建玉器：用新預設蓋 archaeologist / prehistoric，其餘自訂角色 key 保留
      interactions = {
        ...(ce.interactions && typeof ce.interactions === "object"
          ? ce.interactions
          : {}),
        ...def.interactions,
      };
    } else {
      interactions = {
        ...(def && def.interactions ? def.interactions : {}),
        ...(ce.interactions && typeof ce.interactions === "object"
          ? ce.interactions
          : {}),
      };
    }
    if (!Object.keys(interactions).length && ce.prompt) {
      return {
        ...ce,
        enabled: ce.enabled !== false,
        interactions: {},
        prompt: ce.prompt,
        interactionRev: CERAMIC_INTERACTION_REV,
      };
    }
    let src = ce.src || (def && def.src) || "";
    // 舊路徑 img/xxx → img/ChatGPT/xxx
    if (typeof src === "string" && /^img\/[^/]+$/.test(src)) {
      src = "img/ChatGPT/" + src.slice(4);
    }
    return {
      ...ce,
      src,
      enabled: ce.enabled !== false,
      interactions,
      interactionRev: CERAMIC_INTERACTION_REV,
    };
  }

  /**
   * 以預設結構補齊缺欄，避免舊資料壞掉。
   * @param {Partial<CatalogConfig>} data
   * @returns {CatalogConfig}
   */
  function mergeWithDefault(data) {
    const base = cloneDefault();
    const keys = [
      "characters",
      "ceramics",
      "styles",
      "ips",
      "backgrounds",
      "frames",
      "outputs",
    ];
    /** @type {CatalogConfig} */
    const out = { version: 1 };
    keys.forEach((k) => {
      out[k] = Array.isArray(data[k]) ? data[k] : base[k];
    });
    const styleSeed = out.styles || base.styles;
    out.characters = (out.characters || []).map((ch) =>
      normalizeCharacter(ch, styleSeed)
    );
    out.ceramics = mergeById(out.ceramics || [], base.ceramics).map(
      normalizeCeramic
    );
    out.version = Math.max(Number(data.version) || 1, base.version || 3);
    // 補齊新增的輸出／外框預設（不覆蓋使用者已有同 id）
    out.outputs = mergeById(out.outputs, base.outputs);
    out.frames = mergeById(out.frames, base.frames).map((f) => {
      const def = base.frames.find((d) => d.id === f.id);
      if (!def) return f;
      let src = f.src || def.src || "";
      if (typeof src === "string" && /^img\/[^/]+$/.test(src)) {
        src = "img/ChatGPT/" + src.slice(4);
      }
      return {
        ...def,
        ...f,
        src,
        window: f.window || def.window,
        recommendRatio: f.recommendRatio || def.recommendRatio,
      };
    });
    out.ips = mergeById(out.ips, base.ips).map((ip) => {
      const def = base.ips.find((d) => d.id === ip.id);
      if (!def) return ip;
      // 預設 IP 若有較新 promptRev，覆寫 prompt（後台手動改過且 rev 已跟上則保留）
      if (
        def.promptRev &&
        (!ip.promptRev || ip.promptRev < def.promptRev)
      ) {
        return { ...ip, prompt: def.prompt, src: def.src || ip.src, promptRev: def.promptRev };
      }
      return ip;
    });
    return out;
  }

  /**
   * @param {object[]} current
   * @param {object[]} defaults
   * @returns {object[]}
   */
  function mergeById(current, defaults) {
    const list = Array.isArray(current) ? current.slice() : [];
    const have = new Set(list.map((x) => x && x.id));
    (defaults || []).forEach((d) => {
      if (d && d.id && !have.has(d.id)) list.push(JSON.parse(JSON.stringify(d)));
    });
    return list;
  }

  /**
   * @template T
   * @param {T[]} list
   * @returns {T[]}
   */
  function enabledOnly(list) {
    return (list || []).filter((x) => x && x.enabled !== false);
  }

  /**
   * @param {string} prefix
   * @returns {string}
   */
  function uid(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 7)
    );
  }

  global.CatalogStore = {
    STORAGE_KEY,
    DEFAULT_CATALOG,
    cloneDefault,
    cloneStylePresets,
    cloneCeramicPresets,
    loadCatalog,
    saveCatalog,
    resetCatalog,
    mergeWithDefault,
    normalizeCharacter,
    normalizeCeramic,
    getCeramicInteraction,
    characterNeedsCeramics,
    getCharacterStyles,
    enabledOnly,
    uid,
  };
})(window);
