(function () {
  "use strict";

  const THEME_KEY = "theme";

  const VERSES = [
    {
      reference: "Moroni 10:4",
      text:
        "And when ye shall receive these things, I would exhort you that ye would ask God, the Eternal Father, in the name of Christ, if these things are not true; and if ye shall ask with a sincere heart, with real intent, having faith in Christ, he will manifest the truth of it unto you, by the power of the Holy Ghost.",
    },
    {
      reference: "2 Nephi 2:25",
      text: "Adam fell that men might be; and men are, that they might have joy.",
    },
    {
      reference: "John 3:16",
      text:
        "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    },
    {
      reference: "Doctrine and Covenants 1:37",
      text:
        "Search these commandments, for they are true and faithful, and the prophecies and promises which are in them shall all be fulfilled.",
    },
    {
      reference: "Psalm 23:1",
      text: "The Lord is my shepherd; I shall not want.",
    },
    {
      reference: "Matthew 11:28–30",
      text:
        "Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls. For my yoke is easy, and my burden is light.",
    },
    {
      reference: "Alma 7:11–12",
      text:
        "And he shall go forth, suffering pains and afflictions and temptations of every kind; and this that the word might be fulfilled which saith he will take upon him the pains and the sicknesses of his people.",
    },
    {
      reference: "Philippians 4:13",
      text: "I can do all things through Christ which strengtheneth me.",
    },
  ];

  const NEWS_ITEMS = [
    {
      badge: "Upcoming",
      title: "General conference next session",
      subtitle: "Worship with members worldwide — add to your calendar.",
    },
    {
      badge: "This week",
      title: "Come, Follow Me this week",
      subtitle: "Study ideas for individuals and families.",
    },
    {
      badge: "Local",
      title: "Temple open house in your area",
      subtitle: "Check local announcements and scheduling.",
    },
    {
      badge: "Resources",
      title: "Serving in your ward or branch",
      subtitle: "Resources for callings and ministering.",
    },
  ];

  function dayOfYear(d) {
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d - start;
    return Math.floor(diff / 86400000);
  }

  function verseForToday() {
    const d = new Date();
    const idx = (dayOfYear(d) - 1 + VERSES.length * 100) % VERSES.length;
    return VERSES[idx];
  }

  function shorten(str, max) {
    if (str.length <= max) return str;
    return str.slice(0, max - 1) + "…";
  }

  function getPreferredTheme() {
    if (typeof window.matchMedia !== "function") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_) {}
  }

  function initTheme() {
    let theme = null;
    try {
      theme = localStorage.getItem(THEME_KEY);
    } catch (_) {}
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

  function renderDailyVerse() {
    const v = verseForToday();
    const refEl = document.getElementById("dailyRef");
    const textEl = document.getElementById("dailyText");
    if (refEl) refEl.textContent = v.reference;
    if (textEl) textEl.textContent = v.text;
  }

  function renderNews() {
    const ul = document.getElementById("newsList");
    if (!ul) return;
    ul.innerHTML = NEWS_ITEMS.map(
      (n) =>
        `<li class="study-news__item">
          <span class="study-news__badge">${escapeHtml(n.badge)}</span>
          <p class="study-news__item-title">${escapeHtml(n.title)}</p>
          <p class="study-news__item-sub">${escapeHtml(n.subtitle)}</p>
        </li>`
    ).join("");
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  /* Drawer */
  function initDrawer() {
    const toggle = document.getElementById("menuToggle");
    const drawer = document.getElementById("studyDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    if (!toggle || !drawer || !backdrop) return;

    function open() {
      drawer.classList.add("is-open");
      backdrop.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      backdrop.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
    }

    function close() {
      drawer.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      backdrop.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }

    function isOpen() {
      return drawer.classList.contains("is-open");
    }

    toggle.addEventListener("click", function () {
      if (isOpen()) close();
      else open();
    });

    backdrop.addEventListener("click", close);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) close();
    });

    drawer.querySelectorAll("[data-menu-item]").forEach(function (btn) {
      btn.addEventListener("click", close);
    });
  }

  /* Views */
  const titles = { home: "Covenant Study", chat: "Scripture chat", devotional: "Devotional" };

  function showView(name) {
    const home = document.getElementById("view-home");
    const chat = document.getElementById("view-chat");
    const dev = document.getElementById("view-devotional");
    const titleEl = document.getElementById("topbarTitle");
    const main = document.getElementById("study-main");

    [home, chat, dev].forEach(function (el) {
      if (!el) return;
      el.hidden = true;
      el.classList.add("study-view--hidden");
    });

    let active = home;
    if (name === "chat") active = chat;
    if (name === "devotional") active = dev;

    if (active) {
      active.hidden = false;
      active.classList.remove("study-view--hidden");
    }

    if (titleEl) titleEl.textContent = titles[name] || titles.home;

    window.scrollTo(0, 0);

    const existingBack = main && main.querySelector(".study-back-row");
    if (name === "home") {
      if (existingBack) existingBack.remove();
    } else if (main) {
      if (!existingBack) {
        const row = document.createElement("div");
        row.className = "study-back-row";
        row.innerHTML =
          '<button type="button" class="study-back-btn" id="studyBack">‹ Home</button>';
        main.insertBefore(row, main.firstChild);
        document.getElementById("studyBack").addEventListener("click", function () {
          showView("home");
        });
      }
    }
  }

  function initNavigation() {
    document.querySelectorAll("[data-go]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const go = btn.getAttribute("data-go");
        if (go === "chat" || go === "devotional") showView(go);
      });
    });
  }

  /* Chat */
  function initChat() {
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    const thread = document.getElementById("chatThread");
    if (!form || !input || !thread) return;

    function appendMsg(text, isUser) {
      const div = document.createElement("div");
      div.className = "study-msg " + (isUser ? "study-msg--user" : "study-msg--bot");
      div.textContent = text;
      thread.appendChild(div);
      thread.scrollTop = thread.scrollHeight;
    }

    appendMsg(
      "Ask a question about the scriptures. This page uses local demo replies until you connect an AI backend.",
      false
    );

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const t = input.value.trim();
      if (!t) return;
      appendMsg(t, true);
      input.value = "";

      const lower = t.toLowerCase();
      let reply =
        "Thanks for sharing that. When you connect an AI service, answers can draw on approved sources and cite verses. For now, try asking about faith, prayer, or the Book of Mormon.";
      if (lower.includes("faith")) {
        reply =
          "Faith often grows in small, daily choices to turn toward the Savior. Consider Alma 32 — experiment upon the word and see how it begins to swell within you.";
      } else if (lower.includes("prayer") || lower.includes("pray")) {
        reply =
          "The Lord invites us to “pray always” (3 Nephi 18). Even brief, honest prayers can invite guidance and peace.";
      } else if (
        lower.includes("book of mormon") ||
        lower.includes("bom") ||
        lower.includes("nephi")
      ) {
        reply =
          "The Book of Mormon is another testament of Jesus Christ. Try reading a few verses, note a phrase that stands out, and ask how it applies today.";
      }

      window.setTimeout(function () {
        appendMsg(reply, false);
      }, 400);
    });
  }

  /* Devotional */
  function sliderLabels(godVal, dayVal) {
    const g = godVal / 100;
    const d = dayVal / 100;
    let godFoot;
    if (g < 0.34) godFoot = "Seeking closeness";
    else if (g < 0.67) godFoot = "Steady";
    else godFoot = "Feeling near to God";

    let dayFoot;
    if (d < 0.34) dayFoot = "Heavy or hard";
    else if (d < 0.67) dayFoot = "Mixed";
    else dayFoot = "Grateful or bright";

    return { godFoot, dayFoot };
  }

  function buildDevotional(g, d) {
    const v = verseForToday();
    let toneGod;
    if (g < 0.34) {
      toneGod =
        "If God feels far away, remember He often draws near in quiet moments. You are not behind; you are being invited to take the next small step.";
    } else if (g < 0.67) {
      toneGod =
        "Steady faith is holy ground. The Lord blesses consistent effort more than perfect feelings.";
    } else {
      toneGod =
        "Gratitude for closeness to God can spill into kindness for others. Let today’s peace become someone else’s lift.";
    }

    let toneDay;
    if (d < 0.34) {
      toneDay =
        "On hard days, the Savior’s invitation still stands: come unto Him with your weariness. Healing often comes gradually, line upon line.";
    } else if (d < 0.67) {
      toneDay =
        "Mixed days are common. Name one thing you can entrust to the Lord before the sun sets — a worry, a relationship, or a decision.";
    } else {
      toneDay =
        "A brighter day is a gift. Consider who might need a text, a visit, or a quiet prayer on their behalf.";
    }

    return (
      toneGod +
      "\n\n" +
      toneDay +
      "\n\n" +
      "Ponder " +
      v.reference +
      ": “" +
      shorten(v.text, 220) +
      "”"
    );
  }

  function buildPrayer(g, d) {
    let opener;
    if (g < 0.34) {
      opener =
        "Heavenly Father, I come to Thee honestly—sometimes I feel far from Thee. Please help me recognize Thy hand today.";
    } else if (g < 0.67) {
      opener =
        "Father, thank Thee for steadying me. Please increase my trust in Thy Son and Thy timing.";
    } else {
      opener =
        "Father, I thank Thee for feeling Thy love. Help me share that love in simple ways.";
    }

    let middle;
    if (d < 0.34) {
      middle =
        " This day has been difficult; please carry what feels too heavy for me alone.";
    } else if (d < 0.67) {
      middle =
        " My day has been mixed—please guide my thoughts and soften my heart toward others.";
    } else {
      middle = " My heart is grateful; help me notice who needs encouragement.";
    }

    return opener + middle + " In the name of Jesus Christ, amen.";
  }

  function initDevotional() {
    const god = document.getElementById("sliderGod");
    const day = document.getElementById("sliderDay");
    const labelGod = document.getElementById("labelGod");
    const labelDay = document.getElementById("labelDay");
    const btn = document.getElementById("btnDevotional");
    const out = document.getElementById("devotionalOut");
    const body = document.getElementById("devotionalBody");
    const prayerOut = document.getElementById("prayerOut");
    const prayerText = document.getElementById("prayerText");

    if (!god || !day || !labelGod || !labelDay) return;

    function syncLabels() {
      const g = Number(god.value);
      const d = Number(day.value);
      const L = sliderLabels(g, d);
      labelGod.textContent = L.godFoot;
      labelDay.textContent = L.dayFoot;
    }

    god.addEventListener("input", syncLabels);
    day.addEventListener("input", syncLabels);
    syncLabels();

    if (btn && out && body && prayerOut && prayerText) {
      btn.addEventListener("click", function () {
        const gv = Number(god.value) / 100;
        const dv = Number(day.value) / 100;
        body.textContent = buildDevotional(gv, dv);
        prayerText.textContent = buildPrayer(gv, dv);
        out.hidden = false;
        out.classList.remove("study-output--hidden");
        prayerOut.hidden = false;
        prayerOut.classList.remove("study-output--hidden");
        btn.textContent = "Regenerate devotional";
      });
    }
  }

  initTheme();
  initDrawer();
  initNavigation();
  renderDailyVerse();
  renderNews();
  initChat();
  initDevotional();

  document.getElementById("refreshVerse")?.addEventListener("click", renderDailyVerse);
})();
