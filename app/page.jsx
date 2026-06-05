
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

const SK = "forge_v7";
const MUSCLE_GROUPS = ["Chest","Back","Shoulders","Biceps","Triceps","Quads","Hamstrings","Glutes","Calves","Core","Traps","Forearms"];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const EX_TYPES = ["Strength","Distance","Timed","Intervals"];
const ACTIVITY_LEVELS = [
  {label:"Sedentary",desc:"Little/no exercise",factor:1.2},
  {label:"Lightly Active",desc:"1–3 days/week",factor:1.375},
  {label:"Moderately Active",desc:"3–5 days/week",factor:1.55},
  {label:"Very Active",desc:"6–7 days/week",factor:1.725},
  {label:"Extra Active",desc:"Athlete/physical job",factor:1.9},
];
const GOALS = [{label:"Lose Weight",adj:-500},{label:"Maintain",adj:0},{label:"Build Muscle",adj:300}];
const COMMON_FOODS = [
  {name:"Chicken Breast (100g)",calories:165,protein:31,carbs:0,fat:3.6},
  {name:"White Rice (100g)",calories:130,protein:2.7,carbs:28,fat:0.3},
  {name:"Whole Egg",calories:78,protein:6,carbs:0.6,fat:5},
  {name:"Banana",calories:89,protein:1.1,carbs:23,fat:0.3},
  {name:"Oats (100g)",calories:389,protein:17,carbs:66,fat:7},
  {name:"Salmon (100g)",calories:208,protein:20,carbs:0,fat:13},
  {name:"Greek Yogurt (100g)",calories:59,protein:10,carbs:3.6,fat:0.4},
  {name:"Cottage Cheese (100g)",calories:98,protein:11,carbs:3.4,fat:4.3},
];

const BASE_EXERCISE_DB = {
  "Barbell Squat":{type:"Strength",muscles:["Quads","Glutes","Core","Hamstrings"]},
  "Front Squat":{type:"Strength",muscles:["Quads","Glutes","Core"]},
  "Box Squat":{type:"Strength",muscles:["Quads","Glutes"]},
  "Hack Squat":{type:"Strength",muscles:["Quads","Glutes"]},
  "Leg Press":{type:"Strength",muscles:["Quads","Glutes","Hamstrings"]},
  "Barbell Deadlift":{type:"Strength",muscles:["Back","Hamstrings","Glutes","Traps"]},
  "Romanian Deadlift":{type:"Strength",muscles:["Hamstrings","Glutes","Back"]},
  "Trap Bar Deadlift":{type:"Strength",muscles:["Back","Hamstrings","Glutes"]},
  "Good Mornings":{type:"Strength",muscles:["Back","Hamstrings"]},
  "Hip Thrust":{type:"Strength",muscles:["Glutes","Hamstrings"]},
  "Walking Lunges":{type:"Strength",muscles:["Quads","Glutes","Hamstrings"]},
  "Bulgarian Split Squat":{type:"Strength",muscles:["Quads","Glutes","Hamstrings"]},
  "Step-Up":{type:"Strength",muscles:["Quads","Glutes"]},
  "Calf Raises":{type:"Strength",muscles:["Calves"]},
  "Seated Calf Raises":{type:"Strength",muscles:["Calves"]},
  "Hamstring Curl":{type:"Strength",muscles:["Hamstrings"]},
  "Leg Extension":{type:"Strength",muscles:["Quads"]},
  "Back Extensions":{type:"Strength",muscles:["Back","Glutes","Hamstrings"]},
  "Barbell Bench Press":{type:"Strength",muscles:["Chest","Triceps","Shoulders"]},
  "Incline Barbell Bench Press":{type:"Strength",muscles:["Chest","Shoulders","Triceps"]},
  "Incline Dumbbell Press":{type:"Strength",muscles:["Chest","Shoulders","Triceps"]},
  "Flat Dumbbell Press":{type:"Strength",muscles:["Chest","Triceps"]},
  "Dumbbell Fly":{type:"Strength",muscles:["Chest"]},
  "Incline Dumbbell Fly":{type:"Strength",muscles:["Chest","Shoulders"]},
  "Cable Chest Fly":{type:"Strength",muscles:["Chest"]},
  "Cable Crossover":{type:"Strength",muscles:["Chest"]},
  "Dips":{type:"Strength",muscles:["Triceps","Chest","Shoulders"]},
  "Weighted Dips":{type:"Strength",muscles:["Triceps","Chest","Shoulders"]},
  "Push-Ups":{type:"Strength",muscles:["Chest","Triceps","Shoulders"]},
  "Pull-Ups":{type:"Strength",muscles:["Back","Biceps"]},
  "Weighted Pull-Ups":{type:"Strength",muscles:["Back","Biceps"]},
  "Chin-Ups":{type:"Strength",muscles:["Back","Biceps"]},
  "Lat Pulldown":{type:"Strength",muscles:["Back","Biceps"]},
  "Single Arm Pulldown":{type:"Strength",muscles:["Back","Biceps"]},
  "Straight Arm Pulldown":{type:"Strength",muscles:["Back"]},
  "Barbell Row":{type:"Strength",muscles:["Back","Biceps","Traps"]},
  "Dumbbell Row":{type:"Strength",muscles:["Back","Biceps"]},
  "Chest-Supported Row":{type:"Strength",muscles:["Back","Traps"]},
  "Cable Row":{type:"Strength",muscles:["Back","Biceps"]},
  "Face Pulls":{type:"Strength",muscles:["Shoulders","Traps"]},
  "Barbell Overhead Press":{type:"Strength",muscles:["Shoulders","Triceps"]},
  "Dumbbell Shoulder Press":{type:"Strength",muscles:["Shoulders","Triceps"]},
  "Cable Shoulder Press":{type:"Strength",muscles:["Shoulders","Triceps"]},
  "Arnold Press":{type:"Strength",muscles:["Shoulders","Triceps"]},
  "Lateral Raise":{type:"Strength",muscles:["Shoulders"]},
  "Cable Lateral Raise":{type:"Strength",muscles:["Shoulders"]},
  "Cable Rear Delt Fly":{type:"Strength",muscles:["Shoulders","Back"]},
  "Rear Delt Fly":{type:"Strength",muscles:["Shoulders","Back"]},
  "Upright Row":{type:"Strength",muscles:["Shoulders","Traps"]},
  "Shrugs":{type:"Strength",muscles:["Traps"]},
  "Barbell Curl":{type:"Strength",muscles:["Biceps"]},
  "Dumbbell Curl":{type:"Strength",muscles:["Biceps"]},
  "Incline Dumbbell Curl":{type:"Strength",muscles:["Biceps"]},
  "Hammer Curl":{type:"Strength",muscles:["Biceps","Forearms"]},
  "Cable Curl":{type:"Strength",muscles:["Biceps"]},
  "Preacher Curl":{type:"Strength",muscles:["Biceps"]},
  "Tricep Pushdown":{type:"Strength",muscles:["Triceps"]},
  "Rope Tricep Pushdown":{type:"Strength",muscles:["Triceps"]},
  "Skull Crushers":{type:"Strength",muscles:["Triceps"]},
  "Overhead Tricep Extension":{type:"Strength",muscles:["Triceps"]},
  "Cable Kickback":{type:"Strength",muscles:["Triceps"]},
  "Cable Wood Chop":{type:"Strength",muscles:["Core","Shoulders"]},
  "Behind-Body Cable Curl":{type:"Strength",muscles:["Biceps"]},
  "Plank":{type:"Timed",muscles:["Core"]},
  "RKC Plank":{type:"Timed",muscles:["Core","Glutes"]},
  "Hollow Body Hold":{type:"Timed",muscles:["Core"]},
  "Ab Wheel Rollout":{type:"Strength",muscles:["Core","Back"]},
  "Hanging Leg Raises":{type:"Strength",muscles:["Core"]},
  "Reverse Crunches":{type:"Strength",muscles:["Core"]},
  "Cable Twist":{type:"Strength",muscles:["Core"]},
  "Roman Chair Sit-Ups":{type:"Strength",muscles:["Core"]},
  "Deadbugs":{type:"Strength",muscles:["Core"]},
  "Bear Crawl":{type:"Timed",muscles:["Core","Shoulders"]},
  "Bear Crawl Holds":{type:"Timed",muscles:["Core","Shoulders"]},
  "Pallof Press":{type:"Strength",muscles:["Core"]},
  "Bird-Dog":{type:"Strength",muscles:["Core","Back"]},
  "Bicycle Crunches":{type:"Strength",muscles:["Core"]},
  "L-Sit":{type:"Timed",muscles:["Core","Shoulders"]},
  "Garhammer Raise":{type:"Strength",muscles:["Core"]},
  "Medicine Ball Slam":{type:"Strength",muscles:["Core","Shoulders"]},
  "Russian Twist":{type:"Strength",muscles:["Core"]},
  "Suitcase Carry":{type:"Timed",muscles:["Core","Forearms","Traps"]},
  "Running":{type:"Distance",muscles:["Quads","Hamstrings","Calves","Core"]},
  "Cycling":{type:"Distance",muscles:["Quads","Hamstrings","Calves"]},
  "Swimming":{type:"Distance",muscles:["Back","Shoulders","Core"]},
  "Rowing":{type:"Distance",muscles:["Back","Quads","Core"]},
  "Walking":{type:"Distance",muscles:["Quads","Hamstrings","Calves"]},
  "Treadmill Run":{type:"Distance",muscles:["Quads","Hamstrings","Calves"]},
  "Stairmaster":{type:"Timed",muscles:["Quads","Glutes","Calves"]},
  "Elliptical":{type:"Timed",muscles:["Quads","Hamstrings","Core"]},
  "Jump Rope":{type:"Timed",muscles:["Calves","Shoulders","Core"]},
  "HIIT":{type:"Intervals",muscles:["Full Body"]},
  "Assault Bike":{type:"Intervals",muscles:["Quads","Hamstrings","Shoulders","Core"]},
  "Sprints":{type:"Intervals",muscles:["Quads","Hamstrings","Glutes","Calves"]},
  "Kettlebell Swings":{type:"Strength",muscles:["Glutes","Hamstrings","Back","Shoulders"]},
  "Box Jump":{type:"Strength",muscles:["Quads","Glutes","Calves"]},
};

const DEFAULT_PLAN = [
  {id:1,day:"Monday",name:"Full Body Heavy",exercises:[
    {id:1,exName:"Barbell Squat",sets:4,targetReps:8},
    {id:2,exName:"Incline Dumbbell Press",sets:3,targetReps:10},
    {id:3,exName:"Barbell Row",sets:3,targetReps:10},
    {id:4,exName:"Lateral Raise",sets:3,targetReps:15},
    {id:5,exName:"Tricep Pushdown",sets:3,targetReps:12},
  ]},
  {id:2,day:"Wednesday",name:"Full Body Balanced",exercises:[
    {id:1,exName:"Romanian Deadlift",sets:3,targetReps:10},
    {id:2,exName:"Hip Thrust",sets:4,targetReps:10},
    {id:3,exName:"Lat Pulldown",sets:3,targetReps:10},
    {id:4,exName:"Dumbbell Shoulder Press",sets:3,targetReps:10},
    {id:5,exName:"Hammer Curl",sets:3,targetReps:12},
  ]},
  {id:3,day:"Friday",name:"Full Body Volume",exercises:[
    {id:1,exName:"Hack Squat",sets:3,targetReps:12},
    {id:2,exName:"Cable Chest Fly",sets:3,targetReps:15},
    {id:3,exName:"Cable Row",sets:3,targetReps:12},
    {id:4,exName:"Cable Lateral Raise",sets:3,targetReps:15},
    {id:5,exName:"Cable Curl",sets:3,targetReps:12},
  ]},
];

function todayStr(){return new Date().toISOString().split("T")[0];}
function getLast7(){return Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d.toISOString().split("T")[0];});}
function est1RM(w,r){return r===1?w:Math.round(w*(1+r/30));}
function formatPace(secs){const m=Math.floor(secs/60);const s=Math.round(secs%60);return`${m}:${s.toString().padStart(2,"0")}`;}

const ChartTip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return <div style={{background:"#111118",border:"1px solid #2a2a3a",borderRadius:4,padding:"8px 12px",fontSize:11}}>{label&&<div style={{color:"#555",marginBottom:3}}>{label}</div>}{payload.map((p,i)=><div key={i} style={{color:p.color||"#d4ff00"}}>{p.name}: <b>{p.value}{p.unit||""}</b></div>)}</div>;
};

function MuscleHeatmap({recentMuscles}){
  const intensity=g=>{const h=recentMuscles[g]||0;if(!h)return"#1e1e2e";if(h===1)return"#4ade8055";if(h===2)return"#facc1588";return"#ef444488";};
  const lbl=g=>{const h=recentMuscles[g]||0;if(!h)return"Recovered";if(h===1)return"Trained";if(h===2)return"Fatigued";return"Overtrained";};
  return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{MUSCLE_GROUPS.map(g=><div key={g} style={{background:intensity(g),border:"1px solid #2a2a3a",borderRadius:6,padding:"10px 12px",textAlign:"center"}}><div style={{fontSize:11,fontWeight:500}}>{g}</div><div style={{fontSize:9,color:"#aaa",marginTop:3}}>{lbl(g)}</div></div>)}</div>;
}

