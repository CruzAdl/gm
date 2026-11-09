// GM — General Manager (V1 Pure Vanilla Engine)

const STORAGE_KEY = "gm_state_v1";

const DOMAINS = [
  "Job",
  "Responsibilities",
  "Goals (Sport)",
  "Opportunities",
  "Parents",
  "Friends",
  "Pleasures",
  "Vices",
  "Money",
  "Rest"
];

const GUARDRAILS = ["XB15"];

function getLocalDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTimeHHMM(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch (e) {
    console.error("Failed to read state:", e);
  }

  // Default state pre-loaded with Day 1 GM Plan from tonight's session
  const defaultOrigin = window.location.origin + window.location.pathname;

  return {
    settings: {
      ntfyTopic: "",
      appUrl: defaultOrigin,
      clockWindowStart: "05:30",
      clockWindowEnd: "23:00",
      ghToken: "",
      ghGistId: ""
    },
    activePlan: {
      targetDateKey: getLocalDateKey(new Date(Date.now() + 7 * 3600 * 1000)),
      states: {
        goodness: "good",
        functionality: "functional",
        recovery: false
      },
      domains: ["Responsibilities", "Goals (Sport)"],
      guardrails: ["XB15"],
      note: "Day 1: Responsibilities + Sport goals, keep an eye on XB15",
      lastSleepAt: null,
      targetWakeAt: null,
      scheduledPings: [],
      lastAutoScheduleDateKey: null
    },
    emas: [],
    days: [],
    weeks: []
  };
}

let state = loadInitialState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function showToast(msg) {
  const el = document.getElementById("status-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => el.classList.remove("show"), 2400);
}

// ==========================================
// UNIVERSAL GRAMMAR WIDGET BUILDER
// ==========================================
function createGrammarWidget(mountId, options = {}) {
  const {
    includeScore = true,
    scoreLabel = "Score (1–10)",
    domainsLabel = "Domains & Guardrails",
    notePlaceholder = "Optional short note...",
    initialValue = null
  } = options;

  const widgetState = {
    states: {
      goodness: initialValue?.states?.goodness ?? null,
      functionality: initialValue?.states?.functionality ?? null,
      recovery: Boolean(initialValue?.states?.recovery)
    },
    score: initialValue?.score ?? 7,
    domains: [...(initialValue?.domains ?? [])],
    guardrails: [...(initialValue?.guardrails ?? [])],
    note: initialValue?.note ?? ""
  };

  const mount = document.getElementById(mountId);
  if (!mount) return null;

  function render() {
    mount.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "grammar-group";

    // 1. State Toggles (Good/Not Good, Functional/Not Functional, Recovery)
    const stateSection = document.createElement("div");
    stateSection.innerHTML = `<div class="section-label">State Classification</div>`;
    const grid = document.createElement("div");
    grid.className = "state-grid";

    const buttons = [
      {
        label: "Good",
        active: widgetState.states.goodness === "good",
        activeClass: "active-good",
        onClick: () => {
          widgetState.states.goodness =
            widgetState.states.goodness === "good" ? null : "good";
          render();
        }
      },
      {
        label: "Not Good",
        active: widgetState.states.goodness === "not_good",
        activeClass: "active-not-good",
        onClick: () => {
          widgetState.states.goodness =
            widgetState.states.goodness === "not_good" ? null : "not_good";
          render();
        }
      },
      {
        label: "Functional",
        active: widgetState.states.functionality === "functional",
        activeClass: "active-functional",
        onClick: () => {
          widgetState.states.functionality =
            widgetState.states.functionality === "functional" ? null : "functional";
          render();
        }
      },
      {
        label: "Not Functional",
        active: widgetState.states.functionality === "not_functional",
        activeClass: "active-not-functional",
        onClick: () => {
          widgetState.states.functionality =
            widgetState.states.functionality === "not_functional"
              ? null
              : "not_functional";
          render();
        }
      },
      {
        label: "Recovery",
        active: widgetState.states.recovery,
        activeClass: "active-recovery",
        extraClass: "recovery-btn",
        onClick: () => {
          widgetState.states.recovery = !widgetState.states.recovery;
          render();
        }
      }
    ];

    buttons.forEach((b) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `pill-btn ${b.extraClass || ""} ${b.active ? b.activeClass : ""}`;
      btn.textContent = b.label;
      btn.addEventListener("click", b.onClick);
      grid.appendChild(btn);
    });

    stateSection.appendChild(grid);
    wrapper.appendChild(stateSection);

    // 2. Number Scale (1 to 10)
    if (includeScore) {
      const scoreSection = document.createElement("div");
      scoreSection.innerHTML = `<div class="section-label">${scoreLabel}</div>`;
      const scoreGrid = document.createElement("div");
      scoreGrid.className = "score-grid";

      for (let i = 1; i <= 10; i++) {
        const sBtn = document.createElement("button");
        sBtn.type = "button";
        sBtn.className = `score-btn ${widgetState.score === i ? "active" : ""}`;
        sBtn.textContent = String(i);
        sBtn.addEventListener("click", () => {
          widgetState.score = i;
          render();
        });
        scoreGrid.appendChild(sBtn);
      }
      scoreSection.appendChild(scoreGrid);
      wrapper.appendChild(scoreSection);
    }

    // 3. Domain Lenses + XB15 Guardrail
    const domainSection = document.createElement("div");
    domainSection.innerHTML = `<div class="section-label">${domainsLabel}</div>`;
    const domainWrap = document.createElement("div");
    domainWrap.className = "domain-wrap";

    DOMAINS.forEach((dom) => {
      const chip = document.createElement("button");
      chip.type = "button";
      const isSelected = widgetState.domains.includes(dom);
      chip.className = `domain-chip ${isSelected ? "active" : ""}`;
      chip.textContent = dom;
      chip.addEventListener("click", () => {
        if (isSelected) {
          widgetState.domains = widgetState.domains.filter((d) => d !== dom);
        } else {
          widgetState.domains.push(dom);
        }
        render();
      });
      domainWrap.appendChild(chip);
    });

    GUARDRAILS.forEach((gr) => {
      const chip = document.createElement("button");
      chip.type = "button";
      const isSelected = widgetState.guardrails.includes(gr);
      chip.className = `domain-chip guardrail-chip ${isSelected ? "active" : ""}`;
      chip.textContent = gr;
      chip.addEventListener("click", () => {
        if (isSelected) {
          widgetState.guardrails = widgetState.guardrails.filter((g) => g !== gr);
        } else {
          widgetState.guardrails.push(gr);
        }
        render();
      });
      domainWrap.appendChild(chip);
    });

    domainSection.appendChild(domainWrap);
    wrapper.appendChild(domainSection);

    // 4. Short Note
    const noteSection = document.createElement("div");
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.className = "text-input";
    noteInput.placeholder = notePlaceholder;
    noteInput.value = widgetState.note;
    noteInput.addEventListener("input", (e) => {
      widgetState.note = e.target.value;
    });
    noteSection.appendChild(noteInput);
    wrapper.appendChild(noteSection);

    mount.appendChild(wrapper);
  }

  render();

  return {
    getValue() {
      return JSON.parse(JSON.stringify(widgetState));
    },
    setValue(val) {
      widgetState.states = {
        goodness: val?.states?.goodness ?? null,
        functionality: val?.states?.functionality ?? null,
        recovery: Boolean(val?.states?.recovery)
      };
      widgetState.score = val?.score ?? 7;
      widgetState.domains = [...(val?.domains ?? [])];
      widgetState.guardrails = [...(val?.guardrails ?? [])];
      widgetState.note = val?.note ?? "";
      render();
    },
    reset() {
      widgetState.states = { goodness: "good", functionality: "functional", recovery: false };
      widgetState.score = 7;
      widgetState.domains = [];
      widgetState.guardrails = [];
      widgetState.note = "";
      render();
    }
  };
}

