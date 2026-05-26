import { useState, useEffect, useRef } from "react";

// ─── AI ──────────────────────────────────────────────────────────────────────
async function askAI(system, messages, maxTokens = 1000) {
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

// ─── USER PROFILE ─────────────────────────────────────────────────────────────
const USER = {
  name: "My Journey", age: 39,
  height: "5'10\"", heightCm: 177.8,
  startWeight: 87, goalWeight: 80,
  startDate: "April 14, 2025", goalDate: "July 2025",
  conditions: ["Low Vitamin D", "Low B12", "High Triglycerides"],
  injuries: ["Right knee pain", "Lower back pain"],
};

const AI_PROFILE = `You are Svastra's AI health coach — a warm, expert, and encouraging personal trainer.

USER PROFILE:
- Name: My Journey, Age: 39, Height: 5'10" (177.8cm)
- Current weight: ~87kg, Goal: 80kg by July 2025
- Conditions: Low Vitamin D, Low B12, High Triglycerides
- Injuries: Right knee pain, Lower back pain
- Goal: Lose 15 lbs, tone muscle, fix energy, lower triglycerides

STRICT SAFETY RULES — never violate:
- Knee pain: NO running, deep squats, lunges, jumping or high impact
- Back pain: NO heavy deadlifts, NO heavy spinal loading — core stability only
- High triglycerides: NO sugar, refined carbs, fried food, alcohol
- Low B12/D: Always remind to take supplements before workouts
- Keep weights LIGHT — form over weight always
- Always eat before workout — no empty stomach training

Keep responses concise (3–5 sentences), encouraging, and specific to this profile.
Use 1–2 emojis naturally. End health advice with: ⚠️ AI-generated — always consult your doctor.`;

// ─── DATA ─────────────────────────────────────────────────────────────────────
const QUOTES = [
  "Every rep is a step closer to the person you want to become.",
  "Discipline is choosing between what you want now and what you want most.",
  "Strong legs carry you through life. Weak legs just carry you.",
  "Comfort is the enemy of growth. Step outside your zone.",
  "Yesterday you said tomorrow. Today is that tomorrow.",
  "Progress is progress, no matter how small. Trust the process.",
  "A strong core is the foundation of everything. Build from inside out.",
  "Your body can do it. It's your mind you need to convince.",
  "Smart training beats hard training. Listen to your body.",
  "Success is the sum of small efforts repeated day in and day out.",
];

const WEEK_PLAN = [
  { day:"Mon", label:"Rest Day", rest:true, color:"#6b7280", muscles:[], icon:"🛌",
    warmup:["Light stretching 10 min","Deep breathing 5 min"],
    exercises:["Complete rest — let your body recover","Light stretching if desired","Stay hydrated — 3–4L water","Sleep 7–8 hours tonight"],
    cooldown:["Gentle yoga if desired"] },
  { day:"Tue", label:"Chest + Shoulders + Abs", color:"#ef4444", muscles:["Chest","Shoulders","Abs","Core"], icon:"💪",
    warmup:["Arm circles forward + back 1 min","Light chest fly no weight 1×15","Shoulder rolls 1 min","Push-ups on knees 1×10","Cat Cow 2 mins"],
    exercises:["Chest Fly Machine 3×15","Chest Press Machine 3×12","DB Bench Press 3×12","Incline DB Press 3×12","Machine Shoulder Press 3×12","Seated DB Shoulder Press 3×12","Lateral Raises 3×15","Front Raises 3×15","Machine Rear Delt Fly 3×15","Seated Ab Crunch Machine 3×15","Dead Bug 3×10 each","Plank on knees 3×20 sec","Seated Oblique Twist 3×15","Stationary Cycle 15 min"],
    cooldown:["Doorway chest stretch 2 min","Cross body shoulder stretch 1 min each","Child's Pose 2 min","Cat Cow 2 min"] },
  { day:"Wed", label:"Back + Biceps + Triceps", color:"#3b82f6", muscles:["Back","Lats","Biceps","Triceps","Forearms"], icon:"🏋️",
    warmup:["Stationary Cycle very easy 5 min","Arm circles 1 min","Cat Cow 2 min","Light face pulls no weight 1×15","Shoulder rolls 1 min"],
    exercises:["Lat Pulldown 3×12","Single Arm DB Row 3×12 each","Seated Cable Row 3×12","Face Pulls 3×15","Dumbbell Curl 3×15","Hammer Curl 3×15","Tricep Rope Pushdown 3×15","Overhead Tricep Extension 3×15","Stationary Cycle 20 min"],
    cooldown:["Child's Pose 2 min","Cat Cow 2 min","Doorway bicep stretch 1 min each","Overhead tricep stretch 1 min each","Seated forward bend 2 min"] },
  { day:"Thu", label:"Legs + Glutes + Abs", color:"#22c55e", muscles:["Quads","Hamstrings","Glutes","Calves","Abs"], icon:"🦵",
    warmup:["Stationary Cycle very easy 5 min","Standing hip circles 1 min","Glute bridge bodyweight 2×15","Seated leg extension no weight 1×15","Ankle rolls 1 min","Cat Cow 1 min"],
    exercises:["Leg Press partial range 4×15","Seated Leg Extension 3×15","DB Sumo Squat 3×15","DB Step Up low box 3×12 each","DB Lateral Lunge 3×12 each","Lying Leg Curl 3×15","DB Romanian Deadlift 3×12","DB Glute Bridge 4×20","Hip Abductor Machine 3×15","Hip Adductor Machine 3×15","DB Calf Raise 3×20","Seated Calf Raise 3×20","Seated Ab Crunch Machine 3×15","Dead Bug 3×10 each","Plank on knees 3×20 sec","Stationary Cycle 20 min"],
    cooldown:["Stationary Cycle very easy 5 min","Seated hamstring stretch 2 min each","Quad stretch hold wall 1 min each","Calf stretch 1 min each","Child's Pose 2 min","Cat Cow 3 min","Ice right knee 10 min 🧊"] },
  { day:"Fri", label:"Cardio + Mobility", color:"#f59e0b", muscles:["Heart","Joints","Flexibility"], icon:"🏃",
    warmup:["Slow walk 3 min","Hip circles 1 min","Ankle rolls 1 min"],
    exercises:["Stationary Cycle 25 min","Treadmill walk flat 15 min","Cat Cow 5 min","Child's Pose 3 min","Hip flexor stretch 2 min each","Seated hamstring stretch 2 min each","Chest opener stretch 2 min","Deep breathing 5 min"],
    cooldown:["Full body stretch 5 min","Deep breathing 3 min"] },
  { day:"Sat", label:"🔥 Challenge Day", color:"#a855f7", challenge:true, muscles:["Full Body","Cardio","Strength"], icon:"🔥",
    warmup:["Stationary Cycle 5 min","Full body mobility 5 min","Cat Cow 2 min"],
    exercises:["Circuit Round 1: Chest Press + Lat Pulldown + Leg Press 3×15 each","Circuit Round 2: Shoulder Press + Cable Row + Glute Bridge 3×15 each","Circuit Round 3: Bicep Curl + Tricep Pushdown + Calf Raise 3×15 each","HIIT Cycle: 1 min fast + 1 min slow × 10 rounds","Plank challenge: 3×30 sec","Ab Crunch Machine 3×20","Finisher: 100 Glute Bridges for time"],
    cooldown:["Full body stretch 10 min","Cat Cow 5 min","Child's Pose 3 min","Deep breathing 5 min","Ice right knee 10 min 🧊"] },
  { day:"Sun", label:"Active Recovery + Yoga", color:"#06b6d4", muscles:["Full Body","Mind","Flexibility"], icon:"🧘",
    warmup:[],
    exercises:["Morning Yoga 30 min","Light Walk outdoors 20 min","Cat Cow 5 min","Child's Pose 5 min","Hip flexor stretch 3 min","Deep breathing + meditation 10 min","Meal prep for the week"],
    cooldown:["Gentle full body stretch 10 min"] },
];

const MEALS = [
  { label:"Breakfast", time:"7–8 AM", cal:450, protein:35, carbs:55, fat:12, emoji:"🍳", items:["2 boiled eggs","½ cup oats + banana","1 glass fortified milk","Green tea"] },
  { label:"Mid-Morning", time:"10–11 AM", cal:150, protein:5, carbs:18, fat:8, emoji:"🥜", items:["10–12 walnuts","1 apple or orange"] },
  { label:"Lunch", time:"1–2 PM", cal:500, protein:38, carbs:55, fat:12, emoji:"🍱", items:["1 palm grilled chicken or steelhead fillet","1 fist brown rice","2 fists steamed vegetables"] },
  { label:"Pre-Workout", time:"30 min before gym", cal:150, protein:5, carbs:25, fat:4, emoji:"⚡", critical:true, items:["1 banana + 1 tbsp peanut butter","OR small Greek yogurt"] },
  { label:"Dinner", time:"7–8 PM", cal:400, protein:35, carbs:35, fat:12, emoji:"🌙", items:["1 palm grilled fish or chicken","1 cup lentil soup","Salad with olive oil dressing"] },
];

const SUPPLEMENTS = [
  { id:"d3",  name:"Vitamin D3",      dose:"2000–4000 IU",  time:"Morning",     emoji:"☀️", urgent:true, why:"Fixes muscle weakness & fatigue. Critical for your deficiency." },
  { id:"b12", name:"Vitamin B12",     dose:"500–1000 mcg",  time:"Morning",     emoji:"⚡", urgent:true, why:"Stops dizziness & shaking in gym — most urgent supplement." },
  { id:"o3",  name:"Omega 3 Fish Oil",dose:"1–2 capsules",  time:"With lunch",  emoji:"🐟", why:"Lowers high triglycerides & reduces knee/back inflammation." },
  { id:"mg",  name:"Magnesium",       dose:"300–400 mg",    time:"Before bed",  emoji:"🌙", why:"Improves sleep quality & overnight muscle recovery." },
];

const PAIN_POINTS = [
  { label:"Right knee pain",       level:"moderate", tip:"No running, deep squats or lunges — always protect" },
  { label:"Lower back pain",       level:"mild",     tip:"No deadlifts, seated exercises preferred always" },
  { label:"Low Vitamin D",         level:"high",     tip:"Supplement + 15 min morning sunlight during yoga" },
  { label:"Low B12",               level:"high",     tip:"Root cause of dizziness & shaking — supplement daily" },
  { label:"High Triglycerides",    level:"high",     tip:"No sugar, fried food, white carbs or alcohol" },
  { label:"Body shaking when lifting", level:"moderate", tip:"Always eat pre-workout snack, keep weights light" },
];

const GOALS_LIST = [
  { emoji:"⚖️", title:"Lose 15 lbs in 9 weeks",   detail:"~1.5–2 lbs/week safely and sustainably" },
  { emoji:"💪", title:"Tone every muscle group",   detail:"Each day targets different body parts" },
  { emoji:"⚡", title:"Fix energy & dizziness",    detail:"B12 + Vitamin D supplements ASAP" },
  { emoji:"❤️", title:"Lower triglycerides",       detail:"Clean diet + Omega 3 + consistent cardio" },
  { emoji:"🦵", title:"Protect right knee",        detail:"No high-impact, light knee work always" },
  { emoji:"🏆", title:"Reach healthy BMI",         detail:"From 27.5 → under 25" },
];

const RULES = [
  "Always eat before workout — no empty stomach training",
  "Drink 3–4 litres of water every single day",
  "Start B12 & Vitamin D supplements ASAP",
  "Keep weights light — form and control over heavy",
  "Never skip morning yoga — reduces cortisol",
  "Sleep 7–8 hours — fat loss happens at night",
  "Eat fish 3–4 times a week (steelhead is perfect)",
  "Weigh yourself only on Monday mornings",
  "Ice right knee for 10 min after every leg session",
  "See doctor about knee, back & supplement doses",
];

const ROADMAP = [
  { w:"Week 1–2", tot:"3 lbs",  note:"Building habit",        pct:20  },
  { w:"Week 3–4", tot:"6 lbs",  note:"Clothes feeling looser", pct:40  },
  { w:"Week 5–6", tot:"10 lbs", note:"Visible difference!",   pct:67  },
  { w:"Week 7–8", tot:"14 lbs", note:"Almost there!",         pct:93  },
  { w:"Week 9",   tot:"15 lbs", note:"Goal achieved! 🏆",     pct:100 },
];

const JOURNEY_LOG = [
  ["Tue, Apr 14","Cardio — Treadmill 30 min + Cycle + Chin-ups","✅"],
  ["Wed, Apr 15","Pull Day — Back + Biceps","✅"],
  ["Thu, Apr 16","Shoulders + Arms","✅"],
  ["Fri, Apr 17","Cardio + Mobility","⚠️"],
  ["Sat, Apr 18","Legs + Glutes","❌"],
  ["Sun, Apr 19","Active Recovery","✅"],
  ["Tue, Apr 21","Chest only","✅"],
  ["Wed, Apr 22","Back + Biceps","✅"],
  ["Thu, Apr 23","Legs","❌"],
  ["Fri, Apr 24","Legs (makeup)","✅"],
  ["Tue, May 5","Full Body Reactivation","✅"],
  ["Thu, May 7","Chest + Shoulders","✅"],
  ["Fri, May 8","Back + Biceps","✅"],
  ["Sat, May 9","Legs + Glutes","✅"],
  ["Wed, May 13","Back + Biceps + Triceps","✅"],
  ["Thu, May 14","Chest + Shoulders","✅"],
  ["Fri, May 15","Legs + Glutes + Abs","✅"],
  ["Sat, May 16","Cardio + Mobility","✅"],
  ["Tue, May 19","Chest + Shoulders + Abs","✅"],
  ["Wed, May 20","Walking + Yard Work","🚶"],
  ["Thu, May 21","Light Full Body (back pain)","✅"],
];

const SW=87, GW=80, HT=177.8;
const DAY_NAMES=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TODAY=DAY_NAMES[new Date().getDay()];

function calcBMI(w){ return (w/((HT/100)**2)).toFixed(1); }
function toLbs(k){ return (k*2.20462).toFixed(1); }
function pct(lost){ return Math.min(100,Math.max(0,Math.round((lost/(SW-GW))*100))); }
function getQuote(){ return QUOTES[new Date().getDay()%QUOTES.length]; }

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const LS = {
  get:(k,fb)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; }},
  set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} },
};

