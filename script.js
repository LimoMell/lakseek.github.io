// 深色/淺色模式切換
(function () {
    const storageKey = "theme-preference";
    const html = document.documentElement;
    const toggleBtn = document.getElementById("themeToggle");
    const logo = document.querySelector(".top .logo");
    const toggleIcon = document.getElementById("themeToggleIcon");

    const logoFor = {
        light: "assets/icon/lmLogo.png",
        dark: "assets/icon/lmLogo.png",
    };

    const iconFor = {
        light: "assets/icon/lightTheme.png",
        dark: "assets/icon/darkTheme.png",
    };

    const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");

    function getStoredPreference() {
        try {
            const v = localStorage.getItem(storageKey);
            return v === "light" || v === "dark" ? v : null;
        } catch {
            return null;
        }
    }

    function storePreference(value) {
        try {
            if (value === "light" || value === "dark") {
                localStorage.setItem(storageKey, value);
            } else {
                localStorage.removeItem(storageKey);
            }
        } catch {
            // ignore
        }
    }

    function getEffectiveTheme(pref) {
        if (pref === "light" || pref === "dark") return pref;
        return media && media.matches ? "dark" : "light";
    }

    function render(pref) {
        const effective = getEffectiveTheme(pref);
        html.setAttribute("data-theme", effective);

        if (logo) {
            logo.src = logoFor[effective] || logoFor.light;
        }

        if (toggleIcon) {
            toggleIcon.src = iconFor[effective] || iconFor.light;
        }
    }

    function nextPrefFromEffective(effective) {
        return effective === "dark" ? "light" : "dark";
    }

    let pref = getStoredPreference();
    render(pref);

    if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
            const effective = getEffectiveTheme(pref);
            pref = nextPrefFromEffective(effective);
            storePreference(pref);
            render(pref);
        });
    }

    if (media && typeof media.addEventListener === "function") {
        media.addEventListener("change", function () {
            pref = null;
            storePreference(null);
            render(pref);
        });
    } else if (media && typeof media.addListener === "function") {
        media.addListener(function () {
            pref = null;
            storePreference(null);
            render(pref);
        });
    }
})();

// Toast 訊息
(function () {
    var activeToasts = [];
    var toastContainer = null;

    function initToastContainer() {
        if (!toastContainer) {
            toastContainer = document.createElement("div");
            toastContainer.className = "toast-container";
            toastContainer.setAttribute("aria-live", "polite");
            toastContainer.setAttribute("aria-atomic", "false");
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }

    function updateToastPositions() {
        activeToasts.forEach(function (toast, index) {
            var offset = index * (3.5 + 0.5);
            toast.style.bottom = (3 + offset) + "rem";
        });
    }

    function removeToast(toast) {
        var index = activeToasts.indexOf(toast);
        if (index > -1) {
            activeToasts.splice(index, 1);
            toast.classList.remove("toast-visible");
            setTimeout(function () {
                toast.remove();
                updateToastPositions();
            }, 400);
        }
    }

    window.showToast = function (message, duration) {
        if (typeof message !== "string" || message.length === 0) return;
        duration = duration || 2200;

        var container = initToastContainer();
        var toast = document.createElement("div");
        toast.className = "toast";
        toast.setAttribute("role", "status");
        toast.textContent = message;
        container.appendChild(toast);

        activeToasts.push(toast);
        updateToastPositions();

        toast.offsetHeight;
        toast.classList.add("toast-visible");

        setTimeout(function () {
            removeToast(toast);
        }, duration);
    };
})();

// 圖片查看器
(function () {
    var overlay = null;
    var imgEl = null;
    var captionEl = null;
    var downloadLink = null;
    var closeBtn = null;
    var lastActiveElement = null;

    function ensureElements() {
        if (overlay) return overlay;

        overlay = document.createElement("div");
        overlay.className = "image-viewer-overlay";

        var panel = document.createElement("div");
        panel.className = "image-viewer";

        imgEl = document.createElement("img");
        imgEl.className = "image-viewer-img";
        imgEl.alt = "";

        captionEl = document.createElement("div");
        captionEl.className = "image-viewer-caption";

        var actions = document.createElement("div");
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

        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) {
                closeViewer();
            }
        });

        closeBtn.addEventListener("click", function () {
            closeViewer();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && overlay && overlay.classList.contains("image-viewer-visible")) {
                closeViewer();
            }
        });

        return overlay;
    }

    function closeViewer() {
        if (!overlay) return;
        overlay.classList.remove("image-viewer-visible");
        document.documentElement.style.overflow = "";
        if (lastActiveElement && typeof lastActiveElement.focus === "function") {
            lastActiveElement.focus();
        }
        lastActiveElement = null;
    }

    function openViewer(options) {
        if (!options || !options.src) return;
        ensureElements();

        lastActiveElement = document.activeElement;

        imgEl.src = options.src;
        imgEl.alt = options.alt || "";

        captionEl.textContent = options.caption || options.alt || "";

        downloadLink.href = options.downloadHref || options.src;
        if (options.downloadName) {
            downloadLink.setAttribute("download", options.downloadName);
        } else {
            downloadLink.setAttribute("download", "");
        }

        overlay.classList.add("image-viewer-visible");
        document.documentElement.style.overflow = "hidden";
        closeBtn.focus();
    }

    window.openImageViewer = openViewer;
})();