// ==========================================
// BADGE HELPER
// ==========================================
function renderStateBadgesHTML(states, domains = [], guardrails = []) {
  const parts = [];
  if (states?.goodness === "good") {
    parts.push(`<span class="badge badge-good">Good</span>`);
  } else if (states?.goodness === "not_good") {
    parts.push(`<span class="badge badge-not-good">Not Good</span>`);
  }

  if (states?.functionality === "functional") {
    parts.push(`<span class="badge badge-functional">Functional</span>`);
  } else if (states?.functionality === "not_functional") {
    parts.push(`<span class="badge badge-not-functional">Not Functional</span>`);
  }

  if (states?.recovery) {
    parts.push(`<span class="badge badge-recovery">Recovery</span>`);
  }

  domains.forEach((d) => {
    parts.push(`<span class="badge">${d}</span>`);
  });

  guardrails.forEach((g) => {
    parts.push(`<span class="badge badge-guardrail">${g}</span>`);
  });

  return parts.join("");
}

// ==========================================
// RANDOM EMA PING SCHEDULER (NTFY.SH)
// ==========================================
function computeThreeRandomPings(wakeDateObj) {
  // Clamp start to at least 05:30 on the wake day, and end at 23:00 on the wake day
  const dayStart = new Date(wakeDateObj);
  dayStart.setHours(5, 30, 0, 0);

  const dayEnd = new Date(wakeDateObj);
  dayEnd.setHours(23, 0, 0, 0);

  let effectiveStart = wakeDateObj > dayStart ? new Date(wakeDateObj) : dayStart;
  // If effectiveStart is somehow after 21:30 (e.g., testing late at night), shift to tomorrow 07:00
  if (effectiveStart.getTime() > dayEnd.getTime() - 90 * 60 * 1000) {
    const tomorrow = new Date(wakeDateObj.getTime() + 24 * 3600 * 1000);
    effectiveStart = new Date(tomorrow);
    effectiveStart.setHours(7, 0, 0, 0);
    dayEnd.setTime(tomorrow.getTime());
    dayEnd.setHours(23, 0, 0, 0);
  }

  const totalMs = dayEnd.getTime() - effectiveStart.getTime();
  const blockMs = Math.floor(totalMs / 3);
  const slotLabels = ["Morning Ping (1/3)", "Midday Ping (2/3)", "Evening Ping (3/3)"];
  const pings = [];

  for (let i = 0; i < 3; i++) {
    const bStart = effectiveStart.getTime() + i * blockMs;
    const bEnd = bStart + blockMs;
    // Pad by 10 mins inside each block so back-to-back boundary collisions don't happen
    const pad = Math.min(10 * 60 * 1000, Math.floor(blockMs * 0.15));
    const randTs = Math.floor(bStart + pad + Math.random() * (bEnd - bStart - 2 * pad));
    pings.push({
      slot: i + 1,
      label: slotLabels[i],
      timestampMs: randTs,
      iso: new Date(randTs).toISOString(),
      timeFormatted: formatTimeHHMM(new Date(randTs)),
      answered: false
    });
  }

  return pings;
}

