"use client";
import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

const STORAGE_KEY = "forge_v5";

const DEFAULT_PLAN = [
  { id: 1, day: "Monday", name: "Push Day", exercises: [
    { id: 1, name: "Bench Press", sets: 4, targetReps: 8, muscles: ["Chest","Triceps","Shoulders"] },
    { id: 2, name: "Overhead Press", sets: 3, targetReps: 10, muscles: ["Shoulders","Triceps"] },
    { id: 3, name: "Incline Dumbbell Press", sets: 3, targetReps: 12, muscles: ["Chest","Shoulders"] },
    { id: 4, name: "Tricep Pushdowns", sets: 3, targetReps: 15, muscles: ["Triceps"] },
  ]},
  { id: 2, day: "Wednesday", name: "Pull Day", exercises: [
    { id: 1, name: "Deadlift", sets: 4, targetReps: 5, muscles: ["Back","Hamstrings","Glutes","Traps"] },
    { id: 2, name: "Pull-Ups", sets: 3, targetReps: 8, muscles: ["Back","Biceps"] },
    { id: 3, name: "Barbell Row", sets: 3, targetReps: 10, muscles: ["Back","Biceps","Traps"] },
    { id: 4, name: "Bicep Curls", sets: 3, targetReps: 12, muscles: ["Biceps"] },
  ]},
  { id: 3, day: "Friday", name: "Leg Day", exercises: [
    { id: 1, name: "Squat", sets: 4, targetReps: 8, muscles: ["Quads","Glutes","Hamstrings","Core"] },
    { id: 2, name: "Romanian Deadlift", sets: 3, targetReps: 10, muscles: ["Hamstrings","Glutes","Back"] },
    { id: 3, name: "Leg Press", sets: 3, targetReps: 12, muscles: ["Quads","Glutes"] },
    { id: 4, name: "Calf Raises", sets: 4, targetReps: 20, muscles: ["Calves"] },
  ]},
];

const MUSCLE_GROUPS = ["Chest","Back","Shoulders","Biceps","Triceps","Quads","Hamstrings","Glutes","Calves","Core","Traps","Forearms"];
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
  { name: "Greek Yogurt (100g)", calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: "Cottage Cheese (100g)", calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const MEAL_LIBRARY = [
  { id:1, category:"Breakfast", name:"High Protein Overnight Oats", calories:480, protein:38, carbs:52, fat:9, emoji:"🥣",
    ingredients:["100g oats","200ml skimmed milk","150g Greek yogurt (0%)","1 scoop whey protein","1 tbsp peanut butter","1 banana"],
    method:"Mix oats, milk and yogurt. Stir in protein powder. Refrigerate overnight. Top with peanut butter and banana.",
    tags:["High Protein","Meal Prep","No Cook"]},
  { id:2, category:"Breakfast", name:"Scrambled Eggs & Smoked Salmon", calories:390, protein:42, carbs:4, fat:22, emoji:"🍳",
    ingredients:["4 whole eggs","100g smoked salmon","2 tbsp skimmed milk","1 tsp butter","Fresh dill","Black pepper"],
    method:"Whisk eggs with milk. Cook slowly in butter over low heat. Serve with smoked salmon and dill.",
    tags:["High Protein","Low Carb","Quick"]},
  { id:3, category:"Breakfast", name:"Protein Pancakes", calories:420, protein:36, carbs:44, fat:8, emoji:"🥞",
    ingredients:["2 scoops whey protein","2 whole eggs","80g oats (blended)","100ml skimmed milk","1 tsp baking powder","1 tsp vanilla extract"],
    method:"Blend oats to flour. Mix all ingredients. Cook in a non-stick pan on medium heat, 2 mins each side.",
    tags:["High Protein","Meal Prep"]},
  { id:4, category:"Lunch", name:"Chicken & Rice Bowl", calories:520, protein:48, carbs:56, fat:8, emoji:"🍚",
    ingredients:["200g chicken breast","150g cooked white rice","1 tbsp olive oil","1 tsp garlic powder","1 tsp paprika","Steamed broccoli","Soy sauce to taste"],
    method:"Season chicken, cook in olive oil 6 mins each side. Slice and serve over rice with broccoli and soy sauce.",
    tags:["High Protein","Meal Prep","Bulk"]},
  { id:5, category:"Lunch", name:"Tuna Stuffed Sweet Potato", calories:440, protein:40, carbs:48, fat:6, emoji:"🥔",
    ingredients:["1 large sweet potato","2 cans tuna in spring water","2 tbsp Greek yogurt","1 tbsp sweetcorn","Spring onions","Lemon juice","Salt & pepper"],
    method:"Bake sweet potato 45 mins at 200°C. Mix tuna with yogurt, corn, onions and lemon. Stuff into potato.",
    tags:["High Protein","Lean","Meal Prep"]},
  { id:6, category:"Lunch", name:"Turkey & Avocado Wrap", calories:460, protein:38, carbs:36, fat:16, emoji:"🌯",
    ingredients:["150g turkey breast slices","1 wholegrain wrap","½ avocado","Handful spinach","2 tbsp Greek yogurt","Lemon juice","Salt & pepper"],
    method:"Spread Greek yogurt on wrap. Layer turkey, spinach, and sliced avocado. Squeeze lemon, season and roll.",
    tags:["High Protein","Quick","Lean"]},
  { id:7, category:"Lunch", name:"Salmon & Quinoa Power Bowl", calories:560, protein:44, carbs:42, fat:18, emoji:"🐟",
    ingredients:["180g salmon fillet","120g cooked quinoa","Handful kale","½ cucumber","Cherry tomatoes","1 tbsp olive oil","Lemon & dill dressing"],
    method:"Season and pan-fry salmon 4 mins each side. Assemble bowl with quinoa, kale, veg. Top with salmon and dressing.",
    tags:["High Protein","Omega-3","Lean"]},
  { id:8, category:"Dinner", name:"Lean Beef Stir Fry", calories:490, protein:42, carbs:38, fat:14, emoji:"🥩",
    ingredients:["200g lean beef strips","200g mixed stir fry veg","100g rice noodles","2 tbsp low sodium soy sauce","1 tbsp sesame oil","2 cloves garlic","1 tsp ginger"],
    method:"Cook noodles per pack. Stir fry beef in sesame oil 3 mins. Add garlic, ginger, veg and soy sauce. Toss with noodles.",
    tags:["High Protein","Quick","Lean"]},
  { id:9, category:"Dinner", name:"Baked Cod & Sweet Potato Mash", calories:410, protein:38, carbs:44, fat:6, emoji:"🐟",
    ingredients:["200g cod fillet","2 medium sweet potatoes","1 tbsp olive oil","Paprika","Garlic powder","Steamed green beans","Lemon"],
    method:"Bake cod at 200°C 15 mins with oil and spices. Boil and mash sweet potatoes. Serve with green beans and lemon.",
    tags:["High Protein","Lean","Low Fat"]},
  { id:10, category:"Dinner", name:"Chicken Tikka with Cauliflower Rice", calories:380, protein:46, carbs:18, fat:10, emoji:"🍛",
    ingredients:["250g chicken breast","100g fat-free Greek yogurt","2 tbsp tikka masala paste","½ cauliflower (riced)","1 tsp cumin","Coriander","Lemon"],
    method:"Marinate chicken in yogurt and tikka paste 30 mins. Grill 8 mins each side. Blitz cauliflower, sauté 5 mins.",
    tags:["High Protein","Low Carb","Lean"]},
  { id:11, category:"Dinner", name:"Turkey Mince Bolognese", calories:460, protein:44, carbs:42, fat:8, emoji:"🍝",
    ingredients:["300g turkey mince","100g wholewheat pasta","1 can chopped tomatoes","1 onion","2 cloves garlic","1 tsp Italian herbs"],
    method:"Brown mince with onion and garlic. Add tomatoes and herbs. Simmer 20 mins. Serve over cooked pasta.",
    tags:["High Protein","Meal Prep","Lean"]},
  { id:12, category:"Snack", name:"Cottage Cheese & Berries", calories:180, protein:18, carbs:16, fat:3, emoji:"🫐",
    ingredients:["200g low fat cottage cheese","Handful mixed berries","1 tsp honey","Pinch cinnamon"],
    method:"Spoon cottage cheese into a bowl. Top with berries, drizzle honey, dust with cinnamon.",
    tags:["High Protein","Quick","Low Cal"]},
  { id:13, category:"Snack", name:"Protein Rice Cakes", calories:220, protein:20, carbs:24, fat:4, emoji:"🍚",
    ingredients:["4 rice cakes","100g cottage cheese","2 tbsp peanut butter","1 banana (sliced)"],
    method:"Top rice cakes with cottage cheese and peanut butter. Add banana slices.",
    tags:["High Protein","Quick","Pre-Workout"]},
  { id:14, category:"Snack", name:"Greek Yogurt Protein Bowl", calories:260, protein:28, carbs:20, fat:6, emoji:"🥛",
    ingredients:["200g 0% Greek yogurt","1 scoop whey protein","30g granola","1 tbsp honey","Fresh berries"],
    method:"Mix protein powder into yogurt. Top with granola, berries and honey.",
    tags:["High Protein","Quick","Post-Workout"]},
];

function getLast7(){return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d.toISOString().split("T")[0];});}
function todayStr(){return new Date().toISOString().split("T")[0];}