// 彩蛋觸發：↑↑↓↓←→←→BABA
(function () {
    var konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA", "KeyB", "KeyA"];
    var index = 0;

    document.addEventListener("keydown", function (e) {
        if (e.code === konami[index]) {
            index++;
            if (index === konami.length) {
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
    var fursona = document.getElementById("themeToggleEgg");
    var count = 0;
    var resetTimer = null;

    if (fursona) {
        fursona.addEventListener("click", function () {
            count++;
            clearTimeout(resetTimer);
            resetTimer = setTimeout(function () { count = 0; }, 1500);
            if (count >= 6) {
                count = 0;
                showToast("哇！別再按啦 QwQ");
            }
        });
    }
})();

// Limo OriginPic
(function () {
    var link = document.getElementById("fursona1OriginPic");
    if (!link || typeof window.openImageViewer !== "function") return;

    link.addEventListener("click", function (e) {
        e.preventDefault();
        window.openImageViewer({
            src: "assets/original/fursona1.png",
            alt: "limoOriginPic",
            caption: "此圖片嚴禁用於 AI 相關應用、二次修改、未經許可轉載。",
            downloadName: "limo-fursona1-original.png"
        });
    });
})();

// 每日隨機歌曲
(function () {
    var songs = [
        // MSTP
        { title: "C418 - Alpha (from Minecraft)", url: "https://youtu.be/q6o7qpPHd7g" },
        { title: "KIVΛ, Ice - ͟͝͞Ⅱ́̕ (from Cytus II)", url: "https://youtu.be/H2k7TMT3ouA" },
        { title: "KIVΛ - The Whole Rest (from Cytus II)", url: "https://youtu.be/TWqMQeVqqnA"},
        { title: "Theatrum Aeternum - acta est fabula, plaudite (from vivid/stasis)", url: "https://youtu.be/TPTsSu77MKI" },
        { title: "eicateve - R.I.P.", url: "https://youtu.be/QJakdR6FWdg" },
        { title: "Poppin'Party - Returns (from BanG Dream!)", url: "https://youtu.be/zWKV5yudE18" },
        { title: "ryo (supercell) - ODDS&ENDS (unofficial)", url: "https://youtu.be/HUzLUGKwQJc" },
        { title: "Ice - L", url: "https://youtu.be/ZXy_1LA-RlA" },
        { title: "Ice - L2 -Ascension- (Act 1) (unofficial)", url: "https://youtu.be/lAkUpYCUXCU" },
        { title: "Ice - L2 -Ascension- (Act 2) (unofficial)", url: "https://youtu.be/8nF7MU5iGng" },
        { title: "Toby Fox - MEGALOVANIA (from UNDERTALE)", url: "https://youtu.be/KK3KXAECte4" },
        { title: "ああああ - トゥルエンド (from でびコネ)", url: "https://youtu.be/hK7Inl9Rark" },
        { title: "Sta - Incyde (from Cytus II)", url: "https://youtu.be/-1OiVXRGE-U" },
        { title: "繊(Apo11o program vs. お月さま交響曲) ft.じまんぐ - paradigm-paragramme-program", url: "https://youtu.be/8CNl8DZMAL0" },
        { title: "Knighthood - Super Universe (Knighthood Remix) (unofficial)", url: "https://youtu.be/v7rqB-o52tE" },
        { title: "technoplanet - XYZ (from Cytus II)", url: "https://youtu.be/ZYXFo637GNc" },
        { title: "Team Grimoire - Grievous Lady (from Arcaea)", url: "https://youtu.be/QXeaLw2s-Wo" },
        { title: "Team Grimoire - Rrhar’il (from Phigros)", url: "https://youtu.be/Hwny8gQRYZA" },
        { title: "Cheetah Mobile - Neon (from Rolling Sky)", url: "https://youtu.be/pJIh0KPl98s" },
        { title: "Dimrain47 - At the Speed of Light", url: "https://youtu.be/1Zrq8FiKS6A" },
        { title: "cYsmix - Peer Gynt (unofficial)", url: "https://youtu.be/w4dLTLW6dJ0" },
        { title: "USAO & Camellia - Möbius (from WACCA Reverse)", url: "https://youtu.be/2fsZdfixj60" },
        { title: "Antistar feat. Ctymax - Class Memories (unofficial)", url: "https://youtu.be/3Ka6yPBCs5A" },
        { title: "uma vs. モリモリあつし - Re:End of a Dream", url: "https://youtu.be/ayg2A2JoRzg" },

        // 突然喜歡的歌
        { title: "A-One - Idoratrize World", url: "https://youtu.be/n8vn1iFDhAs" },
        { title: "上海アリス幻樂団 - 偶像に世界を委ねて　〜 Idoratrize World (from 東方鬼形獣)", url: "https://youtu.be/7DF5wIPlvq0" },
        { title: "101 202 404 - 小悪魔×3の大脫走！？ (from Cytus II, unofficial)", url: "https://youtu.be/HCgs32kX8eQ" },
        { title: "黒皇帝 - Galaxy Collapse", url: "https://youtu.be/VJFNcHgQ4HM" },
        { title: "黒皇帝 vs MIssionary - Deus Judicium (from Rotaeno)", url: "https://youtu.be/CZJoFLSe9Ao" },
        { title: "seatrus - 零號車輛 (from Paradigm: Reboot)", url: "https://youtu.be/Mk0OFd9du0w" },
        { title: "NeLiME - CODE NAME : ZERO (from Cytus)", url: "https://youtu.be/26nQsUdhBNQ" },
        { title: "log() - SELF (from vivid/stasis)", url: "https://youtu.be/q7PXMBjTVLc" },
        { title: "Juggernaut. - Revenant", url: "https://youtu.be/Oa9K-tWrMIU" },
        { title: "Ayatsugu_Revolved - 100sec Cat Dreams (from Cytus II, unofficial)", url: "https://youtu.be/zBlmtNKgrk0" }
    ];

    if (songs.length === 0) {
        var container = document.getElementById("dailySongContainer");
        if (container) {
            container.innerHTML = "<p>（這裡還沒有歌曲呢QwQ）</p>";
        }
        return;
    }

    function getDailySeed() {
        var today = new Date();
        var dateString = today.getFullYear() + "-" + 
                        String(today.getMonth() + 1).padStart(2, "0") + "-" + 
                        String(today.getDate()).padStart(2, "0");
        var hash = 0;
        for (var i = 0; i < dateString.length; i++) {
            var char = dateString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    function selectDailySong() {
        var seed = getDailySeed();
        var index = seed % songs.length;
        return songs[index];
    }

    var dailySong = selectDailySong();
    var linkEl = document.getElementById("dailySongLink");
    
    if (linkEl && dailySong) {
        linkEl.href = dailySong.url;
        linkEl.textContent = dailySong.title;
    }
})();