// ─── ATOMS ────────────────────────────────────────────────────────────────────
function PBar({value,color="#22c55e",h=6}){
  return(
    <div style={{height:h,borderRadius:h,background:"#1e293b",overflow:"hidden"}}>
      <div style={{height:"100%",width:`${value}%`,background:color,borderRadius:h,transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)"}}/>
    </div>
  );
}
function Badge({children,color}){
  return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:color+"22",color,fontWeight:600,letterSpacing:0.5}}>{children}</span>;
}
function MetricCard({value,label,color="#22c55e",sub}){
  return(
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"12px 14px"}}>
      <div style={{fontSize:22,fontWeight:700,color,letterSpacing:-1}}>{value}</div>
      <div style={{fontSize:11,color:"#64748b",marginTop:2,letterSpacing:0.5}}>{label}</div>
      {sub&&<div style={{fontSize:10,color:"#334155",marginTop:1}}>{sub}</div>}
    </div>
  );
}
function SecTitle({children}){
  return <div style={{fontSize:13,fontWeight:600,color:"#94a3b8",letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>{children}</div>;
}

// ─── DISCLAIMER BANNER ────────────────────────────────────────────────────────
function DisclaimerBanner(){
  const [hidden,setHidden]=useState(()=>LS.get("vyp_disc",false));
  if(hidden) return null;
  return(
    <div style={{background:"#1a0a00",border:"1px solid #f59e0b40",borderLeft:"4px solid #f59e0b",padding:"10px 14px",margin:"0 0 12px",borderRadius:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",letterSpacing:0.5,marginBottom:3}}>⚠️ AI DISCLAIMER</div>
          <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.5}}>
            All workout and nutrition suggestions are <strong style={{color:"#f59e0b"}}>AI-generated</strong> and not medically vetted.
            Consult your doctor before starting any programme — especially with your knee, back and triglyceride conditions.
          </div>
        </div>
        <button onClick={()=>{ setHidden(true); LS.set("vyp_disc",true); }} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:16,flexShrink:0,lineHeight:1}}>✕</button>
      </div>
    </div>
  );
}

