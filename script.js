// 深色/淺色模式切換
(function () {
    const STORAGE_KEY = "theme-preference";
    const THEMES = { light: "light", dark: "dark" };
    const ICONS = {
        light: "assets/icon/lightTheme.png",
        dark: "assets/icon/darkTheme.png",
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
    const TOAST_REMOVE_DELAY = 400; // ms
    const DEFAULT_DURATION = 2200; // ms

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

// 圖片查看器
(function () {
    const html = document.documentElement;
    let overlay = null;
    let imgEl = null;
    let captionEl = null;
    let downloadLink = null;
    let closeBtn = null;
    let lastActiveElement = null;

    const ensureElements = () => {
        if (overlay) return overlay;

        overlay = document.createElement("div");
        overlay.className = "image-viewer-overlay";

        const panel = document.createElement("div");
        panel.className = "image-viewer";

        imgEl = document.createElement("img");
        imgEl.className = "image-viewer-img";
        imgEl.alt = "";

        captionEl = document.createElement("div");
        captionEl.className = "image-viewer-caption";

        const actions = document.createElement("div");
        actions.className = "image-viewer-actions";

        downloadLink = document.createElement("a");
        downloadLink.className = "image-viewer-button";
        downloadLink.textContent = "下載";
        downloadLink.setAttribute("download", "");

        closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "image-viewer-button image-viewer-close";
        closeBtn.textContent = "關閉";

        actions.appendChild(downloadLink);
        actions.appendChild(closeBtn);
        panel.appendChild(imgEl);
        panel.appendChild(captionEl);
        panel.appendChild(actions);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeViewer();
        });

        closeBtn.addEventListener("click", closeViewer);

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && overlay?.classList.contains("image-viewer-visible")) {
                closeViewer();
            }
        });

        return overlay;
    };

    const closeViewer = () => {
        if (!overlay) return;
        overlay.classList.remove("image-viewer-visible");
        html.classList.remove("image-viewer-open");
        lastActiveElement?.focus?.();
        lastActiveElement = null;
    };

    const openViewer = (options) => {
        if (!options?.src) return;
        ensureElements();

        lastActiveElement = document.activeElement;
        imgEl.src = options.src;
        imgEl.alt = options.alt || "";
        captionEl.textContent = options.caption || options.alt || "";
        downloadLink.href = options.downloadHref || options.src;

        if (options.downloadName) {
            downloadLink.setAttribute("download", options.downloadName);
        } else {
            downloadLink.removeAttribute("download");
        }

        overlay.classList.add("image-viewer-visible");
        html.classList.add("image-viewer-open");
        closeBtn.focus();
    };

    window.openImageViewer = openViewer;
})();

