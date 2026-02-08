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

    // 系統深色模式變更時：改為跟隨系統並清除手動偏好，讓網站之後仍會隨系統自動切換
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

// 彩蛋 Toast
function showKonamiEgg() {
    var el = document.createElement("div");
    el.className = "konami-egg";
    el.setAttribute("role", "status");
    el.textContent = "哇！別再按啦 QwQ";
    document.body.appendChild(el);
    el.offsetHeight;
    el.classList.add("konami-egg-visible");
    setTimeout(function () {
        el.classList.remove("konami-egg-visible");
        setTimeout(function () { el.remove(); }, 400);
    }, 2200);
}

// 彩蛋觸發：↑↑↓↓←→←→BABA
(function () {
    var konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA", "KeyB", "KeyA"];
    var index = 0;

    document.addEventListener("keydown", function (e) {
        if (e.code === konami[index]) {
            index++;
            if (index === konami.length) {
                index = 0;
                showKonamiEgg();
            }
        } else {
            index = 0;
        }
    });
})();

// 彩蛋觸發：點擊設定圖 6 次
(function () {
    var fursona = document.getElementById("fursona1");
    var count = 0;
    var resetTimer = null;

    if (fursona) {
        fursona.addEventListener("click", function () {
            count++;
            clearTimeout(resetTimer);
            resetTimer = setTimeout(function () { count = 0; }, 1500);
            if (count >= 6) {
                count = 0;
                showKonamiEgg();
            }
        });
    }
})();