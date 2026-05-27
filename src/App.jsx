import { useState, useEffect, useRef } from "react";

// ─── AI ──────────────────────────────────────────────────────────────────────
async function askAI(system, messages, maxTokens = 1500) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const LS = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  clear: () => { try { Object.keys(localStorage).filter(k => k.startsWith("sv_")).forEach(k => localStorage.removeItem(k)); } catch {} },
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const CONDITIONS = [
  { id: "diabetes_t2", label: "Type 2 Diabetes", emoji: "🩸" },
  { id: "diabetes_t1", label: "Type 1 Diabetes", emoji: "💉" },
  { id: "prediabetes", label: "Pre-Diabetes", emoji: "📉" },
  { id: "hypertension", label: "High Blood Pressure", emoji: "🫀" },
  { id: "high_cholesterol", label: "High Cholesterol", emoji: "🧈" },
  { id: "high_triglycerides", label: "High Triglycerides", emoji: "🩺" },
  { id: "knee_pain", label: "Knee Pain", emoji: "🦵" },
  { id: "back_pain", label: "Back Pain", emoji: "🧍" },
  { id: "shoulder_pain", label: "Shoulder Pain", emoji: "💪" },
  { id: "heart_condition", label: "Heart Condition", emoji: "❤️" },
  { id: "asthma", label: "Asthma", emoji: "🫁" },
  { id: "thyroid", label: "Thyroid Issue", emoji: "🦋" },
  { id: "pcod", label: "PCOD / PCOS", emoji: "🌸" },
  { id: "low_vitamin_d", label: "Low Vitamin D", emoji: "☀️" },
  { id: "low_b12", label: "Low B12", emoji: "⚡" },
  { id: "none", label: "None of these", emoji: "✅" },
];

const GOALS = [
  { id: "lose_fat", label: "Lose Weight", emoji: "🔥", desc: "Burn fat & lean down" },
  { id: "gain_muscle", label: "Build Muscle", emoji: "💪", desc: "Get stronger & bigger" },
  { id: "general", label: "General Fitness", emoji: "✨", desc: "Stay healthy & active" },
  { id: "endurance", label: "Build Endurance", emoji: "🏃", desc: "Run further, last longer" },
  { id: "flexibility", label: "Flexibility", emoji: "🧘", desc: "Move better, feel better" },
  { id: "recomp", label: "Body Recomp", emoji: "⚖️", desc: "Lose fat + build muscle" },
];

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Desk job, barely move" },
  { id: "light", label: "Lightly Active", desc: "1–2 workouts per week" },
  { id: "moderate", label: "Moderately Active", desc: "3–4 workouts per week" },
  { id: "very", label: "Very Active", desc: "5–6 hard sessions per week" },
  { id: "athlete", label: "Athlete", desc: "Training twice daily" },
];

const EQUIPMENT = [
  { id: "gym", label: "Full Gym", emoji: "🏋️" },
  { id: "home", label: "Home Setup", emoji: "🏠" },
  { id: "bodyweight", label: "No Equipment", emoji: "🤸" },
  { id: "outdoor", label: "Outdoor Only", emoji: "🌳" },
];

const DIET_TYPES = [
  { id: "mixed", label: "Mixed (Veg + Non-Veg)", emoji: "🍽️" },
  { id: "non_veg", label: "Non-Vegetarian", emoji: "🍗" },
  { id: "vegetarian", label: "Vegetarian", emoji: "🥗" },
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "pescatarian", label: "Pescatarian", emoji: "🐟" },
  { id: "eggetarian", label: "Eggetarian", emoji: "🥚" },
];

const ALLERGIES = [
  { id: "nuts", label: "Nuts" }, { id: "dairy", label: "Dairy" },
  { id: "gluten", label: "Gluten" }, { id: "eggs", label: "Eggs" },
  { id: "soy", label: "Soy" }, { id: "shellfish", label: "Shellfish" },
];

// ─── HEALTH MATH ─────────────────────────────────────────────────────────────
const toKg = (v, u) => u === "imperial" ? parseFloat(v || 0) * 0.4536 : parseFloat(v || 0);
const toCm = (v, u) => u === "imperial" ? parseFloat(v || 0) * 2.54 : parseFloat(v || 0);

function calcNutrition(u) {
  const wKg = toKg(u.weight, u.units);
  const hCm = toCm(u.height, u.units);
  const age = parseInt(u.age) || 30;
  const bmr = u.sex === "male" ? 10 * wKg + 6.25 * hCm - 5 * age + 5 : 10 * wKg + 6.25 * hCm - 5 * age - 161;
  const muls = { sedentary: 1.2, light: 1.375, moderate: 1.55, very: 1.725, athlete: 1.9 };
  const tdee = Math.round(bmr * (muls[u.activityLevel] || 1.2));
  const hasDiabetes = (u.conditions || []).some(c => c.includes("diabetes") || c === "prediabetes");
  let cals = u.goal === "lose_fat" ? Math.max(1200, tdee - 500) : u.goal === "gain_muscle" ? tdee + 250 : u.goal === "recomp" ? tdee - 200 : tdee;
  const protein = Math.round(wKg * (u.goal === "lose_fat" ? 2.2 : u.goal === "gain_muscle" ? 2.0 : 1.6));
  const fat = Math.round((cals * (hasDiabetes ? 0.35 : 0.28)) / 9);
  const carbs = Math.round((cals - protein * 4 - fat * 9) / 4);
  return { cals, protein, carbs, fat, tdee, wKg: Math.round(wKg * 10) / 10, hCm: Math.round(hCm) };
}

function projectWeight(u) {
  const wKg = toKg(u.weight, u.units);
  const tgKg = toKg(u.targetWeight, u.units);
  const rate = u.goal === "lose_fat" ? -0.55 : u.goal === "gain_muscle" ? 0.15 : u.goal === "recomp" ? -0.2 : -0.3;
  const clamp = v => { if (rate < 0 && v < tgKg) return tgKg; if (rate > 0 && v > tgKg) return tgKg; return Math.round(v * 10) / 10; };
  const disp = kg => u.units === "imperial" ? Math.round(kg / 0.4536 * 10) / 10 : Math.round(kg * 10) / 10;
  return {
    now: disp(wKg), target: disp(tgKg),
    m3: disp(clamp(wKg + rate * 13)),
    m6: disp(clamp(wKg + rate * 26)),
    m9: disp(clamp(wKg + rate * 39)),
    unit: u.units === "imperial" ? "lbs" : "kg",
  };
}

