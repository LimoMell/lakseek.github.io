// 深色/淺色模式切換
(function () {
    const STORAGE_KEY = "theme-preference";
    const THEMES = { light: "light", dark: "dark" };
    const ICONS = {
        light: "assets/icons/light-theme.png",
        dark: "assets/icons/dark-theme.png",
    };

    const html = document.documentElement;
    const toggleBtn = document.getElementById("themeToggle");
    const logo = document.querySelector(".top .logo");
    const toggleIcon = document.getElementById("themeToggleIcon");
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

    const isValidTheme = (theme) => theme === THEMES.light || theme === THEMES.dark;

    const getStoredPreference = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return isValidTheme(stored) ? stored : null;
        } catch {
            return null;
        }
    };

    const storePreference = (theme) => {
        try {
            if (isValidTheme(theme)) {
                localStorage.setItem(STORAGE_KEY, theme);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // 無視燈
        }
    };

    const getEffectiveTheme = (pref) =>
        isValidTheme(pref) ? pref : (mediaQuery?.matches ? THEMES.dark : THEMES.light);

    const toggleTheme = () => {
        const effective = getEffectiveTheme(pref);
        pref = effective === THEMES.dark ? THEMES.light : THEMES.dark;
        storePreference(pref);
        render(pref);
    };

    const render = (pref) => {
        const effective = getEffectiveTheme(pref);
        html.setAttribute("data-theme", effective);
        if (toggleIcon) {
            toggleIcon.src = ICONS[effective];
        }
    };

    let pref = getStoredPreference();
    render(pref);

    if (toggleBtn) {
        toggleBtn.addEventListener("click", toggleTheme);
    }

    if (mediaQuery) {
        mediaQuery.addEventListener?.("change", () => {
            pref = null;
            storePreference(null);
            render(pref);
        });
    }
})();

// Toast 訊息
(function () {
    const TOAST_OFFSET_STEP = 4; // 3.5rem + 0.5rem
    const TOAST_BASE_BOTTOM = 3; // rem
    const TOAST_REMOVE_DELAY = 400;
    const DEFAULT_DURATION = 2200;

    let activeToasts = [];
    let toastContainer = null;

    const initToastContainer = () => {
        if (toastContainer) return toastContainer;

        toastContainer = document.createElement("div");
        toastContainer.className = "toast-container";
        toastContainer.setAttribute("aria-live", "polite");
        toastContainer.setAttribute("aria-atomic", "false");
        document.body.appendChild(toastContainer);
        return toastContainer;
    };

    const updateToastPositions = () => {
        activeToasts.forEach((toast, index) => {
            toast.style.bottom = `${TOAST_BASE_BOTTOM + index * TOAST_OFFSET_STEP}rem`;
        });
    };

    const removeToast = (toast) => {
        const index = activeToasts.indexOf(toast);
        if (index === -1) return;

        activeToasts.splice(index, 1);
        toast.classList.remove("toast-visible");
        setTimeout(() => {
            toast.remove();
            updateToastPositions();
        }, TOAST_REMOVE_DELAY);
    };

    window.showToast = (message, duration = DEFAULT_DURATION) => {
        if (typeof message !== "string" || !message.trim()) return;

        const container = initToastContainer();
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.setAttribute("role", "status");
        toast.textContent = message;
        container.appendChild(toast);

        activeToasts.push(toast);
        updateToastPositions();

        toast.offsetHeight;
        toast.classList.add("toast-visible");

        setTimeout(() => removeToast(toast), duration);
    };
})();