async function schedulePingsOnNtfy(pings) {
  const topic = (state.settings.ntfyTopic || "").trim();
  if (!topic) return { ok: false, error: "No ntfy topic configured" };

  const clickUrl = `${state.settings.appUrl || window.location.href.split("?")[0]}?view=ema`;
  const results = [];

  for (const p of pings) {
    const unixSec = Math.floor(p.timestampMs / 1000);
    try {
      const res = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
        method: "POST",
        headers: {
          "Title": `GM - ${p.label}`,
          "At": String(unixSec),
          "Click": clickUrl,
          "Tags": "compass,sparkles"
        },
        body: `Momentary check-in (${p.timeFormatted}). Valid until the next ping arrives - tap when ready.`
      });
      results.push(res.ok);
    } catch (err) {
      console.warn("ntfy schedule error:", err);
      results.push(false);
    }
  }

  return { ok: results.every(Boolean), count: results.filter(Boolean).length };
}

async function sendImmediateTestPing() {
  const topic = (state.settings.ntfyTopic || "").trim();
  const logBox = document.getElementById("ping-log-box");
  if (!topic) {
    showToast("Set a private ntfy topic first");
    return;
  }

  const clickUrl = `${state.settings.appUrl || window.location.href.split("?")[0]}?view=ema`;
  if (logBox) logBox.textContent = `Sending live ping to ntfy.sh/${topic}...`;

  try {
    const res = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        "Title": "GM - Live Moment Check-In (EMA)",
        "Click": clickUrl,
        "Tags": "zap,spiral_calendar"
      },
      body: "How is this moment? (Good/Functional + 1-10 + Domain). Open until the next ping arrives."
    });
    if (res.ok) {
      showToast("Live ping sent to your phone!");
      if (logBox) {
        logBox.textContent = `✅ Delivered to ntfy.sh/${topic} at ${formatTimeHHMM(new Date())}. Check the ntfy app on your Android phone!`;
      }
    } else {
      if (logBox) logBox.textContent = `⚠️ ntfy returned HTTP ${res.status}`;
    }
  } catch (e) {
    if (logBox) logBox.textContent = `⚠️ Network error: ${e.message}`;
  }
}

async function ensureDailyPingsScheduled() {
  const todayKey = getLocalDateKey();
  const plan = state.activePlan || {};
  const topic = (state.settings?.ntfyTopic || "").trim();
  if (!topic) return;

  // Check if today already has active future or fired pings scheduled
  const hasFuturePings = (plan.scheduledPings || []).some(
    (p) => new Date(p.timestampMs).getDate() === new Date().getDate()
  );

  // If already auto-scheduled for today, don't double schedule
  if (plan.lastAutoScheduleDateKey === todayKey && hasFuturePings) {
    return;
  }

  // Need auto-schedule! If sleep was not tapped, construct baseline for today
  const now = new Date();
  const currentHour = now.getHours();

  // If it's before 21:00, schedule remaining pings for today
  if (currentHour < 21) {
    console.log("Auto-scheduling fallback EMA pings for today...");
    const pings = computeThreeRandomPings(now);
    state.activePlan = state.activePlan || {};
    state.activePlan.scheduledPings = pings;
    state.activePlan.lastAutoScheduleDateKey = todayKey;
    saveState();

    const res = await schedulePingsOnNtfy(pings);
    if (res.ok) {
      console.log(`Auto-scheduled ${res.count} EMA pings for today.`);
    }
  }
}

