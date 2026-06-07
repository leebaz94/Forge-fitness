
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
  "Hip Thrust":{type:"Strength",muscles:["Glutes","Hamstrings"]},
  "Squat Machine":{type:"Strength",muscles:["Quads","Glutes"]},
  "Chest-Supported Row":{type:"Strength",muscles:["Back","Traps"]},
  "Single Arm Pulldown":{type:"Strength",muscles:["Back","Biceps"]},
  "Cable Rear Delt Fly":{type:"Strength",muscles:["Shoulders","Back"]},
  "Hip Thrust":{type:"Strength",muscles:["Glutes","Hamstrings"]},
  "Behind-Body Cable Curl":{type:"Strength",muscles:["Biceps"]},
  "Cable Kickback":{type:"Strength",muscles:["Triceps"]},
  "High Pull":{type:"Strength",muscles:["Traps","Shoulders","Back"]},
  "Push Press":{type:"Strength",muscles:["Shoulders","Triceps","Quads"]},
  "Weighted Dips":{type:"Strength",muscles:["Triceps","Chest","Shoulders"]},
  "Box Jump":{type:"Strength",muscles:["Quads","Glutes","Calves"]},
  "Pallof Press":{type:"Strength",muscles:["Core"]},
  "Single-Leg RDL":{type:"Strength",muscles:["Hamstrings","Glutes","Back"]},
  "Cable Upright Row":{type:"Strength",muscles:["Shoulders","Traps"]},
  "Dumbbell Shrugs":{type:"Strength",muscles:["Traps"]},
  "Rear Delt Fly":{type:"Strength",muscles:["Shoulders","Back"]},
};

