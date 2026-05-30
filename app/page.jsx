"use client";
import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

const STORAGE_KEY = "forge_v4";

// ─── Default Data ───────────────────────────────────────────────────────────
const DEFAULT_PLAN = [
  { id: 1, day: "Monday", name: "Push Day", exercises: [
    { id: 1, name: "Bench Press", sets: 4, targetReps: 8, muscleGroup: "Chest" },
    { id: 2, name: "Overhead Press", sets: 3, targetReps: 10, muscleGroup: "Shoulders" },
    { id: 3, name: "Incline Dumbbell Press", sets: 3, targetReps: 12, muscleGroup: "Chest" },
    { id: 4, name: "Tricep Pushdowns", sets: 3, targetReps: 15, muscleGroup: "Triceps" },
  ]},
  { id: 2, day: "Wednesday", name: "Pull Day", exercises: [
    { id: 1, name: "Deadlift", sets: 4, targetReps: 5, muscleGroup: "Back" },
    { id: 2, name: "Pull-Ups", sets: 3, targetReps: 8, muscleGroup: "Back" },
    { id: 3, name: "Barbell Row", sets: 3, targetReps: 10, muscleGroup: "Back" },
    { id: 4, name: "Bicep Curls", sets: 3, targetReps: 12, muscleGroup: "Biceps" },
  ]},
  { id: 3, day: "Friday", name: "Leg Day", exercises: [
    { id: 1, name: "Squat", sets: 4, targetReps: 8, muscleGroup: "Quads" },
    { id: 2, name: "Romanian Deadlift", sets: 3, targetReps: 10, muscleGroup: "Hamstrings" },
    { id: 3, name: "Leg Press", sets: 3, targetReps: 12, muscleGroup: "Quads" },
    { id: 4, name: "Calf Raises", sets: 4, targetReps: 20, muscleGroup: "Calves" },
  ]},
];

const ACTIVITY_LEVELS = [
  { label: "Sedentary", desc: "Little/no exercise", factor: 1.2 },
  { label: "Lightly Active", desc: "1–3 days/week", factor: 1.375 },
  { label: "Moderately Active", desc: "3–5 days/week", factor: 1.55 },
  { label: "Very Active", desc: "6–7 days/week", factor: 1.725 },
  { label: "Extra Active", desc: "Athlete/physical job", factor: 1.9 },
];
const GOALS = [{ label: "Lose Weight", adj: -500 }, { label: "Maintain", adj: 0 }, { label: "Build Muscle", adj: 300 }];
const COMMON_FOODS = [
  { name: "Chicken Breast (100g)", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "White Rice (100g)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Whole Egg", calories: 78, protein: 6, carbs: 0.6, fat: 5 },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: "Oats (100g)", calories: 389, protein: 17, carbs: 66, fat: 7 },
  { name: "Salmon (100g)", calories: 208, protein: 20, carbs: 0, fat: 13 },
];
const MUSCLE_GROUPS = ["Chest","Back","Shoulders","Biceps","Triceps","Quads","Hamstrings","Glutes","Calves","Core","Traps","Forearms"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getLast7() {
  return Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().split("T")[0]; });
}
function todayStr() { return new Date().toISOString().split("T")[0]; }

// ─── AI Helper ──────────────────────────────────────────────────────────────
async function callAI(prompt, systemPrompt = "") {
  const messages = [{ role: "user", content: prompt }];
  const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, messages };
  if (systemPrompt) body.system = systemPrompt;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  });
  const data = await res.json();
  return data.content?.map(b => b.text||"").join("") || "";
}

async function aiJSON(prompt, system = "") {
  const raw = await callAI(prompt, system + " Respond ONLY with valid JSON, no markdown, no backticks, no explanation.");
  try { return JSON.parse(raw.replace(/```json|```/g,"")); } catch { return null; }
}

// ─── Bulk Parser ─────────────────────────────────────────────────────────────
function parseBulk(text) {
  const lines = text.split("\n").map(l=>l.trim()).filter(Boolean);
  const workouts = []; let cur = null; let eid = 1;
  for (const line of lines) {
    if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|day\s*\d+)/i.test(line)||(line.endsWith(":")||line.match(/^[A-Z][^a-z]*$/)&&line.length<40)) {
      const p = line.replace(/:$/,"").split(/[-–:]/);
      cur = { id: Date.now()+workouts.length, day:p[0].trim(), name:(p[1]||p[0]).trim(), exercises:[] }; eid=1; workouts.push(cur); continue;
    }
    if (!cur) { cur={id:Date.now(),day:"Day 1",name:"Workout",exercises:[]}; workouts.push(cur); }
    const m = line.match(/^([A-Za-z\s()\/]+?)\s*[-–]?\s*(\d+)\s*[xX×]\s*(\d+)/);
    const sm = line.match(/(\d+)\s*sets?\s*(?:x|of|×)?\s*(\d+)\s*reps?/i);
    if (m) cur.exercises.push({id:eid++,name:m[1].trim(),sets:parseInt(m[2]),targetReps:parseInt(m[3]),muscleGroup:""});
    else if (sm) { const n=line.replace(sm[0],"").replace(/^[-–\s]+|[-–\s]+$/g,"").trim(); if(n) cur.exercises.push({id:eid++,name:n,sets:parseInt(sm[1]),targetReps:parseInt(sm[2]),muscleGroup:""}); }
    else if (line.match(/^[A-Za-z]/)) cur.exercises.push({id:eid++,name:line.replace(/[*•\-–]/g,"").trim(),sets:3,targetReps:10,muscleGroup:""});
  }
  return workouts.filter(w=>w.exercises.length>0);
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const ChartTip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  return <div style={{background:"#111118",border:"1px solid #2a2a3a",borderRadius:4,padding:"8px 12px",fontSize:11}}>{label&&<div style={{color:"#555",marginBottom:3}}>{label}</div>}{payload.map((p,i)=><div key={i} style={{color:p.color||"#d4ff00"}}>{p.name}: <b>{p.value}{p.unit||""}</b></div>)}</div>;
};