// ==========================================
// INITIALIZE WIDGETS & EVENT HANDLERS
// ==========================================
let emaWidget, dayWidget, tomorrowWidget, weekWidget;

async function initApp() {
  // Live clock
  const updateClock = () => {
    const el = document.getElementById("live-clock");
    if (el) el.textContent = formatTimeHHMM(new Date());
  };
  updateClock();
  setInterval(updateClock, 10000);

  // Auto-schedule watchdog: ensures if Nightly close was forgotten, pings are armed automatically!
  ensureDailyPingsScheduled();

  // Build Grammar Widgets
  emaWidget = createGrammarWidget("ema-grammar-mount", {
    includeScore: true,
    scoreLabel: "Moment Score (1–10)",
    domainsLabel: "Where is your attention right now?",
    notePlaceholder: "Optional 5-word context (e.g., finishing tasks, sport, resting)...",
    initialValue: {
      states: { goodness: "good", functionality: "functional", recovery: false },
      score: 7,
      domains: [],
      guardrails: [],
      note: ""
    }
  });

  dayWidget = createGrammarWidget("day-grammar-mount", {
    includeScore: true,
    scoreLabel: "Overall Day Score (1–10)",
    domainsLabel: "Domains active today",
    notePlaceholder: "One sentence on how today squared up...",
    initialValue: {
      states: { goodness: "good", functionality: "functional", recovery: false },
      score: 7,
      domains: ["Responsibilities"],
      guardrails: [],
      note: ""
    }
  });

  tomorrowWidget = createGrammarWidget("tomorrow-plan-mount", {
    includeScore: false,
    domainsLabel: "Tomorrow's Focus Domains & Guardrails (XB15)",
    notePlaceholder: "Tomorrow's main intention...",
    initialValue: state.activePlan
  });

  weekWidget = createGrammarWidget("week-grammar-mount", {
    includeScore: true,
    scoreLabel: "Weekly GM Score (1–10)",
    domainsLabel: "Focus Domains for Next Week",
    notePlaceholder: "What worked, what leaked, and 1 adjustment for next week...",
    initialValue: {
      states: { goodness: "good", functionality: "functional", recovery: false },
      score: 7,
      domains: ["Responsibilities", "Goals (Sport)"],
      guardrails: ["XB15"],
      note: ""
    }
  });

  // Tab navigation
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");
      switchTab(target);
    });
  });

  // Check URL query (?view=ema or ?view=day)
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get("view");
  if (viewParam === "day") switchTab("tab-day");
  else if (viewParam === "week") switchTab("tab-week");
  else if (viewParam === "setup") switchTab("tab-setup");

  // Button: Save Moment (EMA)
  document.getElementById("save-ema-btn").addEventListener("click", () => {
    const val = emaWidget.getValue();
    const now = new Date();
    const activeSlot = getCurrentActivePingSlot(now);

    const entry = {
      id: "ema_" + Date.now(),
      timestamp: now.toISOString(),
      timeFormatted: formatTimeHHMM(now),
      dateKey: getLocalDateKey(now),
      slotLabel: activeSlot ? activeSlot.label : "Moment Check-in",
      ...val
    };

    if (activeSlot) {
      activeSlot.answered = true;
    }

    state.emas.unshift(entry);
    saveState();
    emaWidget.reset();
    showToast("Moment logged!");
    syncGistSilent();
  });

  // Button: Save Day Rating Only
  document.getElementById("save-day-only-btn").addEventListener("click", () => {
    saveDayEvaluation();
    showToast("Day rating saved!");
  });

  // Button: Sleep Now (+7h Alarm & Schedule 3 Random Pings)
  document.getElementById("sleep-now-btn").addEventListener("click", async () => {
    // 1. Save today's evaluation if not yet saved today
    saveDayEvaluation();

    // 2. Save tomorrow's GM plan
    const planVal = tomorrowWidget.getValue();
    const now = new Date();
    const wakeDate = new Date(now.getTime() + 7 * 3600 * 1000);
    const pings = computeThreeRandomPings(wakeDate);

    state.activePlan = {
      ...planVal,
      targetDateKey: getLocalDateKey(wakeDate),
      lastSleepAt: now.toISOString(),
      targetWakeAt: wakeDate.toISOString(),
      scheduledPings: pings
    };

    saveState();

    // 3. Show Wake Time + Android Clock link
    const wakeHHMM = formatTimeHHMM(wakeDate);
    document.getElementById("wake-time-display").textContent = wakeHHMM;

    const alarmIntent = `intent:#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.alarm.HOUR=${wakeDate.getHours()};i.android.intent.extra.alarm.MINUTES=${wakeDate.getMinutes()};S.android.intent.extra.alarm.MESSAGE=GM%20Wake%20(+7h);B.android.intent.extra.alarm.SKIP_UI=false;end`;
    const alarmLink = document.getElementById("android-alarm-link");
    alarmLink.setAttribute("href", alarmIntent);

    const resultBox = document.getElementById("alarm-result-box");
    resultBox.classList.add("visible");

    const summaryEl = document.getElementById("scheduled-pings-summary");
    summaryEl.textContent = `Scheduling 3 random pings for tomorrow (${pings.map((p) => p.timeFormatted).join(" · ")})...`;

    // 4. Schedule via ntfy.sh
    const schedRes = await schedulePingsOnNtfy(pings);
    if (schedRes.ok) {
      summaryEl.innerHTML = `✅ <strong>3 Random Pings Armed</strong> on <code>${state.settings.ntfyTopic}</code> for tomorrow's window (05:30–23:00): <strong>${pings.map((p) => p.timeFormatted).join(" · ")}</strong>`;
    } else {
      summaryEl.innerHTML = `⏰ Target wake: <strong>${wakeHHMM}</strong>. Pings generated for <strong>${pings.map((p) => p.timeFormatted).join(" · ")}</strong> (check Setup tab if ntfy offline).`;
    }

    showToast(`Sleep logged! Wake at ${wakeHHMM}`);
    syncGistSilent();
  });

  // Copy voice alarm helper
  document.getElementById("copy-voice-alarm-btn").addEventListener("click", () => {
    const wakeText = document.getElementById("wake-time-display").textContent;
    const phrase = `Hey Google, set an alarm for ${wakeText}`;
    navigator.clipboard?.writeText(phrase);
    showToast(`Copied: "${phrase}"`);
  });

  // Button: Save Weekly GM Review
  document.getElementById("save-week-btn").addEventListener("click", () => {
    const val = weekWidget.getValue();
    const now = new Date();
    const entry = {
      id: "week_" + Date.now(),
      timestamp: now.toISOString(),
      dateKey: getLocalDateKey(now),
      ...val
    };
    state.weeks.unshift(entry);
    saveState();
    showToast("Weekly GM Review saved!");
    syncGistSilent();
  });

  // Setup Tab inputs & buttons
  const topicInput = document.getElementById("ntfy-topic-input");
  const urlInput = document.getElementById("app-url-input");
  const tokenInput = document.getElementById("gh-token-input");
  const gistInput = document.getElementById("gh-gist-id-input");

  topicInput.value = state.settings.ntfyTopic || "";
  urlInput.value = state.settings.appUrl || window.location.href.split("?")[0];
  tokenInput.value = state.settings.ghToken || "";
  gistInput.value = state.settings.ghGistId || "";

  topicInput.addEventListener("input", () => {
    state.settings.ntfyTopic = topicInput.value.trim();
    saveState();
  });

  urlInput.addEventListener("input", () => {
    state.settings.appUrl = urlInput.value.trim();
    saveState();
  });

  tokenInput.addEventListener("input", () => {
    state.settings.ghToken = tokenInput.value.trim();
    saveState();
  });

  gistInput.addEventListener("input", () => {
    state.settings.ghGistId = gistInput.value.trim();
    saveState();
  });

  document.getElementById("send-test-ping-btn").addEventListener("click", () => {
    state.settings.ntfyTopic = topicInput.value.trim();
    saveState();
    sendImmediateTestPing();
  });

  document.getElementById("schedule-today-pings-btn").addEventListener("click", async () => {
    state.settings.ntfyTopic = topicInput.value.trim();
    const pings = computeThreeRandomPings(new Date());
    state.activePlan.scheduledPings = pings;
    saveState();
    const res = await schedulePingsOnNtfy(pings);
    const logBox = document.getElementById("ping-log-box");
    if (logBox) {
      logBox.innerHTML = res.ok
        ? `✅ Scheduled 3 random pings on <code>${state.settings.ntfyTopic}</code> at: <strong>${pings.map((p) => p.timeFormatted).join(" · ")}</strong>`
        : `⚠️ Could not reach ntfy.sh — check connection.`;
    }
    showToast("Scheduled 3 random pings!");
  });

  // JSON Export / Import
  document.getElementById("export-json-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gm-backup-${getLocalDateKey()}.json`;
    a.click();
    showToast("Backup downloaded");
  });

  document.getElementById("import-json-input").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported && Array.isArray(imported.emas)) {
          state = imported;
          saveState();
          showToast("Backup restored!");
        }
      } catch (err) {
        showToast("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  });

  // Optional GitHub Gist Sync
  document.getElementById("sync-gist-btn").addEventListener("click", async () => {
    state.settings.ghToken = tokenInput.value.trim();
    state.settings.ghGistId = gistInput.value.trim();
    saveState();
    await syncWithGitHubGist(true);
  });

  renderAll();
  if (state.settings.ghToken && state.settings.ghGistId) {
    syncGistSilent();
  }
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("active", p.id === tabId);
  });
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-tab") === tabId);
  });
}