function MusclePicker({selected=[],onChange}){
  return <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>{MUSCLE_GROUPS.map(m=>{const on=(selected||[]).includes(m);return <button key={m} onClick={()=>{const c=selected||[];onChange(on?c.filter(x=>x!==m):[...c,m]);}} style={{padding:"4px 10px",fontSize:10,background:on?"#d4ff00":"transparent",border:`1px solid ${on?"#d4ff00":"#2a2a3a"}`,borderRadius:20,cursor:"pointer",color:on?"#0a0a0f":"#aaa",fontFamily:"inherit"}}>{m}</button>;})}</div>;
}
export default function App(){
  const [tab,setTab]=useState("home");
  const [workoutPlan,setWorkoutPlan]=useState(DEFAULT_PLAN);
  const [workoutLogs,setWorkoutLogs]=useState({});
  const [workoutNotes,setWorkoutNotes]=useState({});
  const [activeWorkout,setActiveWorkout]=useState(null);
  const [collapsedEx,setCollapsedEx]=useState({});
  const [exerciseDB,setExerciseDB]=useState(BASE_EXERCISE_DB);
  const [calorieLog,setCalorieLog]=useState([]);
  const [calDate,setCalDate]=useState(todayStr());
  const [bodyLog,setBodyLog]=useState([]);
  const [recoveryLog,setRecoveryLog]=useState({});
  const [checkins,setCheckins]=useState([]);
  const [checkinForm,setCheckinForm]=useState({weight:"",mood:3,energy:3,soreness:3,adherence:3,notes:""});
  const [calc,setCalc]=useState({age:"",gender:"male",weight:"",height:"",activity:1.55,goal:0});
  const [calcResult,setCalcResult]=useState(null);
  const [bodyImages,setBodyImages]=useState([]);
  const [selectedPhotos,setSelectedPhotos]=useState([]);
  const [compareMode,setCompareMode]=useState(false);
  const [photoGroupBy,setPhotoGroupBy]=useState("month");
  const [collapsedPhotoGroups,setCollapsedPhotoGroups]=useState({});
  const [progressCollapsed,setProgressCollapsed]=useState({});
  const [pbCollapsed,setPbCollapsed]=useState({strength:false,cardio:false});
  const [editingWorkout,setEditingWorkout]=useState(null);
  const [editDraft,setEditDraft]=useState(null);
  const [showImport,setShowImport]=useState(false);
  const [importText,setImportText]=useState("");
  const [importPreview,setImportPreview]=useState(null);
  const [importMode,setImportMode]=useState("replace");
  const [showDataModal,setShowDataModal]=useState(false);
  const [dataImportText,setDataImportText]=useState("");
  const [dataImportStatus,setDataImportStatus]=useState("");
  const [newWeight,setNewWeight]=useState("");
  const [customFood,setCustomFood]=useState({name:"",calories:"",protein:"",carbs:"",fat:""});
  const [showScanner,setShowScanner]=useState(false);
  const [scannerState,setScannerState]=useState("idle");
  const [scannedFood,setScannedFood]=useState(null);
  const [manualBarcode,setManualBarcode]=useState("");
  const [scanServing,setScanServing]=useState(100);
  const [scannedBarcode,setScannedBarcode]=useState("");
  const [progressModal,setProgressModal]=useState(null);
  const [dragState,setDragState]=useState(null);
  const [dragOver,setDragOver]=useState(null);
  const [showAddExModal,setShowAddExModal]=useState(null);
  const [newExSearch,setNewExSearch]=useState("");
  const [newExName,setNewExName]=useState("");
  const [newExType,setNewExType]=useState("Strength");
  const [newExMuscles,setNewExMuscles]=useState([]);
  const [newExSets,setNewExSets]=useState(3);
  const [newExReps,setNewExReps]=useState(10);
  const [collapsedHistoryWeeks,setCollapsedHistoryWeeks]=useState({});
  const [expandedHistorySession,setExpandedHistorySession]=useState(null);
  const bodyImgRef=useRef();
  const barcodeVideoRef=useRef();
  const barcodeStreamRef=useRef(null);
  const today=todayStr();

  useEffect(()=>{
    try{
      const d=JSON.parse(localStorage.getItem(SK)||"{}");
      if(d.workoutPlan)setWorkoutPlan(d.workoutPlan);
      if(d.workoutLogs)setWorkoutLogs(d.workoutLogs);
      if(d.workoutNotes)setWorkoutNotes(d.workoutNotes);
      if(d.exerciseDB)setExerciseDB({...BASE_EXERCISE_DB,...d.exerciseDB});
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
    try{localStorage.setItem(SK,JSON.stringify({workoutPlan,workoutLogs,workoutNotes,exerciseDB,calorieLog,bodyLog,recoveryLog,checkins,calc,calcResult,bodyImages}));}catch{}
  },[workoutPlan,workoutLogs,workoutNotes,exerciseDB,calorieLog,bodyLog,recoveryLog,checkins,calc,calcResult,bodyImages]);

  function logKey(wId,exName,date=today){return`${wId}||${exName}||${date}`;}
  function getSets(wId,exName,date=today){return workoutLogs[logKey(wId,exName,date)]||[];}
  function setSets(wId,exName,sets,date=today){setWorkoutLogs(p=>({...p,[logKey(wId,exName,date)]:sets}));}
  function updSetField(wId,exName,si,field,val){const sets=[...getSets(wId,exName)];if(!sets[si])sets[si]={};sets[si]={...sets[si],[field]:val};setSets(wId,exName,sets);}
  function toggleSetDone(wId,exName,si){
    const sets=[...getSets(wId,exName)];
    if(!sets[si])sets[si]={};
    sets[si]={...sets[si],done:!sets[si].done};
    if(sets[si].done){const allDone=sets.every(s=>s.done);if(allDone)setCollapsedEx(p=>({...p,[`${wId}||${exName}`]:true}));}
    setSets(wId,exName,sets);
  }
  function copySetDown(wId,exName,si){
    const sets=[...getSets(wId,exName)];
    if(!sets[si])return;
    if(!sets[si+1])sets[si+1]={};
    sets[si+1]={...sets[si+1],weight:sets[si].weight,reps:sets[si].reps,dist:sets[si].dist,time:sets[si].time,duration:sets[si].duration,intensity:sets[si].intensity,rounds:sets[si].rounds,workSecs:sets[si].workSecs,restSecs:sets[si].restSecs};
    setSets(wId,exName,sets);
  }
  function addSet(wId,exName){
    const sets=[...getSets(wId,exName)];
    const last=sets[sets.length-1]||{};
    sets.push({...last,done:false});
    setSets(wId,exName,sets);
    setWorkoutPlan(p=>p.map(w=>w.id!==wId?w:{...w,exercises:w.exercises.map(e=>e.exName===exName?{...e,sets:e.sets+1}:e)}));
  }
  function removeSet(wId,exName,si){
    const sets=[...getSets(wId,exName)];
    sets.splice(si,1);
    setSets(wId,exName,sets);
    setWorkoutPlan(p=>p.map(w=>w.id!==wId?w:{...w,exercises:w.exercises.map(e=>e.exName===exName&&e.sets>1?{...e,sets:e.sets-1}:e)}));
  }
  function handleDragStart(wId,idx){setDragState({wId,idx});}
  function handleDragOver(e,wId,idx){e.preventDefault();setDragOver({wId,idx});}
  function handleDrop(wId,toIdx){
    if(!dragState||dragState.wId!==wId)return;
    const fromIdx=dragState.idx;
    if(fromIdx===toIdx)return;
    setWorkoutPlan(p=>p.map(w=>{
      if(w.id!==wId)return w;
      const exs=[...w.exercises];
      const[moved]=exs.splice(fromIdx,1);
      exs.splice(toIdx,0,moved);
      return{...w,exercises:exs};
    }));
    setDragState(null);setDragOver(null);
  }
  function getUnifiedProgress(exName){
    const data=[];
    for(const[key,sets]of Object.entries(workoutLogs)){
      const parts=key.split("||");
      if(parts[1]!==exName)continue;
      const date=parts[2];
      const exType=exerciseDB[exName]?.type||"Strength";
      if(exType==="Strength"){const ws=sets.map(s=>parseFloat(s.weight)).filter(Boolean);if(ws.length)data.push({date,label:date.slice(5),value:Math.max(...ws),unit:"kg"});}
      else if(exType==="Distance"){const ds=sets.map(s=>parseFloat(s.dist)).filter(Boolean);if(ds.length)data.push({date,label:date.slice(5),value:Math.max(...ds),unit:"km"});}
      else if(exType==="Timed"){const ts=sets.map(s=>parseFloat(s.duration)).filter(Boolean);if(ts.length)data.push({date,label:date.slice(5),value:Math.max(...ts),unit:"min"});}
      else if(exType==="Intervals"){const rs=sets.map(s=>parseInt(s.rounds)).filter(Boolean);if(rs.length)data.push({date,label:date.slice(5),value:Math.max(...rs),unit:"rds"});}
    }
    return data.sort((a,b)=>a.date.localeCompare(b.date));
  }
  function getAllLoggedExercises(){
    const names=new Set();
    for(const key of Object.keys(workoutLogs)){const parts=key.split("||");if(parts[1])names.add(parts[1]);}
    return[...names].sort();
  }
  function getAllPBs(){
    const pbs={};
    for(const[key,sets]of Object.entries(workoutLogs)){
      const parts=key.split("||");
      const exName=parts[1],date=parts[2];
      if(!exName)continue;
      const exType=exerciseDB[exName]?.type||"Strength";
      let val=null,unit="";
      if(exType==="Strength"){const ws=sets.map(s=>parseFloat(s.weight)).filter(Boolean);if(ws.length){val=Math.max(...ws);unit="kg";}}
      else if(exType==="Distance"){const ds=sets.map(s=>parseFloat(s.dist)).filter(Boolean);if(ds.length){val=Math.max(...ds);unit="km";}}
      else if(exType==="Timed"){const ts=sets.map(s=>parseFloat(s.duration)).filter(Boolean);if(ts.length){val=Math.max(...ts);unit="min";}}
      else if(exType==="Intervals"){const rs=sets.map(s=>parseInt(s.rounds)).filter(Boolean);if(rs.length){val=Math.max(...rs);unit="rds";}}
      if(val!==null&&(!pbs[exName]||val>pbs[exName].value))pbs[exName]={value:val,unit,date,type:exType};
    }
    return pbs;
  }
  function getRecentMuscles(){
    const result={};
    for(const[key,sets]of Object.entries(workoutLogs)){
      const parts=key.split("||");
      const exName=parts[1],date=parts[2];
      if(!exName||!getLast7().includes(date))continue;
      if(sets.some(s=>s.done))(exerciseDB[exName]?.muscles||[]).forEach(m=>{result[m]=(result[m]||0)+1;});
    }
    return result;
  }
  function getVolumeData(){
    return getLast7().map(date=>{
      let vol=0;
      for(const[key,sets]of Object.entries(workoutLogs)){
        if(!key.endsWith(`||${date}`))continue;
        for(const s of sets){if(s.done&&s.weight&&s.reps)vol+=parseFloat(s.weight)*parseInt(s.reps);}
      }
      return{label:DAYS_SHORT[new Date(date+"T12:00:00").getDay()],volume:Math.round(vol)};
    });
  }
  function getWorkoutCompletion(w,date=today){
    let total=0,done=0;
    for(const ex of w.exercises){
      const sets=getSets(w.id,ex.exName,date);
      total+=ex.sets;
      done+=Math.min(sets.filter(s=>s.done).length,ex.sets);
    }
    return{total,done,pct:total?Math.round((done/total)*100):0};
  }

  // ── History helpers ───────────────────────────────────────────────────────
  function getSessionHistory(){
    // Build list of {wId, wName, date, exercises, pct, notes} for all logged dates
    const sessions=[];
    const seen=new Set();
    for(const key of Object.keys(workoutLogs)){
      const parts=key.split("||");
      if(parts.length<3)continue;
      const wId=parseInt(parts[0]),date=parts[2];
      const sessionKey=`${wId}-${date}`;
      if(seen.has(sessionKey))continue;
      seen.add(sessionKey);
      const workout=workoutPlan.find(w=>w.id===wId);
      if(!workout)continue;
      // only include if at least one set was done
      const hasDone=workout.exercises.some(ex=>getSets(wId,ex.exName,date).some(s=>s.done));
      if(!hasDone)continue;
      let total=0,done=0;
      const exDetails=workout.exercises.map(ex=>{
        const sets=getSets(wId,ex.exName,date);
        const doneSets=sets.filter(s=>s.done);
        total+=ex.sets;
        done+=Math.min(doneSets.length,ex.sets);
        return{exName:ex.exName,sets,targetReps:ex.targetReps,type:exerciseDB[ex.exName]?.type||"Strength"};
      });
      const pct=total?Math.round((done/total)*100):0;
      sessions.push({wId,wName:workout.name,wDay:workout.day,date,exDetails,pct,notes:workoutNotes[`${wId}-${date}`]||""});
    }
    return sessions.sort((a,b)=>b.date.localeCompare(a.date));
  }
  function getWeekLabel(dateStr){
    const d=new Date(dateStr+"T12:00:00");
    const day=d.getDay();
    const monday=new Date(d);
    monday.setDate(d.getDate()-(day===0?6:day-1));
    const sunday=new Date(monday);
    sunday.setDate(monday.getDate()+6);
    const fmt=dt=>dt.toLocaleDateString("en-GB",{day:"numeric",month:"short"});
    return`${fmt(monday)} – ${fmt(sunday)}`;
  }
  function groupSessionsByWeek(sessions){
    const groups={};
    for(const s of sessions){
      const label=getWeekLabel(s.date);
      if(!groups[label])groups[label]=[];
      groups[label].push(s);
    }
    return groups;
  }
  function formatSetSummary(set,type){
    if(type==="Strength")return`${set.weight||"—"}kg × ${set.reps||"—"}`;
    if(type==="Distance")return`${set.dist||"—"}km · ${set.time||"—"}min`;
    if(type==="Timed")return`${set.duration||"—"}min · effort ${set.intensity||"—"}/10`;
    if(type==="Intervals")return`${set.rounds||"—"} rds · ${set.workSecs||"—"}s/${set.restSecs||"—"}s`;
    return"—";
  }

  const viewCals=calorieLog.filter(e=>e.date===calDate).reduce((s,e)=>s+e.calories,0);
  const viewP=calorieLog.filter(e=>e.date===calDate).reduce((s,e)=>s+(e.protein||0),0);
  const viewC=calorieLog.filter(e=>e.date===calDate).reduce((s,e)=>s+(e.carbs||0),0);
  const viewF=calorieLog.filter(e=>e.date===calDate).reduce((s,e)=>s+(e.fat||0),0);
  const weekCalData=getLast7().map(date=>({label:DAYS_SHORT[new Date(date+"T12:00:00").getDay()],calories:calorieLog.filter(e=>e.date===date).reduce((s,e)=>s+e.calories,0)}));
  const todayCals=calorieLog.filter(e=>e.date===today).reduce((s,e)=>s+e.calories,0);
  const todayP=calorieLog.filter(e=>e.date===today).reduce((s,e)=>s+(e.protein||0),0);
  function getReadiness(){const r=recoveryLog[today];if(!r)return null;return Math.round((r.sleep/10*40)+(r.energy/5*30)+((5-r.soreness)/5*30));}
  function getStreak(){
    let s=0;const d=new Date();
    while(true){
      const k=d.toISOString().split("T")[0];
      const t=Object.keys(workoutLogs).some(key=>key.endsWith(`||${k}`)&&(workoutLogs[key]||[]).some(s=>s.done));
      if(!t)break;s++;d.setDate(d.getDate()-1);
    }
    return s;
  }
  function runCalc(){
    const{age,gender,weight,height,activity,goal}=calc;
    if(!age||!weight||!height)return;
    const w=parseFloat(weight),h=parseFloat(height),a=parseInt(age);
    const bmr=gender==="male"?10*w+6.25*h-5*a+5:10*w+6.25*h-5*a-161;
    const tdee=Math.round(bmr*activity),target=tdee+GOALS[goal].adj;
    setCalcResult({bmr:Math.round(bmr),tdee,target,protein:Math.round(w*2.2),carbs:Math.round((target*0.4)/4),fat:Math.round((target*0.25)/9)});
  }
  function handleBodyImg(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{setBodyImages(p=>[{url:ev.target.result,date:today,id:Date.now()},...p].slice(0,24));};
    reader.readAsDataURL(file);
  }
  function groupPhotos(imgs,by){
    const groups={};
    for(const img of imgs){
      const d=new Date(img.date+"T12:00:00");
      const key=by==="year"?`${d.getFullYear()}`:by==="month"?`${d.toLocaleString("default",{month:"long"})} ${d.getFullYear()}`:`Week of ${img.date.slice(0,10)}`;
      if(!groups[key])groups[key]=[];
      groups[key].push(img);
    }
    return groups;
  }
  async function startCamera(){
    setScannerState("scanning");setScannedFood(null);setScannedBarcode("");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      barcodeStreamRef.current=stream;
      if(barcodeVideoRef.current){barcodeVideoRef.current.srcObject=stream;barcodeVideoRef.current.play();}
      if("BarcodeDetector" in window){
        const det=new window.BarcodeDetector({formats:["ean_13","ean_8","upc_a","upc_e","code_128"]});
        let found=false;
        const scan=async()=>{
          if(!barcodeVideoRef.current||found)return;
          try{const codes=await det.detect(barcodeVideoRef.current);if(codes.length){found=true;const code=codes[0].rawValue;setScannedBarcode(code);stopCamera();await lookupBarcode(code);return;}}catch{}
          if(!found)requestAnimationFrame(scan);
        };
        barcodeVideoRef.current.addEventListener("playing",()=>requestAnimationFrame(scan),{once:true});
      }else setTimeout(()=>setScannerState("manual"),3000);
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
        const p=data.product,n=p.nutriments;
        const per100=k=>parseFloat(n[k+"_100g"]??n[k]??0)||0;
        setScannedFood({name:p.product_name||"Unknown",brand:p.brands||"",calories:per100("energy-kcal"),protein:per100("proteins"),carbs:per100("carbohydrates"),fat:per100("fat"),image:p.image_front_small_url||null,barcode:code});
        setScanServing(100);
      }else setScannedFood({notFound:true,barcode:code});
    }catch{setScannedFood({notFound:true,barcode:code});}
  }
  function logScannedFood(){
    if(!scannedFood||scannedFood.notFound)return;
    const r=scanServing/100;
    setCalorieLog(p=>[...p,{name:`${scannedFood.name}${scannedFood.brand?` (${scannedFood.brand})`:""} – ${scanServing}g`,calories:Math.round(scannedFood.calories*r),protein:Math.round(scannedFood.protein*r*10)/10,carbs:Math.round(scannedFood.carbs*r*10)/10,fat:Math.round(scannedFood.fat*r*10)/10,date:calDate,id:Date.now()}]);
    closeScanner();
  }
  function startEdit(w){setEditDraft(JSON.parse(JSON.stringify(w)));setEditingWorkout(w.id);}
  function saveEdit(){setWorkoutPlan(p=>p.map(w=>w.id===editDraft.id?editDraft:w));setEditingWorkout(null);setEditDraft(null);}
  function confirmAddEx(wId){
    const name=newExName.trim();if(!name)return;
    if(!exerciseDB[name])setExerciseDB(p=>({...p,[name]:{type:newExType,muscles:newExMuscles}}));
    setWorkoutPlan(p=>p.map(w=>{
      if(w.id!==wId)return w;
      const newId=Math.max(0,...w.exercises.map(e=>e.id))+1;
      return{...w,exercises:[...w.exercises,{id:newId,exName:name,sets:newExSets,targetReps:newExReps}]};
    }));
    setShowAddExModal(null);setNewExSearch("");setNewExName("");setNewExType("Strength");setNewExMuscles([]);setNewExSets(3);setNewExReps(10);
  }

  function exportData(){
    const data={version:"forge_v7",exportedAt:new Date().toISOString(),workoutPlan,workoutLogs,workoutNotes,exerciseDB,calorieLog,bodyLog,recoveryLog,checkins,calc,calcResult,bodyImages};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`forge-backup-${todayStr()}.json`;a.click();URL.revokeObjectURL(url);
  }
  function importData(jsonText){
    try{
      const d=JSON.parse(jsonText);
      if(d.version==="forge_v7"||d.workoutLogs){
        if(d.workoutPlan)setWorkoutPlan(d.workoutPlan);
        if(d.workoutLogs)setWorkoutLogs(d.workoutLogs);
        if(d.workoutNotes)setWorkoutNotes(d.workoutNotes);
        if(d.exerciseDB)setExerciseDB(p=>({...p,...d.exerciseDB}));
        if(d.calorieLog)setCalorieLog(d.calorieLog);
        if(d.bodyLog)setBodyLog(d.bodyLog);
        if(d.recoveryLog)setRecoveryLog(d.recoveryLog);
        if(d.checkins)setCheckins(d.checkins);
        if(d.calc)setCalc(c=>({...c,...d.calc}));
        if(d.calcResult)setCalcResult(d.calcResult);
        if(d.bodyImages)setBodyImages(d.bodyImages);
        setDataImportStatus("✅ Data imported successfully!");return;
      }
      if(d.workoutPlan&&Array.isArray(d.workoutPlan))setWorkoutPlan(d.workoutPlan.map(w=>({...w,exercises:(w.exercises||[]).map(e=>({...e,exName:e.exName||e.name||"Unknown"}))})));
      if(d.workoutLogs){
        const newLogs={};
        for(const[key,val]of Object.entries(d.workoutLogs)){
          if(key.includes("||")){newLogs[key]=val;continue;}
          const parts=key.split("-");
          if(parts.length>=4){
            const wId=parts[0],date=parts.slice(1).join("-");
            if(typeof val==="object"&&!Array.isArray(val)){
              for(const[exIdStr,exSets]of Object.entries(val)){
                const workout=d.workoutPlan?.find(w=>String(w.id)===String(wId));
                const ex=workout?.exercises?.find(e=>String(e.id)===String(exIdStr));
                const exName=ex?.exName||ex?.name||`Exercise ${exIdStr}`;
                const setsArr=Object.values(exSets||{});
                if(setsArr.length)newLogs[`${wId}||${exName}||${date}`]=setsArr;
              }
            }
          }
        }
        setWorkoutLogs(newLogs);
      }
      if(d.calorieLog)setCalorieLog(d.calorieLog);
      if(d.bodyLog)setBodyLog(d.bodyLog);
      if(d.bodyWeightLog)setBodyLog(d.bodyWeightLog);
      if(d.recoveryLog)setRecoveryLog(d.recoveryLog);
      if(d.checkins)setCheckins(d.checkins);
      if(d.weeklyCheckins)setCheckins(d.weeklyCheckins);
      if(d.calc)setCalc(c=>({...c,...d.calc}));
      if(d.calcResult)setCalcResult(d.calcResult);
      if(d.bodyImages)setBodyImages(d.bodyImages);
      setDataImportStatus("✅ Older version data migrated successfully!");
    }catch{setDataImportStatus("❌ Error reading file — make sure it's a valid FORGE backup JSON.");}
  }
  function parseBulk(text){
    const lines=text.split("\n").map(l=>l.trim()).filter(Boolean);
    const workouts=[];let cur=null;let eid=1;
    for(const line of lines){
      if(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|day\s*\d+)/i.test(line)||line.endsWith(":")){
        const p=line.replace(/:$/,"").split(/[-–:]/);
        cur={id:Date.now()+workouts.length,day:p[0].trim(),name:(p[1]||p[0]).trim(),exercises:[]};eid=1;workouts.push(cur);continue;
      }
      if(!cur){cur={id:Date.now(),day:"Day 1",name:"Workout",exercises:[]};workouts.push(cur);}
      const m=line.match(/^([A-Za-z\s()\/]+?)\s*[-–]?\s*(\d+)\s*[xX×]\s*(\d+)/);
      const sm=line.match(/(\d+)\s*sets?\s*(?:x|of|×)?\s*(\d+)\s*reps?/i);
      if(m)cur.exercises.push({id:eid++,exName:m[1].trim(),sets:parseInt(m[2]),targetReps:parseInt(m[3])});
      else if(sm){const n=line.replace(sm[0],"").replace(/^[-–\s]+|[-–\s]+$/g,"").trim();if(n)cur.exercises.push({id:eid++,exName:n,sets:parseInt(sm[1]),targetReps:parseInt(sm[2])});}
      else if(line.match(/^[A-Za-z]/))cur.exercises.push({id:eid++,exName:line.replace(/[*•\-–]/g,"").trim(),sets:3,targetReps:10});
    }
    return workouts.filter(w=>w.exercises.length>0);
  }
  function confirmImport(){
    if(!importPreview?.length)return;
    if(importMode==="replace")setWorkoutPlan(importPreview);
    else setWorkoutPlan(p=>[...p,...importPreview]);
    setShowImport(false);setImportText("");setImportPreview(null);
  }

  const pbs=getAllPBs();
  const recentMuscles=getRecentMuscles();
  const readiness=getReadiness();
  const streak=getStreak();
  const caloriesLeft=calcResult?Math.max(0,calcResult.target-todayCals):null;
  const allLoggedEx=getAllLoggedExercises();
  const strengthEx=allLoggedEx.filter(n=>(exerciseDB[n]?.type||"Strength")==="Strength");
  const cardioEx=allLoggedEx.filter(n=>["Distance","Timed","Intervals"].includes(exerciseDB[n]?.type));
  const strengthPBs=Object.entries(pbs).filter(([,v])=>v.type==="Strength");
  const cardioPBs=Object.entries(pbs).filter(([,v])=>["Distance","Timed","Intervals"].includes(v.type));

  const TABS=[
    {id:"home",icon:"⚡",label:"Home"},
    {id:"workout",icon:"🏋️",label:"Train"},
    {id:"history",icon:"📅",label:"History"},
    {id:"progress",icon:"📈",label:"Progress"},
    {id:"pbs",icon:"🏆",label:"PBs"},
    {id:"calories",icon:"🥗",label:"Calories"},
    {id:"checkin",icon:"📋",label:"Check-In"},
    {id:"body",icon:"⚖️",label:"Body"},
    {id:"photos",icon:"📷",label:"Photos"},
    {id:"recovery",icon:"🌙",label:"Recovery"},
    {id:"analytics",icon:"📊",label:"Analytics"},
    {id:"calculator",icon:"🔢",label:"Calc"},
  ];
  const card={background:"#111118",border:"1px solid #1e1e2e",borderRadius:8,padding:20};
  const pill={background:"#111827",border:"1px solid #1e1e2e",borderRadius:6,padding:"10px 14px",textAlign:"center"};
  const lbl={fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase",marginBottom:6};
  const sectionBtn=(collapsed,onClick,label)=>(
    <button onClick={onClick} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:"transparent",border:"none",cursor:"pointer",padding:"8px 0",fontFamily:"inherit"}}>
      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:2,color:"#d4ff00"}}>{label}</span>
      <span style={{color:"#555",fontSize:14}}>{collapsed?"▼":"▲"}</span>
    </button>
  );

  function ExerciseLog({wId,ex,logDate=today}){
    const exType=exerciseDB[ex.exName]?.type||"Strength";
    const exMuscles=exerciseDB[ex.exName]?.muscles||[];
    const sets=getSets(wId,ex.exName,logDate);
    const exColKey=`${wId}||${ex.exName}`;
    const isCollapsed=collapsedEx[exColKey];
    const doneCount=sets.filter(s=>s.done).length;
    const allDone=sets.length>0&&sets.every(s=>s.done);
    const typeColor=exType==="Strength"?"#d4ff00":exType==="Distance"?"#4ade80":exType==="Timed"?"#a78bfa":"#f97316";
    return(
      <div style={{marginBottom:10,background:"#0d1117",border:`1px solid ${allDone?"#d4ff0033":"#1e1e2e"}`,borderRadius:6,padding:12}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",cursor:"pointer",marginBottom:isCollapsed?0:10}} onClick={()=>setCollapsedEx(p=>({...p,[exColKey]:!p[exColKey]}))}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
              <div style={{fontSize:14,color:"#d4ff00",fontWeight:500}}>{ex.exName}</div>
              <span style={{fontSize:9,background:typeColor+"22",color:typeColor,padding:"1px 7px",borderRadius:10,border:`1px solid ${typeColor}44`}}>{exType}</span>
              {isCollapsed&&<span style={{fontSize:10,background:"#d4ff0022",color:"#d4ff00",padding:"1px 7px",borderRadius:10}}>{doneCount}/{ex.sets}</span>}
            </div>
            {exMuscles.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{exMuscles.map(m=><span key={m} style={{fontSize:9,background:"#1e1e2e",color:"#aaa",padding:"1px 6px",borderRadius:8}}>{m}</span>)}</div>}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginLeft:8,flexShrink:0}}>
            <button className="ghost" style={{fontSize:10,padding:"2px 7px"}} onClick={e=>{e.stopPropagation();setProgressModal({exName:ex.exName});}}>📈</button>
            <span style={{color:"#555",fontSize:12}}>{isCollapsed?"▼":"▲"}</span>
          </div>
        </div>
        {!isCollapsed&&(
          <div>
            {exType==="Strength"&&<div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 1fr 28px 28px 28px",gap:5,marginBottom:5,alignItems:"center"}}>{["#","KG","REPS","AIM","↓","−","✓"].map(h=><div key={h} style={{fontSize:9,color:"#555",textAlign:"center"}}>{h}</div>)}</div>}
            {exType==="Distance"&&<div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 1fr 28px 28px 28px",gap:5,marginBottom:5,alignItems:"center"}}>{["#","KM","MINS","PACE","↓","−","✓"].map(h=><div key={h} style={{fontSize:9,color:"#555",textAlign:"center"}}>{h}</div>)}</div>}
            {exType==="Timed"&&<div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 28px 28px 28px",gap:5,marginBottom:5,alignItems:"center"}}>{["#","MINS","INT","↓","−","✓"].map(h=><div key={h} style={{fontSize:9,color:"#555",textAlign:"center"}}>{h}</div>)}</div>}
            {exType==="Intervals"&&<div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 1fr 28px 28px 28px",gap:5,marginBottom:5,alignItems:"center"}}>{["#","RDS","WORK","REST","↓","−","✓"].map(h=><div key={h} style={{fontSize:9,color:"#555",textAlign:"center"}}>{h}</div>)}</div>}
            {Array.from({length:ex.sets}).map((_,i)=>{
              const s=sets[i]||{};
              const isDone=s.done;
              const pace=s.dist&&s.time?(parseFloat(s.time)/parseFloat(s.dist)):null;
              const btnStyle={background:"#1e1e2e",border:"none",borderRadius:3,cursor:"pointer",height:26,width:26};
              return(
                <div key={i} style={{opacity:isDone?.5:1,marginBottom:5}}>
                  {exType==="Strength"&&(
                    <div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 1fr 28px 28px 28px",gap:5,alignItems:"center"}}>
                      <div style={{fontSize:10,color:"#555",textAlign:"center"}}>{i+1}</div>
                      <input type="number" placeholder="0" value={s.weight||""} onChange={e=>updSetField(wId,ex.exName,i,"weight",e.target.value)} style={{textAlign:"center",padding:"6px 4px",fontSize:12}}/>
                      <input type="number" placeholder="0" value={s.reps||""} onChange={e=>updSetField(wId,ex.exName,i,"reps",e.target.value)} style={{textAlign:"center",padding:"6px 4px",fontSize:12}}/>
                      <div style={{fontSize:11,color:"#555",textAlign:"center"}}>{ex.targetReps}</div>
                      <button onClick={()=>copySetDown(wId,ex.exName,i)} style={{...btnStyle,color:"#aaa",fontSize:11}}>↓</button>
                      <button onClick={()=>removeSet(wId,ex.exName,i)} style={{...btnStyle,color:"#ff4444",fontSize:14}}>−</button>
                      <button className={`done-btn${isDone?" chk":""}`} onClick={()=>toggleSetDone(wId,ex.exName,i)}>{isDone&&<span style={{color:"#0a0a0f",fontSize:12,fontWeight:"bold"}}>✓</span>}</button>
                    </div>
                  )}
                  {exType==="Distance"&&(
                    <div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 1fr 28px 28px 28px",gap:5,alignItems:"center"}}>
                      <div style={{fontSize:10,color:"#555",textAlign:"center"}}>{i+1}</div>
                      <input type="number" placeholder="km" value={s.dist||""} onChange={e=>updSetField(wId,ex.exName,i,"dist",e.target.value)} style={{textAlign:"center",padding:"6px 4px",fontSize:12}}/>
                      <input type="number" placeholder="min" value={s.time||""} onChange={e=>updSetField(wId,ex.exName,i,"time",e.target.value)} style={{textAlign:"center",padding:"6px 4px",fontSize:12}}/>
                      <div style={{fontSize:10,color:"#4ade80",textAlign:"center"}}>{pace?`${formatPace(pace*60)}/km`:"—"}</div>
                      <button onClick={()=>copySetDown(wId,ex.exName,i)} style={{...btnStyle,color:"#aaa",fontSize:11}}>↓</button>
                      <button onClick={()=>removeSet(wId,ex.exName,i)} style={{...btnStyle,color:"#ff4444",fontSize:14}}>−</button>
                      <button className={`done-btn${isDone?" chk":""}`} onClick={()=>toggleSetDone(wId,ex.exName,i)}>{isDone&&<span style={{color:"#0a0a0f",fontSize:12,fontWeight:"bold"}}>✓</span>}</button>
                    </div>
                  )}
                  {exType==="Timed"&&(
                    <div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 28px 28px 28px",gap:5,alignItems:"center"}}>
                      <div style={{fontSize:10,color:"#555",textAlign:"center"}}>{i+1}</div>
                      <input type="number" placeholder="mins" value={s.duration||""} onChange={e=>updSetField(wId,ex.exName,i,"duration",e.target.value)} style={{textAlign:"center",padding:"6px 4px",fontSize:12}}/>
                      <input type="number" placeholder="1-10" min="1" max="10" value={s.intensity||""} onChange={e=>updSetField(wId,ex.exName,i,"intensity",e.target.value)} style={{textAlign:"center",padding:"6px 4px",fontSize:12}}/>
                      <button onClick={()=>copySetDown(wId,ex.exName,i)} style={{...btnStyle,color:"#aaa",fontSize:11}}>↓</button>
                      <button onClick={()=>removeSet(wId,ex.exName,i)} style={{...btnStyle,color:"#ff4444",fontSize:14}}>−</button>
                      <button className={`done-btn${isDone?" chk":""}`} onClick={()=>toggleSetDone(wId,ex.exName,i)}>{isDone&&<span style={{color:"#0a0a0f",fontSize:12,fontWeight:"bold"}}>✓</span>}</button>
                    </div>
                  )}
                  {exType==="Intervals"&&(
                    <div>
                      <div style={{display:"grid",gridTemplateColumns:"20px 1fr 1fr 1fr 28px 28px 28px",gap:5,alignItems:"center"}}>
                        <div style={{fontSize:10,color:"#555",textAlign:"center"}}>{i+1}</div>
                        <input type="number" placeholder="rds" value={s.rounds||""} onChange={e=>updSetField(wId,ex.exName,i,"rounds",e.target.value)} style={{textAlign:"center",padding:"6px 4px",fontSize:12}}/>
                        <input type="number" placeholder="s" value={s.workSecs||""} onChange={e=>updSetField(wId,ex.exName,i,"workSecs",e.target.value)} style={{textAlign:"center",padding:"6px 4px",fontSize:12}}/>
                        <input type="number" placeholder="s" value={s.restSecs||""} onChange={e=>updSetField(wId,ex.exName,i,"restSecs",e.target.value)} style={{textAlign:"center",padding:"6px 4px",fontSize:12}}/>
                        <button onClick={()=>copySetDown(wId,ex.exName,i)} style={{...btnStyle,color:"#aaa",fontSize:11}}>↓</button>
                        <button onClick={()=>removeSet(wId,ex.exName,i)} style={{...btnStyle,color:"#ff4444",fontSize:14}}>−</button>
                        <button className={`done-btn${isDone?" chk":""}`} onClick={()=>toggleSetDone(wId,ex.exName,i)}>{isDone&&<span style={{color:"#0a0a0f",fontSize:12,fontWeight:"bold"}}>✓</span>}</button>
                      </div>
                      {s.rounds&&s.workSecs&&<div style={{fontSize:10,color:"#f97316",textAlign:"right",marginTop:2}}>Work: {Math.round(s.rounds*s.workSecs/60)}min · Rest: {Math.round(s.rounds*(s.restSecs||0)/60)}min</div>}
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={()=>addSet(wId,ex.exName)} style={{background:"#1e1e2e",border:"none",color:"#d4ff00",borderRadius:3,cursor:"pointer",fontSize:11,padding:"4px 10px",marginTop:4,fontFamily:"inherit"}}>+ Add Set</button>
          </div>
        )}
      </div>
    );
  }
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
        .drag-over{border-color:#d4ff00!important;background:#d4ff0008!important}
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
          <button className="ghost" style={{fontSize:11,padding:"4px 10px"}} onClick={()=>{setShowDataModal(true);setDataImportStatus("");setDataImportText("");}}>💾 Data</button>
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
                <div><div style={{fontSize:11,color:"#555",marginBottom:4}}>READINESS</div><div className="hd" style={{fontSize:32,color:readiness>70?"#4ade80":readiness>40?"#facc15":"#ef4444"}}>{readiness}<span style={{fontSize:14,color:"#555"}}>/100</span></div></div>
                <div style={{fontSize:28}}>{readiness>70?"💪":readiness>40?"😐":"😴"}</div>
              </div>
              <div className="pbar" style={{marginTop:10}}><div className="pfill" style={{width:`${readiness}%`,background:readiness>70?"#4ade80":readiness>40?"#facc15":"#ef4444"}}/></div>
            </div>
          )}
          <div style={card}>
            <div className="hd" style={{fontSize:16,marginBottom:12}}>TODAY'S WORKOUTS</div>
            {workoutPlan.map(w=>{
              const{pct}=getWorkoutCompletion(w);
              return(
                <div key={w.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #1e1e2e"}}>
                  <div><div style={{display:"flex",gap:8,alignItems:"center"}}><span className="tag" style={{fontSize:9}}>{w.day}</span><span style={{fontSize:13}}>{w.name}</span></div><div style={{fontSize:10,color:"#555",marginTop:3}}>{w.exercises.length} exercises</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}><div className="hd" style={{fontSize:20,color:pct===100?"#d4ff00":"#555"}}>{pct}%</div><button className="ghost" style={{fontSize:10,padding:"4px 10px"}} onClick={()=>{setTab("workout");setActiveWorkout(w.id);}}>Go →</button></div>
                </div>
              );
            })}
          </div>
          <div style={card}><div className="hd" style={{fontSize:16,marginBottom:12}}>MUSCLE RECOVERY</div><MuscleHeatmap recentMuscles={recentMuscles}/></div>
          {strengthPBs.length>0&&<div style={{...card,borderColor:"#d4ff0033"}}><div className="hd" style={{fontSize:16,marginBottom:10,color:"#d4ff00"}}>LATEST PB 🏆</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:13}}>{strengthPBs[0][0]}</div><div style={{fontSize:10,color:"#555"}}>{strengthPBs[0][1].date}</div></div><div className="hd" style={{fontSize:32,color:"#d4ff00"}}>{strengthPBs[0][1].value}{strengthPBs[0][1].unit}</div></div></div>}
        </div>
      )}

      {tab==="workout"&&(
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          <div><div className="hd" style={{fontSize:22}}>TRAINING LOG</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Drag ⠿ to reorder · tap to collapse · ↓ copies set down</div></div>
          {workoutPlan.map(workout=>{
            const{pct,total}=getWorkoutCompletion(workout);
            const isActive=activeWorkout===workout.id;
            if(editingWorkout===workout.id&&editDraft)return(
              <div key={workout.id} style={{...card,borderColor:"#d4ff0055"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{color:"#d4ff00",fontSize:12}}>EDITING: {workout.name}</div>
                  <div style={{display:"flex",gap:8}}><button className="btn" style={{padding:"6px 14px",fontSize:12}} onClick={saveEdit}>Save</button><button className="ghost" style={{padding:"6px 12px",fontSize:12}} onClick={()=>{setEditingWorkout(null);setEditDraft(null);}}>Cancel</button></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  <input value={editDraft.name} onChange={e=>setEditDraft(d=>({...d,name:e.target.value}))} placeholder="Workout name"/>
                  <input value={editDraft.day} onChange={e=>setEditDraft(d=>({...d,day:e.target.value}))} placeholder="Day"/>
                </div>
                {editDraft.exercises.map((ex,i)=>(
                  <div key={ex.id||i} style={{background:"#0d1117",border:"1px solid #1e1e2e",borderRadius:6,padding:10,marginBottom:8}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 55px 65px 24px",gap:7,alignItems:"center"}}>
                      <input value={ex.exName} placeholder="Exercise" onChange={e=>setEditDraft(d=>({...d,exercises:d.exercises.map((x,j)=>j===i?{...x,exName:e.target.value}:x)}))}/>
                      <input type="number" value={ex.sets} onChange={e=>setEditDraft(d=>({...d,exercises:d.exercises.map((x,j)=>j===i?{...x,sets:parseInt(e.target.value)||1}:x)}))} style={{textAlign:"center"}}/>
                      <input type="number" value={ex.targetReps} onChange={e=>setEditDraft(d=>({...d,exercises:d.exercises.map((x,j)=>j===i?{...x,targetReps:parseInt(e.target.value)||1}:x)}))} style={{textAlign:"center"}}/>
                      <button onClick={()=>setEditDraft(d=>({...d,exercises:d.exercises.filter((_,j)=>j!==i)}))} style={{background:"transparent",border:"none",color:"#ff4444",cursor:"pointer",fontSize:18}}>×</button>
                    </div>
                  </div>
                ))}
                <button className="ghost" style={{marginTop:6,fontSize:11}} onClick={()=>setEditDraft(d=>({...d,exercises:[...d.exercises,{id:Date.now(),exName:"",sets:3,targetReps:10}]}))}>+ Add Exercise</button>
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
                      <button onClick={()=>{if(window.confirm(`Delete "${workout.name}"?`))setWorkoutPlan(p=>p.filter(w=>w.id!==workout.id));}} style={{background:"transparent",border:"1px solid #ff444455",color:"#ff4444",padding:"3px 9px",fontSize:10,borderRadius:4,cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                    </div>
                  </div>
                </div>
                <div className="pbar"><div className="pfill" style={{width:`${pct}%`,background:"#d4ff00"}}/></div>
                {isActive&&(
                  <div style={{marginTop:18}}>
                    {workout.exercises.map((ex,idx)=>(
                      <div key={ex.id||idx} draggable onDragStart={()=>handleDragStart(workout.id,idx)} onDragOver={e=>handleDragOver(e,workout.id,idx)} onDrop={()=>handleDrop(workout.id,idx)} onDragEnd={()=>{setDragState(null);setDragOver(null);}} className={dragOver?.wId===workout.id&&dragOver?.idx===idx?"drag-over":""} style={{borderRadius:6,transition:"all .15s"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,opacity:.35,userSelect:"none"}}>
                          <span style={{fontSize:16}}>⠿</span>
                          <span style={{fontSize:9,color:"#555"}}>drag to reorder</span>
                        </div>
                        <ExerciseLog wId={workout.id} ex={ex} logDate={today}/>
                      </div>
                    ))}
                    <button className="ghost" style={{fontSize:11,marginBottom:14,width:"100%"}} onClick={()=>setShowAddExModal(workout.id)}>+ Add Exercise</button>
                    <div style={{borderTop:"1px solid #1e1e2e",paddingTop:14}}>
                      <div style={{...lbl}}>SESSION NOTES</div>
                      <textarea rows={3} placeholder="How did it feel? PRs, adjustments..." value={workoutNotes[`${workout.id}-${today}`]||""} onChange={e=>setWorkoutNotes(p=>({...p,[`${workout.id}-${today}`]:e.target.value}))} style={{fontSize:12,lineHeight:1.6}}/>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ HISTORY TAB ══ */}
      {tab==="history"&&(()=>{
        const sessions=getSessionHistory();
        const grouped=groupSessionsByWeek(sessions);
        return(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div><div className="hd" style={{fontSize:22}}>WORKOUT HISTORY</div><div style={{fontSize:11,color:"#555",marginTop:2}}>Every session saved · tap to review sets & weights</div></div>
            {sessions.length===0&&(
              <div style={{...card,textAlign:"center",padding:"50px 20px"}}>
                <div style={{fontSize:32,marginBottom:12}}>📋</div>
                <div style={{fontSize:14,color:"#d4ff00",marginBottom:8}}>No sessions logged yet</div>
                <div style={{fontSize:12,color:"#555",lineHeight:1.7}}>Head to Train, log a workout and tick off your sets — it'll appear here automatically.</div>
              </div>
            )}
            {Object.entries(grouped).map(([weekLabel,weekSessions])=>(
              <div key={weekLabel}>
                {/* Week header — collapsible */}
                <button onClick={()=>setCollapsedHistoryWeeks(p=>({...p,[weekLabel]:!p[weekLabel]}))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:"transparent",border:"none",cursor:"pointer",padding:"6px 0",marginBottom:8,fontFamily:"inherit"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span className="hd" style={{fontSize:14,color:"#d4ff00",letterSpacing:2}}>{weekLabel}</span>
                    <span style={{fontSize:10,background:"#d4ff0022",color:"#d4ff00",padding:"2px 8px",borderRadius:10,border:"1px solid #d4ff0044"}}>{weekSessions.length} session{weekSessions.length!==1?"s":""}</span>
                  </div>
                  <span style={{color:"#555",fontSize:14}}>{collapsedHistoryWeeks[weekLabel]?"▼":"▲"}</span>
                </button>

                {!collapsedHistoryWeeks[weekLabel]&&(
                  <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:8}}>
                    {weekSessions.map(session=>{
                      const sessionKey=`${session.wId}-${session.date}`;
                      const isExpanded=expandedHistorySession===sessionKey;
                      return(
                        <div key={sessionKey} style={{...card,padding:14,borderColor:isExpanded?"#d4ff0033":"#1e1e2e"}}>
                          {/* Session header */}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}} onClick={()=>setExpandedHistorySession(isExpanded?null:sessionKey)}>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                                <span className="tag" style={{fontSize:9}}>{session.wDay}</span>
                                <span style={{fontSize:14,fontWeight:500}}>{session.wName}</span>
                              </div>
                              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                                <span style={{fontSize:11,color:"#555"}}>{new Date(session.date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</span>
                                <span style={{fontSize:10,background:session.pct===100?"#d4ff0022":"#1e1e2e",color:session.pct===100?"#d4ff00":"#555",padding:"1px 8px",borderRadius:10,border:`1px solid ${session.pct===100?"#d4ff0044":"#2a2a3a"}`}}>{session.pct}% complete</span>
                              </div>
                            </div>
                            <span style={{color:"#555",fontSize:14,marginLeft:10}}>{isExpanded?"▲":"▼"}</span>
                          </div>

                          {/* Session detail */}
                          {isExpanded&&(
                            <div style={{marginTop:14,borderTop:"1px solid #1e1e2e",paddingTop:14}}>
                              {session.exDetails.map((ex,i)=>{
                                const doneSets=ex.sets.filter(s=>s.done);
                                if(doneSets.length===0)return null;
                                const typeColor=ex.type==="Strength"?"#d4ff00":ex.type==="Distance"?"#4ade80":ex.type==="Timed"?"#a78bfa":"#f97316";
                                return(
                                  <div key={i} style={{marginBottom:14,paddingBottom:14,borderBottom:"1px solid #1e1e2e"}}>
                                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                                      <span style={{fontSize:13,color:"#e8e4d9",fontWeight:500}}>{ex.exName}</span>
                                      <span style={{fontSize:9,background:typeColor+"22",color:typeColor,padding:"1px 6px",borderRadius:8,border:`1px solid ${typeColor}44`}}>{ex.type}</span>
                                    </div>
                                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                                      {doneSets.map((s,si)=>(
                                        <div key={si} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
                                          <span style={{color:"#555",minWidth:20,fontSize:10}}>S{si+1}</span>
                                          <span style={{color:"#e8e4d9"}}>{formatSetSummary(s,ex.type)}</span>
                                          {ex.type==="Strength"&&s.weight&&s.reps&&parseInt(s.reps)>1&&(
                                            <span style={{fontSize:9,color:"#555",marginLeft:"auto"}}>e1RM: {est1RM(parseFloat(s.weight),parseInt(s.reps))}kg</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    {/* Best set highlight */}
                                    {ex.type==="Strength"&&doneSets.some(s=>s.weight)&&(()=>{
                                      const best=Math.max(...doneSets.map(s=>parseFloat(s.weight)||0));
                                      return<div style={{marginTop:6,fontSize:10,color:"#d4ff00"}}>Top set: {best}kg</div>;
                                    })()}
                                    {ex.type==="Distance"&&doneSets.some(s=>s.dist)&&(()=>{
                                      const totalDist=doneSets.reduce((sum,s)=>sum+(parseFloat(s.dist)||0),0);
                                      const totalTime=doneSets.reduce((sum,s)=>sum+(parseFloat(s.time)||0),0);
                                      const avgPace=totalDist>0&&totalTime>0?totalTime/totalDist:null;
                                      return<div style={{marginTop:6,fontSize:10,color:"#4ade80"}}>Total: {totalDist.toFixed(1)}km{avgPace?` · Avg pace: ${formatPace(avgPace*60)}/km`:""}</div>;
                                    })()}
                                  </div>
                                );
                              })}
                              {session.notes&&(
                                <div style={{background:"#0d1117",padding:"10px 12px",borderRadius:4,borderLeft:"2px solid #d4ff0055",fontSize:12,color:"#aaa",lineHeight:1.6,marginTop:4}}>
                                  💬 {session.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      {tab==="progress"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div><div className="hd" style={{fontSize:22}}>PROGRESS</div><div style={{fontSize:11,color:"#555",marginTop:2}}>All sessions unified per exercise</div></div>
          <div style={card}>
            {sectionBtn(progressCollapsed["strength"],()=>setProgressCollapsed(p=>({...p,strength:!p.strength})),"STRENGTH")}
            {!progressCollapsed["strength"]&&<div style={{display:"flex",flexDirection:"column",gap:16,marginTop:12}}>
              {strengthEx.length===0&&<div style={{fontSize:12,color:"#555"}}>Log strength exercises to see progress.</div>}
              {strengthEx.map(exName=>{
                const data=getUnifiedProgress(exName);
                const last=data.slice(-1)[0],first=data[0];
                const gain=last&&first?+(last.value-first.value).toFixed(1):0;
                const exKey=`s-${exName}`;
                return(
                  <div key={exName}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,cursor:"pointer"}} onClick={()=>setProgressCollapsed(p=>({...p,[exKey]:!p[exKey]}))}>
                      <div><div style={{fontSize:13}}>{exName}</div><div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}>{(exerciseDB[exName]?.muscles||[]).map(m=><span key={m} style={{fontSize:9,background:"#1e1e2e",color:"#aaa",padding:"1px 6px",borderRadius:8}}>{m}</span>)}</div></div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {last&&<div className="hd" style={{fontSize:20,color:"#d4ff00"}}>{last.value}kg</div>}
                        {gain!==0&&<div style={{fontSize:10,color:gain>0?"#4ade80":"#ef4444"}}>{gain>0?"+":""}{gain}kg</div>}
                        <span style={{color:"#555",fontSize:12}}>{progressCollapsed[exKey]?"▼":"▲"}</span>
                      </div>
                    </div>
                    {!progressCollapsed[exKey]&&(data.length<2?<div style={{fontSize:10,color:"#333",padding:"6px 0"}}>Log 2+ sessions to see chart</div>:(
                      <ResponsiveContainer width="100%" height={90}><LineChart data={data}><XAxis dataKey="label" tick={{fill:"#555",fontSize:9}}/><YAxis hide domain={["dataMin-2","dataMax+2"]}/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="value" stroke="#d4ff00" strokeWidth={2} dot={{fill:"#d4ff00",r:3}} name="Weight" unit="kg"/></LineChart></ResponsiveContainer>
                    ))}
                  </div>
                );
              })}
            </div>}
          </div>
          <div style={card}>
            {sectionBtn(progressCollapsed["cardio"],()=>setProgressCollapsed(p=>({...p,cardio:!p.cardio})),"CARDIO")}
            {!progressCollapsed["cardio"]&&<div style={{display:"flex",flexDirection:"column",gap:16,marginTop:12}}>
              {cardioEx.length===0&&<div style={{fontSize:12,color:"#555"}}>Log cardio sessions to see progress.</div>}
              {cardioEx.map(exName=>{
                const data=getUnifiedProgress(exName);
                const last=data.slice(-1)[0];
                const exType=exerciseDB[exName]?.type;
                const unitLabel=exType==="Distance"?"km":exType==="Timed"?"min":"rds";
                const exKey=`c-${exName}`;
                return(
                  <div key={exName}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,cursor:"pointer"}} onClick={()=>setProgressCollapsed(p=>({...p,[exKey]:!p[exKey]}))}>
                      <div><div style={{fontSize:13}}>{exName}</div><div style={{fontSize:10,color:exType==="Distance"?"#4ade80":exType==="Timed"?"#a78bfa":"#f97316",marginTop:2}}>{exType}</div></div>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {last&&<div className="hd" style={{fontSize:18,color:"#4ade80"}}>{last.value}{unitLabel}</div>}
                        <span style={{color:"#555",fontSize:12}}>{progressCollapsed[exKey]?"▼":"▲"}</span>
                      </div>
                    </div>
                    {!progressCollapsed[exKey]&&(data.length<2?<div style={{fontSize:10,color:"#333",padding:"6px 0"}}>Log 2+ sessions to see chart</div>:(
                      <ResponsiveContainer width="100%" height={90}><LineChart data={data}><XAxis dataKey="label" tick={{fill:"#555",fontSize:9}}/><YAxis hide/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={{fill:"#4ade80",r:3}} name={exType} unit={unitLabel}/></LineChart></ResponsiveContainer>
                    ))}
                  </div>
                );
              })}
            </div>}
          </div>
        </div>
      )}

      {tab==="pbs"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="hd" style={{fontSize:22}}>PERSONAL BESTS</div>
          <div style={card}>
            {sectionBtn(pbCollapsed.strength,()=>setPbCollapsed(p=>({...p,strength:!p.strength})),"STRENGTH")}
            {!pbCollapsed.strength&&(strengthPBs.length===0?<div style={{fontSize:12,color:"#555",paddingTop:10}}>Log workouts with weight to see PBs.</div>:
              <div style={{marginTop:10}}>{strengthPBs.sort((a,b)=>b[1].value-a[1].value).map(([name,pb],i)=>(
                <div key={name} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<strengthPBs.length-1?"1px solid #1e1e2e":"none"}}>
                  <div className="hd" style={{fontSize:20,minWidth:28,textAlign:"center",color:i===0?"#d4ff00":i===1?"#aaa":i===2?"#cd7f32":"#444"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}</div>
                  <div style={{flex:1}}><div style={{fontSize:13}}>{name}</div><div style={{fontSize:10,color:"#555",marginTop:2}}>{pb.date}</div></div>
                  <div className="hd" style={{fontSize:24,color:"#d4ff00"}}>{pb.value}<span style={{fontSize:11,color:"#555"}}>{pb.unit}</span></div>
                </div>
              ))}</div>
            )}
          </div>
          <div style={card}>
            {sectionBtn(pbCollapsed.cardio,()=>setPbCollapsed(p=>({...p,cardio:!p.cardio})),"CARDIO")}
            {!pbCollapsed.cardio&&(cardioPBs.length===0?<div style={{fontSize:12,color:"#555",paddingTop:10}}>Log cardio to see PBs.</div>:
              <div style={{marginTop:10}}>{cardioPBs.map(([name,pb],i)=>(
                <div key={name} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<cardioPBs.length-1?"1px solid #1e1e2e":"none"}}>
                  <div className="hd" style={{fontSize:20,minWidth:28,textAlign:"center",color:i===0?"#4ade80":i===1?"#aaa":"#444"}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}`}</div>
                  <div style={{flex:1}}><div style={{fontSize:13}}>{name}</div><div style={{display:"flex",gap:6,marginTop:2}}><span style={{fontSize:9,color:pb.type==="Distance"?"#4ade80":pb.type==="Timed"?"#a78bfa":"#f97316",background:pb.type==="Distance"?"#4ade8022":pb.type==="Timed"?"#a78bfa22":"#f9731622",padding:"1px 6px",borderRadius:8}}>{pb.type}</span><span style={{fontSize:10,color:"#555"}}>{pb.date}</span></div></div>
                  <div className="hd" style={{fontSize:24,color:"#4ade80"}}>{pb.value}<span style={{fontSize:11,color:"#555"}}>{pb.unit}</span></div>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}

      {tab==="calories"&&(()=>{
        const isToday=calDate===today;
        return(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div className="hd" style={{fontSize:22}}>NUTRITION LOG</div><button className="btn" style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",fontSize:12}} onClick={()=>{setShowScanner(true);setScannerState("idle");}}>📷 Scan</button></div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button className="ghost" style={{padding:"6px 12px",fontSize:18}} onClick={()=>{const d=new Date(calDate);d.setDate(d.getDate()-1);setCalDate(d.toISOString().split("T")[0]);}}>‹</button>
              <div style={{flex:1,textAlign:"center"}}><input type="date" value={calDate} max={today} onChange={e=>setCalDate(e.target.value)} style={{background:"transparent",border:"none",color:"#d4ff00",fontSize:14,fontFamily:"inherit",textAlign:"center",width:"100%",cursor:"pointer"}}/>{isToday&&<div style={{fontSize:10,color:"#555",marginTop:2}}>Today</div>}</div>
              <button className="ghost" style={{padding:"6px 12px",fontSize:18,opacity:isToday?.3:1}} onClick={()=>{if(isToday)return;const d=new Date(calDate);d.setDate(d.getDate()+1);setCalDate(d.toISOString().split("T")[0]);}}>›</button>
            </div>
            <div style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div><div style={{fontSize:10,color:"#555"}}>{isToday?"TODAY":calDate}</div><div className="hd" style={{fontSize:38,color:"#d4ff00",lineHeight:1}}>{Math.round(viewCals)}</div><div style={{fontSize:10,color:"#555"}}>kcal</div></div>
                {calcResult&&<div style={{textAlign:"right"}}><div style={{fontSize:10,color:"#555"}}>Target</div><div className="hd" style={{fontSize:26}}>{calcResult.target}</div><div style={{fontSize:10,color:viewCals>calcResult.target?"#ef4444":"#4ade80"}}>{viewCals>calcResult.target?`+${Math.round(viewCals-calcResult.target)} over`:`${Math.round(calcResult.target-viewCals)} left`}</div></div>}
              </div>
              {calcResult&&<div className="pbar" style={{marginBottom:12}}><div className="pfill" style={{width:`${Math.min((viewCals/calcResult.target)*100,100)}%`,background:viewCals>calcResult.target?"#ef4444":"#d4ff00"}}/></div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[["Protein",viewP],["Carbs",viewC],["Fat",viewF]].map(([l,v])=><div key={l} style={pill}><div style={{fontSize:9,color:"#555"}}>{l.toUpperCase()}</div><div className="hd" style={{fontSize:20,marginTop:3}}>{Math.round(v)}g</div></div>)}</div>
            </div>
            <div style={card}><div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:12}}>THIS WEEK</div><ResponsiveContainer width="100%" height={140}><BarChart data={weekCalData} barSize={22}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false}/><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}}/><Tooltip content={<ChartTip/>}/>{calcResult&&<ReferenceLine y={calcResult.target} stroke="#d4ff0066" strokeDasharray="4 4"/>}<Bar dataKey="calories" fill="#d4ff0033" stroke="#d4ff00" strokeWidth={1} name="Calories" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>
            {isToday&&<div style={card}><div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>QUICK ADD</div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{COMMON_FOODS.map(f=><button key={f.name} className="ghost" style={{fontSize:11}} onClick={()=>setCalorieLog(p=>[...p,{...f,date:calDate,id:Date.now()}])}>{f.name} · {f.calories}kcal</button>)}</div></div>}
            {isToday&&<div style={card}><div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>ADD CUSTOM</div><div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:7,marginBottom:8}}>{["name","calories","protein","carbs","fat"].map(f=><input key={f} type={f==="name"?"text":"number"} placeholder={f.charAt(0).toUpperCase()+f.slice(1)} value={customFood[f]} onChange={e=>setCustomFood(p=>({...p,[f]:e.target.value}))}/>)}</div><button className="btn" onClick={()=>{if(!customFood.name||!customFood.calories)return;setCalorieLog(p=>[...p,{name:customFood.name,calories:parseFloat(customFood.calories)||0,protein:parseFloat(customFood.protein)||0,carbs:parseFloat(customFood.carbs)||0,fat:parseFloat(customFood.fat)||0,date:calDate,id:Date.now()}]);setCustomFood({name:"",calories:"",protein:"",carbs:"",fat:""});}}>+ Log Food</button></div>}
            {calorieLog.filter(e=>e.date===calDate).length>0&&<div style={card}><div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:10}}>{isToday?"TODAY'S LOG":calDate}</div>{calorieLog.filter(e=>e.date===calDate).map(entry=><div key={entry.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #1e1e2e"}}><div><div style={{fontSize:13}}>{entry.name}</div><div style={{fontSize:10,color:"#555"}}>P:{entry.protein||0}g C:{entry.carbs||0}g F:{entry.fat||0}g</div></div><div style={{display:"flex",alignItems:"center",gap:9}}><span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{entry.calories}</span><button className="ghost" style={{fontSize:11,padding:"3px 7px"}} onClick={()=>setCalorieLog(p=>p.filter(e=>e.id!==entry.id))}>✕</button></div></div>)}</div>}
          </div>
        );
      })()}

      {tab==="checkin"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="hd" style={{fontSize:22}}>WEEKLY CHECK-IN</div>
          <div style={card}>
            <div style={{...lbl}}>WEIGHT (kg)</div>
            <input type="number" placeholder="e.g. 81.2" value={checkinForm.weight} onChange={e=>setCheckinForm(p=>({...p,weight:e.target.value}))} style={{marginBottom:16}}/>
            {[["mood","😐 Mood"],["energy","⚡ Energy"],["soreness","💢 Soreness"],["adherence","✅ Adherence"]].map(([key,label])=>(
              <div key={key} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11,color:"#555"}}>{label}</span><span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{checkinForm[key]}/5</span></div>
                <input type="range" min="1" max="5" value={checkinForm[key]} onChange={e=>setCheckinForm(p=>({...p,[key]:parseInt(e.target.value)}))} style={{width:"100%"}}/>
              </div>
            ))}
            <div style={{...lbl,marginTop:8}}>NOTES</div>
            <textarea rows={3} placeholder="How was your week?" value={checkinForm.notes} onChange={e=>setCheckinForm(p=>({...p,notes:e.target.value}))} style={{marginBottom:12,fontSize:12}}/>
            <button className="btn" style={{width:"100%",padding:13}} onClick={()=>{if(!checkinForm.weight)return;setCheckins(p=>[...p,{...checkinForm,date:today,id:Date.now()}]);setBodyLog(p=>{const f=p.filter(e=>e.date!==today);return[...f,{date:today,weight:parseFloat(checkinForm.weight),id:Date.now()}].sort((a,b)=>a.date.localeCompare(b.date));});setCheckinForm({weight:"",mood:3,energy:3,soreness:3,adherence:3,notes:""});}}>Save Check-In</button>
          </div>
          {checkins.length>=2&&<div style={card}><div className="hd" style={{fontSize:15,marginBottom:12,color:"#d4ff00"}}>WEIGHT TREND</div><ResponsiveContainer width="100%" height={120}><LineChart data={[...checkins].sort((a,b)=>a.date.localeCompare(b.date)).map(c=>({label:c.date.slice(5),weight:parseFloat(c.weight)}))}><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}} unit="kg" domain={["dataMin-1","dataMax+1"]}/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="weight" stroke="#d4ff00" strokeWidth={2} dot={{fill:"#d4ff00",r:4}} name="Weight" unit="kg"/></LineChart></ResponsiveContainer></div>}
          {checkins.length>0&&<div style={card}><div className="hd" style={{fontSize:15,marginBottom:12}}>HISTORY</div>{[...checkins].reverse().map((c,i)=><div key={c.id||i} style={{padding:"12px 0",borderBottom:"1px solid #1e1e2e"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:11,color:"#555"}}>{c.date}</span><span className="hd" style={{fontSize:22,color:"#d4ff00"}}>{c.weight}kg</span></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:c.notes?8:0}}>{[["Mood",c.mood],["Energy",c.energy],["Soreness",c.soreness],["Adhere",c.adherence]].map(([l,v])=><div key={l} style={pill}><div style={{fontSize:9,color:"#555"}}>{l}</div><div className="hd" style={{fontSize:16,color:"#d4ff00",marginTop:2}}>{v}/5</div></div>)}</div>{c.notes&&<div style={{fontSize:12,color:"#aaa",background:"#0d1117",padding:"8px 10px",borderRadius:4,borderLeft:"2px solid #d4ff0055",lineHeight:1.6}}>{c.notes}</div>}<button className="ghost" style={{fontSize:10,padding:"3px 8px",marginTop:8,borderColor:"#ff444455",color:"#ff4444"}} onClick={()=>setCheckins(p=>p.filter(x=>x.id!==c.id))}>Delete</button></div>)}</div>}
        </div>
      )}

      {tab==="body"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="hd" style={{fontSize:22}}>BODY WEIGHT</div>
          <div style={card}><div style={{...lbl}}>LOG TODAY</div><div style={{display:"flex",gap:8}}><input type="number" placeholder="e.g. 80.5" value={newWeight} onChange={e=>setNewWeight(e.target.value)} style={{maxWidth:180}}/><button className="btn" onClick={()=>{if(!newWeight)return;setBodyLog(p=>{const f=p.filter(e=>e.date!==today);return[...f,{date:today,weight:parseFloat(newWeight),id:Date.now()}].sort((a,b)=>a.date.localeCompare(b.date));});setNewWeight("");}}>Log (kg)</button></div></div>
          {bodyLog.length>0&&(()=>{
            const s=[...bodyLog].sort((a,b)=>a.date.localeCompare(b.date));
            const latest=s[s.length-1].weight,first=s[0].weight,change=+(latest-first).toFixed(1);
            return<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>{[["Now",`${latest}kg`],["Change",`${change>=0?"+":""}${change}kg`],["Low",`${Math.min(...s.map(e=>e.weight))}kg`],["High",`${Math.max(...s.map(e=>e.weight))}kg`]].map(([l,v])=><div key={l} style={pill}><div style={{fontSize:9,color:"#555"}}>{l.toUpperCase()}</div><div className="hd" style={{fontSize:18,marginTop:3,color:l==="Change"?(change<0?"#4ade80":change>0?"#ef4444":"#e8e4d9"):"#e8e4d9"}}>{v}</div></div>)}</div>
              <div style={card}><ResponsiveContainer width="100%" height={180}><LineChart data={s.map(e=>({...e,label:e.date.slice(5)}))}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e"/><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}} unit="kg" domain={["dataMin-1","dataMax+1"]}/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="weight" stroke="#d4ff00" strokeWidth={2} dot={{fill:"#d4ff00",r:3}} name="Weight" unit="kg"/></LineChart></ResponsiveContainer></div>
              <div style={card}>{s.slice().reverse().slice(0,10).map(entry=><div key={entry.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #1e1e2e"}}><span style={{fontSize:11,color:"#555"}}>{entry.date}</span><div style={{display:"flex",alignItems:"center",gap:10}}><span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{entry.weight}kg</span><button className="ghost" style={{fontSize:10,padding:"2px 7px"}} onClick={()=>setBodyLog(p=>p.filter(e=>e.id!==entry.id))}>✕</button></div></div>)}</div>
            </>;
          })()}
        </div>
      )}

      {tab==="photos"&&(()=>{
        const groups=groupPhotos(bodyImages,photoGroupBy);
        return(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div className="hd" style={{fontSize:22}}>PROGRESS PHOTOS</div><button className="btn" style={{fontSize:12,padding:"8px 14px"}} onClick={()=>bodyImgRef.current?.click()}>+ Add</button></div>
            <input ref={bodyImgRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleBodyImg}/>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{fontSize:11,color:"#555"}}>Group by:</div>
              {["week","month","year"].map(g=><button key={g} onClick={()=>setPhotoGroupBy(g)} style={{padding:"4px 12px",fontSize:11,background:photoGroupBy===g?"#d4ff00":"transparent",border:`1px solid ${photoGroupBy===g?"#d4ff00":"#2a2a3a"}`,borderRadius:20,cursor:"pointer",color:photoGroupBy===g?"#0a0a0f":"#aaa",fontFamily:"inherit"}}>{g.charAt(0).toUpperCase()+g.slice(1)}</button>)}
              <button onClick={()=>setCompareMode(!compareMode)} style={{marginLeft:"auto",padding:"4px 14px",fontSize:11,background:compareMode?"#f9731644":"transparent",border:`1px solid ${compareMode?"#f97316":"#2a2a3a"}`,borderRadius:20,cursor:"pointer",color:compareMode?"#f97316":"#aaa",fontFamily:"inherit"}}>🔍 Compare {compareMode?"ON":"OFF"}</button>
            </div>
            {compareMode&&selectedPhotos.length===2&&<div style={card}><div style={{fontSize:11,color:"#d4ff00",letterSpacing:1,marginBottom:12}}>COMPARISON</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{selectedPhotos.map(id=>{const img=bodyImages.find(i=>i.id===id);return img?<div key={id} style={{borderRadius:8,overflow:"hidden",border:"2px solid #f97316"}}><img src={img.url} alt={img.date} style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",display:"block"}}/><div style={{background:"#0d1117",padding:"6px 8px",fontSize:10,color:"#aaa",textAlign:"center"}}>{img.date}</div></div>:null;})}</div><button className="ghost" style={{width:"100%",marginTop:10,fontSize:11}} onClick={()=>setSelectedPhotos([])}>Clear</button></div>}
            {compareMode&&selectedPhotos.length<2&&<div style={{fontSize:12,color:"#555",textAlign:"center"}}>Select 2 photos to compare</div>}
            {bodyImages.length===0&&<div style={{...card,textAlign:"center",padding:"40px",color:"#555",fontSize:13}}>No photos yet.</div>}
            {Object.entries(groups).map(([groupLabel,imgs])=>(
              <div key={groupLabel}>
                <button onClick={()=>setCollapsedPhotoGroups(p=>({...p,[groupLabel]:!p[groupLabel]}))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",background:"transparent",border:"none",cursor:"pointer",padding:"6px 0",marginBottom:8}}>
                  <span style={{fontSize:12,color:"#d4ff00",letterSpacing:1,textTransform:"uppercase"}}>{groupLabel} <span style={{color:"#555",fontSize:10}}>({imgs.length})</span></span>
                  <span style={{color:"#555",fontSize:12}}>{collapsedPhotoGroups[groupLabel]?"▼":"▲"}</span>
                </button>
                {!collapsedPhotoGroups[groupLabel]&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{imgs.map((img,i)=>{const isSelected=selectedPhotos.includes(img.id);return(<div key={img.id||i} style={{borderRadius:8,overflow:"hidden",border:`2px solid ${isSelected?"#f97316":"#1e1e2e"}`,cursor:compareMode?"pointer":"default",position:"relative"}} onClick={()=>{if(!compareMode)return;if(isSelected)setSelectedPhotos(p=>p.filter(id=>id!==img.id));else if(selectedPhotos.length<2)setSelectedPhotos(p=>[...p,img.id]);}}>{compareMode&&<div style={{position:"absolute",top:6,right:6,width:20,height:20,borderRadius:"50%",background:isSelected?"#f97316":"#00000088",border:"2px solid #f97316",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>{isSelected?"✓":""}</div>}<img src={img.url} alt={img.date} style={{width:"100%",aspectRatio:"3/4",objectFit:"cover",display:"block"}}/><div style={{background:"#0d1117cc",padding:"5px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:10,color:"#aaa"}}>{img.date}</span>{!compareMode&&<button onClick={()=>setBodyImages(p=>p.filter(x=>x.id!==img.id))} style={{background:"transparent",border:"none",color:"#ff4444",cursor:"pointer",fontSize:12}}>✕</button>}</div></div>);})}</div>}
              </div>
            ))}
          </div>
        );
      })()}

      {tab==="recovery"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="hd" style={{fontSize:22}}>RECOVERY LOG</div>
          <div style={card}>
            {[["sleep","😴 Sleep Hours","1","12",recoveryLog[today]?.sleep||7,0.5],["energy","⚡ Energy Level","1","5",recoveryLog[today]?.energy||3,1],["soreness","💢 Soreness (1=none)","1","5",recoveryLog[today]?.soreness||1,1]].map(([key,label,min,max,val,step])=>(
              <div key={key} style={{marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11,color:"#555"}}>{label}</span><span className="hd" style={{fontSize:18,color:"#d4ff00"}}>{val}{key==="sleep"?"h":"/5"}</span></div>
                <input type="range" min={min} max={max} step={step} value={val} onChange={e=>setRecoveryLog(p=>({...p,[today]:{...(p[today]||{sleep:7,energy:3,soreness:1}),[key]:parseFloat(e.target.value)}}))} style={{width:"100%"}}/>
              </div>
            ))}
            {readiness!=null&&<div style={{background:readiness>70?"#0d1a0d":readiness>40?"#1a1800":"#1a0d0d",border:`1px solid ${readiness>70?"#4ade8044":readiness>40?"#facc1544":"#ef444444"}`,borderRadius:6,padding:14,marginTop:8,textAlign:"center"}}><div style={{fontSize:10,color:"#555",marginBottom:4}}>READINESS</div><div className="hd" style={{fontSize:40,color:readiness>70?"#4ade80":readiness>40?"#facc15":"#ef4444"}}>{readiness}<span style={{fontSize:16,color:"#555"}}>/100</span></div><div style={{fontSize:12,color:"#aaa",marginTop:6}}>{readiness>70?"Train hard today 💪":readiness>40?"Moderate session":"Consider rest or light movement"}</div></div>}
          </div>
        </div>
      )}

      {tab==="analytics"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="hd" style={{fontSize:22}}>ANALYTICS</div>
          <div style={card}><div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>WEEKLY VOLUME</div><ResponsiveContainer width="100%" height={160}><BarChart data={getVolumeData()} barSize={22}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false}/><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}}/><Tooltip content={<ChartTip/>}/><Bar dataKey="volume" fill="#d4ff0033" stroke="#d4ff00" strokeWidth={1} name="Volume (kg)" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>
          <div style={card}><div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>MUSCLE RECOVERY MAP</div><MuscleHeatmap recentMuscles={recentMuscles}/></div>
          <div style={card}><div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>CALORIE CONSISTENCY</div><ResponsiveContainer width="100%" height={130}><BarChart data={weekCalData} barSize={22}><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis hide/><Tooltip content={<ChartTip/>}/>{calcResult&&<ReferenceLine y={calcResult.target} stroke="#d4ff0066" strokeDasharray="4 4"/>}<Bar dataKey="calories" fill="#d4ff0033" stroke="#d4ff00" strokeWidth={1} name="Calories" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>
          {strengthPBs.length>0&&<div style={card}><div className="hd" style={{fontSize:15,color:"#d4ff00",marginBottom:12}}>TOP LIFTS</div>{strengthPBs.slice(0,5).map(([name,pb])=><div key={name} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12}}>{name}</span><span className="hd" style={{fontSize:16,color:"#d4ff00"}}>{pb.value}{pb.unit}</span></div><div className="pbar"><div className="pfill" style={{width:`${Math.round((pb.value/strengthPBs[0][1].value)*100)}%`,background:"#d4ff00"}}/></div></div>)}</div>}
        </div>
      )}

      {tab==="calculator"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div className="hd" style={{fontSize:22}}>CALORIE CALCULATOR</div>
          <div style={card}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[["AGE","age","28"],["WEIGHT (kg)","weight","80"],["HEIGHT (cm)","height","178"]].map(([l,k,ph])=><div key={k}><div style={{...lbl}}>{l}</div><input type="number" placeholder={`e.g. ${ph}`} value={calc[k]} onChange={e=>setCalc(p=>({...p,[k]:e.target.value}))}/></div>)}<div><div style={{...lbl}}>GENDER</div><select value={calc.gender} onChange={e=>setCalc(p=>({...p,gender:e.target.value}))}><option value="male">Male</option><option value="female">Female</option></select></div></div>
            <div style={{marginTop:14}}><div style={{...lbl}}>ACTIVITY LEVEL</div>{ACTIVITY_LEVELS.map(al=><button key={al.factor} onClick={()=>setCalc(p=>({...p,activity:al.factor}))} style={{display:"flex",width:"100%",alignItems:"center",gap:10,padding:"9px 12px",marginBottom:5,background:calc.activity===al.factor?"#d4ff0015":"transparent",border:`1px solid ${calc.activity===al.factor?"#d4ff00":"#1e1e2e"}`,borderRadius:4,cursor:"pointer",color:"#e8e4d9",fontFamily:"inherit"}}><div style={{width:7,height:7,borderRadius:"50%",background:calc.activity===al.factor?"#d4ff00":"#2a2a3a",flexShrink:0}}/><div style={{textAlign:"left"}}><div style={{fontSize:12}}>{al.label}</div><div style={{fontSize:10,color:"#555"}}>{al.desc}</div></div></button>)}</div>
            <div style={{marginTop:14}}><div style={{...lbl}}>GOAL</div><div style={{display:"flex",gap:7}}>{GOALS.map((g,i)=><button key={g.label} onClick={()=>setCalc(p=>({...p,goal:i}))} style={{flex:1,padding:9,background:calc.goal===i?"#d4ff00":"transparent",border:`1px solid ${calc.goal===i?"#d4ff00":"#1e1e2e"}`,borderRadius:4,cursor:"pointer",color:calc.goal===i?"#0a0a0f":"#e8e4d9",fontFamily:"inherit",fontSize:11,fontWeight:calc.goal===i?600:400}}>{g.label}</button>)}</div></div>
            <button className="btn" style={{width:"100%",marginTop:16,padding:13}} onClick={runCalc}>CALCULATE →</button>
          </div>
          {calcResult&&<div style={{...card,borderColor:"#d4ff0033"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>{[["BMR",calcResult.bmr,"Base rate"],["TDEE",calcResult.tdee,"With activity"],["Target",calcResult.target,GOALS[calc.goal].label]].map(([l,v,s])=><div key={l} style={{background:"#0a0a0f",border:"1px solid #1e1e2e",borderRadius:6,padding:12,textAlign:"center"}}><div style={{fontSize:9,color:"#555"}}>{l}</div><div className="hd" style={{fontSize:26,color:l==="Target"?"#d4ff00":"#e8e4d9",margin:"4px 0"}}>{v}</div><div style={{fontSize:9,color:"#555"}}>{s}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>{[["Protein",calcResult.protein+"g"],["Carbs",calcResult.carbs+"g"],["Fat",calcResult.fat+"g"]].map(([l,v])=><div key={l} style={pill}><div style={{fontSize:9,color:"#555"}}>{l.toUpperCase()}</div><div className="hd" style={{fontSize:20,marginTop:3}}>{v}</div></div>)}</div></div>}
        </div>
      )}

      </div>

      {progressModal&&(()=>{
        const data=getUnifiedProgress(progressModal.exName);
        const exType=exerciseDB[progressModal.exName]?.type||"Strength";
        const unitLabel=exType==="Strength"?"kg":exType==="Distance"?"km":exType==="Timed"?"min":"rds";
        return<div className="modal"><div style={{...card,width:"100%",maxWidth:480,borderColor:"#d4ff0044"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><div><div className="hd" style={{fontSize:16,color:"#d4ff00"}}>{progressModal.exName}</div><div style={{fontSize:10,color:"#555"}}>All sessions combined</div></div><button className="ghost" onClick={()=>setProgressModal(null)}>Close</button></div>{data.length<2?<div style={{textAlign:"center",padding:"30px",color:"#555",fontSize:12}}>Log 2+ sessions to see chart.</div>:<ResponsiveContainer width="100%" height={170}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e"/><XAxis dataKey="label" tick={{fill:"#555",fontSize:10}}/><YAxis tick={{fill:"#555",fontSize:10}} unit={unitLabel}/><Tooltip content={<ChartTip/>}/><Line type="monotone" dataKey="value" stroke="#d4ff00" strokeWidth={2} dot={{fill:"#d4ff00",r:4}} name="Value" unit={unitLabel}/></LineChart></ResponsiveContainer>}</div></div>;
      })()}

      {showAddExModal!=null&&(()=>{
        const dbNames=Object.keys(exerciseDB).sort();
        const filteredDB=newExSearch.length>0?dbNames.filter(n=>n.toLowerCase().includes(newExSearch.toLowerCase())):dbNames.slice(0,20);
        return(
          <div className="modal" style={{alignItems:"flex-end",padding:0}}>
            <div style={{background:"#0d1117",border:"1px solid #d4ff0033",borderRadius:"16px 16px 0 0",width:"100%",maxWidth:520,margin:"0 auto",maxHeight:"88vh",overflowY:"auto"}}>
              <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:40,height:4,borderRadius:2,background:"#2a2a3a"}}/></div>
              <div style={{padding:"0 20px 24px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><div className="hd" style={{fontSize:18,color:"#d4ff00"}}>ADD EXERCISE</div><div style={{fontSize:10,color:"#555"}}>Search database or create new</div></div><button className="ghost" style={{fontSize:18,padding:"4px 10px"}} onClick={()=>{setShowAddExModal(null);setNewExSearch("");setNewExName("");}}>✕</button></div>
                <input placeholder="Search exercises..." value={newExSearch} onChange={e=>{setNewExSearch(e.target.value);setNewExName(e.target.value);}} style={{marginBottom:10}}/>
                <div style={{background:"#111118",border:"1px solid #1e1e2e",borderRadius:6,maxHeight:200,overflowY:"auto",marginBottom:12}}>
                  {filteredDB.map(name=><div key={name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderBottom:"1px solid #1e1e2e",cursor:"pointer"}} onClick={()=>{setNewExName(name);setNewExSearch(name);}}><div><div style={{fontSize:12,color:newExName===name?"#d4ff00":"#e8e4d9"}}>{name}</div><div style={{fontSize:9,color:"#555",marginTop:2}}>{exerciseDB[name]?.type} · {(exerciseDB[name]?.muscles||[]).join(", ")}</div></div>{newExName===name&&<span style={{color:"#d4ff00",fontSize:12}}>✓</span>}</div>)}
                  {filteredDB.length===0&&newExSearch.length>0&&<div style={{padding:"12px",fontSize:12,color:"#facc15"}}>✎ "{newExSearch}" will be added as new</div>}
                </div>
                {newExName&&!exerciseDB[newExName]&&<div style={{background:"#111118",border:"1px solid #facc1533",borderRadius:6,padding:12,marginBottom:12}}><div style={{fontSize:11,color:"#facc15",marginBottom:10}}>NEW EXERCISE</div><div style={{...lbl}}>TYPE</div><div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>{EX_TYPES.map(t=><button key={t} onClick={()=>setNewExType(t)} style={{padding:"5px 12px",fontSize:11,background:newExType===t?"#d4ff00":"transparent",border:`1px solid ${newExType===t?"#d4ff00":"#2a2a3a"}`,borderRadius:4,cursor:"pointer",color:newExType===t?"#0a0a0f":"#e8e4d9",fontFamily:"inherit"}}>{t}</button>)}</div><div style={{...lbl}}>MUSCLES</div><MusclePicker selected={newExMuscles} onChange={setNewExMuscles}/></div>}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <div><div style={{...lbl}}>SETS</div><input type="number" min="1" value={newExSets} onChange={e=>setNewExSets(parseInt(e.target.value)||1)} style={{textAlign:"center"}}/></div>
                  <div><div style={{...lbl}}>TARGET REPS</div><input type="number" min="1" value={newExReps} onChange={e=>setNewExReps(parseInt(e.target.value)||1)} style={{textAlign:"center"}}/></div>
                </div>
                <button className="btn" style={{width:"100%",padding:13}} onClick={()=>confirmAddEx(showAddExModal)} disabled={!newExName.trim()}>+ Add to Workout</button>
              </div>
            </div>
          </div>
        );
      })()}

      {showImport&&<div className="modal"><div style={{...card,width:"100%",maxWidth:600,borderColor:"#d4ff0044",maxHeight:"90vh",overflowY:"auto"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><div className="hd" style={{fontSize:18,color:"#d4ff00"}}>BULK IMPORT</div><div style={{fontSize:10,color:"#555"}}>Paste your plan in any format</div></div><button className="ghost" onClick={()=>{setShowImport(false);setImportText("");setImportPreview(null);}}>✕</button></div><textarea rows={9} placeholder={"Monday - Push Day\nBench Press 4x8\nOverhead Press 3x10"} value={importText} onChange={e=>{setImportText(e.target.value);setImportPreview(null);}} style={{marginBottom:10,fontSize:12,lineHeight:1.7}}/><div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}><button className="btn" style={{padding:"8px 18px"}} onClick={()=>setImportPreview(parseBulk(importText))}>Preview</button><div style={{marginLeft:"auto",display:"flex",gap:7}}>{["replace","add"].map(m=><button key={m} onClick={()=>setImportMode(m)} style={{padding:"6px 12px",fontSize:11,background:importMode===m?"#d4ff00":"transparent",border:`1px solid ${importMode===m?"#d4ff00":"#2a2a3a"}`,borderRadius:4,cursor:"pointer",color:importMode===m?"#0a0a0f":"#e8e4d9",fontFamily:"inherit"}}>{m==="replace"?"Replace":"Add"}</button>)}</div></div>{importPreview&&<div><div style={{fontSize:11,color:"#d4ff00",marginBottom:10}}>{importPreview.length} WORKOUTS DETECTED</div>{importPreview.map((w,i)=><div key={i} style={{background:"#0d1117",border:"1px solid #1e1e2e",borderRadius:6,padding:10,marginBottom:7}}><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}><span className="tag" style={{fontSize:9}}>{w.day}</span><span className="hd" style={{fontSize:14}}>{w.name}</span></div>{w.exercises.map((ex,j)=><div key={j} style={{fontSize:11,color:"#aaa",padding:"2px 0"}}>· {ex.exName} — {ex.sets}×{ex.targetReps}</div>)}</div>)}<button className="btn" style={{width:"100%",padding:11,marginTop:6}} onClick={confirmImport}>✓ Confirm Import</button></div>}</div></div>}

      {showDataModal&&(
        <div className="modal">
          <div style={{...card,width:"100%",maxWidth:500,borderColor:"#d4ff0044",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div><div className="hd" style={{fontSize:20,color:"#d4ff00"}}>💾 DATA BACKUP</div><div style={{fontSize:11,color:"#555"}}>Export before updating · import from any version</div></div>
              <button className="ghost" style={{fontSize:18,padding:"4px 10px"}} onClick={()=>setShowDataModal(false)}>✕</button>
            </div>
            <div style={{background:"#0d1117",border:"1px solid #d4ff0033",borderRadius:8,padding:16,marginBottom:16}}>
              <div style={{fontSize:12,color:"#d4ff00",letterSpacing:1,marginBottom:8}}>EXPORT YOUR DATA</div>
              <div style={{fontSize:12,color:"#aaa",lineHeight:1.7,marginBottom:12}}>Downloads a JSON backup of everything. Do this <span style={{color:"#facc15"}}>before</span> updating to a new version.</div>
              <button className="btn" style={{width:"100%",padding:13,fontSize:14}} onClick={exportData}>⬇ Download Backup File</button>
            </div>
            <div style={{background:"#0d1117",border:"1px solid #1e1e2e",borderRadius:8,padding:16}}>
              <div style={{fontSize:12,color:"#d4ff00",letterSpacing:1,marginBottom:8}}>RESTORE FROM BACKUP</div>
              <div style={{fontSize:12,color:"#aaa",lineHeight:1.7,marginBottom:12}}>Paste your backup JSON below. Works with all previous FORGE versions.</div>
              <textarea rows={6} placeholder='Paste backup JSON here... {"version":"forge_v7",...}' value={dataImportText} onChange={e=>setDataImportText(e.target.value)} style={{marginBottom:10,fontSize:11,lineHeight:1.6}}/>
              {dataImportStatus&&<div style={{padding:"10px 12px",borderRadius:4,marginBottom:10,fontSize:12,background:dataImportStatus.startsWith("✅")?"#0d1a0d":"#1a0d0d",border:`1px solid ${dataImportStatus.startsWith("✅")?"#4ade8044":"#ef444433"}`,color:dataImportStatus.startsWith("✅")?"#4ade80":"#ef4444"}}>{dataImportStatus}</div>}
              <button className="btn" style={{width:"100%",padding:13}} disabled={!dataImportText.trim()} onClick={()=>{importData(dataImportText);setDataImportText("");}}>⬆ Restore Data</button>
              <div style={{fontSize:10,color:"#555",marginTop:10,textAlign:"center"}}>⚠️ This will overwrite your current data</div>
            </div>
          </div>
        </div>
      )}

      {showScanner&&(
        <div className="modal" style={{alignItems:"flex-end",padding:0}}>
          <div style={{background:"#0d1117",border:"1px solid #d4ff0033",borderRadius:"16px 16px 0 0",width:"100%",maxWidth:520,margin:"0 auto",maxHeight:"92vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"center",padding:"12px 0 4px"}}><div style={{width:40,height:4,borderRadius:2,background:"#2a2a3a"}}/></div>
            <div style={{padding:"0 20px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}><div><div className="hd" style={{fontSize:20,color:"#d4ff00"}}>BARCODE SCANNER</div><div style={{fontSize:11,color:"#555"}}>Scan food to auto-fill nutrition</div></div><button className="ghost" style={{fontSize:18,padding:"4px 10px"}} onClick={closeScanner}>✕</button></div>
              {scannerState==="idle"&&<div style={{display:"flex",flexDirection:"column",gap:12}}><button className="btn" style={{width:"100%",padding:16,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onClick={startCamera}><span style={{fontSize:22}}>📷</span> Open Camera & Scan</button><div style={{textAlign:"center",fontSize:11,color:"#555"}}>— or enter barcode manually —</div><div style={{display:"flex",gap:8}}><input placeholder="e.g. 5000112548167" value={manualBarcode} onChange={e=>setManualBarcode(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}/><button className="btn" style={{padding:"8px 16px",whiteSpace:"nowrap"}} onClick={()=>{if(manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}>Search</button></div></div>}
              {scannerState==="scanning"&&<div><div style={{position:"relative",borderRadius:12,overflow:"hidden",background:"#000",marginBottom:14}}><video ref={barcodeVideoRef} style={{width:"100%",maxHeight:280,objectFit:"cover",display:"block"}} playsInline muted/><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{width:220,height:120,border:"2px solid #d4ff00",borderRadius:8,boxShadow:"0 0 0 2000px rgba(0,0,0,0.4)",position:"relative"}}><div style={{position:"absolute",width:"100%",height:2,background:"linear-gradient(90deg,transparent,#d4ff00,transparent)",animation:"scanline 1.5s ease-in-out infinite"}}/></div></div></div><div style={{textAlign:"center",color:"#d4ff00",fontSize:13,marginBottom:14,animation:"pulse 1s ease-in-out infinite"}}>Hold barcode steady...</div><div style={{display:"flex",gap:8}}><button className="ghost" style={{flex:1}} onClick={()=>{stopCamera();setScannerState("manual");}}>Enter Manually</button><button className="ghost" style={{flex:1}} onClick={()=>{stopCamera();setScannerState("idle");}}>Cancel</button></div></div>}
              {scannerState==="manual"&&<div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{background:"#1a1400",border:"1px solid #facc1533",borderRadius:6,padding:12,fontSize:12,color:"#facc15"}}>⚠️ Enter barcode from packaging.</div><div style={{display:"flex",gap:8}}><input placeholder="Barcode number" value={manualBarcode} onChange={e=>setManualBarcode(e.target.value)} autoFocus onKeyDown={e=>{if(e.key==="Enter"&&manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}/><button className="btn" style={{padding:"8px 16px",whiteSpace:"nowrap"}} onClick={()=>{if(manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}>Look Up</button></div><button className="ghost" onClick={()=>setScannerState("idle")}>← Back</button></div>}
              {scannerState==="found"&&<div>{!scannedFood&&<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:28,marginBottom:12,animation:"spin 1s linear infinite"}}>⚙️</div><div style={{color:"#d4ff00",fontSize:13}}>Looking up {scannedBarcode}...</div></div>}{scannedFood?.notFound&&<div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{background:"#1a0d0d",border:"1px solid #ef444433",borderRadius:8,padding:16,textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>🔍</div><div style={{fontSize:13,color:"#ef4444"}}>Product not found</div></div><button className="btn" style={{width:"100%"}} onClick={()=>{setScannerState("idle");setScannedFood(null);setManualBarcode("");}}>Try Another</button></div>}{scannedFood&&!scannedFood.notFound&&<div style={{display:"flex",flexDirection:"column",gap:14}}><div style={{background:"#111118",border:"1px solid #d4ff0033",borderRadius:10,padding:16,display:"flex",gap:14,alignItems:"flex-start"}}>{scannedFood.image?<img src={scannedFood.image} alt={scannedFood.name} style={{width:64,height:64,objectFit:"contain",borderRadius:6,background:"#fff",padding:4,flexShrink:0}}/>:<div style={{width:64,height:64,borderRadius:6,background:"#1e1e2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>🛒</div>}<div style={{flex:1}}><div style={{fontSize:14,fontWeight:500,lineHeight:1.3,marginBottom:3}}>{scannedFood.name}</div>{scannedFood.brand&&<div style={{fontSize:11,color:"#d4ff00"}}>{scannedFood.brand}</div>}</div></div><div style={{background:"#111118",border:"1px solid #1e1e2e",borderRadius:8,padding:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:11,color:"#555"}}>SERVING SIZE</span><div style={{display:"flex",alignItems:"center",gap:6}}><input type="number" value={scanServing} onChange={e=>setScanServing(Math.max(1,parseInt(e.target.value)||1))} style={{width:70,textAlign:"center",padding:"6px 8px"}}/><span style={{fontSize:12,color:"#555"}}>g</span></div></div><input type="range" min="5" max="500" step="5" value={scanServing} onChange={e=>setScanServing(parseInt(e.target.value))} style={{width:"100%",marginBottom:8}}/><div style={{display:"flex",justifyContent:"space-between",gap:6}}>{[30,50,100,150,200].map(s=><button key={s} onClick={()=>setScanServing(s)} style={{flex:1,padding:"5px 0",fontSize:11,background:scanServing===s?"#d4ff00":"transparent",border:`1px solid ${scanServing===s?"#d4ff00":"#2a2a3a"}`,borderRadius:4,cursor:"pointer",color:scanServing===s?"#0a0a0f":"#e8e4d9",fontFamily:"inherit"}}>{s}g</button>)}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8}}>{[["Cals",Math.round(scannedFood.calories*scanServing/100),"kcal","#d4ff00"],["Protein",Math.round(scannedFood.protein*scanServing/100*10)/10,"g","#4ade80"],["Carbs",Math.round(scannedFood.carbs*scanServing/100*10)/10,"g","#facc15"],["Fat",Math.round(scannedFood.fat*scanServing/100*10)/10,"g","#f97316"]].map(([l,v,u,c])=><div key={l} style={{...pill}}><div style={{fontSize:9,color:"#555"}}>{l}</div><div className="hd" style={{fontSize:18,marginTop:3,color:c}}>{v}</div><div style={{fontSize:9,color:"#555"}}>{u}</div></div>)}</div><button className="btn" style={{width:"100%",padding:14,fontSize:14}} onClick={logScannedFood}>✓ Add {scanServing}g to Log</button><button className="ghost" style={{width:"100%"}} onClick={()=>{setScannerState("idle");setScannedFood(null);setManualBarcode("");}}>Scan Another</button></div>}</div>}
              {scannerState==="error"&&<div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{background:"#1a0d0d",border:"1px solid #ef444433",borderRadius:8,padding:16,textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>📵</div><div style={{fontSize:13,color:"#ef4444"}}>Camera denied.</div></div><div style={{display:"flex",gap:8}}><input placeholder="Barcode number" value={manualBarcode} onChange={e=>setManualBarcode(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}/><button className="btn" style={{padding:"8px 14px",whiteSpace:"nowrap"}} onClick={()=>{if(manualBarcode.trim()){setScannedBarcode(manualBarcode.trim());setScannerState("found");lookupBarcode(manualBarcode.trim());}}}>Go</button></div></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