const WORKOUT_PLANS_LIBRARY = [
  {id:"lee1",category:"Strength",name:"Lee — Full Body Heavy",day:"Monday",description:"Compound-first full body. Heavy compounds + accessory isolation.",color:"#d4ff00",
    exercises:[
      {id:1,exName:"Squat Machine",sets:4,targetReps:10},
      {id:2,exName:"Hamstring Curl",sets:3,targetReps:12},
      {id:3,exName:"Calf Raises",sets:3,targetReps:14},
      {id:4,exName:"Pull-Ups",sets:3,targetReps:8},
      {id:5,exName:"Chest-Supported Row",sets:3,targetReps:10},
      {id:6,exName:"Incline Dumbbell Press",sets:3,targetReps:10},
      {id:7,exName:"Lateral Raise",sets:3,targetReps:14},
      {id:8,exName:"Incline Dumbbell Curl",sets:3,targetReps:11},
      {id:9,exName:"Tricep Pushdown",sets:3,targetReps:11},
    ]},
  {id:"lee2",category:"Strength",name:"Lee — Full Body Balanced",day:"Wednesday",description:"Hip hinge focus, shoulder & back volume.",color:"#d4ff00",
    exercises:[
      {id:1,exName:"Romanian Deadlift",sets:3,targetReps:10},
      {id:2,exName:"Hip Thrust",sets:4,targetReps:10},
      {id:3,exName:"Leg Press",sets:3,targetReps:11},
      {id:4,exName:"Dumbbell Shoulder Press",sets:3,targetReps:10},
      {id:5,exName:"Lat Pulldown",sets:3,targetReps:10},
      {id:6,exName:"Single Arm Pulldown",sets:3,targetReps:10},
      {id:7,exName:"Cable Rear Delt Fly",sets:3,targetReps:14},
      {id:8,exName:"Back Extensions",sets:2,targetReps:18},
      {id:9,exName:"Seated Calf Raises",sets:3,targetReps:14},
    ]},
  {id:"lee3",category:"Aesthetics",name:"Lee — Full Body Volume",day:"Friday",description:"Cable-focused volume session. High rep isolation.",color:"#f97316",
    exercises:[
      {id:1,exName:"Hip Thrust",sets:3,targetReps:14},
      {id:2,exName:"Hack Squat",sets:3,targetReps:12},
      {id:3,exName:"Calf Raises",sets:3,targetReps:14},
      {id:4,exName:"Cable Shoulder Press",sets:3,targetReps:14},
      {id:5,exName:"Cable Chest Fly",sets:3,targetReps:14},
      {id:6,exName:"Cable Lateral Raise",sets:3,targetReps:18},
      {id:7,exName:"Cable Rear Delt Fly",sets:3,targetReps:18},
      {id:8,exName:"Behind-Body Cable Curl",sets:3,targetReps:11},
      {id:9,exName:"Cable Kickback",sets:3,targetReps:14},
      {id:10,exName:"Straight Arm Pulldown",sets:3,targetReps:12},
    ]},
  {id:"lee4",category:"Aesthetics",name:"Lee — Mini Session (Superset)",day:"Tuesday",description:"Short superset block after yoga. Arms, core, lunges.",color:"#f97316",
    exercises:[
      {id:1,exName:"Rope Tricep Pushdown",sets:3,targetReps:14},
      {id:2,exName:"Cable Curl",sets:3,targetReps:14},
      {id:3,exName:"Dips",sets:3,targetReps:12},
      {id:4,exName:"Face Pulls",sets:3,targetReps:12},
      {id:5,exName:"Cable Wood Chop",sets:3,targetReps:12},
      {id:6,exName:"Bulgarian Split Squat",sets:3,targetReps:11},
    ]},
  {id:"anabolic_pre",category:"Strength",name:"MAPS Anabolic — Pre Phase",day:"Full Body",description:"Weeks 1-3. Foundation building. Learn movement patterns.",color:"#d4ff00",
    exercises:[
      {id:1,exName:"Barbell Squat",sets:2,targetReps:14},
      {id:2,exName:"Walking Lunges",sets:1,targetReps:18},
      {id:3,exName:"Barbell Deadlift",sets:1,targetReps:10},
      {id:4,exName:"Barbell Bench Press",sets:2,targetReps:14},
      {id:5,exName:"Dumbbell Row",sets:2,targetReps:14},
      {id:6,exName:"Dumbbell Shrugs",sets:2,targetReps:14},
      {id:7,exName:"Dumbbell Shoulder Press",sets:2,targetReps:14},
      {id:8,exName:"Rear Delt Fly",sets:1,targetReps:14},
      {id:9,exName:"Barbell Curl",sets:2,targetReps:14},
      {id:10,exName:"Tricep Pushdown",sets:2,targetReps:14},
      {id:11,exName:"Plank",sets:2,targetReps:1},
      {id:12,exName:"Calf Raises",sets:2,targetReps:30},
    ]},
  {id:"anabolic_p1_d1",category:"Strength",name:"MAPS Anabolic — Phase I Day 1",day:"Strength A",description:"Weeks 4-6. Max strength. Heavy compounds 1-4 reps.",color:"#d4ff00",
    exercises:[
      {id:1,exName:"Box Squat",sets:1,targetReps:10},
      {id:2,exName:"Barbell Squat",sets:5,targetReps:3},
      {id:3,exName:"Barbell Bench Press",sets:5,targetReps:3},
      {id:4,exName:"Weighted Pull-Ups",sets:2,targetReps:4},
      {id:5,exName:"Shrugs",sets:3,targetReps:5},
      {id:6,exName:"Barbell Curl",sets:2,targetReps:7},
      {id:7,exName:"Skull Crushers",sets:2,targetReps:7},
      {id:8,exName:"Hanging Leg Raises",sets:5,targetReps:10},
      {id:9,exName:"Calf Raises",sets:5,targetReps:14},
    ]},
  {id:"anabolic_p1_d2",category:"Strength",name:"MAPS Anabolic — Phase I Day 2",day:"Strength B",description:"Weeks 4-6. Deadlift focus. Overhead strength.",color:"#d4ff00",
    exercises:[
      {id:1,exName:"Good Mornings",sets:1,targetReps:10},
      {id:2,exName:"Barbell Deadlift",sets:5,targetReps:3},
      {id:3,exName:"Barbell Overhead Press",sets:5,targetReps:3},
      {id:4,exName:"Rear Delt Fly",sets:2,targetReps:7},
      {id:5,exName:"Dumbbell Shrugs",sets:2,targetReps:7},
      {id:6,exName:"Hammer Curl",sets:2,targetReps:7},
      {id:7,exName:"Overhead Tricep Extension",sets:2,targetReps:7},
      {id:8,exName:"Hanging Leg Raises",sets:5,targetReps:14},
      {id:9,exName:"Seated Calf Raises",sets:3,targetReps:14},
    ]},
  {id:"anabolic_p2_d1",category:"Aesthetics",name:"MAPS Anabolic — Phase II Day 1",day:"Muscle A",description:"Weeks 7-9. Muscle fiber. 3×8-12.",color:"#f97316",
    exercises:[
      {id:1,exName:"Barbell Squat",sets:3,targetReps:10},
      {id:2,exName:"Incline Barbell Bench Press",sets:3,targetReps:10},
      {id:3,exName:"Barbell Row",sets:3,targetReps:10},
      {id:4,exName:"Dumbbell Shrugs",sets:3,targetReps:10},
      {id:5,exName:"Rear Delt Fly",sets:2,targetReps:10},
      {id:6,exName:"Lateral Raise",sets:2,targetReps:10},
      {id:7,exName:"Dumbbell Curl",sets:3,targetReps:10},
      {id:8,exName:"Weighted Dips",sets:3,targetReps:10},
      {id:9,exName:"Seated Calf Raises",sets:3,targetReps:10},
      {id:10,exName:"Hanging Leg Raises",sets:3,targetReps:14},
    ]},
  {id:"perf_p1_d1",category:"Performance",name:"MAPS Performance — Phase I Day 1",day:"Raw Strength A",description:"Weeks 1-3. Explosive strength. Squat, bench, pull-ups.",color:"#4ade80",
    exercises:[
      {id:1,exName:"Barbell Squat",sets:5,targetReps:3},
      {id:2,exName:"Barbell Bench Press",sets:3,targetReps:3},
      {id:3,exName:"High Pull",sets:3,targetReps:3},
      {id:4,exName:"Weighted Pull-Ups",sets:2,targetReps:5},
      {id:5,exName:"Push Press",sets:3,targetReps:5},
      {id:6,exName:"Cable Wood Chop",sets:3,targetReps:18},
    ]},
  {id:"perf_p1_d2",category:"Performance",name:"MAPS Performance — Phase I Day 2",day:"Raw Strength B",description:"Weeks 1-3. Deadlift, lunges, carries.",color:"#4ade80",
    exercises:[
      {id:1,exName:"Barbell Deadlift",sets:5,targetReps:6},
      {id:2,exName:"Walking Lunges",sets:3,targetReps:20},
      {id:3,exName:"Weighted Dips",sets:3,targetReps:5},
      {id:4,exName:"Barbell Row",sets:3,targetReps:5},
      {id:5,exName:"Dumbbell Shoulder Press",sets:3,targetReps:5},
      {id:6,exName:"Suitcase Carry",sets:3,targetReps:1},
    ]},
  {id:"perf_p3_d1",category:"Performance",name:"MAPS Performance — Phase III Day 1",day:"Explosive A",description:"Weeks 7-9. Plyometric explosive strength.",color:"#4ade80",
    exercises:[
      {id:1,exName:"Box Jump",sets:4,targetReps:12},
      {id:2,exName:"Kettlebell Swings",sets:4,targetReps:18},
      {id:3,exName:"Push-Ups",sets:4,targetReps:18},
      {id:4,exName:"Barbell Squat",sets:4,targetReps:18},
    ]},
  {id:"sym_p1",category:"Stability",name:"MAPS Symmetry — Phase I",day:"Symmetry A",description:"2 weeks. Suspension training & isometric holds.",color:"#a78bfa",
    exercises:[
      {id:1,exName:"Bulgarian Split Squat",sets:2,targetReps:10},
      {id:2,exName:"Single-Leg RDL",sets:2,targetReps:10},
      {id:3,exName:"Push-Ups",sets:2,targetReps:10},
      {id:4,exName:"Dumbbell Row",sets:2,targetReps:10},
      {id:5,exName:"Dumbbell Curl",sets:2,targetReps:10},
      {id:6,exName:"Skull Crushers",sets:2,targetReps:10},
    ]},
  {id:"sym_p2",category:"Stability",name:"MAPS Symmetry — Phase II",day:"Symmetry B",description:"3 weeks. Single-arm/leg isolation to fix imbalances.",color:"#a78bfa",
    exercises:[
      {id:1,exName:"Single-Leg RDL",sets:2,targetReps:10},
      {id:2,exName:"Bulgarian Split Squat",sets:2,targetReps:10},
      {id:3,exName:"Cable Crossover",sets:2,targetReps:10},
      {id:4,exName:"Incline Dumbbell Press",sets:2,targetReps:10},
      {id:5,exName:"Dumbbell Row",sets:2,targetReps:10},
      {id:6,exName:"Arnold Press",sets:2,targetReps:10},
      {id:7,exName:"Dumbbell Curl",sets:2,targetReps:10},
      {id:8,exName:"Cable Kickback",sets:2,targetReps:10},
    ]},
  {id:"sym_p4",category:"Strength",name:"MAPS Symmetry — Phase IV (5×5)",day:"Big 3",description:"3 weeks. Maximal strength. 5×5.",color:"#d4ff00",
    exercises:[
      {id:1,exName:"Barbell Squat",sets:5,targetReps:5},
      {id:2,exName:"Barbell Bench Press",sets:5,targetReps:5},
      {id:3,exName:"Barbell Row",sets:5,targetReps:5},
    ]},
  {id:"core1",category:"Core",name:"Core — Primary Movements",day:"Core Session",description:"Essential core. Anti-extension, rotation, stability.",color:"#facc15",
    exercises:[
      {id:1,exName:"Plank",sets:3,targetReps:1},
      {id:2,exName:"Ab Wheel Rollout",sets:3,targetReps:10},
      {id:3,exName:"Hanging Leg Raises",sets:3,targetReps:12},
      {id:4,exName:"Reverse Crunches",sets:3,targetReps:15},
      {id:5,exName:"Cable Twist",sets:3,targetReps:12},
      {id:6,exName:"Roman Chair Sit-Ups",sets:3,targetReps:12},
    ]},
  {id:"core2",category:"Core",name:"Core — Anti-Extension & Rotation",day:"Core Session",description:"Deep core stability. Resist extension, rotational power.",color:"#facc15",
    exercises:[
      {id:1,exName:"Deadbugs",sets:3,targetReps:10},
      {id:2,exName:"RKC Plank",sets:3,targetReps:1},
      {id:3,exName:"Bear Crawl Holds",sets:3,targetReps:1},
      {id:4,exName:"Pallof Press",sets:3,targetReps:10},
      {id:5,exName:"Bird-Dog",sets:3,targetReps:10},
      {id:6,exName:"Medicine Ball Slam",sets:3,targetReps:12},
      {id:7,exName:"Bicycle Crunches",sets:3,targetReps:16},
      {id:8,exName:"Hollow Body Hold",sets:3,targetReps:1},
    ]},
];

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
  const [planFilter,setPlanFilter]=useState("All");
  const [expandedPlan,setExpandedPlan]=useState(null);
  const [planAddSuccess,setPlanAddSuccess]=useState("");
  const bodyImgRef=useRef();
  const barcodeVideoRef=useRef();
  const barcodeStreamRef=useRef(null);
  const barcodeReaderRef=useRef(null);
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
  function getSessionHistory(){
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
      const hasDone=workout.exercises.some(ex=>getSets(wId,ex.exName,date).some(s=>s.done));
      if(!hasDone)continue;
      let total=0,done=0;
      const exDetails=workout.exercises.map(ex=>{
        const sets=getSets(wId,ex.exName,date);
        const doneSets=sets.filter(s=>s.done);
        total+=ex.sets;done+=Math.min(doneSets.length,ex.sets);
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
  function addFullPlanToTraining(plan){
    const newId=Date.now();
    const newWorkout={id:newId,day:plan.day,name:plan.name,exercises:plan.exercises.map((e,i)=>({...e,id:i+1}))};
    setWorkoutPlan(p=>[...p,newWorkout]);
    setPlanAddSuccess(`"${plan.name}" added to Training Log!`);
    setTimeout(()=>setPlanAddSuccess(""),3000);
  }
  function addSingleExerciseFromPlan(exName,sets,targetReps,wId){
    if(!exerciseDB[exName])setExerciseDB(p=>({...p,[exName]:{type:"Strength",muscles:[]}}));
    setWorkoutPlan(p=>p.map(w=>{
      if(w.id!==wId)return w;
      const newId=Math.max(0,...w.exercises.map(e=>e.id))+1;
      return{...w,exercises:[...w.exercises,{id:newId,exName,sets,targetReps}]};
    }));
    setPlanAddSuccess(`"${exName}" added!`);
    setTimeout(()=>setPlanAddSuccess(""),2000);
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
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1280},height:{ideal:720}}});
      barcodeStreamRef.current=stream;
      const video=barcodeVideoRef.current;
      if(!video){stopCamera();return;}
      video.srcObject=stream;
      await video.play();
      if(!window.ZXing){
        await new Promise((resolve,reject)=>{
          const script=document.createElement("script");
          script.src="https://unpkg.com/@zxing/browser@0.1.4/umd/index.min.js";
          script.onload=resolve;
          script.onerror=()=>{
            // fallback — manual entry
            setScannerState("manual");
            resolve();
          };
          document.head.appendChild(script);
        });
      }
      if(!window.ZXing){setScannerState("manual");return;}
      const hints=new Map();
      const formats=[
        window.ZXing.BarcodeFormat.EAN_13,
        window.ZXing.BarcodeFormat.EAN_8,
        window.ZXing.BarcodeFormat.UPC_A,
        window.ZXing.BarcodeFormat.UPC_E,
        window.ZXing.BarcodeFormat.CODE_128,
        window.ZXing.BarcodeFormat.CODE_39,
        window.ZXing.BarcodeFormat.QR_CODE,
      ].filter(Boolean);
      if(formats.length)hints.set(window.ZXing.DecodeHintType?.POSSIBLE_FORMATS,formats);
      const codeReader=new window.ZXing.BrowserMultiFormatReader(hints);
      barcodeReaderRef.current=codeReader;
      codeReader.decodeFromVideoElement(video,(result,err)=>{
        if(result){
          const code=result.getText();
          setScannedBarcode(code);
          stopCamera();
          lookupBarcode(code);
        }
      });
    }catch(e){
      setScannerState("error");
    }
  }
  function stopCamera(){
    if(barcodeReaderRef.current){
      try{barcodeReaderRef.current.reset();}catch{}
      barcodeReaderRef.current=null;
    }
    if(barcodeStreamRef.current){
      barcodeStreamRef.current.getTracks().forEach(t=>t.stop());
      barcodeStreamRef.current=null;
    }
  }
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
  const planCategories=["All","Strength","Aesthetics","Performance","Stability","Core"];
  const filteredPlans=planFilter==="All"?WORKOUT_PLANS_LIBRARY:WORKOUT_PLANS_LIBRARY.filter(p=>p.category===planFilter);
  const categoryColor={Strength:"#d4ff00",Aesthetics:"#f97316",Performance:"#4ade80",Stability:"#a78bfa",Core:"#facc15"};

  const TABS=[
    {id:"home",icon:"⚡",label:"Home"},
    {id:"workout",icon:"🏋️",label:"Train"},
    {id:"history",icon:"📅",label:"History"},
    {id:"plans",icon:"📚",label:"Plans"},
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
                      <textarea rows={3} placeholder="How did it feel? PRs, adjustments..." value={workoutNotes[`${workout.id}-${today}`]||""} onChange={e=>setWorkoutNotes(p=>({...p,[`${workout.id}-${today}`]:e.target.value}))} style={{fontSize:12,line