function getCurrentActivePingSlot(now = new Date()) {
  const pings = state.activePlan?.scheduledPings || [];
  if (!pings.length) return null;
  // A ping stays valid from when it fires until the next ping arrives!
  let active = null;
  for (const p of pings) {
    if (now.getTime() >= p.timestampMs) {
      active = p;
    }
  }
  return active;
}

function saveDayEvaluation() {
  const val = dayWidget.getValue();
  const now = new Date();
  const todayKey = getLocalDateKey(now);

  // Replace existing entry for today or unshift new
  const existingIdx = state.days.findIndex((d) => d.dateKey === todayKey);
  const entry = {
    id: existingIdx >= 0 ? state.days[existingIdx].id : "day_" + Date.now(),
    timestamp: now.toISOString(),
    dateKey: todayKey,
    ...val
  };

  if (existingIdx >= 0) {
    state.days[existingIdx] = entry;
  } else {
    state.days.unshift(entry);
  }
  saveState();
}

// ==========================================
// RENDER VIEWS & MEMORY BRIDGES
// ==========================================
function renderAll() {
  renderActiveBanner();
  renderEmaTab();
  renderDayBridgeTab();
  renderWeeklyBridgeTab();
}

function renderActiveBanner() {
  const plan = state.activePlan || {};
  const statesEl = document.getElementById("banner-target-states");
  const domainsEl = document.getElementById("banner-focus-domains");
  const wakeEl = document.getElementById("banner-wake-info");

  if (statesEl) {
    statesEl.innerHTML = renderStateBadgesHTML(plan.states, [], []);
  }
  if (domainsEl) {
    domainsEl.innerHTML = renderStateBadgesHTML({}, plan.domains || [], plan.guardrails || []);
  }
  if (wakeEl) {
    if (plan.targetWakeAt) {
      const wakeTime = formatTimeHHMM(new Date(plan.targetWakeAt));
      wakeEl.textContent = `Wake: ${wakeTime} · 05:30–23:00`;
    } else {
      wakeEl.textContent = `Window: 05:30–23:00`;
    }
  }
}