// ─── AI CHAT ──────────────────────────────────────────────────────────────────
function AICoach(){
  const[msgs,setMsgs]=useState(()=>LS.get("vyp_chat",[{role:"assistant",content:"Hey! 👋 I'm your Svastra AI coach.\n\nI know your full profile — knee pain, back pain, high triglycerides, and your goal to lose 15 lbs by July. Ask me anything!\n\n⚠️ AI-generated — always consult your doctor for medical decisions."}]));
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const endRef=useRef(null);
  const quickAsks=["Is today safe for my knee?","What should I eat pre-workout?","Modify plan — I'm tired","How to lower triglycerides fast?","Why am I shaking during workouts?"];

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading]);
  useEffect(()=>{ LS.set("vyp_chat",msgs.slice(-20)); },[msgs]);

  const send=async(text)=>{
    const msg=(text||input).trim();
    if(!msg||loading) return;
    const newMsgs=[...msgs,{role:"user",content:msg}];
    setMsgs(newMsgs); setInput(""); setLoading(true);
    try{
      const apiMsgs=newMsgs.filter((_,i)=>!(i===0&&newMsgs[0].role==="assistant"));
      const reply=await askAI(AI_PROFILE,apiMsgs,800);
      setMsgs([...newMsgs,{role:"assistant",content:reply}]);
    }catch(e){
      setMsgs(m=>[...m,{role:"assistant",content:`Sorry, hit a snag: ${e.message} 😅 Try again.`}]);
    }
    setLoading(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 180px)",minHeight:400}}>
      <DisclaimerBanner/>
      {/* Header */}
      <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"12px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:"#22c55e15",border:"1px solid #22c55e40",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🤖</div>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:"#e2e8f0"}}>AI Coach</div>
          <div style={{fontSize:11,color:"#64748b"}}>Knows your full profile · Free to use</div>
        </div>
        <button onClick={()=>{ setMsgs([{role:"assistant",content:"Chat cleared! Ask me anything 👋"}]); LS.set("vyp_chat",[]); }} style={{marginLeft:"auto",background:"none",border:"1px solid #1e293b",borderRadius:8,padding:"5px 10px",color:"#64748b",fontSize:11,cursor:"pointer"}}>Clear</button>
      </div>

      {/* Quick asks */}
      <div style={{overflowX:"auto",display:"flex",gap:6,marginBottom:8,scrollbarWidth:"none",flexShrink:0,paddingBottom:2}}>
        {quickAsks.map((q,i)=>(
          <button key={i} onClick={()=>send(q)} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:20,padding:"6px 12px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap",color:"#64748b",flexShrink:0}}>
            {q} →
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:8,paddingRight:2}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
            {m.role==="assistant"&&<div style={{width:26,height:26,borderRadius:"50%",background:"#22c55e15",border:"1px solid #22c55e30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🤖</div>}
            <div style={{
              maxWidth:"82%",
              background:m.role==="user"?"#22c55e":"#0f172a",
              color:m.role==="user"?"#020818":"#e2e8f0",
              border:m.role==="user"?"none":"1px solid #1e293b",
              borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
              padding:"10px 14px",fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:"#22c55e15",border:"1px solid #22c55e30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>🤖</div>
            <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:"16px 16px 16px 4px",padding:"10px 14px",fontSize:13,color:"#475569"}}>typing…</div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div style={{display:"flex",gap:8,paddingTop:8,borderTop:"1px solid #1e293b",marginTop:6}}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="Ask your coach anything…"
          style={{flex:1,background:"#0f172a",border:"1px solid #1e293b",borderRadius:24,padding:"10px 16px",fontSize:13,color:"#e2e8f0",outline:"none"}}
        />
        <button onClick={()=>send()} disabled={!input.trim()||loading}
          style={{background:"#22c55e",border:"none",borderRadius:"50%",width:42,height:42,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",opacity:(!input.trim()||loading)?0.4:1,flexShrink:0,color:"#020818"}}>
          →
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const TABS=[
  {id:"dashboard",label:"Dashboard",icon:"⚡"},
  {id:"workout",  label:"Workout",  icon:"🏋️"},
  {id:"diet",     label:"Diet",     icon:"🥗"},
  {id:"progress", label:"Progress", icon:"📈"},
  {id:"supplements",label:"Supps", icon:"💊"},
  {id:"goals",    label:"Goals",    icon:"🎯"},
  {id:"log",      label:"Log",      icon:"📅"},
  {id:"coach",    label:"AI Coach", icon:"🤖"},
];

export default function Svastra(){
  const[tab,setTab]=useState("dashboard");
  const[vitals,setVitals]=useState(()=>LS.get("vyp_vitals",[]));
  const[exDone,setExDone]=useState(()=>LS.get("vyp_ex",{}));
  const[supDone,setSupDone]=useState(()=>LS.get("vyp_sup",{}));
  const[workoutLog,setWorkoutLog]=useState(()=>LS.get("vyp_log",[]));
  const[selectedDay,setSelectedDay]=useState(TODAY);
  const[newVital,setNewVital]=useState({weight:"",sleep:"",water:"",steps:"",hr:"",cal:"",mood:"3",note:""});
  const[showDisclaimer,setShowDisclaimer]=useState(()=>!LS.get("vyp_disc_full",false));

  useEffect(()=>{ LS.set("vyp_vitals",vitals); },[vitals]);
  useEffect(()=>{ LS.set("vyp_ex",exDone); },[exDone]);
  useEffect(()=>{ LS.set("vyp_sup",supDone); },[supDone]);
  useEffect(()=>{ LS.set("vyp_log",workoutLog); },[workoutLog]);

  const lw=vitals.filter(v=>v.weight).length?+vitals.filter(v=>v.weight).slice(-1)[0].weight:SW;
  const lost=+(SW-lw).toFixed(1);
  const lostLbs=+toLbs(lost);
  const rem=+(lw-GW).toFixed(1);
  const progress=pct(lost);
  const currBMI=calcBMI(lw);
  const todayPlan=WEEK_PLAN.find(d=>d.day===TODAY)||WEEK_PLAN[0];
  const selPlan=WEEK_PLAN.find(d=>d.day===selectedDay)||WEEK_PLAN[0];
  const dk=new Date().toDateString();
  const todayDone=todayPlan.exercises.filter((_,i)=>exDone[`${TODAY}-${i}`]).length;

  function toggleEx(key){ const n={...exDone,[key]:!exDone[key]}; setExDone(n); }
  function toggleSup(key){ const n={...supDone,[key]:!supDone[key]}; setSupDone(n); }
  function logWorkout(day){
    const e={day,date:new Date().toLocaleDateString(),label:WEEK_PLAN.find(d=>d.day===day)?.label};
    setWorkoutLog(l=>[e,...l].slice(0,50));
  }
  function saveVital(){
    if(!newVital.weight&&!newVital.sleep&&!newVital.steps) return;
    setVitals(v=>[...v,{...newVital,date:new Date().toLocaleDateString()}]);
    setNewVital({weight:"",sleep:"",water:"",steps:"",hr:"",cal:"",mood:"3",note:""});
  }

  // styles
  const s={
    app:{background:"#020818",color:"#e2e8f0",minHeight:"100vh",fontFamily:"system-ui,-apple-system,sans-serif"},
    header:{padding:"16px",background:"#0a1628",borderBottom:"1px solid #1e293b"},
    appName:{fontSize:22,fontWeight:800,color:"#22c55e",letterSpacing:-0.5},
    tagline:{fontSize:10,color:"#22c55e",letterSpacing:2,textTransform:"uppercase",opacity:0.7,marginTop:1},
    tabs:{display:"flex",overflowX:"auto",background:"#0a1628",borderBottom:"1px solid #1e293b",scrollbarWidth:"none",gap:0},
    tab:(a)=>({flexShrink:0,padding:"10px 12px",border:"none",background:"none",color:a?"#22c55e":"#64748b",fontSize:11,fontWeight:a?700:400,cursor:"pointer",borderBottom:a?"2px solid #22c55e":"2px solid transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all 0.2s"}),
    content:{padding:"12px"},
    card:{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:"14px",marginBottom:10},
    cardAccent:(c)=>({background:`${c}08`,border:`1px solid ${c}30`,borderRadius:12,padding:"14px",marginBottom:10}),
    grid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10},
    inp:{width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid #1e293b",background:"#0f172a",color:"#e2e8f0",fontSize:13,boxSizing:"border-box",outline:"none"},
    btn:(c="#22c55e")=>({padding:"9px 20px",borderRadius:10,border:"none",background:c,color:c==="#22c55e"?"#020818":"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}),
    dayBtn:(d)=>({textAlign:"center",padding:"8px 4px",borderRadius:10,border:`1px solid ${d.day===selectedDay?d.color:"#1e293b"}`,background:d.day===TODAY?d.color+"20":"transparent",cursor:"pointer",fontSize:11,color:d.day===selectedDay?d.color:d.day===TODAY?d.color:"#64748b",transition:"all 0.2s",minWidth:40}),
    mealCard:(crit)=>({background:crit?"#22c55e08":"#0f172a",border:`1px solid ${crit?"#22c55e40":"#1e293b"}`,borderRadius:12,padding:"12px 14px",marginBottom:8}),
    painLevel:(l)=>l==="high"?"#ef4444":l==="moderate"?"#f59e0b":"#3b82f6",
    row2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8},
  };

  // ─── FULL DISCLAIMER MODAL ───────────────────────────────────────────────
  if(showDisclaimer){
    return(
      <div style={s.app}>
        <div style={{padding:24,minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center"}}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{fontSize:60,lineHeight:1,marginBottom:8}}>⚡</div>
            <div style={{fontSize:28,fontWeight:800,color:"#22c55e",letterSpacing:-0.5}}>Svastra</div>
            <div style={{fontSize:11,color:"#64748b",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>One Connection for Better Health</div>
          </div>

          <div style={{background:"#1a0a00",border:"1px solid #f59e0b40",borderLeft:"4px solid #f59e0b",borderRadius:12,padding:"16px 18px",marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#f59e0b",marginBottom:10}}>⚠️ Medical Disclaimer — Please Read</div>
            <ul style={{paddingLeft:18,color:"#94a3b8",fontSize:13,lineHeight:2}}>
              <li>All workouts and meal plans are <strong style={{color:"#f59e0b"}}>AI-generated</strong> and not medically vetted.</li>
              <li>This app does <strong style={{color:"#f59e0b"}}>NOT replace</strong> a doctor, physiotherapist, or registered dietitian.</li>
              <li>Always <strong style={{color:"#f59e0b"}}>consult your doctor</strong> before starting — especially with knee pain, back pain, and triglyceride conditions.</li>
              <li>Stop immediately if you feel pain, dizziness, or chest discomfort.</li>
              <li>AI Coach responses are suggestions only — not medical advice.</li>
            </ul>
          </div>

          <button onClick={()=>{ setShowDisclaimer(false); LS.set("vyp_disc_full",true); }}
            style={{...s.btn("#22c55e"),width:"100%",padding:"14px",fontSize:15,borderRadius:12}}>
            I Understand — Enter Svastra ✓
          </button>
          <p style={{textAlign:"center",fontSize:11,color:"#334155",marginTop:12}}>You can review this disclaimer anytime in Settings</p>
        </div>
      </div>
    );
  }

  return(
    <div style={s.app}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={s.appName}>Svastra</div>
            <div style={s.tagline}>One Connection for Better Health</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,fontWeight:600,color:"#22c55e"}}>{progress}% to goal</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div>
          </div>
        </div>
        <div style={{marginTop:10,padding:"10px 14px",background:"#020818",borderRadius:10,borderLeft:"3px solid #22c55e"}}>
          <div style={{fontSize:11,color:"#22c55e",fontWeight:600,letterSpacing:0.5,marginBottom:3}}>💭 THOUGHT OF THE DAY</div>
          <div style={{fontSize:12,color:"#94a3b8",lineHeight:1.5,fontStyle:"italic"}}>"{getQuote()}"</div>
        </div>
        {/* AI disclaimer strip */}
        <div style={{marginTop:8,padding:"6px 12px",background:"#f59e0b08",border:"1px solid #f59e0b20",borderRadius:8,display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:11}}>⚠️</span>
          <span style={{fontSize:11,color:"#f59e0b",opacity:0.8}}>AI-generated plans — not medical advice. Consult your doctor.</span>
          <button onClick={()=>setShowDisclaimer(true)} style={{marginLeft:"auto",background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:10,textDecoration:"underline"}}>View full</button>
        </div>
      </div>

      {/* TABS */}
      <div style={s.tabs}>
        {TABS.map(t=>(
          <button key={t.id} style={s.tab(tab===t.id)} onClick={()=>setTab(t.id)}>
            <span style={{fontSize:16}}>{t.icon}</span>
            <span style={{fontSize:9}}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={s.content}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <div>
            <DisclaimerBanner/>
            <div style={s.grid}>
              <MetricCard value={`${lw}kg`} label="Current Weight" color="#22c55e" sub={`Started: ${SW}kg`}/>
              <MetricCard value={currBMI} label="BMI" color={+currBMI<25?"#22c55e":+currBMI<30?"#f59e0b":"#ef4444"} sub="Healthy: 18.5–24.9"/>
              <MetricCard value={`-${lostLbs>0?lostLbs:0}lbs`} label="Lost So Far" color={lostLbs>0?"#22c55e":"#64748b"}/>
              <MetricCard value={`${rem}kg`} label="To Goal" color="#f59e0b" sub={`Goal: ${GW}kg`}/>
            </div>

            <div style={s.card}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:12,color:"#64748b"}}>
                <span>Start: {SW}kg</span><span>Goal: {GW}kg</span>
              </div>
              <PBar value={progress} color="#22c55e" h={8}/>
              <div style={{fontSize:11,color:"#64748b",marginTop:6}}>{progress}% complete — {rem}kg remaining</div>
            </div>

            <div style={s.cardAccent(todayPlan.color)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{todayPlan.icon} Today — {TODAY}</div>
                  <div style={{fontSize:12,color:todayPlan.color}}>{todayPlan.label}</div>
                </div>
                {!todayPlan.rest&&<Badge color={todayPlan.color}>{todayDone}/{todayPlan.exercises.length} done</Badge>}
              </div>
              {!todayPlan.rest&&(
                <>
                  <PBar value={Math.round(todayDone/todayPlan.exercises.length*100)} color={todayPlan.color}/>
                  <button style={{...s.btn(todayPlan.color),marginTop:10,fontSize:12}} onClick={()=>setTab("workout")}>Open Today's Workout →</button>
                </>
              )}
              {todayPlan.rest&&<div style={{fontSize:12,color:"#64748b"}}>Recovery day — stretch, hydrate and eat well! 🛌</div>}
            </div>

            <div style={s.card}>
              <SecTitle>Today's Supplements</SecTitle>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {SUPPLEMENTS.map(sup=>{
                  const key=`${dk}-${sup.id}`; const done=!!supDone[key];
                  return(
                    <div key={sup.id} onClick={()=>toggleSup(key)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${done?"#22c55e":"#1e293b"}`,background:done?"#22c55e15":"#020818",cursor:"pointer",fontSize:12,color:done?"#22c55e":"#94a3b8",display:"flex",alignItems:"center",gap:6,transition:"all 0.2s"}}>
                      <span>{sup.emoji}</span>
                      <span style={{textDecoration:done?"line-through":"none"}}>{sup.name}</span>
                      {done&&<span>✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={s.card}>
              <SecTitle>Active Health Flags</SecTitle>
              {PAIN_POINTS.slice(0,4).map(p=>(
                <div key={p.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #0f172a"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:500}}>{p.label}</div>
                    <div style={{fontSize:11,color:"#64748b"}}>{p.tip}</div>
                  </div>
                  <Badge color={s.painLevel(p.level)}>{p.level}</Badge>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <SecTitle>Daily Nutrition Targets</SecTitle>
              <div style={s.grid}>
                <MetricCard value="1,650" label="kcal / day" color="#22c55e"/>
                <MetricCard value="130g" label="Protein" color="#3b82f6"/>
                <MetricCard value="155g" label="Carbs" color="#f59e0b"/>
                <MetricCard value="55g" label="Fats" color="#a855f7"/>
              </div>
            </div>

            {/* AI Chat CTA */}
            <div style={{...s.cardAccent("#22c55e"),cursor:"pointer"}} onClick={()=>setTab("coach")}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:32}}>🤖</span>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:"#22c55e"}}>Ask Your AI Coach</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Get personalised advice based on your exact profile →</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── WORKOUT ── */}
        {tab==="workout"&&(
          <div>
            <DisclaimerBanner/>
            <div style={s.card}>
              <SecTitle>Weekly Split</SecTitle>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:4,marginBottom:16}}>
                {WEEK_PLAN.map(d=>(
                  <div key={d.day} style={s.dayBtn(d)} onClick={()=>setSelectedDay(d.day)}>
                    <div style={{fontWeight:600}}>{d.day}</div>
                    <div style={{fontSize:9,marginTop:2,opacity:0.8}}>{d.icon}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{selPlan.icon} {selectedDay}{selectedDay===TODAY?" (Today)":""}</div>
                  <div style={{fontSize:12,color:selPlan.color}}>{selPlan.label}</div>
                </div>
                {!selPlan.rest&&<button style={{...s.btn(selPlan.color),fontSize:11,padding:"6px 12px"}} onClick={()=>logWorkout(selectedDay)}>Log Session</button>}
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                {selPlan.muscles.map(m=><span key={m} style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:selPlan.color+"15",color:selPlan.color}}>{m}</span>)}
              </div>
            </div>

            {selPlan.warmup.length>0&&(
              <div style={s.cardAccent("#f59e0b")}>
                <SecTitle>🔥 Warm-Up</SecTitle>
                {selPlan.warmup.map((w,i)=><div key={i} style={{fontSize:13,padding:"5px 0",borderBottom:"1px solid #1e293b",color:"#94a3b8"}}>• {w}</div>)}
              </div>
            )}

            <div style={s.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <SecTitle style={{margin:0}}>{selPlan.rest?"REST":"Exercises"}</SecTitle>
                {!selPlan.rest&&<Badge color={selPlan.color}>{selPlan.exercises.filter((_,i)=>exDone[`${selectedDay}-${i}`]).length}/{selPlan.exercises.length}</Badge>}
              </div>
              {selPlan.exercises.map((ex,i)=>{
                const key=`${selectedDay}-${i}`;
                const done=!!exDone[key];
                return(
                  <div key={i} onClick={()=>!selPlan.rest&&toggleEx(key)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #0f172a",cursor:selPlan.rest?"default":"pointer",opacity:done?0.5:1}}>
                    {!selPlan.rest&&(
                      <div style={{width:20,height:20,borderRadius:6,border:`1.5px solid ${done?selPlan.color:"#334155"}`,background:done?selPlan.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {done&&<span style={{color:"#020818",fontSize:12,fontWeight:900}}>✓</span>}
                      </div>
                    )}
                    <span style={{fontSize:13,textDecoration:done?"line-through":"none",color:done?"#475569":"#e2e8f0"}}>{ex}</span>
                  </div>
                );
              })}
            </div>

            {selPlan.cooldown.length>0&&(
              <div style={s.cardAccent("#06b6d4")}>
                <SecTitle>❄️ Cool-Down</SecTitle>
                {selPlan.cooldown.map((c,i)=><div key={i} style={{fontSize:13,padding:"5px 0",borderBottom:"1px solid #1e293b",color:"#94a3b8"}}>• {c}</div>)}
              </div>
            )}
          </div>
        )}

        {/* ── DIET ── */}
        {tab==="diet"&&(
          <div>
            <DisclaimerBanner/>
            <div style={s.card}>
              <SecTitle>Daily Targets</SecTitle>
              <div style={s.grid}>
                <MetricCard value="1,650" label="Total kcal" color="#22c55e"/>
                <MetricCard value="130g" label="Protein" color="#3b82f6"/>
                <MetricCard value="155g" label="Carbs" color="#f59e0b"/>
                <MetricCard value="55g" label="Fats" color="#a855f7"/>
              </div>
            </div>
            {MEALS.map(meal=>(
              <div key={meal.label} style={s.mealCard(meal.critical)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div>
                    <span style={{fontSize:14,fontWeight:600}}>{meal.emoji} {meal.label}</span>
                    {meal.critical&&<Badge color="#22c55e" style={{marginLeft:6}}>⚡ CRITICAL</Badge>}
                    <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{meal.time}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#22c55e"}}>{meal.cal} kcal</div>
                    <div style={{fontSize:10,color:"#475569"}}>{meal.protein}g protein</div>
                  </div>
                </div>
                {meal.items.map(item=><div key={item} style={{fontSize:12,color:"#94a3b8",padding:"3px 0",borderBottom:"1px solid #0f172a"}}>• {item}</div>)}
                <div style={{display:"flex",gap:12,marginTop:8,fontSize:11,color:"#475569"}}>
                  <span>Carbs: {meal.carbs}g</span><span>Fat: {meal.fat}g</span>
                </div>
              </div>
            ))}
            <div style={s.card}>
              <SecTitle>Portion Guide</SecTitle>
              {[["Protein (chicken/fish)","1 palm size","🤚"],["Rice / carbs","1 fist","✊"],["Vegetables","2 fists","✊✊"],["Fats (nuts/oil)","1 thumb","👍"],["Fruits","1 fist","✊"]].map(([f,p,e])=>(
                <div key={f} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #0f172a",fontSize:13}}>
                  <span style={{color:"#94a3b8"}}>{f}</span>
                  <span>{e} <span style={{color:"#22c55e",fontWeight:600}}>{p}</span></span>
                </div>
              ))}
            </div>
            <div style={{...s.card,background:"#0a1a0a",border:"1px solid #22c55e20"}}>
              <SecTitle>Rules for High Triglycerides</SecTitle>
              {["❌ No sugar, sweets, or desserts","❌ No white rice, white bread, maida","❌ No fried food","❌ No alcohol","✅ Fish 3–4 times/week (steelhead!)","✅ Olive oil instead of vegetable oil","✅ Walnuts daily for Omega 3"].map((r,i)=>(
                <div key={i} style={{fontSize:13,padding:"5px 0",borderBottom:"1px solid #0f172a",color:r.startsWith("✅")?"#22c55e":"#94a3b8"}}>{r}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROGRESS ── */}
        {tab==="progress"&&(
          <div>
            <div style={s.card}>
              <SecTitle>Log Today's Vitals</SecTitle>
              <div style={s.row2}>
                {[["weight","Weight (kg)"],["sleep","Sleep (hrs)"],["water","Water (L)"],["steps","Steps"]].map(([f,l])=>(
                  <div key={f}>
                    <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>{l}</div>
                    <input value={newVital[f]} onChange={e=>setNewVital(v=>({...v,[f]:e.target.value}))} style={s.inp} placeholder={f==="weight"?"87.0":f==="sleep"?"7.5":f==="water"?"3.0":"6000"} type="number"/>
                  </div>
                ))}
              </div>
              <div style={{marginTop:8}}>
                <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Mood</div>
                <div style={{display:"flex",gap:8}}>
                  {["😞","😕","😐","🙂","😄"].map((m,i)=>(
                    <button key={i} onClick={()=>setNewVital(v=>({...v,mood:String(i)}))} style={{fontSize:20,background:"none",border:`1px solid ${newVital.mood===String(i)?"#22c55e":"#1e293b"}`,borderRadius:8,padding:"5px 8px",cursor:"pointer",opacity:newVital.mood===String(i)?1:0.5}}>{m}</button>
                  ))}
                </div>
              </div>
              <button style={{...s.btn(),marginTop:12,width:"100%"}} onClick={saveVital}>Save Today's Entry ✓</button>
            </div>

            <div style={s.card}>
              <SecTitle>Weight Roadmap</SecTitle>
              {ROADMAP.map(r=>(
                <div key={r.w} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
                    <span style={{color:"#94a3b8"}}>{r.w}</span>
                    <span style={{color:"#22c55e",fontWeight:600}}>-{r.tot}</span>
                  </div>
                  <PBar value={r.pct*(progress/100)} color="#22c55e"/>
                  <div style={{fontSize:11,color:"#475569",marginTop:2}}>{r.note}</div>
                </div>
              ))}
            </div>

            {vitals.length>0&&(
              <div style={s.card}>
                <SecTitle>Vitals History</SecTitle>
                {[...vitals].reverse().slice(0,10).map((v,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #0f172a",fontSize:12}}>
                    <span style={{color:"#64748b"}}>{v.date}</span>
                    <div style={{display:"flex",gap:10}}>
                      {v.weight&&<span style={{color:"#22c55e"}}>{v.weight}kg</span>}
                      {v.sleep&&<span style={{color:"#3b82f6"}}>{v.sleep}h sleep</span>}
                      {v.mood!==undefined&&<span>{["😞","😕","😐","🙂","😄"][parseInt(v.mood)]}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SUPPLEMENTS ── */}
        {tab==="supplements"&&(
          <div>
            <div style={s.card}>
              <SecTitle>Today's Checklist</SecTitle>
              {SUPPLEMENTS.map(sup=>{
                const key=`${dk}-${sup.id}`; const done=!!supDone[key];
                return(
                  <div key={sup.id} onClick={()=>toggleSup(key)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #0f172a",opacity:done?0.4:1,cursor:"pointer"}}>
                    <div style={{width:22,height:22,borderRadius:6,border:`1.5px solid ${done?"#22c55e":"#334155"}`,background:done?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {done&&<span style={{color:"#020818",fontSize:13,fontWeight:900}}>✓</span>}
                    </div>
                    <span style={{fontSize:18}}>{sup.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,display:"flex",gap:6,alignItems:"center"}}>
                        {sup.name} {sup.urgent&&<Badge color="#ef4444">URGENT</Badge>}
                      </div>
                      <div style={{fontSize:11,color:"#64748b"}}>{sup.dose} · {sup.time}</div>
                    </div>
                    {done&&<Badge color="#22c55e">✓ Done</Badge>}
                  </div>
                );
              })}
            </div>
            <div style={s.card}>
              <SecTitle>Why Each Matters</SecTitle>
              {SUPPLEMENTS.map(sup=>(
                <div key={sup.name} style={{padding:"10px 0",borderBottom:"1px solid #0f172a"}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>{sup.emoji} {sup.name}</div>
                  <div style={{fontSize:12,color:"#64748b"}}>{sup.why}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GOALS ── */}
        {tab==="goals"&&(
          <div>
            <div style={s.card}>
              <SecTitle>Your Goals</SecTitle>
              {GOALS_LIST.map(g=>(
                <div key={g.title} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid #0f172a",alignItems:"center"}}>
                  <span style={{fontSize:22}}>{g.emoji}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>{g.title}</div>
                    <div style={{fontSize:12,color:"#64748b"}}>{g.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={s.card}>
              <SecTitle>Active Pain Points</SecTitle>
              {PAIN_POINTS.map(p=>(
                <div key={p.label} style={{padding:"10px 0",borderBottom:"1px solid #0f172a"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600}}>{p.label}</span>
                    <Badge color={s.painLevel(p.level)}>{p.level}</Badge>
                  </div>
                  <div style={{fontSize:12,color:"#64748b"}}>{p.tip}</div>
                </div>
              ))}
            </div>
            <div style={s.card}>
              <SecTitle>10 Golden Rules</SecTitle>
              {RULES.map((r,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"1px solid #0f172a",fontSize:13}}>
                  <span style={{color:"#22c55e",fontWeight:700,minWidth:20}}>{i+1}.</span>
                  <span style={{color:"#94a3b8"}}>{r}</span>
                </div>
              ))}
            </div>
            <div style={s.card}>
              <SecTitle>Your Profile</SecTitle>
              {[["Age","39"],["Height","5'10\""],["Start Weight","87 kg"],["Goal Weight","80 kg"],["Start Date","April 14, 2025"],["Goal Date","July 2025"],["BMI Start","27.5"],["BMI Goal","25.3"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #0f172a",fontSize:13}}>
                  <span style={{color:"#64748b"}}>{k}</span>
                  <span style={{fontWeight:600,color:"#22c55e"}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOG ── */}
        {tab==="log"&&(
          <div>
            <div style={s.card}>
              <SecTitle>Workout History</SecTitle>
              {workoutLog.length===0?(
                <div style={{color:"#64748b",fontSize:13,padding:"16px 0"}}>No sessions logged yet. Complete a workout and tap "Log Session"!</div>
              ):(
                workoutLog.map((w,i)=>{
                  const plan=WEEK_PLAN.find(d=>d.day===w.day);
                  return(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #0f172a"}}>
                      <div style={{fontSize:22}}>{plan?.icon||"💪"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600}}>{w.label}</div>
                        <div style={{fontSize:11,color:"#64748b"}}>{w.date}</div>
                      </div>
                      <Badge color={plan?.color||"#22c55e"}>✓ Done</Badge>
                    </div>
                  );
                })
              )}
            </div>
            <div style={s.card}>
              <SecTitle>Journey Since April 14</SecTitle>
              {[...JOURNEY_LOG].reverse().map(([date,workout,status])=>(
                <div key={date} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #0f172a"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:500}}>{date}</div>
                    <div style={{fontSize:11,color:"#64748b"}}>{workout}</div>
                  </div>
                  <span style={{fontSize:16}}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI COACH ── */}
        {tab==="coach"&&<AICoach/>}

      </div>
    </div>
  );
}
