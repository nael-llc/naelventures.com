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

  function parseTokens(str) {
    return str.trim().split(/\s+/).filter(Boolean);
  }

  function cardMatches(card, activeByGroup) {
    const groups = Object.keys(activeByGroup);
    if (groups.length === 0) return true;

    for (const g of groups) {
      const selected = activeByGroup[g];
      if (selected.size === 0) continue;
      const attr = card.getAttribute("data-" + g);
      if (!attr) return false;
      const values = new Set(parseTokens(attr));
      const hit = [...selected].some((v) => values.has(v));
      if (!hit) return false;
    }
    return true;
  }

  function initFilters() {
    const pills = document.querySelectorAll(".filter-pill");
    const cards = document.querySelectorAll(".card-grid .card");
    const noResults = document.getElementById("noResults");
    const resultCount = document.getElementById("resultCount");
    const activeCountEl = document.getElementById("activeFilterCount");
    const resetBtn = document.getElementById("resetFilters");

    /** @type {Record<string, Set<string>>} */
    const activeByGroup = {};

    function syncPillStates() {
      pills.forEach(function (pill) {
        const groupEl = pill.closest("[data-filter-group]");
        const group = groupEl && groupEl.getAttribute("data-filter-group");
        const value = pill.getAttribute("data-value");
        if (!group || !value) return;
        const set = activeByGroup[group];
        pill.classList.toggle("is-active", set && set.has(value));
      });
    }

    function update() {
      let visible = 0;
      cards.forEach(function (card) {
        const show = cardMatches(card, activeByGroup);
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (resultCount) resultCount.textContent = String(visible);
      if (noResults) noResults.hidden = visible !== 0;

      let totalActive = 0;
      Object.values(activeByGroup).forEach(function (s) {
        totalActive += s.size;
      });
      if (activeCountEl) activeCountEl.textContent = String(totalActive);
    }

    pills.forEach(function (pill) {
      const groupEl = pill.closest("[data-filter-group]");
      const group = groupEl && groupEl.getAttribute("data-filter-group");
      const value = pill.getAttribute("data-value");
      if (!group || !value) return;
      if (!activeByGroup[group]) activeByGroup[group] = new Set();

      pill.addEventListener("click", function () {
        const set = activeByGroup[group];
        if (set.has(value)) set.delete(value);
        else set.add(value);
        syncPillStates();
        update();
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        Object.keys(activeByGroup).forEach(function (k) {
          activeByGroup[k].clear();
        });
        syncPillStates();
        update();
      });
    }

    syncPillStates();
    update();
  }

  function initYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  initTheme();
  initFilters();
  initYear();
})();