function renderEmaTab() {
  const todayKey = getLocalDateKey();
  const todayEmas = state.emas.filter((e) => e.dateKey === todayKey);

  const countBadge = document.getElementById("today-ema-count");
  if (countBadge) countBadge.textContent = `${todayEmas.length} logged`;

  // Show active ping slot status ("open until next ping arrives")
  const slotBadge = document.getElementById("ema-slot-badge");
  const statusSub = document.getElementById("ema-window-status");
  const activeSlot = getCurrentActivePingSlot();
  if (activeSlot && !activeSlot.answered) {
    if (slotBadge) slotBadge.textContent = activeSlot.label;
    if (statusSub) {
      statusSub.textContent = `Ping from ${activeSlot.timeFormatted} is open — valid until the next ping arrives.`;
    }
  } else {
    if (slotBadge) slotBadge.textContent = "Live Moment";
    if (statusSub) {
      statusSub.textContent = "Open until the next ping arrives — take your time.";
    }
  }

  const listEl = document.getElementById("today-ema-list");
  if (!listEl) return;

  if (!todayEmas.length) {
    listEl.innerHTML = `<div class="empty-hint">No moments logged yet today. Log one above anytime or when your phone pings.</div>`;
    return;
  }

  listEl.innerHTML = todayEmas
    .map(
      (e) => `
      <div class="memory-item">
        <div class="memory-top">
          <span>${e.slotLabel || "Moment"} · ${e.timeFormatted}</span>
          <span class="memory-score">${e.score}/10</span>
        </div>
        <div class="memory-tags">
          ${renderStateBadgesHTML(e.states, e.domains, e.guardrails)}
        </div>
        ${e.note ? `<div class="memory-note">"${escapeHtml(e.note)}"</div>` : ""}
      </div>
    `
    )
    .join("");
}

function renderDayBridgeTab() {
  const todayKey = getLocalDateKey();
  const todayEmas = state.emas.filter((e) => e.dateKey === todayKey);
  const bridgeEl = document.getElementById("night-ema-bridge");
  const avgBadge = document.getElementById("bridge-day-avg");

  if (todayEmas.length > 0) {
    const avg = (
      todayEmas.reduce((acc, item) => acc + (Number(item.score) || 0), 0) /
      todayEmas.length
    ).toFixed(1);
    if (avgBadge) avgBadge.textContent = `EMA Avg: ${avg}/10`;
  } else {
    if (avgBadge) avgBadge.textContent = `EMA Avg: --`;
  }

  if (!bridgeEl) return;
  if (!todayEmas.length) {
    bridgeEl.innerHTML = `<div class="empty-hint">No EMA pings logged yet today — your momentary check-ins will appear here tonight so you don't have to rely on memory.</div>`;
    return;
  }

  bridgeEl.innerHTML = todayEmas
    .map(
      (e) => `
      <div class="memory-item">
        <div class="memory-top">
          <span>${e.timeFormatted} (${e.slotLabel || "EMA"})</span>
          <span class="memory-score">${e.score}/10</span>
        </div>
        <div class="memory-tags">
          ${renderStateBadgesHTML(e.states, e.domains, e.guardrails)}
        </div>
        ${e.note ? `<div class="memory-note">"${escapeHtml(e.note)}"</div>` : ""}
      </div>
    `
    )
    .join("");
}