function parseBulk(text){
  const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
  const workouts=[];let cur=null;let eid=1;
  for(const line of lines){
    if(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|day\s*\d+)/i.test(line)||(line.endsWith(":")||line.match(/^[A-Z][^a-z]*$/)&&line.length<40)){
      const p=line.replace(/:$/,"").split(/[-–:]/);
      cur={id:Date.now()+workouts.length,day:p[0].trim(),name:(p[1]||p[0]).trim(),exercises:[]};eid=1;workouts.push(cur);continue;
    }
    if(!cur){cur={id:Date.now(),day:"Day 1",name:"Workout",exercises:[]};workouts.push(cur);}
    const m=line.match(/^([A-Za-z\s()\/]+?)\s*[-–]?\s*(\d+)\s*[xX×]\s*(\d+)/);
    const sm=line.match(/(\d+)\s*sets?\s*(?:x|of|×)?\s*(\d+)\s*reps?/i);
    if(m)cur.exercises.push({id:eid++,name:m[1].trim(),sets:parseInt(m[2]),targetReps:parseInt(m[3]),muscles:[]});
    else if(sm){const n=line.replace(sm[0],"").replace(/^[-–\s]+|[-–\s]+$/g,"").trim();if(n)cur.exercises.push({id:eid++,name:n,sets:parseInt(sm[1]),targetReps:parseInt(sm[2]),muscles:[]});}
    else if(line.match(/^[A-Za-z]/))cur.exercises.push({id:eid++,name:line.replace(/[*•\-–]/g,"").trim(),sets:3,targetReps:10,muscles:[]});
  }
  return workouts.filter(w=>w.exercises.length>0);
}

const ChartTip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return <div style={{background:"#111118",border:"1px solid #2a2a3a",borderRadius:4,padding:"8px 12px",fontSize:11}}>{label&&<div style={{color:"#555",marginBottom:3}}>{label}</div>}{payload.map((p,i)=><div key={i} style={{color:p.color||"#d4ff00"}}>{p.name}: <b>{p.value}{p.unit||""}</b></div>)}</div>;
};

function MuscleHeatmap({recentMuscles}){
  const intensity=(g)=>{const h=recentMuscles[g]||0;if(h===0)return"#1e1e2e";if(h===1)return"#4ade8055";if(h===2)return"#facc1588";return"#ef444488";};
  const label=(g)=>{const h=recentMuscles[g]||0;if(h===0)return"Recovered";if(h===1)return"Trained";if(h===2)return"Fatigued";return"Overtrained";};
  return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{MUSCLE_GROUPS.map(g=>(<div key={g} style={{background:intensity(g),border:"1px solid #2a2a3a",borderRadius:6,padding:"10px 12px",textAlign:"center"}}><div style={{fontSize:11,fontWeight:500}}>{g}</div><div style={{fontSize:9,color:"#aaa",marginTop:3}}>{label(g)}</div></div>))}</div>);
}

