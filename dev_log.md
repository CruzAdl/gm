# GM (General Manager) — Development & Design Log

## Core Philosophy (*Sencillo*)
- **The GM runs in the brain; material tools are prosthetics.**
- **Tier 1 Pure Vanilla Stack:** Native HTML5, CSS3, and modern vanilla JS (`localStorage` first + 1-tap JSON backup + optional GitHub Gist/Repo sync for seamless Android Phone ↔ Mac state). Zero build steps, directly hostable on GitHub Pages.

---

## V1 Specification: The Fractal Evaluation Engine

### 1. Universal Grammar (Moments, Days, Weeks)
Every scale of evaluation speaks the exact same language so the brain only learns one model:
1. **State Toggles:**
   - `Good` ↔ `Not Good` *(how it felt / spirit & well-being)*
   - `Functional` ↔ `Not Functional` *(how it worked / structure & execution)*
   - `Recovery` *(intentional rest, reset, or healing)*
2. **Number Scale:** `1` to `10`
3. **Domain Lenses:**
   - `Job`
   - `Responsibilities`
   - `Goals (Sport)` / `Opportunities`
   - `Parents`
   - `Friends`
   - `Pleasures`
   - `Vices`
   - `XB15` *(discreetly tracked guardrail)*
   - `Money`
   - `Rest`
4. **Short Note:** Optional micro-context.

---

### 2. Three Time Horizons (With Memory Bridges)

#### A. Momentary — Ecological Momentary Assessment (EMA)
- **Delivery:** 3 random push notifications per waking day via **ntfy.sh** (`Morning`, `Midday`, `Evening` blocks).
- **Waking Window:** Bounded by hard clock limits (`05:30` to `23:00`) and dynamically anchored after the `+7h` sleep window.
- **No-Stress Expiration:** A ping never expires in seconds—you have all the time you need to answer it until the next ping arrives.
- **Capture:** Current domain tag(s) + Moment State (`Good/Not Good`, `Functional/Not Functional`, `Recovery`) + Score (`1–10`) + optional note.

#### B. Daily — Nightly Close & `Sleep Now (+7h)`
- **Memory Bridge:** Displays today's 3 EMA snapshots at the top of the screen so you don't have to rely on faulty recall.
- **Day Evaluation:** Rate the overall day using the Universal Grammar.
- **Tomorrow's Seed:** Pick expected mode (e.g., `Good + Functional`), 1–3 focus domains (e.g., `Responsibilities`, `Goals (Sport)`), and guardrails (`XB15`).
- **`Sleep Now (+7h)` Action:**
  1. Logs sleep timestamp and calculates exact wake-up time (`Sleep + 7 hours`) for the Android alarm clock.
  2. Automatically schedules tomorrow's 3 random `ntfy.sh` pings (using `ntfy.sh` native `At:` delayed delivery) inside `[max(WakeTime, 05:30), 23:00]`.

#### C. Weekly — Memory-Bridged GM Review
- **Memory Bridge:** Displays the 7-day timeline (each day's tags, `1–10` score, EMAs, and notes) plus domain hit counts (including `XB15` and `Money`).
- **Week Evaluation:** Rate the week using the Universal Grammar + select 1–3 focus domains for next week + short reflection note.

---

## Future Experiments & Backlog (To Try Later)
1. **Timing of Daily Rating (Morning-After / Split Flow):**
   - *Idea:* Try separating `"Rate Today"` from `"Sleep Now (+7h)"`, or rating the day at a different point (e.g., during the day or the next morning after waking up from the 7h alarm) so bedtime is strictly a 1-tap sleep trigger.
2. **Domain-by-Domain Weekly Scorecard:**
   - *Idea:* During the Weekly Review, test rating each of the domains individually (`1–10`) alongside the overall weekly rating to see if granular domain scores reveal deeper patterns.