// ─── BUILD USER CONTEXT FOR AI ───────────────────────────────────────────────
function buildProfile(u) {
  const n = calcNutrition(u);
  const conds = (u.conditions || []).map(c => CONDITIONS.find(x => x.id === c)?.label).filter(Boolean).join(", ") || "None";
  const alrg = (u.allergies || []).map(a => ALLERGIES.find(x => x.id === a)?.label).filter(Boolean).join(", ") || "None";
  return `USER PROFILE:
Name: ${u.name} | Age: ${u.age} | Sex: ${u.sex}
Weight: ${n.wKg}kg | Height: ${n.hCm}cm | Target weight: ${Math.round(toKg(u.targetWeight, u.units))}kg
Goal: ${GOALS.find(g => g.id === u.goal)?.label} | Timeline: ${u.timelineMonths} months
Activity: ${ACTIVITY_LEVELS.find(a => a.id === u.activityLevel)?.label}
Equipment: ${(u.equipment || []).join(", ")} | Time/day: ${u.minutesPerDay} min
Diet: ${DIET_TYPES.find(d => d.id === u.dietType)?.label} | Allergies: ${alrg}
Foods to avoid: ${u.foodsAvoid || "None"}
Health conditions: ${conds}
Daily targets: ${n.cals} kcal | Protein: ${n.protein}g | Carbs: ${n.carbs}g | Fat: ${n.fat}g`;
}

const SAFETY_RULES = `SAFETY RULES — never break:
- Never diagnose or treat. Never recommend medication.
- Knee pain: NO running, deep squats, lunges, jumping, high impact.
- Back pain: NO heavy deadlifts, prioritise core stability.
- Diabetes: low GI only, NO refined sugar, NO white rice/bread.
- Hypertension: low sodium, DASH-style meals.
- Heart condition: zone 2 cardio only, no HIIT, no Valsalva.
- Respect ALL allergies absolutely.
- Never go below 1200 kcal/day.
- Always end health advice with: ⚠️ AI-generated — consult your doctor.`;

// ─── ATOMS ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#020818", card: "#0f172a", border: "#1e293b", border2: "#0f172a",
  green: "#22c55e", greenL: "#22c55e15", greenD: "#14532d",
  red: "#ef4444", amber: "#f59e0b", blue: "#3b82f6",
  purple: "#a855f7", cyan: "#06b6d4", pink: "#d4537e",
  text: "#e2e8f0", muted: "#64748b", soft: "#94a3b8",
};