// 媒體預覽
(function () {
    const html = document.documentElement;
    let overlay = null;
    let panel = null;
    let imgEl = null;
    let captionEl = null;
    let downloadLink = null;
    let closeBtn = null;
    let loadingEl = null;
    let lastActiveElement = null;
    let loadingTimeout = null;
    let keydownListener = null;
    let currentImages = [];
    let currentIndex = 0;
    let navEl = null;
    let navPrevBtn = null;
    let navNextBtn = null;
    let thumbnailsContainer = null;

    const ensureElements = () => {
        if (overlay) return overlay;

        overlay = document.createElement("div");
        overlay.className = "media-preview-overlay";

        panel = document.createElement("div");
        panel.className = "media-preview";
        panel.setAttribute("tabindex", "-1");
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");

        imgEl = document.createElement("img");
        imgEl.className = "media-preview-img";
        imgEl.alt = "";

        loadingEl = document.createElement("div");
        loadingEl.className = "media-preview-loading";
        loadingEl.setAttribute("role", "status");
        loadingEl.setAttribute("aria-live", "polite");

        const spinner = document.createElement("div");
        spinner.className = "media-preview-spinner";
        for (let i = 0; i < 3; i++) {
            const spinnerDot = document.createElement("span");
            spinnerDot.className = "media-preview-spinner-dot";
            spinner.appendChild(spinnerDot);
        }

        const loadingText = document.createElement("p");
        loadingText.className = "media-preview-loading-text";
        loadingText.textContent = "Loading...";
        loadingEl.appendChild(spinner);
        loadingEl.appendChild(loadingText);

        captionEl = document.createElement("div");
        captionEl.className = "media-preview-caption";

        navEl = document.createElement("div");
        navEl.className = "media-preview-nav";

        navPrevBtn = document.createElement("button");
        navPrevBtn.type = "button";
        navPrevBtn.className = "media-preview-nav-button";
        navPrevBtn.textContent = "←";
        navPrevBtn.addEventListener("click", () => showImage(currentIndex - 1));

        thumbnailsContainer = document.createElement("div");
        thumbnailsContainer.className = "media-preview-thumbnails";

        navNextBtn = document.createElement("button");
        navNextBtn.type = "button";
        navNextBtn.className = "media-preview-nav-button";
        navNextBtn.textContent = "→";
        navNextBtn.addEventListener("click", () => showImage(currentIndex + 1));

        navEl.appendChild(navPrevBtn);
        navEl.appendChild(thumbnailsContainer);
        navEl.appendChild(navNextBtn);

        const actions = document.createElement("div");
        actions.className = "media-preview-actions";

        downloadLink = document.createElement("a");
        downloadLink.className = "media-preview-button";
        downloadLink.textContent = "Download";
        downloadLink.setAttribute("download", "");

        closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "media-preview-button media-preview-close";
        closeBtn.textContent = "Close";

        actions.appendChild(downloadLink);
        actions.appendChild(closeBtn);

        panel.appendChild(imgEl);
        panel.appendChild(loadingEl);
        panel.appendChild(captionEl);
        panel.appendChild(navEl);
        panel.appendChild(actions);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeViewer();
        }, { passive: true });

        closeBtn.addEventListener("click", closeViewer);

        return overlay;
    };

    const handleKeyPress = (e) => {
        if (!overlay?.classList.contains("media-preview-visible")) return;

        if (e.key === "Escape") {
            closeViewer();
        } else if (e.key === "ArrowRight") {
            showImage(currentIndex + 1);
        } else if (e.key === "ArrowLeft") {
            showImage(currentIndex - 1);
        }
    };

    const closeViewer = () => {
        if (!overlay) return;
        clearTimeout(loadingTimeout);
        if (keydownListener) {
            document.removeEventListener("keydown", keydownListener);
            keydownListener = null;
        }
        overlay.classList.remove("media-preview-visible");
        html.classList.remove("media-preview-open");
        lastActiveElement?.focus?.();
        lastActiveElement = null;
        currentImages = [];
        currentIndex = 0;
    };

    const showImage = (index) => {
        if (!currentImages || currentImages.length === 0) return;
        if (index < 0 || index >= currentImages.length) return;

        currentIndex = index;
        const image = currentImages[index];

        clearTimeout(loadingTimeout);
        imgEl.classList.add("media-preview-img-hidden");
        loadingEl.classList.add("media-preview-loading-visible");

        const handleLoad = () => {
            clearTimeout(loadingTimeout);
            imgEl.classList.remove("media-preview-img-hidden");
            loadingEl.classList.remove("media-preview-loading-visible");
            imgEl.removeEventListener("load", handleLoad);
            imgEl.removeEventListener("error", handleError);
        };

        const handleError = () => {
            clearTimeout(loadingTimeout);
            imgEl.classList.remove("media-preview-img-hidden");
            loadingEl.classList.remove("media-preview-loading-visible");
            imgEl.removeEventListener("load", handleLoad);
            imgEl.removeEventListener("error", handleError);
        };

        loadingTimeout = setTimeout(() => {
            imgEl.classList.remove("media-preview-img-hidden");
            loadingEl.classList.remove("media-preview-loading-visible");
        }, 10000);

        imgEl.addEventListener("load", handleLoad);
        imgEl.addEventListener("error", handleError);

        imgEl.src = image.src;
        imgEl.alt = image.alt || "";
        captionEl.textContent = image.caption || image.alt || "";
        downloadLink.href = image.downloadHref || image.src;

        if (image.downloadName) {
            downloadLink.setAttribute("download", image.downloadName);
        } else {
            downloadLink.removeAttribute("download");
        }

        if (currentImages.length > 1) {
            navPrevBtn.disabled = currentIndex === 0;
            navNextBtn.disabled = currentIndex === currentImages.length - 1;

            const thumbnails = thumbnailsContainer.querySelectorAll(".media-preview-thumbnail");
            thumbnails.forEach((thumb, i) => {
                if (i === currentIndex) {
                    thumb.classList.add("media-preview-thumbnail-active");
                } else {
                    thumb.classList.remove("media-preview-thumbnail-active");
                }
            });
        }
    };

    const openViewer = (options) => {
        if (!options?.images || !Array.isArray(options.images)) return;

        const images = options.images;
        if (images.length === 0) return;

        ensureElements();
        currentImages = images;
        currentIndex = 0;

        thumbnailsContainer.innerHTML = "";
        images.forEach((image, index) => {
            const thumbWrapper = document.createElement("div");
            thumbWrapper.className = "media-preview-thumbnail";
            if (index === 0) {
                thumbWrapper.classList.add("media-preview-thumbnail-active");
            }

            const thumbImg = document.createElement("img");
            thumbImg.src = image.src;
            thumbImg.alt = image.alt || `Thumbnail ${index + 1}`;

            thumbWrapper.appendChild(thumbImg);
            thumbWrapper.addEventListener("click", () => showImage(index));
            thumbnailsContainer.appendChild(thumbWrapper);
        });

        if (images.length > 1) {
            navEl.classList.add("media-preview-nav-visible");
            navPrevBtn.disabled = true;
            navNextBtn.disabled = false;
        } else {
            navEl.classList.remove("media-preview-nav-visible");
        }

        clearTimeout(loadingTimeout);
        lastActiveElement = document.activeElement;

        if (!keydownListener) {
            keydownListener = handleKeyPress;
            document.addEventListener("keydown", keydownListener);
        }

        overlay.classList.add("media-preview-visible");
        html.classList.add("media-preview-open");

        showImage(0);
        panel.focus();
    };

    window.openMediaPreview = openViewer;
})();

