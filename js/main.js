(function () {
  const storageKey = "theme";

  function getPreferredTheme() {
    if (typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(storageKey, theme);
    } catch (_) {
      /* ignore */
    }
  }

  function initTheme() {
    let theme = "light";
    try {
      theme = localStorage.getItem(storageKey);
    } catch (_) {
      /* ignore */
    }
    if (!theme) theme = getPreferredTheme();
    applyTheme(theme);

    const btn = document.getElementById("themeToggle");
    if (btn) {
      btn.addEventListener("click", function () {
        const next =
          document.documentElement.getAttribute("data-theme") === "dark"
            ? "light"
            : "dark";
        applyTheme(next);
      });
    }
  }

  /** @type {"home"|"businesses"} */
  function normalizeView(hash) {
    if (hash === "#businesses") return "businesses";
    return "home";
  }

  function setView(view) {
    const homePanel = document.querySelector('[data-view-panel="home"]');
    const bizPanel = document.querySelector('[data-view-panel="businesses"]');
    const navHome = document.getElementById("navHome");
    const navBiz = document.getElementById("navBusinesses");

    if (homePanel) homePanel.hidden = view !== "home";
    if (bizPanel) bizPanel.hidden = view !== "businesses";

    if (navHome) {
      if (view === "home") navHome.setAttribute("aria-current", "page");
      else navHome.removeAttribute("aria-current");
    }
    if (navBiz) {
      if (view === "businesses") navBiz.setAttribute("aria-current", "page");
      else navBiz.removeAttribute("aria-current");
    }

    document.title = view === "businesses" ? "Our businesses — Nael Ventures" : "Nael Ventures";
  }

  function scrollToContact() {
    const el = document.getElementById("contact");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initViews() {
    function fromHash() {
      return normalizeView(window.location.hash);
    }

    setView(fromHash());

    window.addEventListener("hashchange", function () {
      setView(fromHash());
    });

    document.querySelectorAll("[data-view]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        const v = el.getAttribute("data-view");
        if (!v) return;
        const href = el.getAttribute("href") || "";
        if (href.startsWith("#")) {
          e.preventDefault();
          const hash = v === "businesses" ? "#businesses" : "#home";
          if (window.location.hash !== hash) {
            window.location.hash = hash;
          } else {
            setView(v);
          }
        }
      });
    });

    document.querySelectorAll('a[href="#contact"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        scrollToContact();
      });
    });
  }

  function initYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  initTheme();
  initViews();
  initYear();
})();