// 彩蛋觸發：↑↑↓↓←→←→BABA
(function () {
    const KONAMI_CODE = [
        "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
        "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
        "KeyB", "KeyA", "KeyB", "KeyA"
    ];

    let index = 0;

    document.addEventListener("keydown", (e) => {
        if (e.code === KONAMI_CODE[index]) {
            index++;
            if (index === KONAMI_CODE.length) {
                index = 0;
                showToast("你在期待些什麼呢owo");
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
    const themeToggleBaka = document.getElementById("themeToggleEgg");

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

// 彩蛋觸發：點更新日期 6 次
(function () {
    const THRESHOLD = 6;
    const RESET_DELAY = 1500;
    const updateDateBaka = document.getElementById("updateDateEgg");

    if (!updateDateBaka) return;

    let count = 0;
    let resetTimer = null;

    updateDateBaka.addEventListener("click", () => {
        count++;
        clearTimeout(resetTimer);

        if (count >= THRESHOLD) {
            count = 0;
            window.openImageViewer({
                src: "assets/egg/nyapider.gif",
                alt: "Hajimi",
                caption: "別再按了><",
                downloadName: "下載下來做什麼？？？.gif"
            });
        } else {
            resetTimer = setTimeout(() => { count = 0; }, RESET_DELAY);
        }
    });
})();

// Limo OriginPic
(function () {
    const link = document.getElementById("fursona1OriginPic");
    if (!link || !window.openImageViewer) return;

    link.addEventListener("click", (e) => {
        e.preventDefault();
        window.openImageViewer({
            src: "assets/original/fursona1.png",
            alt: "Limo's fursona picture",
            caption: "此圖片嚴禁用於 AI 相關應用、二次修改、未經許可轉載。",
            downloadName: "limo-fursona1-original.png"
        });
    });
})();

// 每日隨機歌曲
(function () {
    const songs = [
        // MSTP
        /* 0 */ { artist: "C418", title: "Alpha", url: "https://youtu.be/q6o7qpPHd7g", from: "Minecraft" },
        /* 1 */ { artist: "KIVΛ, Ice", title: "͟͝͞Ⅱ́̕", url: "https://youtu.be/H2k7TMT3ouA", from: "Cytus II" },
        /* 2 */ { artist: "KIVΛ", title: "The Whole Rest", url: "https://youtu.be/TWqMQeVqqnA", from: "Cytus II" },
        /* 3 */ { artist: "Theatrum Aeternum", title: "acta est fabula, plaudite", url: "https://youtu.be/TPTsSu77MKI", from: "vivid/stasis" },
        /* 4 */ { artist: "eicateve", title: "R.I.P.", url: "https://youtu.be/QJakdR6FWdg" },
        /* 5 */ { artist: "Poppin'Party", title: "Returns", url: "https://youtu.be/zWKV5yudE18", from: "BanG Dream!" },
        /* 6 */ { artist: "ryo (supercell)", title: "ODDS&ENDS", url: "https://youtu.be/HUzLUGKwQJc", unofficial: true },
        /* 7 */ { artist: "Ice", title: "L", url: "https://youtu.be/ZXy_1LA-RlA" },
        /* 8 */ { artist: "Ice", title: "L2 -Ascension- (Act 1)", url: "https://youtu.be/lAkUpYCUXCU", unofficial: true },
        /* 9 */ { artist: "Ice", title: "L2 -Ascension- (Act 2)", url: "https://youtu.be/8nF7MU5iGng", unofficial: true },
        /* 10 */ { artist: "Toby Fox", title: "MEGALOVANIA", url: "https://youtu.be/KK3KXAECte4", from: "UNDERTALE" },
        /* 11 */ { artist: "ああああ", title: "トゥルエンド", url: "https://youtu.be/hK7Inl9Rark", from: "でびるコネクショん" },
        /* 12 */ { artist: "Sta", title: "Incyde", url: "https://youtu.be/-1OiVXRGE-U", from: "Cytus II" },
        /* 13 */ { artist: "繊(Apo11o program vs. お月さま交響曲) ft.じまんぐ", title: "paradigm-paragramme-program", url: "https://youtu.be/8CNl8DZMAL0" },
        /* 14 */ { artist: "Knighthood", title: "Super Universe (Knighthood Remix)", url: "https://youtu.be/v7rqB-o52tE", unofficial: true },
        /* 15 */ { artist: "technoplanet", title: "XYZ", url: "https://youtu.be/ZYXFo637GNc", from: "Cytus II" },
        /* 16 */ { artist: "Team Grimoire", title: "Grievous Lady", url: "https://youtu.be/QXeaLw2s-Wo", from: "Arcaea" },
        /* 17 */ { artist: "Team Grimoire", title: "Rrhar'il", url: "https://youtu.be/Hwny8gQRYZA", from: "Phigros" },
        /* 18 */ { artist: "Cheetah Mobile", title: "Neon", url: "https://youtu.be/pJIh0KPl98s", from: "Rolling Sky" },
        /* 19 */ { artist: "Dimrain47", title: "At the Speed of Light", url: "https://youtu.be/1Zrq8FiKS6A" },
        /* 20 */ { artist: "cYsmix", title: "Peer Gynt", url: "https://youtu.be/w4dLTLW6dJ0", unofficial: true },
        /* 21 */ { artist: "USAO & Camellia", title: "Möbius", url: "https://youtu.be/2fsZdfixj60", from: "WACCA Reverse" },
        /* 22 */ { artist: "Antistar feat. Ctymax", title: "Class Memories", url: "https://youtu.be/3Ka6yPBCs5A", unofficial: true },
        /* 23 */ { artist: "uma vs. モリモリあつし", title: "Re:End of a Dream", url: "https://youtu.be/ayg2A2JoRzg" },

        // 突然喜歡的歌
        /* 24 */ { artist: "A-One", title: "Idoratrize World", url: "https://youtu.be/n8vn1iFDhAs" },
        /* 25 */ { artist: "上海アリス幻樂団", title: "偶像に世界を委ねて　〜 Idoratrize World", url: "https://youtu.be/7DF5wIPlvq0", from: "東方鬼形獣 〜 Wily Beast and Weakest Creature." },
        /* 26 */ { artist: "101-202-404", title: "小悪魔×3の大脫走！？", url: "https://youtu.be/HCgs32kX8eQ", from: "Cytus II", unofficial: true },
        /* 27 */ { artist: "黒皇帝", title: "Galaxy Collapse", url: "https://youtu.be/VJFNcHgQ4HM" },
        /* 28 */ { artist: "黒皇帝 vs MIssionary", title: "Deus Judicium", url: "https://youtu.be/CZJoFLSe9Ao", from: "Rotaeno" },
        /* 29 */ { artist: "seatrus", title: "零號車輛", url: "https://youtu.be/Mk0OFd9du0w", from: "Paradigm: Reboot" },
        /* 30 */ { artist: "NeLiME", title: "CODE NAME : ZERO", url: "https://youtu.be/26nQsUdhBNQ", from: "Cytus" },
        /* 31 */ { artist: "log()", title: "SELF", url: "https://youtu.be/q7PXMBjTVLc", from: "vivid/stasis" },
        /* 32 */ { artist: "Juggernaut.", title: "Revenant", url: "https://youtu.be/Oa9K-tWrMIU" },
        /* 33 */ { artist: "Ayatsugu_Revolved", title: "100sec Cat Dreams", url: "https://youtu.be/zBlmtNKgrk0", from: "Cytus II", unofficial: true },
        /* 34 */ { artist: "It's MyGO!!!!!", title: "詩超絆", url: "https://youtu.be/wJ-OebTVyvk", from: "BanG Dream!" },
        /* 35 */ { artist: "Poppin'Party", title: "Dreamers Go!", url: "https://youtu.be/VigNV3bsE_k", from: "BanG Dream!" },
        /* 36 */ { artist: "ああああ", title: "でびるコネクショん", url: "https://youtu.be/aQx9OjvQZEo", from: "でびるコネクショん" },
        /* 37 */ { artist: "KIVΛ", title: "Used to be", url: "https://youtu.be/hGaJNvkRfo0", from: "Cytus II" },
        /* 38 */ { artist: "やいり", title: "Ultimate feat. 放課後のあいつ", url: "https://youtu.be/j-n1Ah5zXT0", from: "Cytus II", unofficial: true },
        /* 39 */ { artist: "MELOIMAGE", title: "Imprint", url: "https://youtu.be/mTcFEVeVoDs", from: "Cytus II", unofficial: true },
        /* 40 */ { artist: "Apo11o program", title: "Re:The END -再-", url: "https://youtu.be/gnt9Bnei2is", from: "Cytus II" },
        /* 41 */ { artist: 'NOMA w/ Apo11o"ALGIEBA"program', title: "LAST Re;SØRT", url: "https://youtu.be/2a0wyR-Hu1Y", from: "RAVON" },
        /* 42 */ { artist: "Tobu", title: "Higher", url: "https://youtu.be/blA7epJJaR4" },
        /* 43 */ { artist: "ユリイ・カノン", title: "スーサイドパレヱド", url: "https://youtu.be/7awIdGqyr40" },
        /* 44 */ { artist: "上海アリス幻樂団", title: "平安のエイリアン", url: "https://youtu.be/1fwZxZIb2uE", from: "東方星蓮船 〜 Undefined Fantastic Object.", unofficial: true },
        /* 45 */ { artist: "Roselia", title: "Neo-Aspect", url: "https://youtu.be/03iVXFZ8jrs", from: "BanG Dream!" },
        /* 46 */ { artist: "RAISE A SUILEN", title: "DEAD HEAT BEAT", url: "https://youtu.be/2gJfjLGCf9U", from: "BanG Dream!" },
        /* 47 */ { artist: "DECO*27", title: "ヴァンパイア", url: "https://youtu.be/e1xCOsgWG0M" },
        /* 48 */ { artist: "溝口ゆうま feat. 大瀬良あい", title: "Nídhögg", url: "https://youtu.be/3w6I9Ye304o", from: "Cytus II" },
        /* 49 */ { artist: "Tsukasa", title: "Stardust Sphere", url: "https://youtu.be/f9XYU172ImI", from: "Cytus" },
        /* 50 */ { artist: "Ice", title: "iL", url: "https://youtu.be/ilLGb4b7Twc", from: "Cytus II" },
        /* 51 */ { artist: "DJ Myosuke & Gram & t+pazolite", title: "Σ", url: "https://youtu.be/qbQHPdTLX40" },
        /* 52 */ { artist: "Y&Co.", title: "Daisuke", url: "https://youtu.be/T9rMDOkPiRY", unofficial: true },
        /* 53 */ { artist: "BlackY VS Yooh VS siromaru VS xi VS モリモリあつし", title: "創 -汝ら新世界へ歩む者なり-", url: "https://youtu.be/kLs6UW43MsQ", from: "CHUNITHM" },
        /* 54 */ { artist: "xi", title: "Xaleid◆scopiX", url: "https://youtu.be/-PTe8zkYt9A", from: "maimai でらっくす" },
        /* 55 */ { artist: "Shu feat. 天羽しろっぷ", title: "殿ッ！？ご乱心！？", url: "https://youtu.be/U2i_IuAB6wo", from: "maimai でらっくす" },
        /* 56 */ { artist: "ああああ", title: "優しさに触れて", url: "https://youtu.be/f8qaWMjyVWU", from: "でびるコネクショん" },
        /* 57 */ { artist: "Quree", title: "HTTPS", url: "https://youtu.be/dQZ14TWuhi0" },
        /* 58 */ { artist: "Ardolf", title: "(execute.)", url: "https://youtu.be/LJrTObZjVZg" },
        /* 59 */ { artist: "Kry.exe vs. Ganymede", title: "First Breath", url: "https://youtu.be/fJu8paff0Xw", from: "vivid/stasis" }

        // /* ? */ { artist: "", title: "", url: "", from: "", unofficial: trueOr }
    ];

    if (songs.length === 0) {
        const container = document.getElementById("dailySongContainer");
        if (container) {
            container.innerHTML = "<p>（這裡還沒有歌曲呢QwQ）</p>";
        }
        return;
    }

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

        const titleLink = document.createElement("a");
        titleLink.href = dailySong.url;
        titleLink.target = "_blank";
        titleLink.rel = "noopener noreferrer";
        titleLink.textContent = dailySong.unofficial ? `${dailySong.title} (unofficial)` : dailySong.title;
        container.appendChild(titleLink);

        container.appendChild(document.createElement("br"));

        const artistDiv = document.createElement("p");
        artistDiv.style.margin = "0.3em 0";
        artistDiv.textContent = `作曲：${dailySong.artist}`;
        container.appendChild(artistDiv);

        if (dailySong.from) {
            const fromDiv = document.createElement("p");
            fromDiv.style.margin = "0.3em 0";
            fromDiv.textContent = `來自：${dailySong.from}`;
            container.appendChild(fromDiv);
        }
    };

    const dailySong = selectDailySong();
    renderSongInfo(dailySong);
})();