// ─── MUSCLE HEATMAP SVG ───────────────────────────────────────────────────────
function MuscleHeatmap({ recentMuscles }) {
  const intensity = (group) => {
    const hits = recentMuscles[group] || 0;
    if (hits === 0) return "#1e1e2e";
    if (hits === 1) return "#4ade8055";
    if (hits === 2) return "#facc1588";
    return "#ef444488";
  };
  const label = (group) => {
    const hits = recentMuscles[group] || 0;
    if (hits === 0) return "Recovered";
    if (hits === 1) return "Trained";
    if (hits === 2) return "Fatigued";
    return "Overtrained";
  };
  const groups = [
    ["Chest","#d4ff00"],["Back","#d4ff00"],["Shoulders","#d4ff00"],["Biceps","#d4ff00"],
    ["Triceps","#d4ff00"],["Quads","#d4ff00"],["Hamstrings","#d4ff00"],["Glutes","#d4ff00"],
    ["Calves","#d4ff00"],["Core","#d4ff00"],["Traps","#d4ff00"],["Forearms","#d4ff00"]
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
      {groups.map(([g]) => (
        <div key={g} style={{background:intensity(g),border:"1px solid #2a2a3a",borderRadius:6,padding:"10px 12px",textAlign:"center",transition:"all .3s"}}>
          <div style={{fontSize:11,fontWeight:500}}>{g}</div>
          <div style={{fontSize:9,color:"#aaa",marginTop:3}}>{label(g)}</div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("home");
  const [workoutPlan, setWorkoutPlan] = useState(DEFAULT_PLAN);
  const [workoutLogs, setWorkoutLogs] = useState({});
  const [workoutNotes, setWorkoutNotes] = useState({});
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [calorieLog, setCalorieLog] = useState([]);
  const [bodyLog, setBodyLog] = useState([]);
  const [recoveryLog, setRecoveryLog] = useState({});
  const [weeklyCheckins, setWeeklyCheckins] = useState([]);
  const [calc, setCalc] = useState({age:"",gender:"male",weight:"",height:"",activity:1.55,goal:0});
  const [calcResult, setCalcResult] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [mealPlanPrefs, setMealPlanPrefs] = useState("");
  const [mealLoading, setMealLoading] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [progressModal, setProgressModal] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [importMode, setImportMode] = useState("replace");
  const [quickAddEx, setQuickAddEx] = useState(null);
  const [quickDraft, setQuickDraft] = useState({name:"",sets:3,targetReps:10,muscleGroup:""});
  const [newWeight, setNewWeight] = useState("");
  const [aiGenLoading, setAiGenLoading] = useState(false);
  const [aiGenForm, setAiGenForm] = useState({goal:"Build Muscle",days:"3",equipment:"Full gym",experience:"Intermediate",injuries:"None",notes:""});
  const [showAIGen, setShowAIGen] = useState(false);
  const [bodyImages, setBodyImages] = useState([]);
  const [bodyAnalysis, setBodyAnalysis] = useState(null);
  const [bodyAnalysisLoading, setBodyAnalysisLoading] = useState(false);
  const [checkinForm, setCheckinForm] = useState({weight:"",mood:3,energy:3,soreness:3,adherence:3,notes:""});
  const [checkinAI, setCheckinAI] = useState(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [customFood, setCustomFood] = useState({name:"",calories:"",protein:"",carbs:"",fat:""});
  const bodyImgRef = useRef();
  const barcodeVideoRef = useRef();
  const barcodeStreamRef = useRef(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerState, setScannerState] = useState("idle"); // idle | scanning | found | error | manual
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannedFood, setScannedFood] = useState(null);
  const [scanServing, setScanServing] = useState(100);
  const today = todayStr();

  // ── Persist ────────────────────────────────────────────────────────────────
  useEffect(()=>{
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
      if(d.workoutPlan) setWorkoutPlan(d.workoutPlan);
      if(d.workoutLogs) setWorkoutLogs(d.workoutLogs);
      if(d.workoutNotes) setWorkoutNotes(d.workoutNotes);
      if(d.calorieLog) setCalorieLog(d.calorieLog);
      if(d.bodyLog) setBodyLog(d.bodyLog);
      if(d.recoveryLog) setRecoveryLog(d.recoveryLog);
      if(d.weeklyCheckins) setWeeklyCheckins(d.weeklyCheckins);
      if(d.calc) setCalc(c=>({...c,...d.calc}));
      if(d.calcResult) setCalcResult(d.calcResult);
      if(d.mealPlan) setMealPlan(d.mealPlan);
      if(d.bodyImages) setBodyImages(d.bodyImages);
      if(d.bodyAnalysis) setBodyAnalysis(d.bodyAnalysis);
    } catch {}
  },[]);
  useEffect(()=>{
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({workoutPlan,workoutLogs,workoutNotes,calorieLog,bodyLog,recoveryLog,weeklyCheckins,calc,calcResult,mealPlan,bodyImages,bodyAnalysis})); } catch {}
  },[workoutPlan,workoutLogs,workoutNotes,calorieLog,bodyLog,recoveryLog,weeklyCheckins,calc,calcResult,mealPlan,bodyImages,bodyAnalysis]);

  // ── Calorie helpers ────────────────────────────────────────────────────────
  const todayCals = calorieLog.filter(e=>e.date===today).reduce((s,e)=>s+e.calories,0);
  const todayP = calorieLog.filter(e=>e.date===today).reduce((s,e)=>s+(e.protein||0),0);
  const todayC = calorieLog.filter(e=>e.date===today).reduce((s,e)=>s+(e.carbs||0),0);
  const todayF = calorieLog.filter(e=>e.date===today).reduce((s,e)=>s+(e.fat||0),0);
  const weekCalData = getLast7().map(date=>({label:DAYS_SHORT[new Date(date+"T12:00:00").getDay()],calories:calorieLog.filter(e=>e.date===date).reduce((s,e)=>s+e.calories,0)}));

  // ── Workout helpers ────────────────────────────────────────────────────────
  function updSet(wId,exId,si,field,val){const key=`${wId}-${today}`;setWorkoutLogs(p=>{const l=p[key]?JSON.parse(JSON.stringify(p[key])):{};if(!l[exId])l[exId]={};if(!l[exId][si])l[exId][si]={};l[exId][si][field]=val;return{...p,[key]:l}});}
  function getSetV(wId,exId,si,field){return workoutLogs[`${wId}-${today}`]?.[exId]?.[si]?.[field]??"";}
  function toggleDone(wId,exId,si){const key=`${wId}-${today}`;setWorkoutLogs(p=>{const l=p[key]?JSON.parse(JSON.stringify(p[key])):{};if(!l[exId])l[exId]={};if(!l[exId][si])l[exId][si]={};l[exId][si].done=!l[exId][si].done;return{...p,[key]:l}});}
  function getNote(wId){return workoutNotes[`${wId}-${today}`]||"";}
  function setNote(wId,val){setWorkoutNotes(p=>({...p,[`${wId}-${today}`]:val}));}

  // ── Progressive Overload suggestion ───────────────────────────────────────
  function getOverloadSuggestion(wId, exId) {
    const entries = Object.entries(workoutLogs)
      .filter(([k])=>k.startsWith(`${wId}-`))
      .sort(([a],[b])=>b.localeCompare(a));
    if (entries.length < 1) return null;
    const lastKey = entries[0][0];
    const lastLog = entries[0][1][exId];
    if (!lastLog) return null;
    const sets = Object.values(lastLog);
    const weights = sets.map(s=>parseFloat(s.weight)).filter(Boolean);
    const reps = sets.map(s=>parseInt(s.reps)).filter(Boolean);
    const allDone = sets.every(s=>s.done);
    if (!weights.length) return null;
    const maxW = Math.max(...weights);
    const avgReps = reps.length ? Math.round(reps.reduce((a,b)=>a+b,0)/reps.length) : 0;
    const workout = workoutPlan.find(w=>w.id===wId);
    const ex = workout?.exercises.find(e=>e.id===exId);
    if (!ex) return null;
    if (allDone && avgReps >= ex.targetReps) {
      const inc = maxW >= 100 ? 2.5 : 2.5;
      return { suggestion:`Try ${maxW+inc}kg`, reason:`Hit ${avgReps} reps at ${maxW}kg last session ✓`, bump: maxW+inc };
    }
    if (avgReps < ex.targetReps - 2) return { suggestion:`Stay at ${maxW}kg`, reason:`Reps below target — consolidate first`, bump: maxW };
    return { suggestion:`Maintain ${maxW}kg`, reason:`Good progress — aim to complete all sets`, bump: maxW };
  }

  // ── Progress chart data ────────────────────────────────────────────────────
  function getProgressData(wId,exId){
    return Object.entries(workoutLogs).filter(([k])=>k.startsWith(`${wId}-`)).map(([k,log])=>{
      const date=k.replace(`${wId}-`,""); const sets=log[exId]; if(!sets) return null;
      const ws=Object.values(sets).map(s=>parseFloat(s.weight)).filter(Boolean);
      return ws.length?{date,label:date.slice(5),weight:Math.max(...ws)}:null;
    }).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date)).slice(-12);
  }

  // ── PB Board ──────────────────────────────────────────────────────────────
  function getAllPBs(){
    const pbs={};
    for(const [key,log] of Object.entries(workoutLogs)){
      const [wIdStr,date]=key.split(/-(.+)/); const wId=parseInt(wIdStr);
      const workout=workoutPlan.find(w=>w.id===wId); if(!workout) continue;
      for(const [exIdStr,sets] of Object.entries(log)){
        const ex=workout.exercises.find(e=>e.id===parseInt(exIdStr)); if(!ex) continue;
        const ws=Object.values(sets).map(s=>parseFloat(s.weight)).filter(Boolean); if(!ws.length) continue;
        const max=Math.max(...ws);
        if(!pbs[ex.name]||max>pbs[ex.name].weight) pbs[ex.name]={weight:max,date,workoutName:workout.name};
      }
    }
    return Object.entries(pbs).map(([name,d])=>({name,...d})).sort((a,b)=>b.weight-a.weight);
  }

  // ── Recent muscle activity (for heatmap) ──────────────────────────────────
  function getRecentMuscles(){
    const result={}; const last7=getLast7();
    for(const workout of workoutPlan){
      for(const date of last7){
        const key=`${workout.id}-${date}`; const log=workoutLogs[key]; if(!log) continue;
        for(const ex of workout.exercises){
          if(!log[ex.id]||!ex.muscleGroup) continue;
          const hasSets=Object.values(log[ex.id]).some(s=>s.done||s.reps);
          if(hasSets) result[ex.muscleGroup]=(result[ex.muscleGroup]||0)+1;
        }
      }
    }
    return result;
  }

  // ── Weekly volume analytics ────────────────────────────────────────────────
  function getVolumeData(){
    return getLast7().map(date=>{
      let vol=0,sets=0;
      for(const w of workoutPlan){
        const log=workoutLogs[`${w.id}-${date}`]; if(!log) continue;
        for(const [,exLog] of Object.entries(log)){
          for(const set of Object.values(exLog)){
            if(set.done&&set.weight&&set.reps){vol+=parseFloat(set.weight)*parseInt(set.reps);sets++;}
          }
        }
      }
      return{label:DAYS_SHORT[new Date(date+"T12:00:00").getDay()],volume:Math.round(vol),sets};
    });
  }

  // ── 1RM estimate (Epley) ──────────────────────────────────────────────────
  function est1RM(weight,reps){ return reps===1?weight:Math.round(weight*(1+reps/30)); }

  // ── Editor helpers ────────────────────────────────────────────────────────
  function startEdit(w){setEditDraft(JSON.parse(JSON.stringify(w)));setEditingWorkout(w.id);}
  function saveEdit(){setWorkoutPlan(p=>p.map(w=>w.id===editDraft.id?editDraft:w));setEditingWorkout(null);setEditDraft(null);}
  function addExToDraft(){const id=Math.max(0,...editDraft.exercises.map(e=>e.id))+1;setEditDraft(d=>({...d,exercises:[...d.exercises,{id,name:"",sets:3,targetReps:10,muscleGroup:""}]}));}
  function updDraftEx(exId,field,val){setEditDraft(d=>({...d,exercises:d.exercises.map(e=>e.id===exId?{...e,[field]:val}:e)}));}
  function remFromDraft(exId){setEditDraft(d=>({...d,exercises:d.exercises.filter(e=>e.id!==exId)}));}

  // ── Quick add exercise ────────────────────────────────────────────────────
  function confirmQuickAdd(wId){
    if(!quickDraft.name.trim()) return;
    setWorkoutPlan(p=>p.map(w=>{
      if(w.id!==wId) return w;
      const newId=Math.max(0,...w.exercises.map(e=>e.id))+1;
      return{...w,exercises:[...w.exercises,{id:newId,name:quickDraft.name.trim(),sets:parseInt(quickDraft.sets)||3,targetReps:parseInt(quickDraft.targetReps)||10,muscleGroup:quickDraft.muscleGroup||""}]};
    }));
    setQuickAddEx(null); setQuickDraft({name:"",sets:3,targetReps:10,muscleGroup:""});
  }

  // ── Barcode Scanner ──────────────────────────────────────────────────────
  async function startCamera() {
    setScannerState("scanning");
    setScannedFood(null);
    setScannedBarcode("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } });
      barcodeStreamRef.current = stream;
      if (barcodeVideoRef.current) {
        barcodeVideoRef.current.srcObject = stream;
        barcodeVideoRef.current.play();
      }
      // Use BarcodeDetector if available (Chrome/Android), else fall back
      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({ formats: ["ean_13","ean_8","upc_a","upc_e","code_128","code_39"] });
        let detected = false;
        const scan = async () => {
          if (!barcodeVideoRef.current || detected) return;
          try {
            const codes = await detector.detect(barcodeVideoRef.current);
            if (codes.length > 0) {
              detected = true;
              const code = codes[0].rawValue;
              setScannedBarcode(code);
              stopCamera();
              await lookupBarcode(code);
              return;
            }
          } catch {}
          if (!detected) requestAnimationFrame(scan);
        };
        barcodeVideoRef.current.addEventListener("playing", () => requestAnimationFrame(scan), { once: true });
      } else {
        // Fallback: show manual entry after 3 seconds
        setTimeout(() => { if (scannerState === "scanning") setScannerState("manual"); }, 3000);
      }
    } catch (err) {
      setScannerState("error");
    }
  }

  function stopCamera() {
    if (barcodeStreamRef.current) {
      barcodeStreamRef.current.getTracks().forEach(t => t.stop());
      barcodeStreamRef.current = null;
    }
  }

  function closeScanner() {
    stopCamera();
    setShowScanner(false);
    setScannerState("idle");
    setScannedFood(null);
    setScannedBarcode("");
    setManualBarcode("");
    setScanServing(100);
  }

  async function lookupBarcode(code) {
    setScannerState("found");
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const n = p.nutriments;
        const per100 = (key) => parseFloat(n[key + "_100g"] ?? n[key] ?? 0) || 0;
        setScannedFood({
          name: p.product_name || p.generic_name || "Unknown product",
          brand: p.brands || "",
          calories: per100("energy-kcal"),
          protein: per100("proteins"),
          carbs: per100("carbohydrates"),
          fat: per100("fat"),
          fiber: per100("fiber"),
          per: "100g",
          barcode: code,
          image: p.image_front_small_url || null,
        });
        setScanServing(100);
      } else {
        setScannedFood({ notFound: true, barcode: code });
      }
    } catch {
      setScannedFood({ notFound: true, barcode: code });
    }
  }

  function logScannedFood() {
    if (!scannedFood || scannedFood.notFound) return;
    const ratio = scanServing / 100;
    setCalorieLog(p => [...p, {
      name: `${scannedFood.name}${scannedFood.brand ? ` (${scannedFood.brand})` : ""} – ${scanServing}g`,
      calories: Math.round(scannedFood.calories * ratio),
      protein: Math.round(scannedFood.protein * ratio * 10) / 10,
      carbs: Math.round(scannedFood.carbs * ratio * 10) / 10,
      fat: Math.round(scannedFood.fat * ratio * 10) / 10,
      date: today, id: Date.now(),
    }]);
    closeScanner();
  }

  // ── Import ────────────────────────────────────────────────────────────────
  function confirmImport(){
    if(!importPreview?.length) return;
    if(importMode==="replace") setWorkoutPlan(importPreview);
    else setWorkoutPlan(p=>[...p,...importPreview]);
    setShowImport(false); setImportText(""); setImportPreview(null);
  }

  // ── Calculator ────────────────────────────────────────────────────────────
  function runCalc(){
    const {age,gender,weight,height,activity,goal}=calc;
    if(!age||!weight||!height) return;
    const w=parseFloat(weight),h=parseFloat(height),a=parseInt(age);
    const bmr=gender==="male"?10*w+6.25*h-5*a+5:10*w+6.25*h-5*a-161;
    const tdee=Math.round(bmr*activity), target=tdee+GOALS[goal].adj;
    setCalcResult({bmr:Math.round(bmr),tdee,target,protein:Math.round(w*2.2),carbs:Math.round((target*0.4)/4),fat:Math.round((target*0.25)/9)});
  }

  // ── AI Meal Plan ──────────────────────────────────────────────────────────
  async function generateMealPlan(){
    if(!calcResult) return; setMealLoading(true);
    const plan=await aiJSON(`Create a 1-day meal plan for: ${calcResult.target}kcal target, ${calcResult.protein}g protein, ${calcResult.carbs}g carbs, ${calcResult.fat}g fat. Goal: ${GOALS[calc.goal].label}. Preferences: ${mealPlanPrefs||"none"}.
Return JSON: {"meals":[{"name":"Breakfast","time":"7:00 AM","foods":["item1"],"calories":400,"protein":30,"carbs":40,"fat":10,"notes":"tip"}],"totals":{"calories":2000,"protein":150,"carbs":200,"fat":65}}`);
    if(plan) setMealPlan(plan); setMealLoading(false);
  }

  // ── AI Workout Generator ──────────────────────────────────────────────────
  async function generateWorkout(){
    setAiGenLoading(true);
    const plan=await aiJSON(`Create a ${aiGenForm.days}-day workout program for: Goal=${aiGenForm.goal}, Equipment=${aiGenForm.equipment}, Experience=${aiGenForm.experience}, Injuries=${aiGenForm.injuries}, Notes=${aiGenForm.notes||"none"}.
Return JSON array: [{"id":1,"day":"Monday","name":"Push Day","exercises":[{"id":1,"name":"Bench Press","sets":4,"targetReps":8,"muscleGroup":"Chest"}]}]`);
    if(plan&&Array.isArray(plan)){setWorkoutPlan(plan);setShowAIGen(false);}
    setAiGenLoading(false);
  }

  // ── Body scan AI ──────────────────────────────────────────────────────────
  async function analyseBodyImage(base64, mediaType){
    setBodyAnalysisLoading(true);
    const res = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514", max_tokens:1000,
        system:"You are a certified fitness coach and body composition analyst. Analyse physique photos constructively and professionally. Respond ONLY with valid JSON, no markdown.",
        messages:[{role:"user",content:[
          {type:"image",source:{type:"base64",media_type:mediaType,data:base64}},
          {type:"text",text:`Analyse this physique photo and return JSON:
{"bodyFatEstimate":"15-18%","bodyFatCategory":"Athletic","primaryStrengths":["Good shoulder width","Visible abs"],"areasToFocus":["Hamstrings could be thicker","More glute development"],"posturalObservations":["Slight anterior pelvic tilt","Good upper back posture"],"recommendations":["Add 2x weekly hamstring focus","Hip flexor stretching daily"],"overallAssessment":"Brief 2-3 sentence assessment"}`}
        ]}]
      })
    });
    const data = await res.json();
    const text = data.content?.map(b=>b.text||"").join("")||"";
    try { setBodyAnalysis(JSON.parse(text.replace(/```json|```/g,""))); } catch {}
    setBodyAnalysisLoading(false);
  }

  function handleBodyImageUpload(e){
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(",")[1];
      const mediaType = file.type;
      setBodyImages(p=>[{url:dataUrl,date:today},...p].slice(0,6));
      await analyseBodyImage(base64, mediaType);
    };
    reader.readAsDataURL(file);
  }

  // ── Weekly check-in AI ────────────────────────────────────────────────────
  async function submitCheckin(){
    setCheckinLoading(true);
    const recent = weeklyCheckins.slice(-3);
    const prompt=`Weekly fitness check-in. Current weight: ${checkinForm.weight}kg, mood: ${checkinForm.mood}/5, energy: ${checkinForm.energy}/5, soreness: ${checkinForm.soreness}/5, adherence: ${checkinForm.adherence}/5. Notes: "${checkinForm.notes}". 
Previous check-ins: ${JSON.stringify(recent)}. Calorie target: ${calcResult?.target||"unknown"}kcal. Workout goal: ${GOALS[calc.goal].label}.
Give personalised, conversational coaching advice. Mention if weight change looks like water weight. Return JSON: {"headline":"Great week overall","bodyweightNote":"The 1kg gain is likely water...","recommendation":"Maintain current plan","adjustments":["Increase protein by 20g","Add one extra cardio session"],"readinessScore":78,"nextWeekFocus":"Focus on hitting protein targets"}`;
    const result = await aiJSON(prompt);
    if(result){
      setCheckinAI(result);
      setWeeklyCheckins(p=>[...p,{...checkinForm,date:today,aiSummary:result.headline}]);
      setCheckinForm({weight:"",mood:3,energy:3,soreness:3,adherence:3,notes:""});
    }
    setCheckinLoading(false);
  }

  // ── Readiness score (from recovery log) ───────────────────────────────────
  function getTodayReadiness(){
    const r = recoveryLog[today];
    if(!r) return null;
    return Math.round((r.sleep/10*40)+(r.energy/5*30)+((5-r.soreness)/5*30));
  }

  // ── Streak ────────────────────────────────────────────────────────────────
  function getStreak(){
    let streak=0; const d=new Date();
    while(true){
      const key=d.toISOString().split("T")[0];
      const trained=workoutPlan.some(w=>workoutLogs[`${w.id}-${key}`]);
      if(!trained) break; streak++; d.setDate(d.getDate()-1);
    }
    return streak;
  }

  const pbs = getAllPBs();
  const recentMuscles = getRecentMuscles();
  const volumeData = getVolumeData();
  const readiness = getTodayReadiness();
  const streak = getStreak();
  const latestWeight = bodyLog.length ? [...bodyLog].sort((a,b)=>a.date.localeCompare(b.date)).slice(-1)[0].weight : null;
  const caloriesLeft = calcResult ? Math.max(0, calcResult.target - todayCals) : null;

  const TABS = [
    {id:"home",icon:"⚡",label:"Home"},
    {id:"workout",icon:"🏋️",label:"Train"},
    {id:"progress",icon:"📈",label:"Progress"},
    {id:"pbs",icon:"🏆",label:"PBs"},
    {id:"calories",icon:"🥗",label:"Calories"},
    {id:"meals",icon:"🍽️",label:"Meals"},
    {id:"checkin",icon:"📋",label:"Check-In"},
    {id:"body",icon:"⚖️",label:"Body"},
    {id:"bodyscan",icon:"📷",label:"Scan"},
    {id:"recovery",icon:"🌙",label:"Recovery"},
    {id:"analytics",icon:"📊",label:"Analytics"},
    {id:"calculator",icon:"🔢",label:"Calc"},
  ];

  const C = {
    card: {background:"#111118",border:"1px solid #1e1e2e",borderRadius:8,padding:20},
    pill: {background:"#111827",border:"1px solid #1e1e2e",borderRadius:6,padding:"10px 14px",textAlign:"center"},
    label: {fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase",marginBottom:6},
  };

  return (
    <div style={{fontFamily:"'DM Mono','Courier New',monospace",background:"#0a0a0f",minHeight:"100vh",color:"#e8e4d9"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#d4ff00}
        input,select,textarea{background:#111827;border:1px solid #2a2a3a;color:#e8e4d9;padding:8px 12px;font-family:inherit;font-size:13px;border-radius:4px;outline:none}
        input{width:100%}input:focus,select:focus,textarea:focus{border-color:#d4ff00}
        textarea{width:100%;resize:vertical}
        .btn{background:#d4ff00;color:#0a0a0f;border:none;padding:10px 20px;font-family:inherit;font-size:13px;font-weight:500;border-radius:4px;cursor:pointer;transition:all .15s}
        .btn:hover{background:#bfe000;transform:translateY(-1px)}.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .ghost{background:transparent;border:1px solid #2a2a3a;color:#e8e4d9;padding:8px 16px;font-family:inherit;font-size:12px;border-radius:4px;cursor:pointer;transition:all .15s}
        .ghost:hover{border-color:#d4ff00;color:#d4ff00}
        .tag{display:inline-block;background:#d4ff0022;color:#d4ff00;border:1px solid #d4ff0044;font-size:10px;padding:2px 8px;border-radius:2px;letter-spacing:1px;text-transform:uppercase}
        .done-btn{width:28px;height:28px;border-radius:4px;border:2px solid #2a2a3a;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
        .done-btn.chk{background:#d4ff00;border-color:#d4ff00}
        .pbar{height:6px;background:#1e1e2e;border-radius:3px;overflow:hidden;margin-top:6px}
        .pfill{height:100%;border-radius:3px;transition:width .4s}
        .modal{position:fixed;inset:0;background:#000c;z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
        .hd{font-family:'Bebas Neue',sans-serif;letter-spacing:2px}
        .slider-row{display:flex;align-items:center;gap:12;margin-bottom:12px}
        input[type=range]{-webkit-appearance:none;height:4px;background:#2a2a3a;border-radius:2px;border:none;padding:0}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:#d4ff00;border-radius:50%;cursor:pointer}
      `}</style>

      {/* ── Header ── */}
      <div style={{borderBottom:"1px solid #1e1e2e",padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
        <div className="hd" style={{fontSize:26,color:"#d4ff00",letterSpacing:3}}>FORGE</div>
        <div style={{fontSize:10,color:"#333",letterSpacing:1,display:"flex",gap:16,marginLeft:"auto",alignItems:"center"}}>
          {readiness!=null&&<span style={{color:readiness>70?"#4ade80":readiness>40?"#facc15":"#ef4444"}}>↑{readiness} READY</span>}
          {streak>0&&<span style={{color:"#d4ff00"}}>🔥{streak}d</span>}
          <button className="ghost" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>setShowImport(true)}>⬆ Import</button>
          <button className="ghost" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>setShowAIGen(true)}>✨ AI Plan</button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{display:"flex",borderBottom:"1px solid #1e1e2e",overflowX:"auto",padding:"0 8px"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",color:tab===t.id?"#d4ff00":"#444",padding:"11px 12px",cursor:"pointer",fontSize:10,fontFamily:"inherit",borderBottom:tab===t.id?"2px solid #d4ff00":"2px solid transparent",whiteSpace:"nowrap",gap:4,display:"flex",alignItems:"center"}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:"18px 14px",maxWidth:860,margin:"0 auto"}}>

      {/* ════════════ HOME DASHBOARD ════════════ */}
      {tab==="home" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="hd" style={{fontSize:24}}>DAILY OVERVIEW</div>
          {/* KPI row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[
              ["CALORIES",caloriesLeft!=null?`${Math.round(caloriesLeft)} left`:"—","Run calculator first"],
              ["PROTEIN",`${Math.round(todayP)}g`,calcResult?`of ${calcResult.protein}g`:"—"],
              ["STREAK",streak?`${streak} days`:"Start!","Keep it going"],
            ].map(([l,v,s])=>(
              <div key={l} style={{...C.card,padding:14,textAlign:"center"}}>
                <div style={{fontSize:9,color:"#555",letterSpacing:1}}>{l}</div>
                <div className="hd" style={{fontSize:24,color:"#d4ff00",margin:"4px 0"}}>{v}</div>
                <div style={{fontSize:9,color:"#444"}}>{s}</div>
              </div>
            ))}
          </div>
          {/* Readiness */}
          {readiness!=null&&(
            <div style={{...C.card,background:readiness>70?"#0d1a0d":readiness>40?"#1a1800":"#1a0d0d",borderColor:readiness>70?"#4ade8044":readiness>40?"#facc1544":"#ef444444"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:11,color:"#555",marginBottom:4}}>TODAY'S READINESS</div>
                  <div className="hd" style={{fontSize:32,color:readiness>70?"#4ade80":readiness>40?"#facc15":"#ef4444"}}>{readiness}<span style={{fontSize:14,color:"#555"}}>/100</span></div>
                </div>
                <div style={{fontSize:28}}>{readiness>70?"💪":readiness>40?"😐":"😴"}</div>
              </div>
              <div className="pbar" style={{marginTop:10}}><div className="pfill" style={{width:`${readiness}%`,background:readiness>70?"#4ade80":readiness>40?"#facc15":"#ef4444"}}/></div>
            </div>
          )}
          {/* Today's workout */}
          <div style={C.card}>
            <div className="hd" style={{fontSize:16,marginBottom:12}}>TODAY'S WORKOUT</div>
            {workoutPlan.map(w=>{
              const key=`${w.id}-${today}`;
              const total=w.exercises.reduce((s,e)=>s+e.sets,0);
              const done=w.exercises.reduce((s,e)=>{for(let i=0;i<e.sets;i++)if(workoutLogs[key]?.[e.id]?.[i]?.done)s++;return s;},0);
              const pct=total?Math.round((done/total)*100):0;
              return(
                <div key={w.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1e1e2e"}}>
                  <div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}><span className="tag" style={{fontSize:9}}>{w.day}</span><span style={{fontSize:13}}>{w.name}</span></div>
                    <div style={{fontSize:10,color:"#555",marginTop:3}}>{w.exercises.length} exercises · {total} sets</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div className="hd" style={{fontSize:20,color:pct===100?"#d4ff00":"#555"}}>{pct}%</div>
                    <button className="ghost" style={{fontSize:10,padding:"4px 10px"}} onClick={()=>{setTab("workout");setActiveWorkout(w.id);}}>Go →</button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Muscle heatmap preview */}
          <div style={C.card}>
            <div className="hd" style={{fontSize:16,marginBottom:12}}>MUSCLE RECOVERY</div>
            <MuscleHeatmap recentMuscles={recentMuscles}/>
            <div style={{display:"flex",gap:16,marginTop:12,fontSize:10,color:"#555"}}>
              {[["#4ade8055","Recovered"],["#facc1588","Trained"],["#ef444488","Fatigued"]].map(([bg,l])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:bg}}/>{l}</div>
              ))}
            </div>
          </div>
          {/* Latest PB */}
          {pbs.length>0&&(
            <div style={{...C.card,borderColor:"#d4ff0033"}}>
              <div className="hd" style={{fontSize:16,marginBottom:10,color:"#d4ff00"}}>LATEST PB 🏆</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:13}}>{pbs[0].name}</div><div style={{fontSize:10,color:"#555"}}>{pbs[0].workoutName} · {pbs[0].date}</div></div>
                <div className="hd" style={{fontSize:32,color:"#d4ff00"}}>{pbs[0].weight}kg</div>
              </div>
            </div>
          )}
          {/* Body weight trend */}
          {bodyLog.length>1&&(
            <div style={C.card}>
              <div className="hd" style={{fontSize:16,marginBottom:12}}>WEIGHT TREND</div>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={[...bodyLog].sort((a,b)=>a.date.localeCompare(b.date)).slice(-14).map(e=>({...e,label:e.date.slice(5)}))}>
                  <YAxis hide domain={["dataMin-1","dataMax+1"]}/>
                  <XAxis dataKey="label" tick={{fill:"#555",fontSize:9}}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Line type="monotone" dataKey="weight" stroke="#d4ff00" strokeWidth={2} dot={false} name="Weight" unit="kg"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ════════════ WORKOUT ════════════ */}
      {tab==="workout" && (
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div><div className="hd" style={{fontSize:22}}>TRAINING LOG</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Log sets · notes · quick-add exercises</div></div>
          {workoutPlan.map(workout=>{
            const key=`${workout.id}-${today}`;
            const total=workout.exercises.reduce((s,e)=>s+e.sets,0);
            const done=workout.exercises.reduce((s,e)=>{for(let i=0;i<e.sets;i++)if(workoutLogs[key]?.[e.id]?.[i]?.done)s++;return s;},0);
            const pct=total?Math.round((done/total)*100):0;
            const isActive=activeWorkout===workout.id;

            if(editingWorkout===workout.id&&editDraft) return(
              <div key={workout.id} style={{...C.card,borderColor:"#d4ff0055"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{color:"#d4ff00",fontSize:12,letterSpacing:1}}>EDITING: {workout.name}</div>
                  <div style={{display:"flex",gap:8}}><button className="btn" style={{padding:"6px 14px",fontSize:12}} onClick={saveEdit}>Save</button><button className="ghost" style={{padding:"6px 12px",fontSize:12}} onClick={()=>{setEditingWorkout(null);setEditDraft(null);}}>Cancel</button></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 60px 70px 90px 24px",gap:7,marginBottom:8,fontSize:10,color:"#555"}}><div>EXERCISE</div><div>SETS</div><div>REPS</div><div>MUSCLE</div><div/></div>
                {editDraft.exercises.map(ex=>(
                  <div key={ex.id} style={{display:"grid",gridTemplateColumns:"1fr 60px 70px 90px 24px",gap:7,marginBottom:7,alignItems:"center"}}>
                    <input value={ex.name} placeholder="Exercise" onChange={e=>updDraftEx(ex.id,"name",e.target.value)}/>
                    <input type="number" value={ex.sets} onChange={e=>updDraftEx(ex.id,"sets",parseInt(e.target.value)||1)} style={{textAlign:"center"}}/>
                    <input type="number" value={ex.targetReps} onChange={e=>updDraftEx(ex.id,"targetReps",parseInt(e.target.value)||1)} style={{textAlign:"center"}}/>
                    <select value={ex.muscleGroup||""} onChange={e=>updDraftEx(ex.id,"muscleGroup",e.target.value)} style={{fontSize:11,padding:"7px 6px"}}>
                      <option value="">—</option>{MUSCLE_GROUPS.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                    <button onClick={()=>remFromDraft(ex.id)} style={{background:"transparent",border:"none",color:"#ff4444",cursor:"pointer",fontSize:18}}>×</button>
                  </div>
                ))}
                <button className="ghost" style={{marginTop:8,fontSize:11}} onClick={addExToDraft}>+ Add Exercise</button>
              </div>
            );

            return(
              <div key={workout.id} style={C.card}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><span className="tag">{workout.day}</span><span className="hd" style={{fontSize:17}}>{workout.name}</span></div>
                    <div style={{fontSize:10,color:"#555",marginTop:3}}>{workout.exercises.length} exercises · {total} sets</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                    <div className="hd" style={{fontSize:20,color:pct===100?"#d4ff00":"#e8e4d9"}}>{pct}%</div>
                    <div style={{display:"flex",gap:5}}>
                      <button className="ghost" style={{fontSize:10,padding:"3px 9px"}} onClick={()=>startEdit(workout)}>Edit</button>
                      <button className="ghost" style={{fontSize:10,padding:"3px 9px"}} onClick={()=>setActiveWorkout(isActive?null:workout.id)}>{isActive?"Collapse":"Log"}</button>
                    </div>
                  </div>
                </div>
                <div className="pbar"><div className="pfill" style={{width:`${pct}%`,background:pct===100?"#d4ff00":"#d4ff00"}}/></div>

                {isActive&&(
                  <div style={{marginTop:18}}>
                    {workout.exercises.map(ex=>{
                      const suggestion=getOverloadSuggestion(workout.id,ex.id);
                      return(
                        <div key={ex.id} style={{marginBottom:22}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                            <div>
                              <div style={{fontSize:13,color:"#d4ff00"}}>{ex.name}</div>
                              {ex.muscleGroup&&<div style={{fontSize:10,color:"#555"}}>{ex.muscleGroup}</div>}
                            </div>
                            <button className="ghost" style={{fontSize:10,padding:"3px 8px"}} onClick={()=>setProgressModal({wId:workout.id,exId:ex.id,name:ex.name})}>📈</button>
                          </div>
                          {suggestion&&(
                            <div style={{background:"#d4ff0010",border:"1px solid #d4ff0033",borderRadius:4,padding:"7px 10px",marginBottom:8,fontSize:11}}>
                              <span style={{color:"#d4ff00",fontWeight:500}}>💡 {suggestion.suggestion}</span>
                              <span style={{color:"#555",marginLeft:8}}>{suggestion.reason}</span>
                            </div>
                          )}
                          <div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 1fr 32px",gap:6,alignItems:"center",marginBottom:5}}>
                            {["#","KG","REPS","AIM","✓"].map(h=><div key={h} style={{fontSize:9,color:"#555",textAlign:"center"}}>{h}</div>)}
                          </div>
                          {Array.from({length:ex.sets}).map((_,i)=>{
                            const isDone=workoutLogs[key]?.[ex.id]?.[i]?.done;
                            const w=getSetV(workout.id,ex.id,i,"weight");
                            const r=getSetV(workout.id,ex.id,i,"reps");
                            const est=w&&r&&parseInt(r)>0?est1RM(parseFloat(w),parseInt(r)):null;
                            return(
                              <div key={i}>
                                <div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 1fr 32px",gap:6,alignItems:"center",marginBottom:5,opacity:isDone?.5:1}}>
                                  <div style={{fontSize:10,color:"#555",textAlign:"center"}}>{i+1}</div>
                                  <input type="number" placeholder={suggestion?.bump||"0"} value={w} onChange={e=>updSet(workout.id,ex.id,i,"weight",e.target.value)} style={{textAlign:"center"}}/>
                                  <input type="number" placeholder="0" value={r} onChange={e=>updSet(workout.id,ex.id,i,"reps",e.target.value)} style={{textAlign:"center"}}/>
                                  <div style={{fontSize:11,color:"#555",textAlign:"center"}}>{ex.targetReps}</div>
                                  <button className={`done-btn${isDone?" chk":""}`} onClick={()=>toggleDone(workout.id,ex.id,i)}>
                                    {isDone&&<span style={{color:"#0a0a0f",fontSize:13,fontWeight:"bold"}}>✓</span>}
                                  </button>
                                </div>
                                {est&&isDone&&<div style={{fontSize:9,color:"#555",textAlign:"right",marginTop:-3,marginBottom:4}}>est. 1RM: {est}kg</div>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    {/* Quick add */}
                    {quickAddEx===workout.id?(
                      <div style={{background:"#0d1117",border:"1px solid #d4ff0033",borderRadius:6,padding:12,marginBottom:14}}>
                        <div style={{fontSize:10,color:"#d4ff00",marginBottom:8,letterSpacing:1}}>QUICK ADD EXERCISE</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 55px 65px 90px",gap:7,marginBottom:8}}>
                          <input placeholder="Exercise name" value={quickDraft.name} onChange={e=>setQuickDraft(p=>({...p,name:e.target.value}))}/>
                          <input type="number" placeholder="Sets" value={quickDraft.sets} onChange={e=>setQuickDraft(p=>({...p,sets:e.target.value}))} style={{textAlign:"center"}}/>
                          <input type="number" placeholder="Reps" value={quickDraft.targetReps} onChange={e=>setQuickDraft(p=>({...p,targetReps:e.target.value}))} style={{textAlign:"center"}}/>
                          <select value={quickDraft.muscleGroup} onChange={e=>setQuickDraft(p=>({...p,muscleGroup:e.target.value}))} style={{fontSize:11,padding:"7px 6px"}}>
                            <option value="">Muscle</option>{MUSCLE_GROUPS.map(m=><option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                        <div style={{display:"flex",gap:7}}>
                          <button className="btn" style={{fontSize:11,padding:"6px 14px"}} onClick={()=>confirmQuickAdd(workout.id)}>Add to Session</button>
                          <button className="ghost" style={{fontSize:11,padding:"6px 12px"}} onClick={()=>setQuickAddEx(null)}>Cancel</button>
                        </div>
                      </div>
                    ):(
                      <button className="ghost" style={{fontSize:11,marginBottom:14}} onClick={()=>setQuickAddEx(workout.id)}>+ Add Exercise to Session</button>
                    )}
                    {/* Notes */}
                    <div style={{borderTop:"1px solid #1e1e2e",paddingTop:14}}>
                      <div style={{...C.label}}>SESSION NOTES</div>
                      <textarea rows={3} placeholder="How did it feel? Any PRs, adjustments, soreness..." value={getNote(workout.id)} onChange={e=>setNote(workout.id,e.target.value)} style={{fontSize:12,lineHeight:1.6}}/>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════ PROGRESS ════════════ */}
      {tab==="progress" && (
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div><div className="hd" style={{fontSize:22}}>STRENGTH PROGRESS</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Max weight per exercise over time</div></div>
          {workoutPlan.map(w=>(
            <div key={w.id} style={C.card}>
              <div className="hd" style={{fontSize:16,color:"#d4ff00",marginBottom:14}}>{w.name}</div>
              {w.exercises.map(ex=>{
                const data=getProgressData(w.id,ex.id);
                const last=data.slice(-1)[0];
                const first=data[0];
                const gain=last&&first?last.weight-first.weight:0;
                return(
                  <div key={ex.id} style={{marginBottom:22}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div><div style={{fontSize:12}}>{ex.name}</div>{ex.muscleGroup&&<div style={{fontSize:9,color:"#555"}}>{ex.muscleGroup}</div>}</div>
                      <div style={{textAlign:"right"}}>
                        {last&&<div className="hd" style={{fontSize:20,color:"#d4ff00"}}>{last.weight}kg</div>}
                        {gain!==0&&<div style={{fontSize:10,color:gain>0?"#4ade80":"#ef4444"}}>{gain>0?"+":""}{gain}kg</div>}
                      </div>
                    </div>
                    {data.length<2?<div style={{fontSize:10,color:"#333",padding:"8px 0"}}>Log 2+ sessions to see chart</div>:(
                      <ResponsiveContainer width="100%" height={90}>
                        <LineChart data={data}>
                          <XAxis dataKey="label" tick={{fill:"#555",fontSize:9}}/>
                          <YAxis hide domain={["dataMin-2","dataMax+2"]}/>
                          <Tooltip content={<ChartTip/>}/>
                          <Line type="monotone" dataKey="weight" stroke="#d4ff00" strokeWidth={2} dot={{fill:"#d4ff00",r:3}} name="Weight" unit="kg"/>
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ════════════ PBs ════════════ */}
      {tab==="pbs" && (
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div><div className="hd" style={{fontSize:22}}>PERSONAL BESTS</div><div style={{fontSize:11,color:"#555",marginTop:2}}>All-time max weights logged · est. 1RM shown</div></div>
          {pbs.length===0?(
            <div style={{...C.card,textAlign:"center",padding:"50px 20px",color:"#555"}}>Log workouts with weight to see your PBs here.</div>
          ):(
            <div style={C.card}>
              {pbs.map((pb,i)=>{
                const allSets=Object.entries(workoutLogs).filter(([k])=>{const w=workoutPlan.find(w=>k.startsWith(`${w.id}-`));return w?.exercises.find(e=>e.name===pb.name);});
                const bestReps=Object.values(allSets.flatMap(([,log])=>Object.values(log)).flatMap(ex=>Object.values(ex||{})).map(s=>parseInt(s.reps)).filter(Boolean));
                const topReps=bestReps.length?Math.max(...bestReps):null;
                const oneRM=topReps?est1RM(pb.weight,topReps):null;
                return(
                  <div key={pb.name} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 0",borderBottom:i<pbs.length-1?"1px solid #1e1e2e":"none"}}>
                    <div className="hd" style={{fontSize:22,minWidth:30,textAlign:"center",color:i===0?"#d4ff00":i===1?"#aaa":i===2?"#cd7f32":"#444"}}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13}}>{pb.name}</div>
                      <div style={{fontSize:10,color:"#555",marginTop:2}}>{pb.workoutName} · {pb.date}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div className="hd" style={{fontSize:26,color:"#d4ff00"}}>{pb.weight}kg</div>
                      {oneRM&&<div style={{fontSize:10,color:"#555"}}>~{oneRM}kg 1RM</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════ CALORIES ════════════ */}
      {tab==="calories" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div className="hd" style={{fontSize:22}}>NUTRITION LOG</div>
            <button className="btn" style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",fontSize:13}} onClick={()=>{setShowScanner(true);setScannerState("idle");}}>
              <span style={{fontSize:16}}>📷</span> Scan Barcode
            </button>
          </div>
          <div style={C.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div><div style={{fontSize:10,color:"#555"}}>TODAY</div><div className="hd" style={{fontSize:38,color:"#d4ff00",lineHeight:1}}>{Math.round(todayCals)}</div><div style={{fontSize:10,color:"#555"}}>kcal</div></div>
              {calcResult&&<div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#555"}}>Target</div><div className="hd" style={{fontSize:26}}>{calcResult.target}</div><div style={{fontSize:10,color:todayCals>calcResult.target?"#ef4444":"#4ade80"}}>{todayCals>calcResult.target?`+${Math.round(todayCals-calcResult.target)} over`:`${Math.round(calcResult.target-todayCals)} remaining`}</div></div>}
            </div>
            {calcResult&&<div className="pbar" style={{marginBottom:12}}><div className="pfill" style={{width:`${Math.min((todayCals/calcResult.target)*100,100)}%`,background:todayCals>calcResult.target?"#ef4444":"#d4ff00"}}/></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[["Protein",todayP,"g"],["Carbs",todayC,"g"],["Fat",todayF,"g"]].map(([l,v,u])=>(
                <div key={l} style={C.pill}><div style={{fontSize:9,color:"#555"}}>{l.toUpperCase()}</div><div className="hd" style={{fontSize:20,marginTop:3}}>{Math.round(v)}{u}</div></div>
              ))}
            </div>
          </div>
          <div style={C.card}>
            <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:12}}>THIS WEEK</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weekCalData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}}/>
                <Tooltip content={<ChartTip/>}/>
                {calcResult&&<ReferenceLine y={calcResult.target} stroke="#d4ff0066" strokeDasharray="4 4"/>}
                <Bar dataKey="calories" fill="#d4ff0033" stroke="#d4ff00" strokeWidth={1} name="Calories" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={C.card}>
            <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>QUICK ADD</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {COMMON_FOODS.map(f=><button key={f.name} className="ghost" style={{fontSize:11}} onClick={()=>setCalorieLog(p=>[...p,{...f,date:today,id:Date.now()}])}>{f.name} · {f.calories}kcal</button>)}
            </div>
          </div>
          <div style={C.card}>
            <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>CUSTOM FOOD</div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:7,marginBottom:8}}>
              {["name","calories","protein","carbs","fat"].map(f=>(
                <input key={f} type={f==="name"?"text":"number"} placeholder={f.charAt(0).toUpperCase()+f.slice(1)} value={customFood[f]} onChange={e=>setCustomFood(p=>({...p,[f]:e.target.value}))}/>
              ))}
            </div>
            <button className="btn" onClick={()=>{if(!customFood.name||!customFood.calories)return;setCalorieLog(p=>[...p,{name:customFood.name,calories:parseFloat(customFood.calories)||0,protein:parseFloat(customFood.protein)||0,carbs:parseFloat(customFood.carbs)||0,fat:parseFloat(customFood.fat)||0,date:today,id:Date.now()}]);setCustomFood({name:"",calories:"",protein:"",carbs:"",fat:""});}}>+ Log Food</button>
          </div>
          {calorieLog.filter(e=>e.date===today).length>0&&(
            <div style={C.card}>
              <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>TODAY'S LOG</div>
              {calorieLog.filter(e=>e.date===today).map(entry=>(
                <div key={entry.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #1e1e2e"}}>
                  <div><div style={{fontSize:13}}>{entry.name}</div><div style={{fontSize:10,color:"#555"}}>P:{entry.protein||0}g C:{entry.carbs||0}g F:{entry.fat||0}g</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{entry.calories}</span>
                    <button className="ghost" style={{fontSize:11,padding:"3px 7px"}} onClick={()=>setCalorieLog(p=>p.filter(e=>e.id!==entry.id))}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════ MEAL PLAN ════════════ */}
      {tab==="meals" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>AI MEAL PLAN</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Generated to your exact targets</div></div>
          {!calcResult?<div style={{...C.card,textAlign:"center",padding:"40px",color:"#555",fontSize:13}}>Run the Calorie Calculator first to set your targets.</div>:(
            <div style={C.card}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                {[["Target",calcResult.target+"kcal"],["Protein",calcResult.protein+"g"],["Goal",GOALS[calc.goal].label]].map(([l,v])=>(
                  <div key={l} style={C.pill}><div style={{fontSize:9,color:"#555"}}>{l.toUpperCase()}</div><div className="hd" style={{fontSize:16,marginTop:3}}>{v}</div></div>
                ))}
              </div>
              <div style={{...C.label}}>PREFERENCES</div>
              <input placeholder="e.g. high protein, no dairy, meal prep friendly..." value={mealPlanPrefs} onChange={e=>setMealPlanPrefs(e.target.value)} style={{marginBottom:12}}/>
              <button className="btn" style={{width:"100%",padding:13}} onClick={generateMealPlan} disabled={mealLoading}>{mealLoading?"✨ Generating...":"✨ Generate Meal Plan"}</button>
            </div>
          )}
          {mealPlan&&(
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                {[["Cals",mealPlan.totals?.calories+"kcal"],["P",mealPlan.totals?.protein+"g"],["C",mealPlan.totals?.carbs+"g"],["F",mealPlan.totals?.fat+"g"]].map(([l,v])=>(
                  <div key={l} style={C.pill}><div style={{fontSize:9,color:"#555"}}>{l}</div><div className="hd" style={{fontSize:16,color:"#d4ff00",marginTop:3}}>{v}</div></div>
                ))}
              </div>
              {mealPlan.meals?.map((meal,i)=>(
                <div key={i} style={C.card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}><span className="tag" style={{fontSize:9}}>{meal.time}</span><span className="hd" style={{fontSize:15}}>{meal.name}</span></div><div style={{fontSize:10,color:"#555"}}>P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</div></div>
                    <div className="hd" style={{fontSize:24,color:"#d4ff00"}}>{meal.calories}<span style={{fontSize:10,color:"#555"}}>kcal</span></div>
                  </div>
                  {meal.foods?.map((food,j)=><div key={j} style={{fontSize:12,display:"flex",alignItems:"center",gap:7,marginBottom:4}}><div style={{width:4,height:4,borderRadius:"50%",background:"#d4ff00",flexShrink:0}}/>{food}</div>)}
                  {meal.notes&&<div style={{fontSize:11,color:"#555",background:"#0d1117",padding:"7px 10px",borderRadius:4,borderLeft:"2px solid #d4ff0055",marginTop:8}}>{meal.notes}</div>}
                  <button className="ghost" style={{fontSize:10,marginTop:10,padding:"5px 12px"}} onClick={()=>setCalorieLog(p=>[...p,{name:meal.name,calories:meal.calories,protein:meal.protein,carbs:meal.carbs,fat:meal.fat,date:today,id:Date.now()}])}>+ Log this meal</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ════════════ WEEKLY CHECK-IN ════════════ */}
      {tab==="checkin" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>WEEKLY CHECK-IN</div><div style={{fontSize:11,color:"#555",marginTop:2}}>AI coach reviews your week & guides next steps</div></div>
          <div style={C.card}>
            <div style={{...C.label}}>THIS WEEK'S WEIGHT (kg)</div>
            <input type="number" placeholder="e.g. 81.2" value={checkinForm.weight} onChange={e=>setCheckinForm(p=>({...p,weight:e.target.value}))} style={{marginBottom:16}}/>
            {[["mood","😐 Mood"],["energy","⚡ Energy"],["soreness","💢 Soreness (1=none)"],["adherence","✅ Plan Adherence"]].map(([key,label])=>(
              <div key={key} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,color:"#555"}}>{label}</span>
                  <span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{checkinForm[key]}/5</span>
                </div>
                <input type="range" min="1" max="5" value={checkinForm[key]} onChange={e=>setCheckinForm(p=>({...p,[key]:parseInt(e.target.value)}))} style={{width:"100%"}}/>
              </div>
            ))}
            <div style={{...C.label,marginTop:8}}>NOTES / HOW WAS YOUR WEEK?</div>
            <textarea rows={3} placeholder="Had a heavy weekend, missed one session, felt strong on squats..." value={checkinForm.notes} onChange={e=>setCheckinForm(p=>({...p,notes:e.target.value}))} style={{marginBottom:12,fontSize:12}}/>
            <button className="btn" style={{width:"100%",padding:13}} onClick={submitCheckin} disabled={checkinLoading||!checkinForm.weight}>{checkinLoading?"🤔 AI is reviewing your week...":"Submit Check-In"}</button>
          </div>
          {checkinAI&&(
            <div style={{...C.card,borderColor:"#d4ff0033"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div className="hd" style={{fontSize:18,color:"#d4ff00"}}>YOUR COACH SAYS</div>
                <div style={{background:"#d4ff00",color:"#0a0a0f",borderRadius:20,padding:"4px 12px",fontWeight:600,fontSize:12}}>{checkinAI.readinessScore}/100</div>
              </div>
              <div style={{fontStyle:"italic",fontSize:14,color:"#e8e4d9",marginBottom:12,lineHeight:1.6}}>"{checkinAI.headline}"</div>
              {checkinAI.bodyweightNote&&<div style={{background:"#111827",border:"1px solid #2a2a3a",borderRadius:4,padding:"10px 12px",fontSize:12,marginBottom:12,lineHeight:1.6}}><span style={{color:"#d4ff00"}}>⚖️ Weight: </span>{checkinAI.bodyweightNote}</div>}
              <div style={{fontSize:12,color:"#d4ff00",marginBottom:6,letterSpacing:1}}>RECOMMENDATION</div>
              <div style={{fontSize:13,marginBottom:12}}>{checkinAI.recommendation}</div>
              {checkinAI.adjustments?.length>0&&(
                <div>
                  <div style={{fontSize:11,color:"#555",marginBottom:6}}>ADJUSTMENTS</div>
                  {checkinAI.adjustments.map((a,i)=><div key={i} style={{fontSize:12,padding:"6px 0",borderBottom:"1px solid #1e1e2e",display:"flex",gap:8}}><span style={{color:"#d4ff00"}}>→</span>{a}</div>)}
                </div>
              )}
              {checkinAI.nextWeekFocus&&<div style={{background:"#d4ff0015",border:"1px solid #d4ff0033",borderRadius:4,padding:"10px 12px",fontSize:12,marginTop:12}}><span style={{color:"#d4ff00"}}>Next week: </span>{checkinAI.nextWeekFocus}</div>}
            </div>
          )}
          {weeklyCheckins.length>0&&(
            <div style={C.card}>
              <div className="hd" style={{fontSize:15,marginBottom:10}}>HISTORY</div>
              {weeklyCheckins.slice().reverse().map((c,i)=>(
                <div key={i} style={{padding:"10px 0",borderBottom:"1px solid #1e1e2e"}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12}}>{c.date}</span><span className="hd" style={{fontSize:16,color:"#d4ff00"}}>{c.weight}kg</span></div>
                  {c.aiSummary&&<div style={{fontSize:11,color:"#555",marginTop:3}}>{c.aiSummary}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════ BODY WEIGHT ════════════ */}
      {tab==="body" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>BODY WEIGHT</div></div>
          <div style={C.card}>
            <div style={{...C.label}}>LOG TODAY</div>
            <div style={{display:"flex",gap:8}}>
              <input type="number" placeholder="e.g. 80.5" value={newWeight} onChange={e=>setNewWeight(e.target.value)} style={{maxWidth:180}}/>
              <button className="btn" onClick={()=>{if(!newWeight)return;setBodyLog(p=>{const f=p.filter(e=>e.date!==today);return[...f,{date:today,weight:parseFloat(newWeight),id:Date.now()}].sort((a,b)=>a.date.localeCompare(b.date));});setNewWeight("");}}>Log (kg)</button>
            </div>
          </div>
          {bodyLog.length>0&&(()=>{
            const s=[...bodyLog].sort((a,b)=>a.date.localeCompare(b.date));
            const latest=s[s.length-1].weight,first=s[0].weight,change=latest-first;
            return<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                {[["Now",`${latest}kg`],["Change",`${change>=0?"+":""}${change.toFixed(1)}kg`],["Low",`${Math.min(...s.map(e=>e.weight))}kg`],["High",`${Math.max(...s.map(e=>e.weight))}kg`]].map(([l,v])=>(
                  <div key={l} style={C.pill}><div style={{fontSize:9,color:"#555"}}>{l.toUpperCase()}</div><div className="hd" style={{fontSize:18,marginTop:3,color:l==="Change"?(change<0?"#4ade80":change>0?"#ef4444":"#e8e4d9"):"#e8e4d9"}}>{v}</div></div>
                ))}
              </div>
              <div style={C.card}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={s.map(e=>({...e,label:e.date.slice(5)}))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e"/>
                    <XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}} unit="kg" domain={["dataMin-1","dataMax+1"]}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Line type="monotone" dataKey="weight" stroke="#d4ff00" strokeWidth={2} dot={{fill:"#d4ff00",r:3}} name="Weight" unit="kg"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={C.card}>
                {s.slice().reverse().slice(0,10).map(entry=>(
                  <div key={entry.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #1e1e2e"}}>
                    <span style={{fontSize:11,color:"#555"}}>{entry.date}</span>
                    <div style={{display:"flex",alignItems:"center",gap:10}}><span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{entry.weight}kg</span><button className="ghost" style={{fontSize:10,padding:"2px 7px"}} onClick={()=>setBodyLog(p=>p.filter(e=>e.id!==entry.id))}>✕</button></div>
                  </div>
                ))}
              </div>
            </>;
          })()}
        </div>
      )}

      {/* ════════════ BODY SCAN ════════════ */}
      {tab==="bodyscan" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>BODY SCAN</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Upload a photo · AI estimates body fat & analyses posture</div></div>
          <div style={C.card}>
            <div style={{...C.label}}>UPLOAD PHYSIQUE PHOTO</div>
            <div style={{background:"#0d1117",border:"2px dashed #2a2a3a",borderRadius:6,padding:"30px",textAlign:"center",cursor:"pointer",marginBottom:12}} onClick={()=>bodyImgRef.current?.click()}>
              <div style={{fontSize:32,marginBottom:8}}>📷</div>
              <div style={{fontSize:13,color:"#555"}}>Tap to upload photo</div>
              <div style={{fontSize:10,color:"#333",marginTop:4}}>For best results: full body, good lighting, relaxed pose</div>
            </div>
            <input ref={bodyImgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBodyImageUpload}/>
            {bodyAnalysisLoading&&<div style={{textAlign:"center",padding:"20px",color:"#d4ff00",fontSize:13}}>🤖 AI is analysing your physique...</div>}
          </div>
          {bodyAnalysis&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{...C.card,borderColor:"#d4ff0033"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div><div className="hd" style={{fontSize:18,color:"#d4ff00"}}>BODY COMPOSITION</div><div style={{fontSize:11,color:"#555"}}>AI estimate — not a medical diagnosis</div></div>
                  <div style={{textAlign:"right"}}>
                    <div className="hd" style={{fontSize:32,color:"#d4ff00"}}>{bodyAnalysis.bodyFatEstimate}</div>
                    <div style={{fontSize:11,color:"#555"}}>{bodyAnalysis.bodyFatCategory}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:"#aaa",lineHeight:1.7}}>{bodyAnalysis.overallAssessment}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={C.card}>
                  <div style={{fontSize:11,color:"#4ade80",letterSpacing:1,marginBottom:10}}>STRENGTHS ✓</div>
                  {bodyAnalysis.primaryStrengths?.map((s,i)=><div key={i} style={{fontSize:12,padding:"5px 0",borderBottom:"1px solid #1e1e2e",display:"flex",gap:7}}><span style={{color:"#4ade80"}}>+</span>{s}</div>)}
                </div>
                <div style={C.card}>
                  <div style={{fontSize:11,color:"#facc15",letterSpacing:1,marginBottom:10}}>FOCUS AREAS →</div>
                  {bodyAnalysis.areasToFocus?.map((s,i)=><div key={i} style={{fontSize:12,padding:"5px 0",borderBottom:"1px solid #1e1e2e",display:"flex",gap:7}}><span style={{color:"#facc15"}}>→</span>{s}</div>)}
                </div>
              </div>
              {bodyAnalysis.posturalObservations?.length>0&&(
                <div style={C.card}>
                  <div style={{fontSize:11,color:"#f97316",letterSpacing:1,marginBottom:10}}>POSTURAL OBSERVATIONS</div>
                  {bodyAnalysis.posturalObservations.map((s,i)=><div key={i} style={{fontSize:12,padding:"5px 0",borderBottom:"1px solid #1e1e2e",display:"flex",gap:7}}><span style={{color:"#f97316"}}>⚠</span>{s}</div>)}
                </div>
              )}
              <div style={C.card}>
                <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>RECOMMENDATIONS</div>
                {bodyAnalysis.recommendations?.map((r,i)=><div key={i} style={{fontSize:12,padding:"6px 0",borderBottom:"1px solid #1e1e2e",display:"flex",gap:7}}><span style={{color:"#d4ff00"}}>→</span>{r}</div>)}
              </div>
            </div>
          )}
          {bodyImages.length>0&&(
            <div style={C.card}>
              <div className="hd" style={{fontSize:15,marginBottom:10}}>PROGRESS PHOTOS</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {bodyImages.map((img,i)=>(
                  <div key={i} style={{borderRadius:6,overflow:"hidden",border:"1px solid #1e1e2e"}}>
                    <img src={img.url} alt={img.date} style={{width:"100%",height:100,objectFit:"cover"}}/>
                    <div style={{fontSize:9,color:"#555",padding:"4px 6px",background:"#0d1117"}}>{img.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════ RECOVERY ════════════ */}
      {tab==="recovery" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>RECOVERY LOG</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Track sleep & energy to get a daily readiness score</div></div>
          <div style={C.card}>
            {[["sleep","😴 Sleep Hours","1","12",recoveryLog[today]?.sleep||7],["energy","⚡ Energy Level","1","5",recoveryLog[today]?.energy||3],["soreness","💢 Soreness","1","5",recoveryLog[today]?.soreness||1]].map(([key,label,min,max,val])=>(
              <div key={key} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,color:"#555"}}>{label}</span>
                  <span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{val}{key==="sleep"?"h":"/5"}</span>
                </div>
                <input type="range" min={min} max={max} step={key==="sleep"?.5:1} value={val} onChange={e=>setRecoveryLog(p=>({...p,[today]:{...(p[today]||{sleep:7,energy:3,soreness:1}),[key]:parseFloat(e.target.value)}}))} style={{width:"100%"}}/>
              </div>
            ))}
            {readiness!=null&&(
              <div style={{background:readiness>70?"#0d1a0d":readiness>40?"#1a1800":"#1a0d0d",border:`1px solid ${readiness>70?"#4ade8044":readiness>40?"#facc1544":"#ef444444"}`,borderRadius:6,padding:14,marginTop:8,textAlign:"center"}}>
                <div style={{fontSize:10,color:"#555",marginBottom:4}}>READINESS SCORE</div>
                <div className="hd" style={{fontSize:40,color:readiness>70?"#4ade80":readiness>40?"#facc15":"#ef4444"}}>{readiness}<span style={{fontSize:16,color:"#555"}}>/100</span></div>
                <div style={{fontSize:12,color:"#aaa",marginTop:6}}>{readiness>70?"You're good to train hard today 💪":readiness>40?"Moderate session recommended":"Consider rest or light movement"}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════ ANALYTICS ════════════ */}
      {tab==="analytics" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>ANALYTICS</div></div>
          <div style={C.card}>
            <div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>WEEKLY TRAINING VOLUME</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={volumeData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false}/>
                <XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}}/>
                <Tooltip content={<ChartTip/>}/>
                <Bar dataKey="volume" fill="#d4ff0033" stroke="#d4ff00" strokeWidth={1} name="Volume (kg)" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={C.card}>
            <div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>MUSCLE GROUP FREQUENCY</div>
            <MuscleHeatmap recentMuscles={recentMuscles}/>
          </div>
          <div style={C.card}>
            <div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>TOP LIFTS (Est. 1RM)</div>
            {pbs.slice(0,5).map((pb,i)=>{
              const allSets=Object.entries(workoutLogs).filter(([k])=>workoutPlan.some(w=>k.startsWith(`${w.id}-`)));
              const topReps=Math.max(0,...allSets.flatMap(([,log])=>Object.values(log)).flatMap(ex=>Object.values(ex||{})).map(s=>parseInt(s.reps)).filter(Boolean));
              const oneRM=topReps>0?est1RM(pb.weight,topReps):pb.weight;
              const pct=pbs[0]?Math.round((oneRM/est1RM(pbs[0].weight,topReps||1))*100):100;
              return(
                <div key={pb.name} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12}}>{pb.name}</span><span className="hd" style={{fontSize:16,color:"#d4ff00"}}>~{oneRM}kg</span>
                  </div>
                  <div className="pbar"><div className="pfill" style={{width:`${pct}%`,background:"#d4ff00"}}/></div>
                </div>
              );
            })}
          </div>
          <div style={C.card}>
            <div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>CALORIE CONSISTENCY</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weekCalData} barSize={22}>
                <XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis hide/>
                <Tooltip content={<ChartTip/>}/>
                {calcResult&&<ReferenceLine y={calcResult.target} stroke="#d4ff0066" strokeDasharray="4 4"/>}
                <Bar dataKey="calories" fill="#d4ff0033" stroke="#d4ff00" strokeWidth={1} name="Calories" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ════════════ CALCULATOR ════════════ */}
      {tab==="calculator" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>CALORIE CALCULATOR</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Mifflin-St Jeor formula</div></div>
          <div style={C.card}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["AGE","age","number","28"],["WEIGHT (kg)","weight","number","80"],["HEIGHT (cm)","height","number","178"]].map(([l,k,t,ph])=>(
                <div key={k}><div style={{...C.label}}>{l}</div><input type={t} placeholder={`e.g. ${ph}`} value={calc[k]} onChange={e=>setCalc(p=>({...p,[k]:e.target.value}))}/></div>
              ))}
              <div><div style={{...C.label}}>GENDER</div><select value={calc.gender} onChange={e=>setCalc(p=>({...p,gender:e.target.value}))}><option value="male">Male</option><option value="female">Female</option></select></div>
            </div>
            <div style={{marginTop:14}}>
              <div style={{...C.label}}>ACTIVITY LEVEL</div>
              {ACTIVITY_LEVELS.map(al=>(
                <button key={al.factor} onClick={()=>setCalc(p=>({...p,activity:al.factor}))} style={{display:"flex",width:"100%",alignItems:"center",gap:10,padding:"9px 12px",marginBottom:5,background:calc.activity===al.factor?"#d4ff0015":"transparent",border:`1px solid ${calc.activity===al.factor?"#d4ff00":"#1e1e2e"}`,borderRadius:4,cursor:"pointer",color:"#e8e4d9",fontFamily:"inherit"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:calc.activity===al.factor?"#d4ff00":"#2a2a3a",flexShrink:0}}/>
                  <div style={{textAlign:"left"}}><div style={{fontSize:12}}>{al.label}</div><div style={{fontSize:10,color:"#555"}}>{al.desc}</div></div>
                </button>
              ))}
            </div>
            <div style={{marginTop:14}}>
              <div style={{...C.label}}>GOAL</div>
              <div style={{display:"flex",gap:7}}>
                {GOALS.map((g,i)=><button key={g.label} onClick={()=>setCalc(p=>({...p,goal:i}))} style={{flex:1,padding:9,background:calc.goal===i?"#d4ff00":"transparent",border:`1px solid ${calc.goal===i?"#d4ff00":"#1e1e2e"}`,borderRadius:4,cursor:"pointer",color:calc.goal===i?"#0a0a0f":"#e8e4d9",fontFamily:"inherit",fontSize:11,fontWeight:calc.goal===i?600:400}}>{g.label}</button>)}
              </div>
            </div>
            <button className="btn" style={{width:"100%",marginTop:16,padding:13}} onClick={runCalc}>CALCULATE →</button>
          </div>
          {calcResult&&(
            <div style={{...C.card,borderColor:"#d4ff0033"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                {[["BMR",calcResult.bmr,"Base rate"],["TDEE",calcResult.tdee,"With activity"],["Target",calcResult.target,GOALS[calc.goal].label]].map(([l,v,s])=>(
                  <div key={l} style={{background:"#0a0a0f",border:"1px solid #1e1e2e",borderRadius:6,padding:12,textAlign:"center"}}>
                    <div style={{fontSize:9,color:"#555"}}>{l}</div>
                    <div className="hd" style={{fontSize:26,color:l==="Target"?"#d4ff00":"#e8e4d9",margin:"4px 0"}}>{v}</div>
                    <div style={{fontSize:9,color:"#555"}}>{s}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[["Protein",calcResult.protein+"g"],["Carbs",calcResult.carbs+"g"],["Fat",calcResult.fat+"g"]].map(([l,v])=>(
                  <div key={l} style={C.pill}><div style={{fontSize:9,color:"#555"}}>{l.toUpperCase()}</div><div className="hd" style={{fontSize:20,marginTop:3}}>{v}</div></div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* ════ PROGRESS MODAL ════ */}
      {progressModal&&(()=>{
        const data=getProgressData(progressModal.wId,progressModal.exId);
        return(
          <div className="modal">
            <div style={{...C.card,width:"100%",maxWidth:480,borderColor:"#d4ff0044"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div><div className="hd" style={{fontSize:16,color:"#d4ff00"}}>{progressModal.name}</div><div style={{fontSize:10,color:"#555"}}>Max weight per session</div></div>
                <button className="ghost" onClick={()=>setProgressModal(null)}>Close</button>
              </div>
              {data.length<2?<div style={{textAlign:"center",padding:"30px",color:"#555",fontSize:12}}>Log 2+ sessions to see chart.</div>:(
                <ResponsiveContainer width="100%" height={170}>
                  <LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e"/><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}} unit="kg"/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="weight" stroke="#d4ff00" strokeWidth={2} dot={{fill:"#d4ff00",r:4}} name="Weight" unit="kg"/></LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        );
      })()}

      {/* ════ BULK IMPORT MODAL ════ */}
      {showImport&&(
        <div className="modal">
          <div style={{...C.card,width:"100%",maxWidth:600,borderColor:"#d4ff0044",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div><div className="hd" style={{fontSize:18,color:"#d4ff00"}}>BULK IMPORT</div><div style={{fontSize:10,color:"#555"}}>Paste from notes in any format</div></div>
              <button className="ghost" onClick={()=>{setShowImport(false);setImportText("");setImportPreview(null);}}>✕</button>
            </div>
            <div style={{background:"#0d1117",border:"1px solid #1e1e2e",borderRadius:6,padding:12,marginBottom:12,fontSize:11,color:"#555",lineHeight:1.8}}>
              <div style={{color:"#d4ff00",marginBottom:4,fontSize:10,letterSpacing:1}}>SUPPORTED FORMATS</div>
              Monday - Push Day<br/>Bench Press 4x8 · Overhead Press 3x10<br/><br/>Or: "3 sets x 10 reps", bullet lists, plain names
            </div>
            <textarea rows={9} placeholder={"Monday - Push Day\nBench Press 4x8\nOverhead Press 3x10\n\nWednesday - Pull Day\nDeadlift 4x5"} value={importText} onChange={e=>{setImportText(e.target.value);setImportPreview(null);}} style={{marginBottom:10,fontSize:12,lineHeight:1.7}}/>
            <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
              <button className="btn" style={{padding:"8px 18px"}} onClick={()=>setImportPreview(parseBulk(importText))}>Preview</button>
              <div style={{marginLeft:"auto",display:"flex",gap:7}}>
                {["replace","add"].map(m=><button key={m} onClick={()=>setImportMode(m)} style={{padding:"6px 12px",fontSize:11,background:importMode===m?"#d4ff00":"transparent",border:`1px solid ${importMode===m?"#d4ff00":"#2a2a3a"}`,borderRadius:4,cursor:"pointer",color:importMode===m?"#0a0a0f":"#e8e4d9",fontFamily:"inherit"}}>{m==="replace"?"Replace plan":"Add to plan"}</button>)}
              </div>
            </div>
            {importPreview&&(
              <div>
                <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>{importPreview.length} WORKOUT{importPreview.length!==1?"S":""} DETECTED</div>
                {importPreview.map((w,i)=>(
                  <div key={i} style={{background:"#0d1117",border:"1px solid #1e1e2e",borderRadius:6,padding:10,marginBottom:7}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}><span className="tag" style={{fontSize:9}}>{w.day}</span><span className="hd" style={{fontSize:14}}>{w.name}</span></div>
                    {w.exercises.map((ex,j)=><div key={j} style={{fontSize:11,color:"#aaa",padding:"2px 0"}}>· {ex.name} — {ex.sets}×{ex.targetReps}</div>)}
                  </div>
                ))}
                <button className="btn" style={{width:"100%",padding:11,marginTop:6}} onClick={confirmImport}>✓ Confirm Import</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ AI WORKOUT GENERATOR MODAL ════ */}
      {showAIGen&&(
        <div className="modal">
          <div style={{...C.card,width:"100%",maxWidth:500,borderColor:"#d4ff0044",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div><div className="hd" style={{fontSize:18,color:"#d4ff00"}}>✨ AI WORKOUT GENERATOR</div><div style={{fontSize:10,color:"#555"}}>Builds a personalised program just for you</div></div>
              <button className="ghost" onClick={()=>setShowAIGen(false)}>✕</button>
            </div>
            {[["GOAL",null,"goal",["Build Muscle","Lose Fat","Strength","Endurance","General Fitness"]],["TRAINING DAYS/WEEK",null,"days",["2","3","4","5","6"]],["EQUIPMENT",null,"equipment",["Full gym","Dumbbells only","Barbell & rack","Bodyweight only","Home gym"]],["EXPERIENCE",null,"experience",["Beginner","Intermediate","Advanced"]],].map(([label,,key,opts])=>(
              <div key={key} style={{marginBottom:12}}>
                <div style={{...C.label}}>{label}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {opts.map(o=><button key={o} onClick={()=>setAiGenForm(p=>({...p,[key]:o}))} style={{padding:"6px 12px",fontSize:11,background:aiGenForm[key]===o?"#d4ff00":"transparent",border:`1px solid ${aiGenForm[key]===o?"#d4ff00":"#2a2a3a"}`,borderRadius:4,cursor:"pointer",color:aiGenForm[key]===o?"#0a0a0f":"#e8e4d9",fontFamily:"inherit"}}>{o}</button>)}
                </div>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <div style={{...C.label}}>INJURIES / LIMITATIONS</div>
              <input placeholder="e.g. bad knee, lower back issues, shoulder impingement" value={aiGenForm.injuries} onChange={e=>setAiGenForm(p=>({...p,injuries:e.target.value}))}/>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{...C.label}}>EXTRA NOTES</div>
              <input placeholder="e.g. more glute focus, minimal equipment needed..." value={aiGenForm.notes} onChange={e=>setAiGenForm(p=>({...p,notes:e.target.value}))}/>
            </div>
            <button className="btn" style={{width:"100%",padding:13}} onClick={generateWorkout} disabled={aiGenLoading}>{aiGenLoading?"✨ Building your programme...":"✨ Generate My Programme"}</button>
          </div>
        </div>
      )}

      {/* ════ BARCODE SCANNER MODAL ════ */}
      {showScanner && (
        <div className="modal" style={{alignItems:"flex-end",padding:0}}>
          <div style={{background:"#0d1117",border:"1px solid #d4ff0033",borderRadius:"16px 16px 0 0",width:"100%",maxWidth:520,margin:"0 auto",maxHeight:"92vh",overflowY:"auto"}}>
            {/* Handle bar */}
            <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}>
              <div style={{width:40,height:4,borderRadius:2,background:"#2a2a3a"}}/>
            </div>
            <div style={{padding:"0 20px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div>
                  <div className="hd" style={{fontSize:20,color:"#d4ff00"}}>BARCODE SCANNER</div>
                  <div style={{fontSize:11,color:"#555"}}>Scan any food product to auto-fill nutrition</div>
                </div>
                <button className="ghost" style={{fontSize:18,padding:"4px 10px",lineHeight:1}} onClick={closeScanner}>✕</button>
              </div>

              {/* IDLE state — choose scan or manual */}
              {scannerState === "idle" && (
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <button className="btn" style={{width:"100%",padding:16,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onClick={startCamera}>
                    <span style={{fontSize:22}}>📷</span> Open Camera & Scan
                  </button>
                  <div style={{textAlign:"center",fontSize:11,color:"#555"}}>— or enter barcode manually —</div>
                  <div style={{display:"flex",gap:8}}>
                    <input placeholder="e.g. 5000112548167" value={manualBarcode} onChange={e=>setManualBarcode(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}/>
                    <button className="btn" style={{padding:"8px 16px",whiteSpace:"nowrap"}} onClick={()=>{if(manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}>Search</button>
                  </div>
                  <div style={{background:"#111118",border:"1px solid #1e1e2e",borderRadius:8,padding:14,fontSize:11,color:"#555",lineHeight:1.7}}>
                    <div style={{color:"#d4ff00",marginBottom:6,letterSpacing:1,fontSize:10}}>HOW IT WORKS</div>
                    Uses the Open Food Facts database — over 3 million products worldwide. Works best with EAN-13 barcodes (the long numbers on food packaging).
                  </div>
                </div>
              )}

              {/* SCANNING state — live camera */}
              {scannerState === "scanning" && (
                <div>
                  <div style={{position:"relative",borderRadius:12,overflow:"hidden",background:"#000",marginBottom:14}}>
                    <video ref={barcodeVideoRef} style={{width:"100%",maxHeight:280,objectFit:"cover",display:"block"}} playsInline muted/>
                    {/* Scanning overlay */}
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                      <div style={{width:220,height:120,border:"2px solid #d4ff00",borderRadius:8,boxShadow:"0 0 0 2000px rgba(0,0,0,0.4)"}}>
                        <div style={{position:"absolute",top:0,left:0,width:20,height:20,borderTop:"3px solid #d4ff00",borderLeft:"3px solid #d4ff00",borderRadius:"8px 0 0 0"}}/>
                        <div style={{position:"absolute",top:0,right:0,width:20,height:20,borderTop:"3px solid #d4ff00",borderRight:"3px solid #d4ff00",borderRadius:"0 8px 0 0"}}/>
                        <div style={{position:"absolute",bottom:0,left:0,width:20,height:20,borderBottom:"3px solid #d4ff00",borderLeft:"3px solid #d4ff00",borderRadius:"0 0 0 8px"}}/>
                        <div style={{position:"absolute",bottom:0,right:0,width:20,height:20,borderBottom:"3px solid #d4ff00",borderRight:"3px solid #d4ff00",borderRadius:"0 0 8px 0"}}/>
                        {/* Animated scan line */}
                        <div style={{position:"absolute",width:"100%",height:2,background:"linear-gradient(90deg,transparent,#d4ff00,transparent)",animation:"scanline 1.5s ease-in-out infinite"}}/>
                      </div>
                    </div>
                  </div>
                  <style>{`@keyframes scanline{0%,100%{top:10%}50%{top:85%}}`}</style>
                  <div style={{textAlign:"center",color:"#d4ff00",fontSize:13,marginBottom:14,animation:"pulse 1s ease-in-out infinite"}}>
                    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
                    Hold barcode steady in the frame...
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button className="ghost" style={{flex:1}} onClick={()=>{stopCamera();setScannerState("manual");}}>Enter Manually Instead</button>
                    <button className="ghost" style={{flex:1}} onClick={()=>{stopCamera();setScannerState("idle");}}>Cancel</button>
                  </div>
                </div>
              )}

              {/* MANUAL fallback entry */}
              {scannerState === "manual" && (
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{background:"#1a1400",border:"1px solid #facc1533",borderRadius:6,padding:12,fontSize:12,color:"#facc15"}}>
                    ⚠️ Camera barcode detection not supported in this browser. Enter the barcode number from the packaging instead.
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <input placeholder="Barcode number (e.g. 5000112548167)" value={manualBarcode} onChange={e=>setManualBarcode(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}/>
                    <button className="btn" style={{padding:"8px 16px",whiteSpace:"nowrap"}} onClick={()=>{if(manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}>Look Up</button>
                  </div>
                  <button className="ghost" onClick={()=>setScannerState("idle")}>← Back</button>
                </div>
              )}

              {/* FOUND / LOADING state */}
              {scannerState === "found" && (
                <div>
                  {!scannedFood && (
                    <div style={{textAlign:"center",padding:"40px 20px"}}>
                      <div style={{fontSize:28,marginBottom:12,animation:"spin 1s linear infinite"}}>⚙️</div>
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                      <div style={{color:"#d4ff00",fontSize:13}}>Looking up barcode {scannedBarcode}...</div>
                      <div style={{fontSize:11,color:"#555",marginTop:6}}>Searching Open Food Facts database</div>
                    </div>
                  )}

                  {scannedFood?.notFound && (
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      <div style={{background:"#1a0d0d",border:"1px solid #ef444433",borderRadius:8,padding:16,textAlign:"center"}}>
                        <div style={{fontSize:28,marginBottom:8}}>🔍</div>
                        <div style={{fontSize:13,color:"#ef4444",marginBottom:4}}>Product not found</div>
                        <div style={{fontSize:11,color:"#555"}}>Barcode: {scannedFood.barcode}</div>
                        <div style={{fontSize:11,color:"#555",marginTop:4}}>This product isn't in the database yet.</div>
                      </div>
                      <button className="btn" style={{width:"100%"}} onClick={()=>{setScannerState("idle");setScannedFood(null);setManualBarcode("");}}>Try Another Barcode</button>
                      <button className="ghost" style={{width:"100%"}} onClick={closeScanner}>Add Manually Instead</button>
                    </div>
                  )}

                  {scannedFood && !scannedFood.notFound && (
                    <div style={{display:"flex",flexDirection:"column",gap:14}}>
                      {/* Product card */}
                      <div style={{background:"#111118",border:"1px solid #d4ff0033",borderRadius:10,padding:16,display:"flex",gap:14,alignItems:"flex-start"}}>
                        {scannedFood.image
                          ? <img src={scannedFood.image} alt={scannedFood.name} style={{width:64,height:64,objectFit:"contain",borderRadius:6,background:"#fff",padding:4,flexShrink:0}}/>
                          : <div style={{width:64,height:64,borderRadius:6,background:"#1e1e2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🛒</div>
                        }
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:500,lineHeight:1.3,marginBottom:3}}>{scannedFood.name}</div>
                          {scannedFood.brand && <div style={{fontSize:11,color:"#d4ff00",marginBottom:6}}>{scannedFood.brand}</div>}
                          <div style={{fontSize:10,color:"#555",fontFamily:"monospace"}}>#{scannedFood.barcode}</div>
                        </div>
                      </div>

                      {/* Serving size slider */}
                      <div style={{background:"#111118",border:"1px solid #1e1e2e",borderRadius:8,padding:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                          <span style={{fontSize:11,color:"#555",letterSpacing:1}}>SERVING SIZE</span>
                          <div style={{display:"flex",alignItems:"center",gap:6}}>
                            <input type="number" value={scanServing} onChange={e=>setScanServing(Math.max(1,parseInt(e.target.value)||1))} style={{width:70,textAlign:"center",padding:"6px 8px"}}/>
                            <span style={{fontSize:12,color:"#555"}}>g</span>
                          </div>
                        </div>
                        <input type="range" min="5" max="500" step="5" value={scanServing} onChange={e=>setScanServing(parseInt(e.target.value))} style={{width:"100%",marginBottom:8}}/>
                        <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                          {[30,50,100,150,200].map(s=>(
                            <button key={s} onClick={()=>setScanServing(s)} style={{flex:1,padding:"5px 0",fontSize:11,background:scanServing===s?"#d4ff00":"transparent",border:`1px solid ${scanServing===s?"#d4ff00":"#2a2a3a"}`,borderRadius:4,cursor:"pointer",color:scanServing===s?"#0a0a0f":"#e8e4d9",fontFamily:"inherit"}}>{s}g</button>
                          ))}
                        </div>
                      </div>

                      {/* Nutrition preview for selected serving */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>
                        {[
                          ["Calories", Math.round(scannedFood.calories * scanServing / 100), "kcal", "#d4ff00"],
                          ["Protein",  Math.round(scannedFood.protein  * scanServing / 100 * 10)/10, "g", "#4ade80"],
                          ["Carbs",    Math.round(scannedFood.carbs    * scanServing / 100 * 10)/10, "g", "#facc15"],
                          ["Fat",      Math.round(scannedFood.fat      * scanServing / 100 * 10)/10, "g", "#f97316"],
                        ].map(([l,v,u,c])=>(
                          <div key={l} style={{...C.pill,borderColor:"#1e1e2e"}}>
                            <div style={{fontSize:9,color:"#555"}}>{l.toUpperCase()}</div>
                            <div className="hd" style={{fontSize:18,marginTop:3,color:c}}>{v}</div>
                            <div style={{fontSize:9,color:"#555"}}>{u}</div>
                          </div>
                        ))}
                      </div>

                      {/* Per 100g reference */}
                      <div style={{fontSize:11,color:"#555",textAlign:"center"}}>
                        Per 100g: {scannedFood.calories}kcal · P:{scannedFood.protein}g · C:{scannedFood.carbs}g · F:{scannedFood.fat}g
                      </div>

                      <button className="btn" style={{width:"100%",padding:14,fontSize:14}} onClick={logScannedFood}>
                        ✓ Add {scanServing}g to Today's Log
                      </button>
                      <button className="ghost" style={{width:"100%"}} onClick={()=>{setScannerState("idle");setScannedFood(null);setManualBarcode("");}}>
                        Scan Another Product
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ERROR state */}
              {scannerState === "error" && (
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{background:"#1a0d0d",border:"1px solid #ef444433",borderRadius:8,padding:16,textAlign:"center"}}>
                    <div style={{fontSize:28,marginBottom:8}}>📵</div>
                    <div style={{fontSize:13,color:"#ef4444",marginBottom:4}}>Camera access denied</div>
                    <div style={{fontSize:11,color:"#555"}}>Allow camera access in your browser settings, or enter the barcode number manually below.</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <input placeholder="Barcode number" value={manualBarcode} onChange={e=>setManualBarcode(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}/>
                    <button className="btn" style={{padding:"8px 14px",whiteSpace:"nowrap"}} onClick={()=>{if(manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}>Go</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