function renderWeeklyBridgeTab() {
  const daysBridgeEl = document.getElementById("week-days-bridge");
  const domainBarsEl = document.getElementById("week-domain-bars");
  const weekAvgBadge = document.getElementById("week-bridge-avg");
  const pastWeeksEl = document.getElementById("past-weeks-list");

  // Build 7-day window (today and past 6 days)
  const last7Keys = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000);
    last7Keys.push(getLocalDateKey(d));
  }

  const domainCounts = {};
  [...DOMAINS, ...GUARDRAILS].forEach((k) => (domainCounts[k] = 0));

  let scoreSum = 0;
  let scoreCount = 0;

  const dayRowsHtml = [];

  last7Keys.forEach((dKey) => {
    const dayEntry = state.days.find((d) => d.dateKey === dKey);
    const dayEmas = state.emas.filter((e) => e.dateKey === dKey);

    // Count domains from both EMAs and Day entries in the last 7 days
    dayEmas.forEach((e) => {
      (e.domains || []).forEach((dom) => (domainCounts[dom] = (domainCounts[dom] || 0) + 1));
      (e.guardrails || []).forEach((gr) => (domainCounts[gr] = (domainCounts[gr] || 0) + 1));
    });
    if (dayEntry) {
      (dayEntry.domains || []).forEach((dom) => (domainCounts[dom] = (domainCounts[dom] || 0) + 1));
      (dayEntry.guardrails || []).forEach((gr) => (domainCounts[gr] = (domainCounts[gr] || 0) + 1));
    }

    if (!dayEntry && dayEmas.length === 0) return;

    const displayScore = dayEntry
      ? dayEntry.score
      : (
          dayEmas.reduce((acc, e) => acc + (Number(e.score) || 0), 0) / dayEmas.length
        ).toFixed(1);

    scoreSum += Number(displayScore);
    scoreCount += 1;

    const badges = dayEntry
      ? renderStateBadgesHTML(dayEntry.states, dayEntry.domains, dayEntry.guardrails)
      : renderStateBadgesHTML(
          dayEmas[0]?.states,
          Array.from(new Set(dayEmas.flatMap((e) => e.domains || []))),
          Array.from(new Set(dayEmas.flatMap((e) => e.guardrails || [])))
        );

    const emaSummary =
      dayEmas.length > 0
        ? `<div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
             ${dayEmas.length} EMA ping(s): ${dayEmas.map((e) => `${e.timeFormatted} (${e.score}/10)`).join(" · ")}
           </div>`
        : "";

    dayRowsHtml.push(`
      <div class="memory-item">
        <div class="memory-top">
          <span><strong>${dKey}</strong> ${dayEntry ? "· Nightly Close" : "· From EMAs"}</span>
          <span class="memory-score">${displayScore}/10</span>
        </div>
        <div class="memory-tags">${badges}</div>
        ${dayEntry?.note ? `<div class="memory-note">"${escapeHtml(dayEntry.note)}"</div>` : ""}
        ${emaSummary}
      </div>
    `);
  });

  if (weekAvgBadge) {
    weekAvgBadge.textContent =
      scoreCount > 0 ? `7d Avg: ${(scoreSum / scoreCount).toFixed(1)}/10` : "7d Avg: --";
  }

  if (daysBridgeEl) {
    daysBridgeEl.innerHTML =
      dayRowsHtml.length > 0
        ? dayRowsHtml.join("")
        : `<div class="empty-hint">As you log Moments and Nightly Closes this week, your 7-day trail will automatically populate here.</div>`;
  }

  // Render Domain Hit Bars
  if (domainBarsEl) {
    const maxHits = Math.max(1, ...Object.values(domainCounts));
    const sortedDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);

    domainBarsEl.innerHTML = sortedDomains
      .map(([dom, count]) => {
        const pct = Math.round((count / maxHits) * 100);
        const isGuardrail = GUARDRAILS.includes(dom);
        return `
          <div class="domain-bar-row">
            <span style="color: ${isGuardrail ? "var(--warn)" : "var(--text)"}; font-weight: ${count > 0 ? "600" : "400"};">
              ${dom}
            </span>
            <div class="domain-bar-track">
              <div class="domain-bar-fill ${isGuardrail ? "guardrail" : ""}" style="width: ${pct}%;"></div>
            </div>
            <span style="text-align: right; color: var(--text-muted);">${count}</span>
          </div>
        `;
      })
      .join("");
  }

  // Past Weekly Reviews
  if (pastWeeksEl) {
    if (!state.weeks.length) {
      pastWeeksEl.innerHTML = `<div class="empty-hint">No weekly reviews saved yet.</div>`;
    } else {
      pastWeeksEl.innerHTML = state.weeks
        .map(
          (w) => `
          <div class="memory-item">
            <div class="memory-top">
              <span>Week of ${w.dateKey}</span>
              <span class="memory-score">${w.score}/10</span>
            </div>
            <div class="memory-tags">
              ${renderStateBadgesHTML(w.states, w.domains, w.guardrails)}
            </div>
            ${w.note ? `<div class="memory-note">"${escapeHtml(w.note)}"</div>` : ""}
          </div>
        `
        )
        .join("");
    }
  }
}