function MusclePicker({selected=[],onChange}){
  return(<div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>{MUSCLE_GROUPS.map(m=>{const on=(selected||[]).includes(m);return(<button key={m} onClick={()=>{const cur=selected||[];onChange(on?cur.filter(x=>x!==m):[...cur,m]);}} style={{padding:"4px 10px",fontSize:10,background:on?"#d4ff00":"transparent",border:`1px solid ${on?"#d4ff00":"#2a2a3a"}`,borderRadius:20,cursor:"pointer",color:on?"#0a0a0f":"#aaa",fontFamily:"inherit"}}>{m}</button>);})}</div>);
}
export default function App(){
  const [tab,setTab]=useState("home");
  const [workoutPlan,setWorkoutPlan]=useState(DEFAULT_PLAN);
  const [workoutLogs,setWorkoutLogs]=useState({});
  const [workoutNotes,setWorkoutNotes]=useState({});
  const [activeWorkout,setActiveWorkout]=useState(null);
  const [calorieLog,setCalorieLog]=useState([]);
  const [bodyLog,setBodyLog]=useState([]);
  const [recoveryLog,setRecoveryLog]=useState({});
  const [checkins,setCheckins]=useState([]);
  const [checkinForm,setCheckinForm]=useState({weight:"",mood:3,energy:3,soreness:3,adherence:3,notes:""});
  const [calc,setCalc]=useState({age:"",gender:"male",weight:"",height:"",activity:1.55,goal:0});
  const [calcResult,setCalcResult]=useState(null);
  const [editingWorkout,setEditingWorkout]=useState(null);
  const [editDraft,setEditDraft]=useState(null);
  const [progressModal,setProgressModal]=useState(null);
  const [showImport,setShowImport]=useState(false);
  const [importText,setImportText]=useState("");
  const [importPreview,setImportPreview]=useState(null);
  const [importMode,setImportMode]=useState("replace");
  const [quickAddEx,setQuickAddEx]=useState(null);
  const [quickDraft,setQuickDraft]=useState({name:"",sets:3,targetReps:10,muscles:[]});
  const [newWeight,setNewWeight]=useState("");
  const [customFood,setCustomFood]=useState({name:"",calories:"",protein:"",carbs:"",fat:""});
  const [mealFilter,setMealFilter]=useState("All");
  const [expandedMeal,setExpandedMeal]=useState(null);
  const [bodyImages,setBodyImages]=useState([]);
  const [showScanner,setShowScanner]=useState(false);
  const [scannerState,setScannerState]=useState("idle");
  const [scannedFood,setScannedFood]=useState(null);
  const [manualBarcode,setManualBarcode]=useState("");
  const [scanServing,setScanServing]=useState(100);
  const [scannedBarcode,setScannedBarcode]=useState("");
  const bodyImgRef=useRef();
  const barcodeVideoRef=useRef();
  const barcodeStreamRef=useRef(null);
  const today=todayStr();

  useEffect(()=>{
    try{
      const d=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
      if(d.workoutPlan)setWorkoutPlan(d.workoutPlan);
      if(d.workoutLogs)setWorkoutLogs(d.workoutLogs);
      if(d.workoutNotes)setWorkoutNotes(d.workoutNotes);
      if(d.calorieLog)setCalorieLog(d.calorieLog);
      if(d.bodyLog)setBodyLog(d.bodyLog);
      if(d.recoveryLog)setRecoveryLog(d.recoveryLog);
      if(d.checkins)setCheckins(d.checkins);
      if(d.calc)setCalc(c=>({...c,...d.calc}));
      if(d.calcResult)setCalcResult(d.calcResult);
      if(d.bodyImages)setBodyImages(d.bodyImages);
    }catch{}
  },[]);

  useEffect(()=>{
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({workoutPlan,workoutLogs,workoutNotes,calorieLog,bodyLog,recoveryLog,checkins,calc,calcResult,bodyImages}));}catch{}
  },[workoutPlan,workoutLogs,workoutNotes,calorieLog,bodyLog,recoveryLog,checkins,calc,calcResult,bodyImages]);

  const todayCals=calorieLog.filter(e=>e.date===today).reduce((s,e)=>s+e.calories,0);
  const todayP=calorieLog.filter(e=>e.date===today).reduce((s,e)=>s+(e.protein||0),0);
  const todayC=calorieLog.filter(e=>e.date===today).reduce((s,e)=>s+(e.carbs||0),0);
  const todayF=calorieLog.filter(e=>e.date===today).reduce((s,e)=>s+(e.fat||0),0);
  const weekCalData=getLast7().map(date=>({label:DAYS_SHORT[new Date(date+"T12:00:00").getDay()],calories:calorieLog.filter(e=>e.date===date).reduce((s,e)=>s+e.calories,0)}));

  function updSet(wId,exId,si,field,val){const key=`${wId}-${today}`;setWorkoutLogs(p=>{const l=p[key]?JSON.parse(JSON.stringify(p[key])):{};if(!l[exId])l[exId]={};if(!l[exId][si])l[exId][si]={};l[exId][si][field]=val;return{...p,[key]:l}});}
  function getSetV(wId,exId,si,field){return workoutLogs[`${wId}-${today}`]?.[exId]?.[si]?.[field]??"";}
  function toggleDone(wId,exId,si){const key=`${wId}-${today}`;setWorkoutLogs(p=>{const l=p[key]?JSON.parse(JSON.stringify(p[key])):{};if(!l[exId])l[exId]={};if(!l[exId][si])l[exId][si]={};l[exId][si].done=!l[exId][si].done;return{...p,[key]:l}});}
  function getNote(wId){return workoutNotes[`${wId}-${today}`]||"";}
  function setNote(wId,val){setWorkoutNotes(p=>({...p,[`${wId}-${today}`]:val}));}

  function getOverload(wId,exId){
    const entries=Object.entries(workoutLogs).filter(([k])=>k.startsWith(`${wId}-`)).sort(([a],[b])=>b.localeCompare(a));
    if(!entries.length)return null;
    const lastLog=entries[0][1][exId];if(!lastLog)return null;
    const sets=Object.values(lastLog);
    const weights=sets.map(s=>parseFloat(s.weight)).filter(Boolean);
    const reps=sets.map(s=>parseInt(s.reps)).filter(Boolean);
    const allDone=sets.every(s=>s.done);
    if(!weights.length)return null;
    const maxW=Math.max(...weights);
    const avgReps=reps.length?Math.round(reps.reduce((a,b)=>a+b,0)/reps.length):0;
    const workout=workoutPlan.find(w=>w.id===wId);
    const ex=workout?.exercises.find(e=>e.id===exId);
    if(!ex)return null;
    if(allDone&&avgReps>=ex.targetReps)return{suggestion:`Try ${maxW+2.5}kg`,reason:`Hit ${avgReps} reps at ${maxW}kg ✓`};
    if(avgReps<ex.targetReps-2)return{suggestion:`Stay at ${maxW}kg`,reason:`Build consistency first`};
    return{suggestion:`Maintain ${maxW}kg`,reason:`Aim to complete all sets`};
  }

  function getProgressData(wId,exId){
    return Object.entries(workoutLogs).filter(([k])=>k.startsWith(`${wId}-`)).map(([k,log])=>{
      const date=k.replace(`${wId}-`,"");const sets=log[exId];if(!sets)return null;
      const ws=Object.values(sets).map(s=>parseFloat(s.weight)).filter(Boolean);
      return ws.length?{date,label:date.slice(5),weight:Math.max(...ws)}:null;
    }).filter(Boolean).sort((a,b)=>a.date.localeCompare(b.date)).slice(-12);
  }

  function getAllPBs(){
    const pbs={};
    for(const[key,log]of Object.entries(workoutLogs)){
      const[wIdStr,date]=key.split(/-(.+)/);const wId=parseInt(wIdStr);
      const workout=workoutPlan.find(w=>w.id===wId);if(!workout)continue;
      for(const[exIdStr,sets]of Object.entries(log)){
        const ex=workout.exercises.find(e=>e.id===parseInt(exIdStr));if(!ex)continue;
        const ws=Object.values(sets).map(s=>parseFloat(s.weight)).filter(Boolean);if(!ws.length)continue;
        const max=Math.max(...ws);
        if(!pbs[ex.name]||max>pbs[ex.name].weight)pbs[ex.name]={weight:max,date,workoutName:workout.name};
      }
    }
    return Object.entries(pbs).map(([name,d])=>({name,...d})).sort((a,b)=>b.weight-a.weight);
  }

  function getRecentMuscles(){
    const result={};const last7=getLast7();
    for(const workout of workoutPlan){
      for(const date of last7){
        const key=`${workout.id}-${date}`;const log=workoutLogs[key];if(!log)continue;
        for(const ex of workout.exercises){
          if(!log[ex.id]||(ex.muscles||[]).length===0)continue;
          const hasSets=Object.values(log[ex.id]).some(s=>s.done||s.reps);
          if(hasSets)(ex.muscles||[]).forEach(m=>{result[m]=(result[m]||0)+1;});
        }
      }
    }
    return result;
  }

  function getVolumeData(){
    return getLast7().map(date=>{
      let vol=0;
      for(const w of workoutPlan){const log=workoutLogs[`${w.id}-${date}`];if(!log)continue;for(const[,exLog]of Object.entries(log)){for(const set of Object.values(exLog)){if(set.done&&set.weight&&set.reps)vol+=parseFloat(set.weight)*parseInt(set.reps);}}}
      return{label:DAYS_SHORT[new Date(date+"T12:00:00").getDay()],volume:Math.round(vol)};
    });
  }

  function est1RM(w,r){return r===1?w:Math.round(w*(1+r/30));}
  function startEdit(w){setEditDraft(JSON.parse(JSON.stringify(w)));setEditingWorkout(w.id);}
  function saveEdit(){setWorkoutPlan(p=>p.map(w=>w.id===editDraft.id?editDraft:w));setEditingWorkout(null);setEditDraft(null);}
  function addExToDraft(){const id=Math.max(0,...editDraft.exercises.map(e=>e.id))+1;setEditDraft(d=>({...d,exercises:[...d.exercises,{id,name:"",sets:3,targetReps:10,muscles:[]}]}));}
  function updDraftEx(exId,field,val){setEditDraft(d=>({...d,exercises:d.exercises.map(e=>e.id===exId?{...e,[field]:val}:e)}));}
  function remFromDraft(exId){setEditDraft(d=>({...d,exercises:d.exercises.filter(e=>e.id!==exId)}));}
  function confirmQuickAdd(wId){
    if(!quickDraft.name.trim())return;
    setWorkoutPlan(p=>p.map(w=>{if(w.id!==wId)return w;const newId=Math.max(0,...w.exercises.map(e=>e.id))+1;return{...w,exercises:[...w.exercises,{id:newId,name:quickDraft.name.trim(),sets:parseInt(quickDraft.sets)||3,targetReps:parseInt(quickDraft.targetReps)||10,muscles:quickDraft.muscles||[]}]};}));
    setQuickAddEx(null);setQuickDraft({name:"",sets:3,targetReps:10,muscles:[]});
  }
  function confirmImport(){
    if(!importPreview?.length)return;
    if(importMode==="replace")setWorkoutPlan(importPreview);
    else setWorkoutPlan(p=>[...p,...importPreview]);
    setShowImport(false);setImportText("");setImportPreview(null);
  }
  function runCalc(){
    const{age,gender,weight,height,activity,goal}=calc;
    if(!age||!weight||!height)return;
    const w=parseFloat(weight),h=parseFloat(height),a=parseInt(age);
    const bmr=gender==="male"?10*w+6.25*h-5*a+5:10*w+6.25*h-5*a-161;
    const tdee=Math.round(bmr*activity),target=tdee+GOALS[goal].adj;
    setCalcResult({bmr:Math.round(bmr),tdee,target,protein:Math.round(w*2.2),carbs:Math.round((target*0.4)/4),fat:Math.round((target*0.25)/9)});
  }
  function getTodayReadiness(){
    const r=recoveryLog[today];if(!r)return null;
    return Math.round((r.sleep/10*40)+(r.energy/5*30)+((5-r.soreness)/5*30));
  }
  function getStreak(){
    let streak=0;const d=new Date();
    while(true){const key=d.toISOString().split("T")[0];const trained=workoutPlan.some(w=>workoutLogs[`${w.id}-${key}`]);if(!trained)break;streak++;d.setDate(d.getDate()-1);}
    return streak;
  }
  async function startCamera(){
    setScannerState("scanning");setScannedFood(null);setScannedBarcode("");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      barcodeStreamRef.current=stream;
      if(barcodeVideoRef.current){barcodeVideoRef.current.srcObject=stream;barcodeVideoRef.current.play();}
      if("BarcodeDetector" in window){
        const detector=new window.BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e","code_128"]});
        let detected=false;
        const scan=async()=>{
          if(!barcodeVideoRef.current||detected)return;
          try{const codes=await detector.detect(barcodeVideoRef.current);if(codes.length>0){detected=true;const code=codes[0].rawValue;setScannedBarcode(code);stopCamera();await lookupBarcode(code);return;}}catch{}
          if(!detected)requestAnimationFrame(scan);
        };
        barcodeVideoRef.current.addEventListener("playing",()=>requestAnimationFrame(scan),{once:true});
      }else{setTimeout(()=>setScannerState("manual"),3000);}
    }catch{setScannerState("error");}
  }
  function stopCamera(){if(barcodeStreamRef.current){barcodeStreamRef.current.getTracks().forEach(t=>t.stop());barcodeStreamRef.current=null;}}
  function closeScanner(){stopCamera();setShowScanner(false);setScannerState("idle");setScannedFood(null);setScannedBarcode("");setManualBarcode("");setScanServing(100);}
  async function lookupBarcode(code){
    setScannerState("found");
    try{
      const res=await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data=await res.json();
      if(data.status===1&&data.product){
        const p=data.product;const n=p.nutriments;
        const per100=(key)=>parseFloat(n[key+"_100g"]??n[key]??0)||0;
        setScannedFood({name:p.product_name||"Unknown",brand:p.brands||"",calories:per100("energy-kcal"),protein:per100("proteins"),carbs:per100("carbohydrates"),fat:per100("fat"),image:p.image_front_small_url||null,barcode:code});
        setScanServing(100);
      }else{setScannedFood({notFound:true,barcode:code});}
    }catch{setScannedFood({notFound:true,barcode:code});}
  }
  function logScannedFood(){
    if(!scannedFood||scannedFood.notFound)return;
    const r=scanServing/100;
    setCalorieLog(p=>[...p,{name:`${scannedFood.name}${scannedFood.brand?` (${scannedFood.brand})`:""} – ${scanServing}g`,calories:Math.round(scannedFood.calories*r),protein:Math.round(scannedFood.protein*r*10)/10,carbs:Math.round(scannedFood.carbs*r*10)/10,fat:Math.round(scannedFood.fat*r*10)/10,date:today,id:Date.now()}]);
    closeScanner();
  }
  function handleBodyImg(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{setBodyImages(p=>[{url:ev.target.result,date:today,id:Date.now()},...p].slice(0,12));};
    reader.readAsDataURL(file);
  }

  const pbs=getAllPBs();
  const recentMuscles=getRecentMuscles();
  const readiness=getTodayReadiness();
  const streak=getStreak();
  const caloriesLeft=calcResult?Math.max(0,calcResult.target-todayCals):null;
  const mealCategories=["All","Breakfast","Lunch","Dinner","Snack"];
  const filteredMeals=mealFilter==="All"?MEAL_LIBRARY:MEAL_LIBRARY.filter(m=>m.category===mealFilter);
  const TABS=[
    {id:"home",icon:"⚡",label:"Home"},{id:"workout",icon:"🏋️",label:"Train"},
    {id:"progress",icon:"📈",label:"Progress"},{id:"pbs",icon:"🏆",label:"PBs"},
    {id:"calories",icon:"🥗",label:"Calories"},{id:"meals",icon:"🍽️",label:"Meals"},
    {id:"checkin",icon:"📋",label:"Check-In"},{id:"body",icon:"⚖️",label:"Body"},
    {id:"photos",icon:"📷",label:"Photos"},{id:"recovery",icon:"🌙",label:"Recovery"},
    {id:"analytics",icon:"📊",label:"Analytics"},{id:"calculator",icon:"🔢",label:"Calc"},
  ];
  const card={background:"#111118",border:"1px solid #1e1e2e",borderRadius:8,padding:20};
  const pill={background:"#111827",border:"1px solid #1e1e2e",borderRadius:6,padding:"10px 14px",textAlign:"center"};
  const lbl={fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase",marginBottom:6};
  return(
    <div style={{fontFamily:"'DM Mono','Courier New',monospace",background:"#0a0a0f",minHeight:"100vh",color:"#e8e4d9"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#d4ff00}
        input,select,textarea{background:#111827;border:1px solid #2a2a3a;color:#e8e4d9;padding:8px 12px;font-family:inherit;font-size:13px;border-radius:4px;outline:none}
        input{width:100%}input:focus,select:focus,textarea:focus{border-color:#d4ff00}
        textarea{width:100%;resize:vertical}
        .btn{background:#d4ff00;color:#0a0a0f;border:none;padding:10px 20px;font-family:inherit;font-size:13px;font-weight:500;border-radius:4px;cursor:pointer;transition:all .15s}
        .btn:hover{background:#bfe000}.btn:disabled{opacity:.5;cursor:not-allowed}
        .ghost{background:transparent;border:1px solid #2a2a3a;color:#e8e4d9;padding:8px 16px;font-family:inherit;font-size:12px;border-radius:4px;cursor:pointer;transition:all .15s}
        .ghost:hover{border-color:#d4ff00;color:#d4ff00}
        .tag{display:inline-block;background:#d4ff0022;color:#d4ff00;border:1px solid #d4ff0044;font-size:10px;padding:2px 8px;border-radius:2px;letter-spacing:1px;text-transform:uppercase}
        .done-btn{width:28px;height:28px;border-radius:4px;border:2px solid #2a2a3a;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .done-btn.chk{background:#d4ff00;border-color:#d4ff00}
        .pbar{height:6px;background:#1e1e2e;border-radius:3px;overflow:hidden;margin-top:6px}
        .pfill{height:100%;border-radius:3px;transition:width .4s}
        .hd{font-family:'Bebas Neue',sans-serif;letter-spacing:2px}
        .modal{position:fixed;inset:0;background:#000c;z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
        input[type=range]{-webkit-appearance:none;height:4px;background:#2a2a3a;border-radius:2px;border:none;padding:0}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:#d4ff00;border-radius:50%;cursor:pointer}
        @keyframes scanline{0%,100%{top:10%}50%{top:85%}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>

      <div style={{borderBottom:"1px solid #1e1e2e",padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
        <div className="hd" style={{fontSize:26,color:"#d4ff00",letterSpacing:3}}>FORGE</div>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          {readiness!=null&&<span style={{fontSize:10,color:readiness>70?"#4ade80":readiness>40?"#facc15":"#ef4444"}}>↑{readiness}</span>}
          {streak>0&&<span style={{fontSize:11,color:"#d4ff00"}}>🔥{streak}d</span>}
          <button className="ghost" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>setShowImport(true)}>⬆ Import</button>
        </div>
      </div>

      <div style={{display:"flex",borderBottom:"1px solid #1e1e2e",overflowX:"auto",padding:"0 8px"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",color:tab===t.id?"#d4ff00":"#444",padding:"11px 12px",cursor:"pointer",fontSize:10,fontFamily:"inherit",borderBottom:tab===t.id?"2px solid #d4ff00":"2px solid transparent",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:"18px 14px",maxWidth:860,margin:"0 auto"}}>

      {tab==="home"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="hd" style={{fontSize:24}}>DAILY OVERVIEW</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            {[["CALORIES",caloriesLeft!=null?`${Math.round(caloriesLeft)} left`:"—","Run calculator"],["PROTEIN",`${Math.round(todayP)}g`,calcResult?`of ${calcResult.protein}g`:"—"],["STREAK",streak?`${streak} days`:"Start!","Keep it going"]].map(([l,v,s])=>(
              <div key={l} style={{...card,padding:14,textAlign:"center"}}><div style={{fontSize:9,color:"#555",letterSpacing:1}}>{l}</div><div className="hd" style={{fontSize:22,color:"#d4ff00",margin:"4px 0"}}>{v}</div><div style={{fontSize:9,color:"#444"}}>{s}</div></div>
            ))}
          </div>
          {readiness!=null&&(
            <div style={{...card,background:readiness>70?"#0d1a0d":readiness>40?"#1a1800":"#1a0d0d",borderColor:readiness>70?"#4ade8044":readiness>40?"#facc1544":"#ef444444"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:11,color:"#555",marginBottom:4}}>TODAY'S READINESS</div><div className="hd" style={{fontSize:32,color:readiness>70?"#4ade80":readiness>40?"#facc15":"#ef4444"}}>{readiness}<span style={{fontSize:14,color:"#555"}}>/100</span></div></div>
                <div style={{fontSize:28}}>{readiness>70?"💪":readiness>40?"😐":"😴"}</div>
              </div>
              <div className="pbar" style={{marginTop:10}}><div className="pfill" style={{width:`${readiness}%`,background:readiness>70?"#4ade80":readiness>40?"#facc15":"#ef4444"}}/></div>
            </div>
          )}
          <div style={card}>
            <div className="hd" style={{fontSize:16,marginBottom:12}}>TODAY'S WORKOUTS</div>
            {workoutPlan.map(w=>{
              const key=`${w.id}-${today}`;
              const total=w.exercises.reduce((s,e)=>s+e.sets,0);
              const done=w.exercises.reduce((s,e)=>{for(let i=0;i<e.sets;i++)if(workoutLogs[key]?.[e.id]?.[i]?.done)s++;return s;},0);
              const pct=total?Math.round((done/total)*100):0;
              return(<div key={w.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1e1e2e"}}>
                <div><div style={{display:"flex",gap:8,alignItems:"center"}}><span className="tag" style={{fontSize:9}}>{w.day}</span><span style={{fontSize:13}}>{w.name}</span></div><div style={{fontSize:10,color:"#555",marginTop:3}}>{w.exercises.length} exercises</div></div>
                <div style={{display:"flex",alignItems:"center",gap:10}}><div className="hd" style={{fontSize:20,color:pct===100?"#d4ff00":"#555"}}>{pct}%</div><button className="ghost" style={{fontSize:10,padding:"4px 10px"}} onClick={()=>{setTab("workout");setActiveWorkout(w.id);}}>Go →</button></div>
              </div>);
            })}
          </div>
          <div style={card}><div className="hd" style={{fontSize:16,marginBottom:12}}>MUSCLE RECOVERY</div><MuscleHeatmap recentMuscles={recentMuscles}/></div>
          {pbs.length>0&&(<div style={{...card,borderColor:"#d4ff0033"}}><div className="hd" style={{fontSize:16,marginBottom:10,color:"#d4ff00"}}>LATEST PB 🏆</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:13}}>{pbs[0].name}</div><div style={{fontSize:10,color:"#555"}}>{pbs[0].date}</div></div><div className="hd" style={{fontSize:32,color:"#d4ff00"}}>{pbs[0].weight}kg</div></div></div>)}
        </div>
      )}

      {tab==="workout"&&(
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div><div className="hd" style={{fontSize:22}}>TRAINING LOG</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Log sets · notes · quick-add exercises</div></div>
          {workoutPlan.map(workout=>{
            const key=`${workout.id}-${today}`;
            const total=workout.exercises.reduce((s,e)=>s+e.sets,0);
            const done=workout.exercises.reduce((s,e)=>{for(let i=0;i<e.sets;i++)if(workoutLogs[key]?.[e.id]?.[i]?.done)s++;return s;},0);
            const pct=total?Math.round((done/total)*100):0;
            const isActive=activeWorkout===workout.id;
            if(editingWorkout===workout.id&&editDraft)return(
              <div key={workout.id} style={{...card,borderColor:"#d4ff0055"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{color:"#d4ff00",fontSize:12}}>EDITING: {workout.name}</div>
                  <div style={{display:"flex",gap:8}}><button className="btn" style={{padding:"6px 14px",fontSize:12}} onClick={saveEdit}>Save</button><button className="ghost" style={{padding:"6px 12px",fontSize:12}} onClick={()=>{setEditingWorkout(null);setEditDraft(null);}}>Cancel</button></div>
                </div>
                {editDraft.exercises.map(ex=>(
                  <div key={ex.id} style={{background:"#0d1117",border:"1px solid #1e1e2e",borderRadius:6,padding:12,marginBottom:10}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 55px 65px 24px",gap:7,marginBottom:8,alignItems:"center"}}>
                      <input value={ex.name} placeholder="Exercise name" onChange={e=>updDraftEx(ex.id,"name",e.target.value)}/>
                      <input type="number" value={ex.sets} onChange={e=>updDraftEx(ex.id,"sets",parseInt(e.target.value)||1)} style={{textAlign:"center"}}/>
                      <input type="number" value={ex.targetReps} onChange={e=>updDraftEx(ex.id,"targetReps",parseInt(e.target.value)||1)} style={{textAlign:"center"}}/>
                      <button onClick={()=>remFromDraft(ex.id)} style={{background:"transparent",border:"none",color:"#ff4444",cursor:"pointer",fontSize:18}}>×</button>
                    </div>
                    <div style={{fontSize:10,color:"#555",marginBottom:5}}>MUSCLE GROUPS</div>
                    <MusclePicker selected={ex.muscles||[]} onChange={val=>updDraftEx(ex.id,"muscles",val)}/>
                  </div>
                ))}
                <button className="ghost" style={{marginTop:8,fontSize:11}} onClick={addExToDraft}>+ Add Exercise</button>
              </div>
            );
            return(
              <div key={workout.id} style={card}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:8}}><span className="tag">{workout.day}</span><span className="hd" style={{fontSize:17}}>{workout.name}</span></div><div style={{fontSize:10,color:"#555",marginTop:3}}>{workout.exercises.length} exercises · {total} sets</div></div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                    <div className="hd" style={{fontSize:20,color:pct===100?"#d4ff00":"#e8e4d9"}}>{pct}%</div>
                    <div style={{display:"flex",gap:5}}>
                      <button className="ghost" style={{fontSize:10,padding:"3px 9px"}} onClick={()=>startEdit(workout)}>Edit</button>
                      <button className="ghost" style={{fontSize:10,padding:"3px 9px"}} onClick={()=>setActiveWorkout(isActive?null:workout.id)}>{isActive?"Collapse":"Log"}</button>
                      <button onClick={()=>{if(window.confirm(`Delete "${workout.name}"?`))setWorkoutPlan(p=>p.filter(w=>w.id!==workout.id));}} style={{background:"transparent",border:"1px solid #ff444455",color:"#ff4444",padding:"3px 9px",fontSize:10,borderRadius:4,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                    </div>
                  </div>
                </div>
                <div className="pbar"><div className="pfill" style={{width:`${pct}%`,background:"#d4ff00"}}/></div>
                {isActive&&(
                  <div style={{marginTop:18}}>
                    {workout.exercises.map(ex=>{
                      const suggestion=getOverload(workout.id,ex.id);
                      return(
                        <div key={ex.id} style={{marginBottom:16,background:"#0d1117",border:"1px solid #1e1e2e",borderRadius:6,padding:12}}>
                          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:14,color:"#d4ff00",fontWeight:500,marginBottom:4}}>{ex.name}</div>
                              {(ex.muscles||[]).length>0&&(<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{(ex.muscles||[]).map(m=>(<span key={m} style={{fontSize:9,background:"#1e1e2e",color:"#aaa",padding:"2px 7px",borderRadius:10,border:"1px solid #2a2a3a"}}>{m}</span>))}</div>)}
                            </div>
                            <button className="ghost" style={{fontSize:10,padding:"3px 8px",flexShrink:0,marginLeft:8}} onClick={()=>setProgressModal({wId:workout.id,exId:ex.id,name:ex.name})}>📈</button>
                          </div>
                          {suggestion&&(<div style={{background:"#d4ff0010",border:"1px solid #d4ff0033",borderRadius:4,padding:"6px 10px",marginBottom:8,fontSize:11}}><span style={{color:"#d4ff00",fontWeight:500}}>💡 {suggestion.suggestion}</span><span style={{color:"#555",marginLeft:8}}>{suggestion.reason}</span></div>)}
                          <div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 1fr 32px",gap:6,alignItems:"center",marginBottom:5}}>
                            {["#","KG","REPS","AIM","✓"].map(h=><div key={h} style={{fontSize:9,color:"#555",textAlign:"center"}}>{h}</div>)}
                          </div>
                          {Array.from({length:ex.sets}).map((_,i)=>{
                            const isDone=workoutLogs[key]?.[ex.id]?.[i]?.done;
                            const w=getSetV(workout.id,ex.id,i,"weight");
                            const r=getSetV(workout.id,ex.id,i,"reps");
                            const est=w&&r&&parseInt(r)>0?est1RM(parseFloat(w),parseInt(r)):null;
                            return(<div key={i}>
                              <div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 1fr 32px",gap:6,alignItems:"center",marginBottom:5,opacity:isDone?.5:1}}>
                                <div style={{fontSize:10,color:"#555",textAlign:"center"}}>{i+1}</div>
                                <input type="number" placeholder="0" value={w} onChange={e=>updSet(workout.id,ex.id,i,"weight",e.target.value)} style={{textAlign:"center"}}/>
                                <input type="number" placeholder="0" value={r} onChange={e=>updSet(workout.id,ex.id,i,"reps",e.target.value)} style={{textAlign:"center"}}/>
                                <div style={{fontSize:11,color:"#555",textAlign:"center"}}>{ex.targetReps}</div>
                                <button className={`done-btn${isDone?" chk":""}`} onClick={()=>toggleDone(workout.id,ex.id,i)}>{isDone&&<span style={{color:"#0a0a0f",fontSize:13,fontWeight:"bold"}}>✓</span>}</button>
                              </div>
                              {est&&isDone&&<div style={{fontSize:9,color:"#555",textAlign:"right",marginBottom:3}}>est. 1RM: {est}kg</div>}
                            </div>);
                          })}
                        </div>
                      );
                    })}
                    {quickAddEx===workout.id?(
                      <div style={{background:"#0d1117",border:"1px solid #d4ff0033",borderRadius:6,padding:12,marginBottom:14}}>
                        <div style={{fontSize:10,color:"#d4ff00",marginBottom:8}}>QUICK ADD EXERCISE</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 55px 65px",gap:7,marginBottom:8}}>
                          <input placeholder="Exercise name" value={quickDraft.name} onChange={e=>setQuickDraft(p=>({...p,name:e.target.value}))}/>
                          <input type="number" placeholder="Sets" value={quickDraft.sets} onChange={e=>setQuickDraft(p=>({...p,sets:e.target.value}))} style={{textAlign:"center"}}/>
                          <input type="number" placeholder="Reps" value={quickDraft.targetReps} onChange={e=>setQuickDraft(p=>({...p,targetReps:e.target.value}))} style={{textAlign:"center"}}/>
                        </div>
                        <div style={{fontSize:10,color:"#555",marginBottom:6}}>MUSCLE GROUPS</div>
                        <MusclePicker selected={quickDraft.muscles||[]} onChange={val=>setQuickDraft(p=>({...p,muscles:val}))}/>
                        <div style={{display:"flex",gap:7,marginTop:10}}>
                          <button className="btn" style={{fontSize:11,padding:"6px 14px"}} onClick={()=>confirmQuickAdd(workout.id)}>Add</button>
                          <button className="ghost" style={{fontSize:11,padding:"6px 12px"}} onClick={()=>setQuickAddEx(null)}>Cancel</button>
                        </div>
                      </div>
                    ):(
                      <button className="ghost" style={{fontSize:11,marginBottom:14}} onClick={()=>setQuickAddEx(workout.id)}>+ Add Exercise to Session</button>
                    )}
                    <div style={{borderTop:"1px solid #1e1e2e",paddingTop:14}}>
                      <div style={{...lbl}}>SESSION NOTES</div>
                      <textarea rows={3} placeholder="How did it feel? Any PRs, adjustments..." value={getNote(workout.id)} onChange={e=>setNote(workout.id,e.target.value)} style={{fontSize:12,lineHeight:1.6}}/>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab==="progress"&&(
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div className="hd" style={{fontSize:22}}>STRENGTH PROGRESS</div>
          {workoutPlan.map(w=>(
            <div key={w.id} style={card}>
              <div className="hd" style={{fontSize:16,color:"#d4ff00",marginBottom:14}}>{w.name}</div>
              {w.exercises.map(ex=>{
                const data=getProgressData(w.id,ex.id);
                const last=data.slice(-1)[0],first=data[0],gain=last&&first?last.weight-first.weight:0;
                return(<div key={ex.id} style={{marginBottom:22}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div><div style={{fontSize:13}}>{ex.name}</div>{(ex.muscles||[]).length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:3}}>{(ex.muscles||[]).map(m=><span key={m} style={{fontSize:9,background:"#1e1e2e",color:"#aaa",padding:"1px 6px",borderRadius:8}}>{m}</span>)}</div>}</div>
                    <div style={{textAlign:"right"}}>{last&&<div className="hd" style={{fontSize:20,color:"#d4ff00"}}>{last.weight}kg</div>}{gain!==0&&<div style={{fontSize:10,color:gain>0?"#4ade80":"#ef4444"}}>{gain>0?"+":""}{gain}kg</div>}</div>
                  </div>
                  {data.length<2?<div style={{fontSize:10,color:"#333",padding:"8px 0"}}>Log 2+ sessions to see chart</div>:(
                    <ResponsiveContainer width="100%" height={90}><LineChart data={data}><XAxis dataKey="label" tick={{fill:"#555",fontSize:9}}/><YAxis hide domain={["dataMin-2","dataMax+2"]}/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="weight" stroke="#d4ff00" strokeWidth={2} dot={{fill:"#d4ff00",r:3}} name="Weight" unit="kg"/></LineChart></ResponsiveContainer>
                  )}
                </div>);
              })}
            </div>
          ))}
        </div>
      )}

      {tab==="pbs"&&(
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div className="hd" style={{fontSize:22}}>PERSONAL BESTS</div>
          {pbs.length===0?<div style={{...card,textAlign:"center",padding:"50px 20px",color:"#555"}}>Log workouts with weight to see your PBs.</div>:(
            <div style={card}>{pbs.map((pb,i)=>(<div key={pb.name} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 0",borderBottom:i<pbs.length-1?"1px solid #1e1e2e":"none"}}><div className="hd" style={{fontSize:22,minWidth:30,textAlign:"center",color:i===0?"#d4ff00":i===1?"#aaa":i===2?"#cd7f32":"#444"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}</div><div style={{flex:1}}><div style={{fontSize:13}}>{pb.name}</div><div style={{fontSize:10,color:"#555",marginTop:2}}>{pb.workoutName} · {pb.date}</div></div><div className="hd" style={{fontSize:26,color:"#d4ff00"}}>{pb.weight}kg</div></div>))}</div>
          )}
        </div>
      )}

      {tab==="calories"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div className="hd" style={{fontSize:22}}>NUTRITION LOG</div>
            <button className="btn" style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",fontSize:12}} onClick={()=>{setShowScanner(true);setScannerState("idle");}}>📷 Scan</button>
          </div>
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div><div style={{fontSize:10,color:"#555"}}>TODAY</div><div className="hd" style={{fontSize:38,color:"#d4ff00",lineHeight:1}}>{Math.round(todayCals)}</div><div style={{fontSize:10,color:"#555"}}>kcal</div></div>
              {calcResult&&<div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#555"}}>Target</div><div className="hd" style={{fontSize:26}}>{calcResult.target}</div><div style={{fontSize:10,color:todayCals>calcResult.target?"#ef4444":"#4ade80"}}>{todayCals>calcResult.target?`+${Math.round(todayCals-calcResult.target)} over`:`${Math.round(calcResult.target-todayCals)} left`}</div></div>}
            </div>
            {calcResult&&<div className="pbar" style={{marginBottom:12}}><div className="pfill" style={{width:`${Math.min((todayCals/calcResult.target)*100,100)}%`,background:todayCals>calcResult.target?"#ef4444":"#d4ff00"}}/></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[["Protein",todayP],["Carbs",todayC],["Fat",todayF]].map(([l,v])=>(<div key={l} style={pill}><div style={{fontSize:9,color:"#555"}}>{l.toUpperCase()}</div><div className="hd" style={{fontSize:20,marginTop:3}}>{Math.round(v)}g</div></div>))}</div>
          </div>
          <div style={card}>
            <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:12}}>THIS WEEK</div>
            <ResponsiveContainer width="100%" height={140}><BarChart data={weekCalData} barSize={22}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false}/><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}}/><Tooltip content={<ChartTip/>}/>{calcResult&&<ReferenceLine y={calcResult.target} stroke="#d4ff0066" strokeDasharray="4 4"/>}<Bar dataKey="calories" fill="#d4ff0033" stroke="#d4ff00" strokeWidth={1} name="Calories" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
          </div>
          <div style={card}>
            <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>QUICK ADD</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{COMMON_FOODS.map(f=><button key={f.name} className="ghost" style={{fontSize:11}} onClick={()=>setCalorieLog(p=>[...p,{...f,date:today,id:Date.now()}])}>{f.name} · {f.calories}kcal</button>)}</div>
          </div>
          <div style={card}>
            <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>ADD CUSTOM</div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:7,marginBottom:8}}>{["name","calories","protein","carbs","fat"].map(f=><input key={f} type={f==="name"?"text":"number"} placeholder={f.charAt(0).toUpperCase()+f.slice(1)} value={customFood[f]} onChange={e=>setCustomFood(p=>({...p,[f]:e.target.value}))}/>)}</div>
            <button className="btn" onClick={()=>{if(!customFood.name||!customFood.calories)return;setCalorieLog(p=>[...p,{name:customFood.name,calories:parseFloat(customFood.calories)||0,protein:parseFloat(customFood.protein)||0,carbs:parseFloat(customFood.carbs)||0,fat:parseFloat(customFood.fat)||0,date:today,id:Date.now()}]);setCustomFood({name:"",calories:"",protein:"",carbs:"",fat:""});}}>+ Log Food</button>
          </div>
          {calorieLog.filter(e=>e.date===today).length>0&&(
            <div style={card}>
              <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>TODAY'S LOG</div>
              {calorieLog.filter(e=>e.date===today).map(entry=>(
                <div key={entry.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #1e1e2e"}}>
                  <div><div style={{fontSize:13}}>{entry.name}</div><div style={{fontSize:10,color:"#555"}}>P:{entry.protein||0}g C:{entry.carbs||0}g F:{entry.fat||0}g</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:9}}><span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{entry.calories}</span><button className="ghost" style={{fontSize:11,padding:"3px 7px"}} onClick={()=>setCalorieLog(p=>p.filter(e=>e.id!==entry.id))}>✕</button></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==="meals"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>MEAL LIBRARY</div><div style={{fontSize:11,color:"#555",marginTop:2}}>High protein · lean · ready to cook</div></div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{mealCategories.map(c=>(<button key={c} onClick={()=>setMealFilter(c)} style={{padding:"6px 14px",fontSize:11,background:mealFilter===c?"#d4ff00":"transparent",border:`1px solid ${mealFilter===c?"#d4ff00":"#2a2a3a"}`,borderRadius:20,cursor:"pointer",color:mealFilter===c?"#0a0a0f":"#aaa",fontFamily:"inherit"}}>{c}</button>))}</div>
          {filteredMeals.map(meal=>(
            <div key={meal.id} style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}} onClick={()=>setExpandedMeal(expandedMeal===meal.id?null:meal.id)}>
                <div style={{flex:1,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><span style={{fontSize:24}}>{meal.emoji}</span><div><div style={{fontSize:14,fontWeight:500}}>{meal.name}</div><div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}><span className="tag" style={{fontSize:9}}>{meal.category}</span>{meal.tags.map(t=><span key={t} style={{fontSize:9,background:"#1e1e2e",color:"#aaa",padding:"1px 6px",borderRadius:8,border:"1px solid #2a2a3a"}}>{t}</span>)}</div></div></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>{[["Cals",meal.calories+"kcal","#d4ff00"],["Protein",meal.protein+"g","#4ade80"],["Carbs",meal.carbs+"g","#facc15"],["Fat",meal.fat+"g","#f97316"]].map(([l,v,c])=>(<div key={l} style={{...pill,padding:"8px 10px"}}><div style={{fontSize:9,color:"#555"}}>{l}</div><div className="hd" style={{fontSize:15,color:c,marginTop:2}}>{v}</div></div>))}</div>
                </div>
                <div style={{fontSize:16,color:"#555",marginLeft:10,cursor:"pointer"}}>{expandedMeal===meal.id?"▲":"▼"}</div>
              </div>
              {expandedMeal===meal.id&&(
                <div style={{borderTop:"1px solid #1e1e2e",paddingTop:14}}>
                  <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:8}}>INGREDIENTS</div>
                  {meal.ingredients.map((ing,i)=>(<div key={i} style={{fontSize:12,padding:"5px 0",borderBottom:"1px solid #1e1e2e",display:"flex",gap:8}}><span style={{color:"#d4ff00"}}>·</span>{ing}</div>))}
                  <div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,margin:"14px 0 8px"}}>METHOD</div>
                  <div style={{fontSize:12,color:"#aaa",lineHeight:1.7}}>{meal.method}</div>
                  <button className="btn" style={{width:"100%",marginTop:14,padding:11,fontSize:12}} onClick={()=>setCalorieLog(p=>[...p,{name:meal.name,calories:meal.calories,protein:meal.protein,carbs:meal.carbs,fat:meal.fat,date:today,id:Date.now()}])}>+ Log this meal to today</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="checkin"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>WEEKLY CHECK-IN</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Log your week · track trends over time</div></div>
          <div style={card}>
            <div style={{...lbl}}>WEIGHT THIS WEEK (kg)</div>
            <input type="number" placeholder="e.g. 81.2" value={checkinForm.weight} onChange={e=>setCheckinForm(p=>({...p,weight:e.target.value}))} style={{marginBottom:16}}/>
            {[["mood","😐 Mood"],["energy","⚡ Energy"],["soreness","💢 Soreness"],["adherence","✅ Plan Adherence"]].map(([key,label])=>(
              <div key={key} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11,color:"#555"}}>{label}</span><span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{checkinForm[key]}/5</span></div>
                <input type="range" min="1" max="5" value={checkinForm[key]} onChange={e=>setCheckinForm(p=>({...p,[key]:parseInt(e.target.value)}))} style={{width:"100%"}}/>
              </div>
            ))}
            <div style={{...lbl,marginTop:8}}>NOTES</div>
            <textarea rows={3} placeholder="How was your week? Energy, diet, sleep, highlights..." value={checkinForm.notes} onChange={e=>setCheckinForm(p=>({...p,notes:e.target.value}))} style={{marginBottom:12,fontSize:12}}/>
            <button className="btn" style={{width:"100%",padding:13}} onClick={()=>{if(!checkinForm.weight)return;setCheckins(p=>[...p,{...checkinForm,date:today,id:Date.now()}]);setBodyLog(p=>{const f=p.filter(e=>e.date!==today);return[...f,{date:today,weight:parseFloat(checkinForm.weight),id:Date.now()}].sort((a,b)=>a.date.localeCompare(b.date));});setCheckinForm({weight:"",mood:3,energy:3,soreness:3,adherence:3,notes:""});}}>Save Check-In</button>
          </div>
          {checkins.length>0&&(
            <>
              {checkins.length>=2&&(<div style={card}><div className="hd" style={{fontSize:15,marginBottom:12,color:"#d4ff00"}}>WEIGHT TREND</div><ResponsiveContainer width="100%" height={120}><LineChart data={[...checkins].sort((a,b)=>a.date.localeCompare(b.date)).map(c=>({label:c.date.slice(5),weight:parseFloat(c.weight)}))}><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}} unit="kg" domain={["dataMin-1","dataMax+1"]}/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="weight" stroke="#d4ff00" strokeWidth={2} dot={{fill:"#d4ff00",r:4}} name="Weight" unit="kg"/></LineChart></ResponsiveContainer></div>)}
              <div style={card}>
                <div className="hd" style={{fontSize:15,marginBottom:12}}>CHECK-IN HISTORY</div>
                {[...checkins].reverse().map((c,i)=>(
                  <div key={c.id||i} style={{padding:"12px 0",borderBottom:"1px solid #1e1e2e"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:11,color:"#555"}}>{c.date}</span><span className="hd" style={{fontSize:22,color:"#d4ff00"}}>{c.weight}kg</span></div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:8}}>{[["Mood",c.mood],["Energy",c.energy],["Soreness",c.soreness],["Adherence",c.adherence]].map(([l,v])=>(<div key={l} style={pill}><div style={{fontSize:9,color:"#555"}}>{l}</div><div className="hd" style={{fontSize:16,color:"#d4ff00",marginTop:2}}>{v}/5</div></div>))}</div>
                    {c.notes&&<div style={{fontSize:12,color:"#aaa",background:"#0d1117",padding:"8px 10px",borderRadius:4,borderLeft:"2px solid #d4ff0055",lineHeight:1.6}}>{c.notes}</div>}
                    <button className="ghost" style={{fontSize:10,padding:"3px 8px",marginTop:8,borderColor:"#ff444455",color:"#ff4444"}} onClick={()=>setCheckins(p=>p.filter(x=>x.id!==c.id))}>Delete</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab==="body"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="hd" style={{fontSize:22}}>BODY WEIGHT</div>
          <div style={card}>
            <div style={{...lbl}}>LOG TODAY</div>
            <div style={{display:"flex",gap:8}}><input type="number" placeholder="e.g. 80.5" value={newWeight} onChange={e=>setNewWeight(e.target.value)} style={{maxWidth:180}}/><button className="btn" onClick={()=>{if(!newWeight)return;setBodyLog(p=>{const f=p.filter(e=>e.date!==today);return[...f,{date:today,weight:parseFloat(newWeight),id:Date.now()}].sort((a,b)=>a.date.localeCompare(b.date));});setNewWeight("");}}>Log (kg)</button></div>
          </div>
          {bodyLog.length>0&&(()=>{
            const s=[...bodyLog].sort((a,b)=>a.date.localeCompare(b.date));
            const latest=s[s.length-1].weight,first=s[0].weight,change=latest-first;
            return<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>{[["Now",`${latest}kg`],["Change",`${change>=0?"+":""}${change.toFixed(1)}kg`],["Low",`${Math.min(...s.map(e=>e.weight))}kg`],["High",`${Math.max(...s.map(e=>e.weight))}kg`]].map(([l,v])=>(<div key={l} style={pill}><div style={{fontSize:9,color:"#555"}}>{l.toUpperCase()}</div><div className="hd" style={{fontSize:18,marginTop:3,color:l==="Change"?(change<0?"#4ade80":change>0?"#ef4444":"#e8e4d9"):"#e8e4d9"}}>{v}</div></div>))}</div>
              <div style={card}><ResponsiveContainer width="100%" height={180}><LineChart data={s.map(e=>({...e,label:e.date.slice(5)}))}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e"/><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}} unit="kg" domain={["dataMin-1","dataMax+1"]}/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="weight" stroke="#d4ff00" strokeWidth={2} dot={{fill:"#d4ff00",r:3}} name="Weight" unit="kg"/></LineChart></ResponsiveContainer></div>
              <div style={card}>{s.slice().reverse().slice(0,10).map(entry=>(<div key={entry.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #1e1e2e"}}><span style={{fontSize:11,color:"#555"}}>{entry.date}</span><div style={{display:"flex",alignItems:"center",gap:10}}><span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{entry.weight}kg</span><button className="ghost" style={{fontSize:10,padding:"2px 7px"}} onClick={()=>setBodyLog(p=>p.filter(e=>e.id!==entry.id))}>✕</button></div></div>))}</div>
            </>;
          })()}
        </div>
      )}

      {tab==="photos"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>PROGRESS PHOTOS</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Track your visual progress over time</div></div>
          <div style={card}>
            <div style={{background:"#0d1117",border:"2px dashed #2a2a3a",borderRadius:6,padding:"28px",textAlign:"center",cursor:"pointer"}} onClick={()=>bodyImgRef.current?.click()}>
              <div style={{fontSize:32,marginBottom:8}}>📷</div>
              <div style={{fontSize:13,color:"#555"}}>Tap to add progress photo</div>
              <div style={{fontSize:10,color:"#333",marginTop:4}}>Full body · good lighting · consistent angle</div>
            </div>
            <input ref={bodyImgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBodyImg}/>
          </div>
          {bodyImages.length===0&&<div style={{...card,textAlign:"center",padding:"40px",color:"#555",fontSize:13}}>No photos yet. Add your first one above!</div>}
          {bodyImages.length>0&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{bodyImages.map((img,i)=>(<div key={img.id||i} style={{borderRadius:8,overflow:"hidden",border:"1px solid #1e1e2e"}}><img src={img.url} alt={img.date} style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",display:"block"}}/><div style={{background:"#0d1117cc",padding:"6px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,color:"#aaa"}}>{img.date}</span><button onClick={()=>setBodyImages(p=>p.filter((_,j)=>j!==i))} style={{background:"transparent",border:"none",color:"#ff4444",cursor:"pointer",fontSize:14}}>✕</button></div></div>))}</div>)}
        </div>
      )}

      {tab==="recovery"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>RECOVERY LOG</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Log sleep & energy for a readiness score</div></div>
          <div style={card}>
            {[["sleep","😴 Sleep Hours","1","12",recoveryLog[today]?.sleep||7,0.5],["energy","⚡ Energy Level","1","5",recoveryLog[today]?.energy||3,1],["soreness","💢 Soreness (1=none)","1","5",recoveryLog[today]?.soreness||1,1]].map(([key,label,min,max,val,step])=>(
              <div key={key} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11,color:"#555"}}>{label}</span><span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{val}{key==="sleep"?"h":"/5"}</span></div>
                <input type="range" min={min} max={max} step={step} value={val} onChange={e=>setRecoveryLog(p=>({...p,[today]:{...(p[today]||{sleep:7,energy:3,soreness:1}),[key]:parseFloat(e.target.value)}}))} style={{width:"100%"}}/>
              </div>
            ))}
            {readiness!=null&&(<div style={{background:readiness>70?"#0d1a0d":readiness>40?"#1a1800":"#1a0d0d",border:`1px solid ${readiness>70?"#4ade8044":readiness>40?"#facc1544":"#ef444444"}`,borderRadius:6,padding:14,marginTop:8,textAlign:"center"}}><div style={{fontSize:10,color:"#555",marginBottom:4}}>READINESS SCORE</div><div className="hd" style={{fontSize:40,color:readiness>70?"#4ade80":readiness>40?"#facc15":"#ef4444"}}>{readiness}<span style={{fontSize:16,color:"#555"}}>/100</span></div><div style={{fontSize:12,color:"#aaa",marginTop:6}}>{readiness>70?"Good to train hard today 💪":readiness>40?"Moderate session recommended":"Consider rest or light movement"}</div></div>)}
          </div>
        </div>
      )}

      {tab==="analytics"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="hd" style={{fontSize:22}}>ANALYTICS</div>
          <div style={card}><div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>WEEKLY VOLUME</div><ResponsiveContainer width="100%" height={160}><BarChart data={getVolumeData()} barSize={22}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false}/><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}}/><Tooltip content={<ChartTip/>}/><Bar dataKey="volume" fill="#d4ff0033" stroke="#d4ff00" strokeWidth={1} name="Volume (kg)" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>
          <div style={card}><div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>MUSCLE RECOVERY MAP</div><MuscleHeatmap recentMuscles={recentMuscles}/><div style={{display:"flex",gap:16,marginTop:12,fontSize:10,color:"#555"}}>{[["#4ade8055","Recovered"],["#facc1588","Trained"],["#ef444488","Fatigued"]].map(([bg,l])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:bg}}/>{l}</div>))}</div></div>
          <div style={card}><div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>CALORIE CONSISTENCY</div><ResponsiveContainer width="100%" height={130}><BarChart data={weekCalData} barSize={22}><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis hide/><Tooltip content={<ChartTip/>}/>{calcResult&&<ReferenceLine y={calcResult.target} stroke="#d4ff0066" strokeDasharray="4 4"/>}<Bar dataKey="calories" fill="#d4ff0033" stroke="#d4ff00" strokeWidth={1} name="Calories" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>
          {pbs.length>0&&(<div style={card}><div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>TOP LIFTS</div>{pbs.slice(0,5).map((pb,i)=>(<div key={pb.name} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12}}>{pb.name}</span><span className="hd" style={{fontSize:16,color:"#d4ff00"}}>{pb.weight}kg</span></div><div className="pbar"><div className="pfill" style={{width:`${Math.round((pb.weight/pbs[0].weight)*100)}%`,background:"#d4ff00"}}/></div></div>))}</div>)}
        </div>
      )}

      {tab==="calculator"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>CALORIE CALCULATOR</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Mifflin-St Jeor formula</div></div>
          <div style={card}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[["AGE","age","28"],["WEIGHT (kg)","weight","80"],["HEIGHT (cm)","height","178"]].map(([l,k,ph])=>(<div key={k}><div style={{...lbl}}>{l}</div><input type="number" placeholder={`e.g. ${ph}`} value={calc[k]} onChange={e=>setCalc(p=>({...p,[k]:e.target.value}))}/></div>))}<div><div style={{...lbl}}>GENDER</div><select value={calc.gender} onChange={e=>setCalc(p=>({...p,gender:e.target.value}))}><option value="male">Male</option><option value="female">Female</option></select></div></div>
            <div style={{marginTop:14}}><div style={{...lbl}}>ACTIVITY LEVEL</div>{ACTIVITY_LEVELS.map(al=>(<button key={al.factor} onClick={()=>setCalc(p=>({...p,activity:al.factor}))} style={{display:"flex",width:"100%",alignItems:"center",gap:10,padding:"9px 12px",marginBottom:5,background:calc.activity===al.factor?"#d4ff0015":"transparent",border:`1px solid ${calc.activity===al.factor?"#d4ff00":"#1e1e2e"}`,borderRadius:4,cursor:"pointer",color:"#e8e4d9",fontFamily:"inherit"}}><div style={{width:7,height:7,borderRadius:"50%",background:calc.activity===al.factor?"#d4ff00":"#2a2a3a",flexShrink:0}}/><div style={{textAlign:"left"}}><div style={{fontSize:12}}>{al.label}</div><div style={{fontSize:10,color:"#555"}}>{al.desc}</div></div></button>))}</div>
            <div style={{marginTop:14}}><div style={{...lbl}}>GOAL</div><div style={{display:"flex",gap:7}}>{GOALS.map((g,i)=><button key={g.label} onClick={()=>setCalc(p=>({...p,goal:i}))} style={{flex:1,padding:9,background:calc.goal===i?"#d4ff00":"transparent",border:`1px solid ${calc.goal===i?"#d4ff00":"#1e1e2e"}`,borderRadius:4,cursor:"pointer",color:calc.goal===i?"#0a0a0f":"#e8e4d9",fontFamily:"inherit",fontSize:11,fontWeight:calc.goal===i?600:400}}>{g.label}</button>)}</div></div>
            <button className="btn" style={{width:"100%",marginTop:16,padding:13}} onClick={runCalc}>CALCULATE →</button>
          </div>
          {calcResult&&(<div style={{...card,borderColor:"#d4ff0033"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>{[["BMR",calcResult.bmr,"Base rate"],["TDEE",calcResult.tdee,"With activity"],["Target",calcResult.target,GOALS[calc.goal].label]].map(([l,v,s])=>(<div key={l} style={{background:"#0a0a0f",border:"1px solid #1e1e2e",borderRadius:6,padding:12,textAlign:"center"}}><div style={{fontSize:9,color:"#555"}}>{l}</div><div className="hd" style={{fontSize:26,color:l==="Target"?"#d4ff00":"#e8e4d9",margin:"4px 0"}}>{v}</div><div style={{fontSize:9,color:"#555"}}>{s}</div></div>))}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[["Protein",calcResult.protein+"g"],["Carbs",calcResult.carbs+"g"],["Fat",calcResult.fat+"g"]].map(([l,v])=>(<div key={l} style={pill}><div style={{fontSize:9,color:"#555"}}>{l.toUpperCase()}</div><div className="hd" style={{fontSize:20,marginTop:3}}>{v}</div></div>))}</div></div>)}
        </div>
      )}
      </div>

      {progressModal&&(()=>{const data=getProgressData(progressModal.wId,progressModal.exId);return(<div className="modal"><div style={{...card,width:"100%",maxWidth:480,borderColor:"#d4ff0044"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div><div className="hd" style={{fontSize:16,color:"#d4ff00"}}>{progressModal.name}</div><div style={{fontSize:10,color:"#555"}}>Max weight per session</div></div><button className="ghost" onClick={()=>setProgressModal(null)}>Close</button></div>{data.length<2?<div style={{textAlign:"center",padding:"30px",color:"#555",fontSize:12}}>Log 2+ sessions to see chart.</div>:(<ResponsiveContainer width="100%" height={170}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e"/><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}} unit="kg"/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="weight" stroke="#d4ff00" strokeWidth={2} dot={{fill:"#d4ff00",r:4}} name="Weight" unit="kg"/></LineChart></ResponsiveContainer>)}</div></div>);})()}

      {showImport&&(<div className="modal"><div style={{...card,width:"100%",maxWidth:600,borderColor:"#d4ff0044",maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><div className="hd" style={{fontSize:18,color:"#d4ff00"}}>BULK IMPORT</div><div style={{fontSize:10,color:"#555"}}>Paste your plan in any format</div></div><button className="ghost" onClick={()=>{setShowImport(false);setImportText("");setImportPreview(null);}}>✕</button></div><textarea rows={9} placeholder={"Monday - Push Day\nBench Press 4x8\nOverhead Press 3x10\n\nWednesday - Pull Day\nDeadlift 4x5"} value={importText} onChange={e=>{setImportText(e.target.value);setImportPreview(null);}} style={{marginBottom:10,fontSize:12,lineHeight:1.7}}/><div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}><button className="btn" style={{padding:"8px 18px"}} onClick={()=>setImportPreview(parseBulk(importText))}>Preview</button><div style={{marginLeft:"auto",display:"flex",gap:7}}>{["replace","add"].map(m=><button key={m} onClick={()=>setImportMode(m)} style={{padding:"6px 12px",fontSize:11,background:importMode===m?"#d4ff00":"transparent",border:`1px solid ${importMode===m?"#d4ff00":"#2a2a3a"}`,borderRadius:4,cursor:"pointer",color:importMode===m?"#0a0a0f":"#e8e4d9",fontFamily:"inherit"}}>{m==="replace"?"Replace":"Add to plan"}</button>)}</div></div>{importPreview&&(<div><div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>{importPreview.length} WORKOUTS DETECTED</div>{importPreview.map((w,i)=>(<div key={i} style={{background:"#0d1117",border:"1px solid #1e1e2e",borderRadius:6,padding:10,marginBottom:7}}><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}><span className="tag" style={{fontSize:9}}>{w.day}</span><span className="hd" style={{fontSize:14}}>{w.name}</span></div>{w.exercises.map((ex,j)=><div key={j} style={{fontSize:11,color:"#aaa",padding:"2px 0"}}>· {ex.name} — {ex.sets}×{ex.targetReps}</div>)}</div>))}<button className="btn" style={{width:"100%",padding:11,marginTop:6}} onClick={confirmImport}>✓ Confirm Import</button></div>)}</div></div>)}

      {showScanner&&(<div className="modal" style={{alignItems:"flex-end",padding:0}}><div style={{background:"#0d1117",border:"1px solid #d4ff0033",borderRadius:"16px 16px 0 0",width:"100%",maxWidth:520,margin:"0 auto",maxHeight:"92vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:40,height:4,borderRadius:2,background:"#2a2a3a"}}/></div><div style={{padding:"0 20px 24px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div><div className="hd" style={{fontSize:20,color:"#d4ff00"}}>BARCODE SCANNER</div><div style={{fontSize:11,color:"#555"}}>Scan any food to auto-fill nutrition</div></div><button className="ghost" style={{fontSize:18,padding:"4px 10px"}} onClick={closeScanner}>✕</button></div>
      {scannerState==="idle"&&(<div style={{display:"flex",flexDirection:"column",gap:12}}><button className="btn" style={{width:"100%",padding:16,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onClick={startCamera}><span style={{fontSize:22}}>📷</span> Open Camera & Scan</button><div style={{textAlign:"center",fontSize:11,color:"#555"}}>— or enter barcode manually —</div><div style={{display:"flex",gap:8}}><input placeholder="e.g. 5000112548167" value={manualBarcode} onChange={e=>setManualBarcode(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}/><button className="btn" style={{padding:"8px 16px",whiteSpace:"nowrap"}} onClick={()=>{if(manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}>Search</button></div></div>)}
      {scannerState==="scanning"&&(<div><div style={{position:"relative",borderRadius:12,overflow:"hidden",background:"#000",marginBottom:14}}><video ref={barcodeVideoRef} style={{width:"100%",maxHeight:280,objectFit:"cover",display:"block"}} playsInline muted/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{width:220,height:120,border:"2px solid #d4ff00",borderRadius:8,boxShadow:"0 0 0 2000px rgba(0,0,0,0.4)",position:"relative"}}><div style={{position:"absolute",width:"100%",height:2,background:"linear-gradient(90deg,transparent,#d4ff00,transparent)",animation:"scanline 1.5s ease-in-out infinite"}}/></div></div></div><div style={{textAlign:"center",color:"#d4ff00",fontSize:13,marginBottom:14,animation:"pulse 1s ease-in-out infinite"}}>Hold barcode steady in the frame...</div><div style={{display:"flex",gap:8}}><button className="ghost" style={{flex:1}} onClick={()=>{stopCamera();setScannerState("manual");}}>Enter Manually</button><button className="ghost" style={{flex:1}} onClick={()=>{stopCamera();setScannerState("idle");}}>Cancel</button></div></div>)}
      {scannerState==="manual"&&(<div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{background:"#1a1400",border:"1px solid #facc1533",borderRadius:6,padding:12,fontSize:12,color:"#facc15"}}>⚠️ Enter the barcode number from the packaging.</div><div style={{display:"flex",gap:8}}><input placeholder="Barcode number" value={manualBarcode} onChange={e=>setManualBarcode(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}/><button className="btn" style={{padding:"8px 16px",whiteSpace:"nowrap"}} onClick={()=>{if(manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}>Look Up</button></div><button className="ghost" onClick={()=>setScannerState("idle")}>← Back</button></div>)}
      {scannerState==="found"&&(<div>{!scannedFood&&<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:28,marginBottom:12,animation:"spin 1s linear infinite"}}>⚙️</div><div style={{color:"#d4ff00",fontSize:13}}>Looking up {scannedBarcode}...</div></div>}{scannedFood?.notFound&&(<div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{background:"#1a0d0d",border:"1px solid #ef444433",borderRadius:8,padding:16,textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>🔍</div><div style={{fontSize:13,color:"#ef4444",marginBottom:4}}>Product not found</div></div><button className="btn" style={{width:"100%"}} onClick={()=>{setScannerState("idle");setScannedFood(null);setManualBarcode("");}}>Try Another</button></div>)}{scannedFood&&!scannedFood.notFound&&(<div style={{display:"flex",flexDirection:"column",gap:14}}><div style={{background:"#111118",border:"1px solid #d4ff0033",borderRadius:10,padding:16,display:"flex",gap:14,alignItems:"flex-start"}}>{scannedFood.image?<img src={scannedFood.image} alt={scannedFood.name} style={{width:64,height:64,objectFit:"contain",borderRadius:6,background:"#fff",padding:4,flexShrink:0}}/>:<div style={{width:64,height:64,borderRadius:6,background:"#1e1e2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🛒</div>}<div style={{flex:1}}><div style={{fontSize:14,fontWeight:500,lineHeight:1.3,marginBottom:3}}>{scannedFood.name}</div>{scannedFood.brand&&<div style={{fontSize:11,color:"#d4ff00"}}>{scannedFood.brand}</div>}</div></div><div style={{background:"#111118",border:"1px solid #1e1e2e",borderRadius:8,padding:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:11,color:"#555"}}>SERVING SIZE</span><div style={{display:"flex",alignItems:"center",gap:6}}><input type="number" value={scanServing} onChange={e=>setScanServing(Math.max(1,parseInt(e.target.value)||1))} style={{width:70,textAlign:"center",padding:"6px 8px"}}/><span style={{fontSize:12,color:"#555"}}>g</span></div></div><input type="range" min="5" max="500" step="5" value={scanServing} onChange={e=>setScanServing(parseInt(e.target.value))} style={{width:"100%",marginBottom:8}}/><div style={{display:"flex",justifyContent:"space-between",gap:6}}>{[30,50,100,150,200].map(s=><button key={s} onClick={()=>setScanServing(s)} style={{flex:1,padding:"5px 0",fontSize:11,background:scanServing===s?"#d4ff00":"transparent",border:`1px solid ${scanServing===s?"#d4ff00":"#2a2a3a"}`,borderRadius:4,cursor:"pointer",color:scanServing===s?"#0a0a0f":"#e8e4d9",fontFamily:"inherit"}}>{s}g</button>)}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>{[["Cals",Math.round(scannedFood.calories*scanServing/100),"kcal","#d4ff00"],["Protein",Math.round(scannedFood.protein*scanServing/100*10)/10,"g","#4ade80"],["Carbs",Math.round(scannedFood.carbs*scanServing/100*10)/10,"g","#facc15"],["Fat",Math.round(scannedFood.fat*scanServing/100*10)/10,"g","#f97316"]].map(([l,v,u,c])=>(<div key={l} style={{...pill}}><div style={{fontSize:9,color:"#555"}}>{l}</div><div className="hd" style={{fontSize:18,marginTop:3,color:c}}>{v}</div><div style={{fontSize:9,color:"#555"}}>{u}</div></div>))}</div><button className="btn" style={{width:"100%",padding:14,fontSize:14}} onClick={logScannedFood}>✓ Add {scanServing}g to Today's Log</button><button className="ghost" style={{width:"100%"}} onClick={()=>{setScannerState("idle");setScannedFood(null);setManualBarcode("");}}>Scan Another</button></div>)}</div>)}
      {scannerState==="error"&&(<div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{background:"#1a0d0d",border:"1px solid #ef444433",borderRadius:8,padding:16,textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>📵</div><div style={{fontSize:13,color:"#ef4444",marginBottom:4}}>Camera access denied</div><div style={{fontSize:11,color:"#555"}}>Enter barcode manually below.</div></div><div style={{display:"flex",gap:8}}><input placeholder="Barcode number" value={manualBarcode} onChange={e=>setManualBarcode(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}/><button className="btn" style={{padding:"8px 14px",whiteSpace:"nowrap"}} onClick={()=>{if(manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}>Go</button></div></div>)}
      </div></div></div>)}

    </div>
  );
}