const S = {
  app: { background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif" },
  card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 10 },
  inp: { width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, boxSizing: "border-box", outline: "none" },
  btn: (bg = C.green, c = "#020818") => ({ padding: "13px 20px", borderRadius: 12, border: "none", background: bg, color: c, fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%", transition: "opacity 0.15s" }),
  btnSm: (bg = C.green, c = "#020818") => ({ padding: "8px 16px", borderRadius: 10, border: "none", background: bg, color: c, fontWeight: 600, fontSize: 13, cursor: "pointer" }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
};

function PBar({ value, color = C.green, h = 6 }) {
  return (
    <div style={{ height: h, borderRadius: h, background: C.border, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, value)}%`, background: color, borderRadius: h, transition: "width 0.8s ease" }} />
    </div>
  );
}

function Badge({ children, color = C.green }) {
  return <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: color + "22", color, fontWeight: 700, letterSpacing: 0.3 }}>{children}</span>;
}

function MetCard({ value, label, color = C.green, sub }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: -1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "#334155", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function SecTitle({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: C.soft, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>{children}</div>;
}

function Chip({ item, selected, onClick, span2 }) {
  return (
    <div onClick={onClick} style={{
      background: selected ? C.greenL : "#0a1628", border: `2px solid ${selected ? C.green : C.border}`,
      borderRadius: 12, padding: "10px 8px", cursor: "pointer", textAlign: "center",
      transition: "all 0.15s", gridColumn: span2 ? "span 2" : undefined,
    }}>
      {item.emoji && <div style={{ fontSize: 20, marginBottom: 3 }}>{item.emoji}</div>}
      <div style={{ fontSize: 12, fontWeight: 600, color: selected ? C.green : C.text }}>{item.label}</div>
      {item.desc && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{item.desc}</div>}
    </div>
  );
}

function Skel({ h = 80 }) {
  return <div style={{ background: "linear-gradient(90deg,#0f172a 25%,#1e293b 50%,#0f172a 75%)", backgroundSize: "200% 100%", borderRadius: 12, height: h, marginBottom: 10, animation: "shimmer 1.5s infinite" }}>
    <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
  </div>;
}

function ProgBar({ step, total }) {
  return (
    <div style={{ padding: "14px 20px 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: 0.5 }}>Step {step} of {total}</span>
        <span style={{ fontSize: 11, color: C.muted }}>{Math.round(step / total * 100)}% done</span>
      </div>
      <div style={{ height: 4, background: C.border, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${step / total * 100}%`, height: "100%", background: C.green, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

// ─── SCREEN 1: WELCOME ───────────────────────────────────────────────────────
function Welcome({ onNext }) {
  return (
    <div style={{ ...S.app, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 28px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>🌿</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: C.green, letterSpacing: -1, margin: "0 0 8px" }}>Svastha</h1>
        <p style={{ fontSize: 15, color: C.soft, margin: "0 0 40px", lineHeight: 1.5 }}>One Connection for Better Health</p>

        <div style={{ width: "100%", marginBottom: 32 }}>
          {[
            ["🏋️", "Personalised workout plans built for your body"],
            ["🍽️", "Custom meal plans respecting your health conditions"],
            ["📈", "Body transformation timeline — see your future"],
            ["🤖", "AI coach that knows you, available 24/7"],
          ].map(([e, t], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 8, textAlign: "left" }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{e}</span>
              <span style={{ fontSize: 13, color: C.soft, lineHeight: 1.4 }}>{t}</span>
            </div>
          ))}
        </div>

        <button onClick={onNext} style={{ ...S.btn(), fontSize: 17, padding: "16px", borderRadius: 14 }}>
          Get Started — It's Free →
        </button>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 12 }}>Takes 3 minutes · No account needed</p>
      </div>
    </div>
  );
}

// ─── SCREEN 2: DISCLAIMER ────────────────────────────────────────────────────
function Disclaimer({ onAccept }) {
  const [checked, setChecked] = useState(false);
  return (
    <div style={{ ...S.app, padding: 24, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>⚠️</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>Before We Begin</h2>
        <p style={{ fontSize: 14, color: C.muted }}>Please read this carefully</p>
      </div>

      <div style={{ background: "#1a0a00", border: `1px solid ${C.amber}30`, borderLeft: `4px solid ${C.amber}`, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 10 }}>Medical Disclaimer</div>
        <ul style={{ paddingLeft: 18, lineHeight: 2.1, fontSize: 13, color: C.soft }}>
          <li>Svastha uses <strong style={{ color: C.amber }}>Artificial Intelligence</strong> to create personalised plans.</li>
          <li>AI suggestions are <strong style={{ color: C.amber }}>not medically vetted</strong> and do not replace a doctor, physiotherapist, or dietitian.</li>
          <li><strong style={{ color: C.amber }}>Consult your doctor</strong> before starting any new programme — especially if you have medical conditions.</li>
          <li>Stop immediately if you feel pain, dizziness, or chest discomfort.</li>
          <li>People under 16 should use this with a parent or guardian.</li>
        </ul>
      </div>

      <div onClick={() => setChecked(v => !v)} style={{
        display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px",
        background: checked ? C.greenL : "#0a1628", border: `2px solid ${checked ? C.green : C.border}`,
        borderRadius: 12, cursor: "pointer", marginBottom: 20, transition: "all 0.15s",
      }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: checked ? C.green : "transparent", border: `2px solid ${checked ? C.green : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
          {checked && <span style={{ color: "#020818", fontSize: 14, fontWeight: 900, lineHeight: 1 }}>✓</span>}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: checked ? C.green : C.soft, lineHeight: 1.6 }}>
          I understand Svastha provides AI-generated suggestions only. I will consult a medical professional before making health decisions.
        </p>
      </div>

      <button onClick={onAccept} disabled={!checked} style={{ ...S.btn(checked ? C.green : C.border, checked ? "#020818" : C.muted), opacity: checked ? 1 : 0.5, cursor: checked ? "pointer" : "not-allowed" }}>
        I Understand — Continue ✓
      </button>
    </div>
  );
}

// ─── SCREEN 3: ONBOARDING ────────────────────────────────────────────────────
function Onboarding({ user, setUser, onComplete }) {
  const [step, setStep] = useState(1);
  const TOTAL = 5;
  const up = patch => setUser(u => ({ ...u, ...patch }));

  const canNext = [null,
    () => user.name?.trim() && user.age && user.sex && user.height && user.weight && user.targetWeight,
    () => true,
    () => user.goal,
    () => user.activityLevel && user.equipment?.length > 0,
    () => user.dietType,
  ];

  const wrap = children => (
    <div style={{ ...S.app, minHeight: "100vh" }}>
      <ProgBar step={step} total={TOTAL} />
      <div style={{ padding: "16px 20px 32px" }}>
        {children}
      </div>
    </div>
  );

  // STEP 1 — Basic Info
  if (step === 1) return wrap(<>
    <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Your profile 👋</h2>
    <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>Everything stays on your device</p>

    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Your Name</label>
    <input value={user.name || ""} onChange={e => up({ name: e.target.value })} placeholder="e.g. Alex" style={{ ...S.inp, marginTop: 6, marginBottom: 14 }} />

    <div style={{ ...S.grid2, marginBottom: 14 }}>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Age</label>
        <input type="number" value={user.age || ""} onChange={e => up({ age: e.target.value })} placeholder="28" style={{ ...S.inp, marginTop: 6 }} />
      </div>
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Sex</label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          {["male", "female"].map(s => (
            <button key={s} onClick={() => up({ sex: s })} style={{ flex: 1, padding: "11px", border: `2px solid ${user.sex === s ? C.green : C.border}`, background: user.sex === s ? C.greenL : C.card, color: user.sex === s ? C.green : C.text, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {s === "male" ? "♂ Male" : "♀ Female"}
            </button>
          ))}
        </div>
      </div>
    </div>

    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Units</label>
    <div style={{ display: "flex", gap: 8, marginTop: 6, marginBottom: 14 }}>
      {[{ id: "metric", label: "Metric (kg, cm)" }, { id: "imperial", label: "Imperial (lbs, in)" }].map(u => (
        <button key={u.id} onClick={() => up({ units: u.id })} style={{ flex: 1, padding: "10px", border: `2px solid ${user.units === u.id ? C.green : C.border}`, background: user.units === u.id ? C.greenL : C.card, color: user.units === u.id ? C.green : C.text, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {u.label}
        </button>
      ))}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
      {[
        { f: "height", l: `Height (${user.units === "imperial" ? "in" : "cm"})`, ph: user.units === "imperial" ? "68" : "172" },
        { f: "weight", l: `Weight (${user.units === "imperial" ? "lbs" : "kg"})`, ph: user.units === "imperial" ? "180" : "82" },
        { f: "targetWeight", l: `Target (${user.units === "imperial" ? "lbs" : "kg"})`, ph: user.units === "imperial" ? "160" : "72" },
      ].map(f => (
        <div key={f.f}>
          <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>{f.l}</label>
          <input type="number" value={user[f.f] || ""} onChange={e => up({ [f.f]: e.target.value })} placeholder={f.ph} style={{ ...S.inp, marginTop: 5 }} />
        </div>
      ))}
    </div>

    <button disabled={!canNext[1]()} onClick={() => setStep(2)} style={{ ...S.btn(canNext[1]() ? C.green : C.border, canNext[1]() ? "#020818" : C.muted), opacity: canNext[1]() ? 1 : 0.5 }}>
      Continue →
    </button>
  </>);

  // STEP 2 — Health Conditions
  if (step === 2) return wrap(<>
    <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Health conditions? 🩺</h2>
    <p style={{ fontSize: 13, color: C.muted, margin: "0 0 18px" }}>Tap all that apply — keeps every plan safe for you</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
      {CONDITIONS.map(c => (
        <Chip key={c.id} item={c} selected={(user.conditions || []).includes(c.id)} onClick={() => {
          if (c.id === "none") { up({ conditions: ["none"] }); return; }
          const next = (user.conditions || []).filter(x => x !== "none");
          up({ conditions: next.includes(c.id) ? next.filter(x => x !== c.id) : [...next, c.id] });
        }} />
      ))}
    </div>
    <div style={{ background: "#0a1a2a", border: `1px solid ${C.blue}30`, borderLeft: `3px solid ${C.blue}`, borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
      <p style={{ margin: 0, fontSize: 12, color: "#93c5fd" }}>💡 No conditions? Select "None of these" or just continue.</p>
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <button onClick={() => setStep(1)} style={{ ...S.btn(C.border, C.text), flex: 1 }}>← Back</button>
      <button onClick={() => setStep(3)} style={{ ...S.btn(), flex: 2 }}>Continue →</button>
    </div>
  </>);

  // STEP 3 — Goals
  if (step === 3) return wrap(<>
    <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Your main goal 🎯</h2>
    <p style={{ fontSize: 13, color: C.muted, margin: "0 0 18px" }}>Pick the one that matters most right now</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
      {GOALS.map(g => <Chip key={g.id} item={g} selected={user.goal === g.id} onClick={() => up({ goal: g.id })} />)}
    </div>
    <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
      Timeline — <span style={{ color: C.green }}>{user.timelineMonths || 6} months</span>
    </label>
    <input type="range" min="3" max="12" step="3" value={user.timelineMonths || 6} onChange={e => up({ timelineMonths: parseInt(e.target.value) })} style={{ width: "100%", accentColor: C.green, marginBottom: 4 }} />
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 24 }}>
      <span>3 mo</span><span>6 mo</span><span>9 mo</span><span>12 mo</span>
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <button onClick={() => setStep(2)} style={{ ...S.btn(C.border, C.text), flex: 1 }}>← Back</button>
      <button disabled={!canNext[3]()} onClick={() => setStep(4)} style={{ ...S.btn(canNext[3]() ? C.green : C.border, canNext[3]() ? "#020818" : C.muted), flex: 2, opacity: canNext[3]() ? 1 : 0.5 }}>Continue →</button>
    </div>
  </>);

  // STEP 4 — Activity
  if (step === 4) return wrap(<>
    <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Activity & equipment 🏃</h2>
    <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px" }}>Be honest — we design around your real life</p>
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
      {ACTIVITY_LEVELS.map(a => (
        <div key={a.id} onClick={() => up({ activityLevel: a.id })} style={{ display: "flex", alignItems: "center", padding: "13px 16px", background: user.activityLevel === a.id ? C.greenL : C.card, border: `2px solid ${user.activityLevel === a.id ? C.green : C.border}`, borderRadius: 12, cursor: "pointer", transition: "all 0.15s" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: user.activityLevel === a.id ? C.green : C.text }}>{a.label}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{a.desc}</div>
          </div>
          {user.activityLevel === a.id && <span style={{ color: C.green, fontSize: 18, fontWeight: 900 }}>✓</span>}
        </div>
      ))}
    </div>
    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Equipment</label>
    <div style={{ ...S.grid2, marginTop: 8, marginBottom: 16 }}>
      {EQUIPMENT.map(e => <Chip key={e.id} item={e} selected={(user.equipment || []).includes(e.id)} onClick={() => up({ equipment: (user.equipment || []).includes(e.id) ? (user.equipment || []).filter(x => x !== e.id) : [...(user.equipment || []), e.id] })} />)}
    </div>
    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
      Time per day — <span style={{ color: C.green }}>{user.minutesPerDay || 45} min</span>
    </label>
    <input type="range" min="15" max="90" step="15" value={user.minutesPerDay || 45} onChange={e => up({ minutesPerDay: parseInt(e.target.value) })} style={{ width: "100%", accentColor: C.green, marginTop: 8, marginBottom: 24 }} />
    <div style={{ display: "flex", gap: 10 }}>
      <button onClick={() => setStep(3)} style={{ ...S.btn(C.border, C.text), flex: 1 }}>← Back</button>
      <button disabled={!canNext[4]()} onClick={() => setStep(5)} style={{ ...S.btn(canNext[4]() ? C.green : C.border, canNext[4]() ? "#020818" : C.muted), flex: 2, opacity: canNext[4]() ? 1 : 0.5 }}>Continue →</button>
    </div>
  </>);

  // STEP 5 — Diet
  if (step === 5) return wrap(<>
    <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>Diet preferences 🍽️</h2>
    <p style={{ fontSize: 13, color: C.muted, margin: "0 0 16px" }}>So we only suggest meals you'll enjoy</p>
    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Diet Type</label>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
      {DIET_TYPES.map((d, i) => <Chip key={d.id} item={d} selected={user.dietType === d.id} onClick={() => up({ dietType: d.id })} span2={i === 0} />)}
    </div>
    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Allergies</label>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
      {ALLERGIES.map(a => <Chip key={a.id} item={a} selected={(user.allergies || []).includes(a.id)} onClick={() => up({ allergies: (user.allergies || []).includes(a.id) ? (user.allergies || []).filter(x => x !== a.id) : [...(user.allergies || []), a.id] })} />)}
    </div>
    <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Foods to avoid (optional)</label>
    <input value={user.foodsAvoid || ""} onChange={e => up({ foodsAvoid: e.target.value })} placeholder="e.g. mushrooms, spicy food" style={{ ...S.inp, marginTop: 6, marginBottom: 24 }} />
    <div style={{ display: "flex", gap: 10 }}>
      <button onClick={() => setStep(4)} style={{ ...S.btn(C.border, C.text), flex: 1 }}>← Back</button>
      <button disabled={!canNext[5]()} onClick={onComplete} style={{ ...S.btn(canNext[5]() ? C.green : C.border, canNext[5]() ? "#020818" : C.muted), flex: 2, opacity: canNext[5]() ? 1 : 0.5 }}>Build My Plan ✨</button>
    </div>
  </>);
}

// ─── SCREEN 4: GENERATING ────────────────────────────────────────────────────
function Generating({ name }) {
  const [idx, setIdx] = useState(0);
  const steps = ["🧮 Calculating your metabolic rate...", "📊 Analysing your health conditions...", "🏋️ Building your workout programme...", "🍽️ Designing your meal plan...", "📈 Projecting your body timeline...", "✨ Personalising everything for you..."];
  useEffect(() => { const t = setInterval(() => setIdx(i => (i + 1) % steps.length), 1100); return () => clearInterval(t); }, []);
  return (
    <div style={{ ...S.app, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16, animation: "spin 2s linear infinite" }}>🌿</div>
      <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800 }}>Building your plan{name ? `, ${name}` : ""}!</h2>
      <p style={{ margin: "0 0 28px", fontSize: 14, color: C.muted }}>This takes about 15 seconds…</p>
      <div style={{ fontSize: 14, color: C.green, fontWeight: 600, minHeight: 28 }}>{steps[idx]}</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── SCREEN 5: MAIN DASHBOARD ─────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Home", icon: "⚡" },
  { id: "workout", label: "Workout", icon: "🏋️" },
  { id: "diet", label: "Diet", icon: "🥗" },
  { id: "progress", label: "Progress", icon: "📈" },
  { id: "coach", label: "AI Coach", icon: "🤖" },
];

// AI COACH
function AICoach({ user }) {
  const profile = buildProfile(user);
  const [msgs, setMsgs] = useState([{ role: "assistant", content: `Hey ${user.name}! 👋 I'm your Svastha AI coach.\n\nI know your full profile — your goal, health conditions, diet, and workout preferences.\n\nAsk me anything! I'll always keep your specific conditions in mind.\n\n⚠️ AI-generated — always consult your doctor for medical decisions.` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const quickAsks = ["Is today's plan safe for my conditions?", "What should I eat pre-workout?", "I'm tired — adjust my plan", "How do I improve faster?", "What supplements should I consider?"];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    const newMsgs = [...msgs, { role: "user", content: msg }];
    setMsgs(newMsgs); setInput(""); setLoading(true);
    try {
      const sys = `You are Svastha's AI health coach — warm, expert, and encouraging.\n${profile}\n${SAFETY_RULES}\nKeep responses 3–5 sentences. Use 1–2 emojis. Reference user conditions when relevant.`;
      const apiMsgs = newMsgs.filter((_, i) => !(i === 0 && newMsgs[0].role === "assistant"));
      const reply = await askAI(sys, apiMsgs, 800);
      setMsgs([...newMsgs, { role: "assistant", content: reply }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "assistant", content: `Sorry, hit a snag: ${e.message} 😅 Try again.` }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.greenL, border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Svastha AI Coach</div>
          <div style={{ fontSize: 11, color: C.muted }}>Knows your full profile · Personalised advice</div>
        </div>
        <button onClick={() => setMsgs([{ role: "assistant", content: "Chat cleared! Ask me anything 👋" }])} style={{ ...S.btnSm(C.border, C.muted), fontSize: 11 }}>Clear</button>
      </div>
      <div style={{ overflowX: "auto", display: "flex", gap: 6, marginBottom: 8, scrollbarWidth: "none", flexShrink: 0 }}>
        {quickAsks.map((q, i) => (
          <button key={i} onClick={() => send(q)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 12px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", color: C.muted, flexShrink: 0 }}>{q} →</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 8 }}>
            {m.role === "assistant" && <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.greenL, border: `1px solid ${C.green}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🤖</div>}
            <div style={{ maxWidth: "82%", background: m.role === "user" ? C.green : C.card, color: m.role === "user" ? "#020818" : C.text, border: m.role === "user" ? "none" : `1px solid ${C.border}`, borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "10px 14px", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: C.greenL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</div><div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "18px 18px 18px 4px", padding: "10px 14px", fontSize: 13, color: C.muted }}>typing…</div></div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, marginTop: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask your coach anything…" style={{ ...S.inp, flex: 1, borderRadius: 24 }} />
        <button onClick={() => send()} disabled={!input.trim() || loading} style={{ background: C.green, border: "none", borderRadius: "50%", width: 42, height: 42, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: (!input.trim() || loading) ? 0.4 : 1, flexShrink: 0, color: "#020818" }}>→</button>
      </div>
    </div>
  );
}

// DASHBOARD TAB
function DashboardTab({ user, workout, diet, workoutLoading, dietLoading, onGenWorkout, onGenDiet, setTab }) {
  const n = calcNutrition(user);
  const proj = projectWeight(user);
  const goal = GOALS.find(g => g.id === user.goal);
  const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div style={{ paddingBottom: 10 }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#052e16,#064e3b)", padding: "20px 16px 24px", marginBottom: 12 }}>
        <p style={{ margin: "0 0 2px", fontSize: 12, color: "#86efac" }}>{dateStr}</p>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#ffffff" }}>Hey {user.name}! 👋</h1>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#86efac" }}>{goal?.emoji} {goal?.label} · {user.timelineMonths}-month plan</p>
        <div style={{ ...S.grid2 }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff" }}>{proj.now}</div>
            <div style={{ fontSize: 11, color: "#86efac" }}>{proj.unit} now</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#ffffff" }}>{proj.target}</div>
            <div style={{ fontSize: 11, color: "#86efac" }}>{proj.unit} goal</div>
          </div>
        </div>
      </div>

      {/* AI disclaimer strip */}
      <div style={{ background: "#1a0a00", border: `1px solid ${C.amber}25`, borderLeft: `3px solid ${C.amber}`, padding: "8px 14px", marginBottom: 12, borderRadius: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.amber, flex: 1 }}>⚠️ All plans are AI-generated and not medical advice. Consult your doctor.</span>
      </div>

      {/* Nutrition targets */}
      <div style={S.card}>
        <SecTitle>Your Daily Targets</SecTitle>
        <div style={{ ...S.grid2 }}>
          <MetCard value={`${n.cals}`} label="kcal / day" color={C.green} />
          <MetCard value={`${n.protein}g`} label="Protein" color={C.blue} />
          <MetCard value={`${n.carbs}g`} label="Carbs" color={C.amber} />
          <MetCard value={`${n.fat}g`} label="Fat" color={C.purple} />
        </div>
      </div>

      {/* Today's workout preview */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SecTitle style={{ margin: 0 }}>🏋️ Today's Workout</SecTitle>
          <button onClick={onGenWorkout} style={{ ...S.btnSm(), fontSize: 11 }}>{workout ? "🔄 New" : "⚡ Generate"}</button>
        </div>
        {workoutLoading && <><Skel h={40} /><Skel h={40} /></>}
        {!workoutLoading && !workout && <p style={{ fontSize: 13, color: C.muted }}>Tap Generate to build today's personalised workout →</p>}
        {workout && !workoutLoading && (
          <>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: C.green }}>{workout.focus} · ~{workout.totalMinutes} min</p>
            {workout.sections?.slice(0, 1).map((sec, i) => (
              <div key={i}>
                {sec.exercises?.slice(0, 3).map((ex, j) => (
                  <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border2}`, fontSize: 13 }}>
                    <span style={{ color: C.soft }}>{ex.name}</span>
                    <Badge color={C.green}>{ex.sets}</Badge>
                  </div>
                ))}
              </div>
            ))}
            <button onClick={() => setTab("workout")} style={{ ...S.btnSm(C.greenL, C.green), marginTop: 10, width: "100%", border: `1px solid ${C.green}30` }}>View Full Workout →</button>
          </>
        )}
      </div>

      {/* Today's diet preview */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SecTitle style={{ margin: 0 }}>🍽️ Today's Meals</SecTitle>
          <button onClick={onGenDiet} style={{ ...S.btnSm(), fontSize: 11 }}>{diet ? "🔄 New" : "⚡ Generate"}</button>
        </div>
        {dietLoading && <><Skel h={40} /><Skel h={40} /></>}
        {!dietLoading && !diet && <p style={{ fontSize: 13, color: C.muted }}>Tap Generate to build today's personalised meal plan →</p>}
        {diet && !dietLoading && (
          <>
            {diet.meals?.slice(0, 2).map((meal, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border2}`, fontSize: 13 }}>
                <span style={{ color: C.soft }}>{meal.emoji} {meal.name}</span>
                <Badge color="#22c55e">{meal.calories} kcal</Badge>
              </div>
            ))}
            <button onClick={() => setTab("diet")} style={{ ...S.btnSm(C.greenL, C.green), marginTop: 10, width: "100%", border: `1px solid ${C.green}30` }}>View Full Meal Plan →</button>
          </>
        )}
      </div>

      {/* Body timeline */}
      <div style={S.card}>
        <SecTitle>📅 Body Timeline</SecTitle>
        {[{ l: "Now", w: proj.now, c: true }, { l: "3 months", w: proj.m3 }, { l: "6 months", w: proj.m6 }, { l: "9 months", w: proj.m9 }].map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border2}` }}>
            <div style={{ width: 70, fontSize: 12, fontWeight: 600, color: m.c ? C.green : C.muted }}>{m.l}</div>
            <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: m.c ? C.green : C.text }}>{m.w} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>{proj.unit}</span></div>
            {m.c && <Badge color={C.green}>NOW</Badge>}
          </div>
        ))}
      </div>

      {/* AI CTA */}
      <div onClick={() => setTab("coach")} style={{ ...S.card, cursor: "pointer", background: "linear-gradient(135deg,#052e16,#064e3b)", border: `1px solid ${C.green}30` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 36 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.green }}>Ask Your AI Coach</div>
            <div style={{ fontSize: 12, color: "#86efac", marginTop: 2 }}>Get personalised advice right now →</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// WORKOUT TAB
function WorkoutTab({ user, plan, onRefresh, loading, err }) {
  const [exDone, setExDone] = useState(() => LS.get("sv_ex", {}));
  const dk = new Date().toDateString();
  const toggle = key => { const n = { ...exDone, [key]: !exDone[key] }; setExDone(n); LS.set("sv_ex", n); };

  return (
    <div style={{ paddingBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>🏋️ Today's Workout</h2>
        <button onClick={onRefresh} style={S.btnSm()}>{plan ? "🔄 New" : "⚡ Generate"}</button>
      </div>

      {err && <div style={{ background: "#1a0505", border: `1px solid ${C.red}30`, borderLeft: `3px solid ${C.red}`, borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#fca5a5" }}>❌ {err}</div>}
      {loading && <><Skel h={60} /><Skel h={120} /><Skel h={100} /><Skel h={80} /></>}
      {!loading && !plan && <div style={{ ...S.card, textAlign: "center", padding: 24 }}><p style={{ color: C.muted, fontSize: 14 }}>Tap Generate to build your personalised workout</p></div>}

      {plan && !loading && (
        <>
          <div style={{ background: C.greenL, border: `1px solid ${C.green}30`, borderRadius: 12, padding: "12px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: 15, color: C.green }}>🏋️ {plan.focus}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#86efac" }}>~{plan.totalMinutes} min · {new Date().toLocaleDateString("en-US", { weekday: "long" })}</p>
            </div>
            <Badge color={C.green}>{plan.sections?.reduce((a, s) => a + (s.exercises?.length || 0), 0)} exercises</Badge>
          </div>

          {plan.warmup?.length > 0 && (
            <div style={S.card}>
              <SecTitle>🔥 Warm-Up</SecTitle>
              {plan.warmup.map((w, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border2}`, fontSize: 13 }}><span style={{ color: C.soft }}>{w.activity}</span><span style={{ color: C.muted }}>{w.duration}</span></div>)}
            </div>
          )}

          {plan.sections?.map((sec, i) => (
            <div key={i} style={S.card}>
              <SecTitle>{sec.emoji} {sec.title}</SecTitle>
              {sec.exercises?.map((ex, j) => {
                const key = `${dk}-${i}-${j}`; const done = !!exDone[key];
                return (
                  <div key={j} onClick={() => toggle(key)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border2}`, cursor: "pointer", opacity: done ? 0.5 : 1 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${done ? C.green : C.border}`, background: done ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {done && <span style={{ color: "#020818", fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: done ? C.muted : C.text, textDecoration: done ? "line-through" : "none" }}>{ex.name}</div>
                      {ex.notes && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{ex.notes}</div>}
                    </div>
                    <Badge color={C.green}>{ex.sets}</Badge>
                  </div>
                );
              })}
            </div>
          ))}

          {plan.cardio && (
            <div style={S.card}>
              <SecTitle>🏃 Cardio</SecTitle>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{plan.cardio.activity}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{plan.cardio.duration}</span>
              </div>
              {plan.cardio.notes && <p style={{ margin: "6px 0 0", fontSize: 11, color: C.muted }}>{plan.cardio.notes}</p>}
            </div>
          )}

          {plan.cooldown?.length > 0 && (
            <div style={S.card}>
              <SecTitle>❄️ Cool-Down</SecTitle>
              {plan.cooldown.map((c, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border2}`, fontSize: 13 }}><span style={{ color: C.soft }}>{c.activity}</span><span style={{ color: C.muted }}>{c.duration}</span></div>)}
            </div>
          )}

          {plan.reminders?.length > 0 && (
            <div style={{ background: "#1a0a00", border: `1px solid ${C.amber}30`, borderLeft: `3px solid ${C.amber}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13, color: C.amber }}>⚠️ Reminders</p>
              {plan.reminders.map((r, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12, color: "#fde68a" }}>{r}</p>)}
            </div>
          )}

          <div style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 11, color: C.muted, textAlign: "center" }}>
            ⚠️ AI-generated — consult your doctor before starting any new exercise programme.
          </div>
        </>
      )}
    </div>
  );
}

// DIET TAB
function DietTab({ user, plan, onRefresh, loading, err }) {
  const n = calcNutrition(user);
  return (
    <div style={{ paddingBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>🍽️ Today's Meals</h2>
        <button onClick={onRefresh} style={S.btnSm()}>{plan ? "🔄 New" : "⚡ Generate"}</button>
      </div>

      <div style={{ background: "linear-gradient(135deg,#052e16,#064e3b)", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#86efac", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Daily Targets</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
          {[["🔥", `${n.cals}`, "kcal"], ["🥩", `${n.protein}g`, "protein"], ["🌾", `${n.carbs}g`, "carbs"], ["🫒", `${n.fat}g`, "fat"]].map(([e, v, l], i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "7px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 12 }}>{e}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{v}</div>
              <div style={{ fontSize: 10, color: "#86efac" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {err && <div style={{ background: "#1a0505", border: `1px solid ${C.red}30`, borderLeft: `3px solid ${C.red}`, borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#fca5a5" }}>❌ {err}</div>}
      {loading && <><Skel h={140} /><Skel h={140} /><Skel h={140} /></>}
      {!loading && !plan && <div style={{ ...S.card, textAlign: "center", padding: 24 }}><p style={{ color: C.muted, fontSize: 14 }}>Tap Generate to build your personalised meal plan</p></div>}

      {plan && !loading && (
        <>
          {plan.meals?.map((meal, i) => (
            <div key={i} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{meal.emoji} {meal.name}</span>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{meal.time}</div>
                </div>
                <Badge color={C.green}>{meal.calories} kcal</Badge>
              </div>
              {meal.items?.map((item, j) => (
                <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border2}`, fontSize: 13 }}>
                  <span style={{ color: C.soft }}>{item.food}</span>
                  <span style={{ color: C.muted, fontSize: 11 }}>{item.portion}</span>
                </div>
              ))}
              {meal.note && <p style={{ margin: "8px 0 0", fontSize: 11, color: C.muted, fontStyle: "italic" }}>💡 {meal.note}</p>}
            </div>
          ))}
          {plan.tips?.length > 0 && (
            <div style={{ background: "#1a0a00", border: `1px solid ${C.amber}30`, borderLeft: `3px solid ${C.amber}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13, color: C.amber }}>💡 Nutrition Tips</p>
              {plan.tips.map((t, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12, color: "#fde68a" }}>• {t}</p>)}
            </div>
          )}
          <div style={{ background: C.card, border: `1px dashed ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 11, color: C.muted, textAlign: "center" }}>
            ⚠️ AI-generated — consult a registered dietitian for medical nutrition advice.
          </div>
        </>
      )}
    </div>
  );
}

// PROGRESS TAB
function ProgressTab({ user, setUser }) {
  const proj = projectWeight(user);
  const [newW, setNewW] = useState("");
  const weightLog = LS.get("sv_wlog", []);
  const logWeight = () => {
    if (!newW) return;
    const log = [{ date: new Date().toLocaleDateString(), weight: parseFloat(newW) }, ...weightLog].slice(0, 90);
    LS.set("sv_wlog", log);
    setUser(u => ({ ...u, weight: newW }));
    setNewW("");
  };
  const changes = {
    lose_fat: ["Your starting point", "Clothes feel looser, more energy", "Belly fat visibly reducing", "Strong body transformation"],
    gain_muscle: ["Your starting point", "Noticeably stronger", "Muscle definition growing", "Athletic physique"],
    recomp: ["Your starting point", "Body composition shifting", "Feeling firmer, clothes fitting better", "Strong & lean"],
    general: ["Your starting point", "Moving better, more energy", "Visibly healthier", "Active healthy lifestyle"],
  };
  const cc = changes[user.goal] || changes.general;
  return (
    <div style={{ paddingBottom: 10 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 14px" }}>📈 Your Progress</h2>
      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)", borderRadius: 14, padding: "16px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#ffffff" }}>{proj.now}</div><div style={{ fontSize: 11, color: "#a5b4fc" }}>{proj.unit} now</div></div>
          <div style={{ fontSize: 24, color: "#6366f1", opacity: 0.7 }}>→</div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#ffffff" }}>{proj.target}</div><div style={{ fontSize: 11, color: "#a5b4fc" }}>{proj.unit} goal</div></div>
        </div>
      </div>
      <div style={S.card}>
        <SecTitle>📅 Body Milestones</SecTitle>
        {[{ l: "Now", w: proj.now, c: true }, { l: "3 months", w: proj.m3 }, { l: "6 months", w: proj.m6 }, { l: "9 months", w: proj.m9 }].map((m, i) => {
          const diff = Math.round((m.w - proj.now) * 10) / 10;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.border2}` }}>
              <div style={{ width: 72, fontSize: 12, fontWeight: 600, color: m.c ? C.green : C.muted }}>{m.l}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: m.c ? C.green : C.text }}>{m.w} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>{proj.unit}</span></div>
                {!m.c && <div style={{ fontSize: 11, color: diff < 0 ? C.green : C.amber, fontWeight: 600 }}>{diff > 0 ? "+" : ""}{diff} {proj.unit}</div>}
                <div style={{ fontSize: 11, color: C.muted }}>{cc[Math.min(i, cc.length - 1)]}</div>
              </div>
              {m.c && <Badge color={C.green}>NOW</Badge>}
            </div>
          );
        })}
      </div>
      <div style={S.card}>
        <SecTitle>📝 Log Today's Weight</SecTitle>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" value={newW} onChange={e => setNewW(e.target.value)} placeholder={`Weight in ${proj.unit}`} style={{ ...S.inp, flex: 1 }} />
          <button onClick={logWeight} disabled={!newW} style={{ ...S.btnSm(), width: 80, opacity: newW ? 1 : 0.4 }}>Log ✓</button>
        </div>
      </div>
      {LS.get("sv_wlog", []).length > 0 && (
        <div style={S.card}>
          <SecTitle>History</SecTitle>
          {LS.get("sv_wlog", []).slice(0, 7).map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border2}`, fontSize: 13 }}>
              <span style={{ color: C.muted }}>{e.date}</span>
              <span style={{ fontWeight: 700, color: i === 0 ? C.green : C.text }}>{e.weight} {proj.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
const WORKOUT_SYS = `You are an expert personal trainer. Respond ONLY with valid JSON — no markdown.
Return this exact shape:
{"thought":"short motivational quote","focus":"muscle focus e.g. Chest + Core","totalMinutes":45,"warmup":[{"activity":"Arm circles","duration":"1 min"}],"sections":[{"title":"Chest","emoji":"💪","exercises":[{"name":"Push-ups","sets":"3×12","notes":"Keep core tight"}]}],"cardio":{"activity":"Stationary bike","duration":"15 min","notes":"Zone 2 pace"},"cooldown":[{"activity":"Child's pose","duration":"1 min"}],"reminders":["💧 Drink water","⚠️ Stop if you feel pain"]}`;

const DIET_SYS = `You are an expert dietitian. Respond ONLY with valid JSON — no markdown.
Return this exact shape with 4 meals:
{"meals":[{"name":"Breakfast","emoji":"🍳","time":"7:30 AM","calories":420,"items":[{"food":"Oatmeal with banana","portion":"1 cup / 1 medium"}],"note":"optional tip"}],"tips":["tip 1","tip 2"]}
Respect ALL conditions and allergies strictly. For diabetics: low GI only, no refined sugar.`;

const defaultUser = () => ({
  name: "", age: "", sex: "", units: "metric",
  height: "", weight: "", targetWeight: "",
  conditions: [], goal: "", timelineMonths: 6,
  activityLevel: "", equipment: [], minutesPerDay: 45,
  dietType: "", allergies: [], foodsAvoid: "",
});

export default function App() {
  const [screen, setScreen] = useState(() => {
    const u = LS.get("sv_user", null);
    return u?.onboarded ? "app" : "welcome";
  });
  const [user, setUser] = useState(() => LS.get("sv_user", defaultUser()));
  const [tab, setTab] = useState("dashboard");
  const [workout, setWorkout] = useState(null);
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [workoutErr, setWorkoutErr] = useState(null);
  const [diet, setDiet] = useState(null);
  const [dietLoading, setDietLoading] = useState(false);
  const [dietErr, setDietErr] = useState(null);

  useEffect(() => { LS.set("sv_user", user); }, [user]);

  const fetchWorkout = async () => {
    setWorkoutLoading(true); setWorkoutErr(null);
    try {
      const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
      const sys = WORKOUT_SYS + "\n\n" + buildProfile(user) + "\n\n" + SAFETY_RULES;
      const raw = await askAI(sys, [{ role: "user", content: `Generate today's (${day}) workout. Time: ${user.minutesPerDay} min. Equipment: ${(user.equipment || []).join(", ")}.` }]);
      setWorkout(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch (e) { setWorkoutErr(e.message); }
    setWorkoutLoading(false);
  };

  const fetchDiet = async () => {
    setDietLoading(true); setDietErr(null);
    try {
      const n = calcNutrition(user);
      const sys = DIET_SYS + "\n\n" + buildProfile(user) + "\n\n" + SAFETY_RULES + `\nTarget: ${n.cals}kcal, Protein ${n.protein}g, Carbs ${n.carbs}g, Fat ${n.fat}g.`;
      const raw = await askAI(sys, [{ role: "user", content: "Generate today's full meal plan with 4 meals." }]);
      setDiet(JSON.parse(raw.replace(/```json|```/g, "").trim()));
    } catch (e) { setDietErr(e.message); }
    setDietLoading(false);
  };

  const completeOnboarding = async () => {
    setUser(u => ({ ...u, onboarded: true }));
    setScreen("generating");
    await Promise.allSettled([fetchWorkout(), fetchDiet()]);
    setScreen("app");
  };

  const resetApp = () => {
    LS.clear();
    setUser(defaultUser());
    setWorkout(null); setDiet(null);
    setScreen("welcome");
  };

  if (screen === "welcome") return <Welcome onNext={() => setScreen("disclaimer")} />;
  if (screen === "disclaimer") return <Disclaimer onAccept={() => setScreen("onboarding")} />;
  if (screen === "onboarding") return <Onboarding user={user} setUser={setUser} onComplete={completeOnboarding} />;
  if (screen === "generating") return <Generating name={user.name} />;

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${C.border}`, background: C.card, position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🌿</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: C.green, letterSpacing: -0.3 }}>Svastha</div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1 }}>One Connection for Better Health</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.greenL, border: `1px solid ${C.green}40`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: C.green }}>
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
          <button onClick={resetApp} style={{ background: "none", border: "none", color: C.muted, fontSize: 11, cursor: "pointer" }}>Reset</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 14px", paddingBottom: 80 }}>
        {tab === "dashboard" && <DashboardTab user={user} workout={workout} diet={diet} workoutLoading={workoutLoading} dietLoading={dietLoading} onGenWorkout={fetchWorkout} onGenDiet={fetchDiet} setTab={setTab} />}
        {tab === "workout" && <WorkoutTab user={user} plan={workout} onRefresh={fetchWorkout} loading={workoutLoading} err={workoutErr} />}
        {tab === "diet" && <DietTab user={user} plan={diet} onRefresh={fetchDiet} loading={dietLoading} err={dietErr} />}
        {tab === "progress" && <ProgressTab user={user} setUser={setUser} />}
        {tab === "coach" && <AICoach user={user} />}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, display: "flex", borderTop: `1px solid ${C.border}`, background: C.card, zIndex: 20 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 0 13px" }}>
              <span style={{ fontSize: 20, opacity: active ? 1 : 0.45 }}>{t.icon}</span>
              <span style={{ fontSize: 9, color: active ? C.green : C.muted, fontWeight: active ? 700 : 400, textTransform: "uppercase", letterSpacing: 0.3 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