// ==========================================
// OPTIONAL GITHUB GIST SYNC (2-WAY MERGE)
// ==========================================
function mergeById(localArr = [], remoteArr = []) {
  const map = new Map();
  [...remoteArr, ...localArr].forEach((item) => {
    if (!item || !item.id) return;
    const prev = map.get(item.id);
    if (!prev || new Date(item.timestamp || 0) >= new Date(prev.timestamp || 0)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  );
}

async function syncWithGitHubGist(interactive = false) {
  const token = (state.settings.ghToken || "").trim();
  if (!token) {
    if (interactive) showToast("Add a GitHub token (gist scope) first");
    return;
  }

  let gistId = (state.settings.ghGistId || "").trim();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json"
  };

  try {
    // Auto-discover existing gm_state.json Gist if Gist ID is left blank!
    if (!gistId) {
      const listRes = await fetch("https://api.github.com/gists?per_page=50", { headers });
      if (listRes.ok) {
        const gists = await listRes.json();
        const found = Array.isArray(gists)
          ? gists.find((g) => g.files && g.files["gm_state.json"])
          : null;
        if (found) {
          gistId = found.id;
          state.settings.ghGistId = gistId;
          const gistInput = document.getElementById("gh-gist-id-input");
          if (gistInput) gistInput.value = gistId;
        }
      }
    }

    if (!gistId) {
      const payloadState = JSON.parse(JSON.stringify(state));
      delete payloadState.settings.ghToken; // Never store token inside Gist file

      const res = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers,
        body: JSON.stringify({
          description: "GM (General Manager) Private Sync State",
          public: false,
          files: {
            "gm_state.json": {
              content: JSON.stringify(payloadState, null, 2)
            }
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        state.settings.ghGistId = data.id;
        const gistInput = document.getElementById("gh-gist-id-input");
        if (gistInput) gistInput.value = data.id;
        saveState();
        if (interactive) showToast(`Created & connected Gist: ${data.id}`);
      } else if (interactive) {
        showToast(`GitHub HTTP ${res.status} (check token)`);
      }
    } else {
      // 1. Fetch existing Gist to merge remote + local
      const getRes = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
      if (getRes.ok) {
        const gistData = await getRes.json();
        const rawContent = gistData.files?.["gm_state.json"]?.content;
        if (rawContent) {
          const remote = JSON.parse(rawContent);
          state.emas = mergeById(state.emas, remote.emas);
          state.days = mergeById(state.days, remote.days);
          state.weeks = mergeById(state.weeks, remote.weeks);
          if (!state.settings.ntfyTopic && remote.settings?.ntfyTopic) {
            state.settings.ntfyTopic = remote.settings.ntfyTopic;
            const topicInput = document.getElementById("ntfy-topic-input");
            if (topicInput) topicInput.value = state.settings.ntfyTopic;
          }
          const localSleep = new Date(state.activePlan?.lastSleepAt || 0).getTime();
          const remoteSleep = new Date(remote.activePlan?.lastSleepAt || 0).getTime();
          if (remoteSleep > localSleep && remote.activePlan) {
            state.activePlan = remote.activePlan;
          }
        }
      }

      // 2. Push merged state back to Gist
      const payloadState = JSON.parse(JSON.stringify(state));
      delete payloadState.settings.ghToken;

      const patchRes = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          files: {
            "gm_state.json": {
              content: JSON.stringify(payloadState, null, 2)
            }
          }
        })
      });
      saveState();
      if (patchRes.ok && interactive) {
        showToast("Synced & merged with private GitHub Gist!");
      } else if (!patchRes.ok && interactive) {
        showToast(`GitHub HTTP ${patchRes.status}`);
      }
    }
  } catch (e) {
    if (interactive) showToast("Gist sync failed");
  }
}

function syncGistSilent() {
  if (state.settings.ghToken) {
    syncWithGitHubGist(false);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", initApp);
