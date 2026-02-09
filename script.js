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
        downloadLink.textContent = "下載原圖";
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
                showToast("哇！別再按啦 QwQ");
            }
        } else {
            index = 0;
        }
    });
})();

// 彩蛋觸發：點擊 logo 6 次
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
    var link = document.getElementById("fursona1OriginalLink");
    if (!link || typeof window.openImageViewer !== "function") return;

    link.addEventListener("click", function (e) {
        e.preventDefault();
        window.openImageViewer({
            src: "assets/original/fursona1.png",
            alt: "limoOriginPic",
            caption: "里莫/Limo 的設定圖（原圖）",
            downloadName: "limo-fursona1-original.png"
        });
    });
})();