// 彩蛋觸發：↑↑↓↓←→←→BABA
(function () {
    const KONAMI_CODE = [
        "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA", "KeyB", "KeyA"
    ];

    let index = 0;

    document.addEventListener("keydown", (e) => {
        if (e.code === KONAMI_CODE[index]) {
            index++;
            if (index === KONAMI_CODE.length) {
                index = 0;
                showToast("你在期待什麼呢owo");
            }
        } else {
            index = 0;
        }
    });
})();

// 彩蛋觸發：切換深色/淺色模式 6 次
(function () {
    const THRESHOLD = 6;
    const RESET_DELAY = 1500;
    const themeToggleBaka = document.getElementById("themeToggleIcon");

    if (!themeToggleBaka) return;

    let count = 0;
    let resetTimer = null;

    themeToggleBaka.addEventListener("click", () => {
        count++;
        clearTimeout(resetTimer);

        if (count >= THRESHOLD) {
            count = 0;
            showToast("哇！別再按啦 QwQ");
        } else {
            resetTimer = setTimeout(() => { count = 0; }, RESET_DELAY);
        }
    });
})();

// Limo 設定圖 OF
(function () {
    const link = document.getElementById("chara1FursonaOF");
    if (!link || !window.openMediaPreview) return;

    link.addEventListener("click", (e) => {
        e.preventDefault();
        window.openMediaPreview({
            images: [{
                src: "assets/characters/artworks/1/fursona-of.png",
                alt: "Limo's fursona picture",
                caption: "イラスト：瑞樹",
                downloadName: "limo-fursona.png"
            }]
        });
    });
})();

// Limo 的圖
(function () {
    const link = document.getElementById("chara1Arts");
    if (!link || !window.openMediaPreview) return;

    link.addEventListener("click", (e) => {
        e.preventDefault();
        window.openMediaPreview({
            images: [{
                src: "assets/characters/artworks/1/new-lunar-year-2026-ych-a.png",
                alt: "New lunar year YCH (A) by 瑞樹",
                caption: "イラスト：瑞樹",
                downloadName: "limo-pic1.png"
            },
            {
                src: "assets/characters/artworks/1/new-lunar-year-2026-ych-b.png",
                alt: "New lunar year YCH (B) by 瑞樹",
                caption: "イラスト：瑞樹",
                downloadName: "limo-pic2.png"
            }
            ]
        });
    });
})();

// 每日隨機歌曲
(function () {
    const songs = [
        // MSTP
        { artist: "C418", title: "Alpha", url: "https://youtu.be/q6o7qpPHd7g", from: "Minecraft", platform: "YouTube" },
        { artist: "KIVΛ, Ice", title: "͟͝͞Ⅱ́̕", url: "https://youtu.be/H2k7TMT3ouA", from: "Cytus II", platform: "YouTube" },
        { artist: "KIVΛ", title: "The Whole Rest", url: "https://youtu.be/TWqMQeVqqnA", from: "Cytus II", platform: "YouTube" },
        { artist: "log()", title: "SELF", url: "https://youtu.be/q7PXMBjTVLc", from: "vivid/stasis", platform: "YouTube" },
        { artist: "Theatrum Aeternum", title: "acta est fabula, plaudite", url: "https://youtu.be/TPTsSu77MKI", from: "vivid/stasis", platform: "YouTube" },
        { artist: "eicateve", title: "R.I.P.", url: "https://youtu.be/QJakdR6FWdg", platform: "YouTube" },
        { artist: "Poppin'Party", title: "Returns", url: "https://youtu.be/zWKV5yudE18", from: "BanG Dream!", platform: "YouTube" },
        { artist: "ryo", title: "ODDS&ENDS", url: "https://youtu.be/HUzLUGKwQJc", platform: "YouTube", unofficial: true },
        { artist: "Ice", title: "L", url: "https://youtu.be/ZXy_1LA-RlA", platform: "YouTube" },
        { artist: "Ice", title: "L2 -Ascension- (Act 1)", url: "https://youtu.be/lAkUpYCUXCU", platform: "YouTube", unofficial: true },
        { artist: "Ice", title: "L2 -Ascension- (Act 2)", url: "https://youtu.be/8nF7MU5iGng", platform: "YouTube", unofficial: true },
        { artist: "Toby Fox", title: "MEGALOVANIA", url: "https://youtu.be/KK3KXAECte4", from: "UNDERTALE", platform: "YouTube" },
        { artist: "ああああ", title: "トゥルエンド", url: "https://youtu.be/hK7Inl9Rark", from: "でびるコネクショん", platform: "YouTube" },
        { artist: "Sta", title: "Incyde", url: "https://youtu.be/-1OiVXRGE-U", from: "Cytus II", platform: "YouTube" },
        { artist: "繊(Apo11o program vs. お月さま交響曲) ft.じまんぐ", title: "paradigm-paragramme-program", url: "https://youtu.be/8CNl8DZMAL0", from: "Cytus II", platform: "YouTube" },
        { artist: "Knighthood", title: "Super Universe (Knighthood Remix)", url: "https://youtu.be/v7rqB-o52tE", platform: "YouTube", unofficial: true },
        { artist: "technoplanet", title: "XYZ", url: "https://youtu.be/ZYXFo637GNc", from: "Cytus II", platform: "YouTube" },
        { artist: "Team Grimoire", title: "Grievous Lady", url: "https://youtu.be/QXeaLw2s-Wo", from: "Arcaea", platform: "YouTube" },
        { artist: "Team Grimoire", title: "Rrhar'il", url: "https://youtu.be/Hwny8gQRYZA", from: "Phigros", platform: "YouTube" },
        { artist: "Cheetah Mobile", title: "Neon", url: "https://youtu.be/pJIh0KPl98s", from: "Rolling Sky", platform: "YouTube" },
        { artist: "Dimrain47", title: "At the Speed of Light", url: "https://youtu.be/1Zrq8FiKS6A", platform: "YouTube" },
        { artist: "cYsmix", title: "Peer Gynt", url: "https://youtu.be/w4dLTLW6dJ0", platform: "YouTube", unofficial: true },
        { artist: "USAO & Camellia", title: "Möbius", url: "https://youtu.be/2fsZdfixj60", from: "WACCA", platform: "YouTube" },
        { artist: "Antistar feat. Ctymax", title: "Class Memories", url: "https://youtu.be/3Ka6yPBCs5A", platform: "YouTube", unofficial: true },
        { artist: "uma vs. モリモリあつし", title: "Re:End of a Dream", url: "https://youtu.be/ayg2A2JoRzg", platform: "YouTube" },

        // 突然喜歡的歌
        { artist: "A-One", title: "Idoratrize World", url: "https://youtu.be/n8vn1iFDhAs", platform: "YouTube" },
        { artist: "上海アリス幻樂団", title: "偶像に世界を委ねて　〜 Idoratrize World", url: "https://youtu.be/7DF5wIPlvq0", from: "東方鬼形獣 〜 Wily Beast and Weakest Creature.", platform: "YouTube" },
        { artist: "101-202-404", title: "小悪魔×3の大脫走！？", url: "https://youtu.be/HCgs32kX8eQ", from: "Cytus II", platform: "YouTube", unofficial: true },
        { artist: "黒皇帝", title: "Galaxy Collapse", url: "https://youtu.be/VJFNcHgQ4HM", platform: "YouTube" },
        { artist: "黒皇帝 vs MIssionary", title: "Deus Judicium", url: "https://youtu.be/CZJoFLSe9Ao", from: "Rotaeno", platform: "YouTube" },
        { artist: "NeLiME", title: "CODE NAME : ZERO", url: "https://youtu.be/26nQsUdhBNQ", from: "Cytus", platform: "YouTube" },
        { artist: "Ayatsugu_Revolved", title: "100sec Cat Dreams", url: "https://youtu.be/zBlmtNKgrk0", from: "Cytus II", platform: "YouTube", unofficial: true },
        { artist: "It's MyGO!!!!!", title: "詩超絆", url: "https://youtu.be/wJ-OebTVyvk", from: "BanG Dream!", platform: "YouTube" },
        { artist: "Poppin'Party", title: "Dreamers Go!", url: "https://youtu.be/VigNV3bsE_k", from: "BanG Dream!", platform: "YouTube" },
        { artist: "ああああ", title: "でびるコネクショん", url: "https://youtu.be/aQx9OjvQZEo", from: "でびるコネクショん", platform: "YouTube" },
        { artist: "KIVΛ", title: "Used to be", url: "https://youtu.be/hGaJNvkRfo0", from: "Cytus II", platform: "YouTube" },
        { artist: "MELOIMAGE", title: "Imprint", url: "https://youtu.be/mTcFEVeVoDs", from: "Cytus II", platform: "YouTube", unofficial: true },
        { artist: "Apo11o program", title: "Re:The END -再-", url: "https://youtu.be/gnt9Bnei2is", from: "Cytus II", platform: "YouTube" },
        { artist: 'NOMA w/ Apo11o"ALGIEBA"program', title: "LAST Re;SØRT", url: "https://youtu.be/2a0wyR-Hu1Y", from: "RAVON", platform: "YouTube" },
        { artist: "Tobu", title: "Higher", url: "https://youtu.be/blA7epJJaR4", platform: "YouTube" },
        { artist: "ユリイ・カノン", title: "スーサイドパレヱド", url: "https://youtu.be/7awIdGqyr40", platform: "YouTube" },
        { artist: "Roselia", title: "Neo-Aspect", url: "https://youtu.be/03iVXFZ8jrs", from: "BanG Dream!", platform: "YouTube" },
        { artist: "RAISE A SUILEN", title: "DEAD HEAT BEAT", url: "https://youtu.be/2gJfjLGCf9U", from: "BanG Dream!", platform: "YouTube" },
        { artist: "DECO*27", title: "ヴァンパイア", url: "https://youtu.be/e1xCOsgWG0M", platform: "YouTube" },
        { artist: "Tsukasa", title: "Stardust Sphere", url: "https://youtu.be/f9XYU172ImI", from: "Cytus", platform: "YouTube" },
        { artist: "Ice", title: "iL", url: "https://youtu.be/ilLGb4b7Twc", from: "Cytus II", platform: "YouTube" },
        { artist: "Y&Co.", title: "Daisuke", url: "https://www.nicovideo.jp/watch/sm13256898", platform: "ニコニコ" },
        { artist: "xi", title: "Xaleid◆scopiX", url: "https://youtu.be/-PTe8zkYt9A", from: "maimai でらっくす", platform: "YouTube" },
        { artist: "Shu feat. 天羽しろっぷ", title: "殿ッ！？ご乱心！？", url: "https://youtu.be/U2i_IuAB6wo", from: "maimai でらっくす", platform: "YouTube" },
        { artist: "ああああ", title: "優しさに触れて", url: "https://youtu.be/f8qaWMjyVWU", from: "でびるコネクショん", platform: "YouTube" },
        { artist: "Quree", title: "HTTPS", url: "https://youtu.be/dQZ14TWuhi0", platform: "YouTube" },
        { artist: "Kry.exe vs. Ganymede", title: "First Breath", url: "https://youtu.be/fJu8paff0Xw", from: "vivid/stasis", platform: "YouTube" },
        { artist: "ああああ", title: "そうして明日も続いていく", url: "https://youtu.be/Go1R4PHAnec", from: "でびるコネクショん", platform: "YouTube" },
        { artist: "Consider", title: "夏目", url: "https://www.bilibili.com/video/BV1FCVAzZEcE/", from: "この雪が解けるまで", platform: "Bilibili", unofficial: true },
        { artist: 'Apo11o"EQUATOR"program vs.Nightster', title: "ΛVeS", url: "https://youtu.be/C_AXYPvm5V0", from: "DEEMO II", platform: "YouTube" },
        { artist: "ああああ", title: "ここが居場所", url: "https://youtu.be/yP29FeiZlpk", from: "でびるコネクショん", platform: "YouTube" },
        { artist: "BTB", title: "Weißer Flügel", url: "https://www.nicovideo.jp/watch/sm35039151", platform: "ニコニコ" },
        { artist: "大国奏音", title: "封焔の135秒", url: "https://youtu.be/gSaVkMJpdcQ", from: "maimai でらっくす", platform: "YouTube" },
        { artist: "Kry.exe-天利", title: "Sigma (Haocore Mix) ~ Regrets of the Yellow Tulip ~", url: "https://youtu.be/8iwB9-9kKRQ", from: "Phigros", platform: "YouTube", unofficial: true },
        { artist: "siromaru + cranky", title: "conflict", url: "https://youtu.be/e8HRTlkGD4Q", platform: "YouTube" },
        { artist: "HOYO-MiX", title: "Hope Is the Thing With Feathers", url: "https://youtu.be/f_E7TX8DSmM", from: "崩壊：スターレイル", platform: "YouTube" },
        { artist: "花譜", title: "邂逅", url: "https://youtu.be/Q5DlTbOeNdQ", platform: "YouTube" },
        { artist: "wowaka", title: "ローリンガール", url: "https://youtu.be/vnw8zURAxkU", platform: "YouTube" },
        { artist: "Bon Jovi", title: "It's My Life", url: "https://youtu.be/vx2u5uUu3DE", platform: "YouTube" },
        { artist: "MyReminiscence", title: "Memory", url: "https://youtu.be/alfnHgCTWr0", from: "Ib", platform: "YouTube" },
        { artist: "garlagan", title: "Is This It Is It", url: "https://youtu.be/K6iKoB12Ftg", platform: "YouTube" },
        { artist: "Tatsh&NAOKI", title: "REDZONE <Platinum Long Version>", url: "https://youtu.be/2411fXLYKo4", platform: "YouTube", unofficial: true },
        { artist: "ryo", title: "メルト", url: "https://www.nicovideo.jp/watch/sm1715919", platform: "ニコニコ" },
        { artist: "Virtual Self", title: "Particle Arts", url: "https://youtu.be/b06pKMxF6h8", platform: "YouTube" },
        { artist: "TheFatRat", title: "Never Be Alone", url: "https://youtu.be/Ic-gZlPFTkQ", platform: "YouTube" },
        { artist: "鄭秀文 Sammi Cheng", title: "煞科", url: "https://youtu.be/wVZdkt38YO0", platform: "YouTube" },
        { artist: "CHAGE and ASKA", title: "On Your Mark", url: "https://youtu.be/3Obh9kg6o_U", platform: "YouTube" },
        { artist: "Porter Robinson & Madeon", title: "Shelter", url: "https://youtu.be/fzQ6gRAEoy0", platform: "YouTube" },
        { artist: "nekodex", title: "circles!", url: "https://youtu.be/ytNl9wBWaRY", from: "osu!", platform: "YouTube" }

        // { artist: "", title: "", url: "", from: "", platform: "" }
    ];

    const getDailySeed = () => {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        let hash = 0;
        for (let i = 0; i < dateString.length; i++) {
            hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    };

    const selectDailySong = () => {
        const params = new URLSearchParams(window.location.search);
        const specified = params.get("dailySong");

        if (specified !== null) {
            const index = parseInt(specified, 10);
            if (!isNaN(index) && index >= 0 && index < songs.length) {
                return songs[index];
            }
        }

        const seed = getDailySeed();
        return songs[seed % songs.length];
    };

    const renderSongInfo = (dailySong) => {
        const container = document.getElementById("dailySongContainer");
        if (!container || !dailySong) return;

        container.innerHTML = "";

        // 標題
        const titleWrapper = document.createElement("h3");
        titleWrapper.style.margin = "0 0 0.5rem 0";
        titleWrapper.style.fontSize = "1.1rem";

        // 標題 URL + 非公式音源標籤
        const titleLink = document.createElement("a");
        titleLink.href = dailySong.url;
        titleLink.target = "_blank";
        titleLink.rel = "noopener noreferrer";
        titleLink.textContent = dailySong.unofficial ? `${dailySong.title}（非公式音源）` : dailySong.title;

        titleWrapper.appendChild(titleLink);
        container.appendChild(titleWrapper);

        // 作曲家
        const artistDiv = document.createElement("p");
        artistDiv.style.margin = "0.3em 0";
        artistDiv.textContent = `作曲：${dailySong.artist}`;
        container.appendChild(artistDiv);

        // 來自 IP
        if (dailySong.from) {
            const fromDiv = document.createElement("p");
            fromDiv.style.margin = "0.3em 0";
            fromDiv.textContent = `來自：${dailySong.from}`;
            container.appendChild(fromDiv);
        }

        // 來源平台
        const platformDiv = document.createElement("p");
        platformDiv.style.margin = "0.3em 0";
        platformDiv.textContent = `平台：${dailySong.platform}`;
        container.appendChild(platformDiv);
    };

    const dailySong = selectDailySong();
    renderSongInfo(dailySong);
})();

/*
                                                          #=--=             #--#                                                                                        
                                                      +----------#        ----------                                                                                    
                                                   *--------------%      --------------                                                                                 
                                                 ------------------     -----------------%                                                                              
                                               =-------------------     -------***---------#                                                                            
                                             %----------******-----    %-----*+++++++=-------                                                                           
                                            #--------*===+****-----    =----*++========-------#                                                                         
                                           =-------+=======***-----    -----++===========-------                                                                        
                                          +-------==========***----    -*+++*====****=====-------                                                                       
                                         #-------=====**+=*++*-----    --+***++#*====*=====-------                                                                      
                                         -------+===**==***##*----=   #.--+####%*#====*=====-------                                                                     
                                        --------===**=#+#####*---=#   ++=--#####%%#===**====*------%                                                                    
                                        -------====*=#-+##%#**--==#..++:=++*#*:##%%#===*=====-------                                                                    
                                       #-------===+*#::=#%%#**====#.:::::-:+#::+#%%%#==*=====-------                                                                    
                                       ==------===*%:::=%%%#+-----+.:::::::#+:::*#%%%#=*=====-------%                                                                   
                                       =======**---#::=#%%%##-----=--::::::#+:::*#%%%#=*=====-------%                                                                   
                                       #===+------%#==##%%%%##------======###*:###%%%#=*=====-------                                                                    
                                       %=---------%#==##%%%%%##----------####=:+#%%%%#=*============                                                                    
                                       -----------%#####%%%%%%#=---------########%%%%#=#===========%                                                                    
                                      ---------#--+######%%%%%#-----------######%%%%%#--#==========                                                                     
                                     -------==-----######%%%%---------------####%%%%#=---=========                                                                      
                                    --=%  ===--------=####----------------------====------*======%                                                                      
                                          %----*---=-::::::-------------::::::::::::::----======%                                                                       
                                          ----+--::::::::-:::::------:::::::::::::::::::--*====%                                                                        
                                         #----+::::::::::::::::::+-::::::::::::::::::::::-*===                                                                          
                                         =---#=:#####+:::::::::::::::::::::::::::####+-::---%                                                                           
                                        %+---==:#::::+=*#*#-=-::::::::::::=##*#++++::::::+-----#                                                                        
                                      ====---==::::::+===#==:::::::::::::::+++#++++::::::---------%                                                                     
                                     %=====-#==*:::###*+++--:::::::::::::=+####*------:::---------%                                                                     
                                        #===#==#:::::---::::::::::::::::::::::----::::::========                                                                        
                                           %===+:::-------:::::::*==::*::::::--=---::::=====%                                                                           
                                               %=#:::::::::::::::=====:::::::::::::::===%                                                                               
                                               %====+%:::::::::::=====:::::::::::%+=====#                                                                               
                                               #%% @**####%%%%--::===:::--%%%######    %                                                                                
                                                  **########%%%::::::::::%########*#%                                                                                   
                                                 *##########%%#=##*::*##=###########*%                                                                                  
                                     %%%%%%%%%%%@%%%%%%%#::::::%::::::::%:====%%%%%%%%%%%%%%%%%@@%%                                                                     
                         %%%%%%%%%:::**%%%%%%%%%%%%%%===+=**::::#-%::%-#:::=+======%%%%%%%%%%%%%%**:::%%%%%%%%%                                                         
                  %#***+%%%%%%%%%%%***************#=======+=:::::::::::::::==+=======#***************%%%%%%%%%%%+***#%                                                  
             %*++++++%%%%#%%%%%%%%+++++++*********========+=+---------------=+========*********+++++++%%%%%%%%#%%%%++++++*%                                             
         *+++++++++%%%**%%%%%%%%%++++++++++++*****+======+==-------++-------==+======#*****++++++++++++%%%%%%%%%**%%%+++++++++*                                         
     @##**+++++++%%%*+%%%%%%%%%%%+++++++++++++++###========------++++++------========###+++++++++++++++%%%%%%%%%%%+*%%%+++++++**##@                                     
             %++%%*++%%%%%*%%%##++++++++++++++++++##====*==---#++++++++++#---==*====##++++++++++++++++++##%%%*%%%%%++*%%++%                                             
               %*+++%%%%%*%%#*##+++++++++++++++++++#=======-----++++++++-----=======#+++++++++++++++++++##*#%%*%%%%%++*+%                                               
                *++@@@@%+%%#**%##++++++++++++++++-=====*===-------++++-------===*=====-++++++++++++++++##%**#%%+%@@@@++* @                                              
              *  +@@@@%++%%*++*##++++++++++++++##%====#====--------++--------====#====+**++++++++++++++##*++*%%++#@@@@*  *                                              
             ++  @@@@@+++%#++++*##   @++++++++*###===#=====+----------------+=====#===***+++++++++@   ##*++++#%+++@@@@@  ++                                             
                 @@@@+++%%++++++%##%   @+++++++++#+#+========--------------========+%+*+++++++++@   %##%++++++%%+++@@@@                                                 
                 @@@@#@@%%+   #++#####  %+++++++++++@===========--------+==========@+++++++++++%  #####++#   +%%@@#@@@@                                                 
                 @@@    %%*     *##***%####%%%%%%##%%==============================%%##%%%%%%####%***##*      %%    @@@                                                 
                 @@@     %       %#%+++++***##%**++*@+*==========================++@*++**%##***+++++%#%       %     @@@                                                 
                 @@@     %%       ##*     *+*##%**+++*+++*====================*+++*+++*+%##*+*     *##        %     @@@                                                 
                  @@      %        #%     @+++++%%+++%#++++++++++++++++++++++++++#%+++%%+++++@     %#        %      @@                                                  
                   @@      %        #%     ++++++++++++=+@+++++++%++++%+++++++@+=++++++++++++     %#        %      @@                                                   
                    @@     *+         %    *++++@   %======+++#++++++++++#+++======%   @++++*    %         +*     @@                                                    
                             *         ++  @+*      =========+  +++++++@  +=========      *+@  ++         #                                                             
                      *++*              *   @       =========  #++++++     =========       @   *              *++*                                                      
                      +++                           ========%  +======     %========                           +++                                                      
                                                    =======%   =======%     %======= +====+%                                                                            
                                                    ===*==%    =======+      %==*=============                                                                          
                                                    %===+      ========%       *===%===========%                                                                        
                                                               =========        +++=============                                                                        
                                                               #=========     %++++*============%                                                                       
                                                                ==========%+++++++++============%                                                                       
                                                                +===========+++++++=============                                                                        
                                                                 ==============+===============%                                                                        
                                                                  ============================*                                                                         
                                                                   ==========================#==%                                                                       
                                                                    *=====+=====================%                                                                       
                                                                      *======#=================                                                                         
                                                                         %===%  %+==========%                                                                           
#でびコネ
*/