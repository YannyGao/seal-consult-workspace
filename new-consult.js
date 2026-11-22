/* =====================================================================
   New consult page — Cardiovascular Medicine demo.
   Opens from any "New consult" button as its own page (#new-consult).
   1 Patient (searchable select + simulated chart import)
   2 Specialty: pick from a nested list, or ask a question and get routed after clarifying questions;
     then pick from the clinicians on call for that route
   3 Generated request template (fields from the Cardiovascular Medicine Consult Request Form) → Send page
   Routing and pagers follow the Stanford Cardiovascular Medicine consultation guidelines supplied for the demo.
   All patients, clinicians and chart data are synthetic. Not for clinical use.
   Uses the workboard's globals: C, PT, AV, av, render, ME, TEAM, CALLBACK, sendMin, UNREAD.
   ===================================================================== */
(function(){
"use strict";
const B=window.SEAL_BRIDGE;if(!B){console.warn("New consult: SEAL_BRIDGE missing");return}
const {C,PT,av,ME,TEAM,CALLBACK,NOW,fmt}=B;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
const T=ms=>RM?0:ms;
const I={
  chev:'<svg class="ncd-chev" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cv:'<svg class="cv" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ck:'<svg class="ck" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ok:'<svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  search:'<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  back:'<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chart:'<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="2.5" width="12" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 7h6M7 10h6M7 13h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  up:'<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3.5M3.8 7.5L8 3.3l4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  spark:'<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l1.6 4.4 4.4 1.6-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6z" fill="currentColor"/></svg>',
  list:'<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 4h8M5.5 8h8M5.5 12h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="2.5" cy="4" r="1" fill="currentColor"/><circle cx="2.5" cy="8" r="1" fill="currentColor"/><circle cx="2.5" cy="12" r="1" fill="currentColor"/></svg>',
  warn:'<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style="flex:none;margin-top:1px"><path d="M8 2l6.5 11.5h-13z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6.5v3.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.6" r=".9" fill="currentColor"/></svg>',
  info:'<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style="flex:none;margin-top:1px"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 7.2v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="4.9" r=".9" fill="currentColor"/></svg>'
};

/* ---------- synthetic chart data (what the import "pulls") ---------- */
const UNIT={"512-A":"5 West","518-B":"5 West","604-A":"6 West","611-B":"6 West"};
const CHART={
  A:{age:67,sex:"F",adm:"Cellulitis, left leg",pamf:false,hx:"Paroxysmal atrial fibrillation on apixaban; hypertension",cardio:"Sarah Lin, MD (Stanford Cardiology)",
     ecg:"Today 06:40 · Atrial fibrillation, ventricular rate 118",ecgOk:true,tele:"AF with rates 105–130 overnight",
     labs:"hs-troponin I 8 → 9 ng/L (flat) · BNP 210 pg/mL · K 3.6",testing:"TTE (Stanford, 03/2025): LVEF 55%, mild LA enlargement",
     meds:"Apixaban 5 mg BID (held for procedure), metoprolol tartrate 25 mg BID"},
  B:{age:72,sex:"M",adm:"Community-acquired pneumonia with hypoxia",pamf:false,hx:"CAD s/p PCI to LAD (2019); type 2 diabetes",cardio:"Alan Brooks, MD (El Camino Health, outside)",
     ecg:"Today 09:12 · Sinus tachycardia 108, new T-wave inversions V2–V4",ecgOk:true,tele:"Sinus tachycardia, no arrhythmia",
     labs:"hs-troponin I 34 → 58 → 91 ng/L (rising) · BNP 890 pg/mL",testing:"Outside TTE (El Camino, 2024): LVEF 45%, anterior hypokinesis",
     meds:"Aspirin 81 mg, atorvastatin 80 mg, metformin (held)",flag:{t:"bad",x:"Rising troponin — tie it to a clinical question"}},
  C:{age:58,sex:"F",adm:"MSSA bacteremia",pamf:false,hx:"No known cardiac history",cardio:"None on file",
     ecg:"Today 07:05 · Normal sinus rhythm 84",ecgOk:true,tele:"No events",
     labs:"hs-troponin I 4 ng/L · BNP 95 pg/mL",testing:"TTE pending (ordered today) · new systolic murmur on exam",
     meds:"Cefazolin 2 g q8h"},
  D:{age:49,sex:"M",adm:"Syncope, under evaluation",pamf:false,hx:"Complete heart block, dual-chamber pacemaker (2021)",cardio:"Daniel Kim, MD (Stanford Cardiology)",
     ecg:"Today 08:30 · AV-paced rhythm 70",ecgOk:true,tele:"Two pauses of 2.8 s at 03:10",
     labs:"hs-troponin I 6 ng/L · electrolytes normal",testing:"Last device check 04/2025: normal function",
     meds:"None cardiac",flag:{t:"warn",x:"Telemetry pauses with a pacemaker — device check may be needed"}},
  E:{age:81,sex:"F",adm:"Acute on chronic heart failure",pamf:false,hx:"HFrEF (LVEF 30%), ischemic cardiomyopathy, CKD 3",cardio:"Daniel Kim, MD (Stanford Cardiology)",
     ecg:"Today 05:50 · Sinus rhythm 92, LBBB (old)",ecgOk:true,tele:"Frequent PVCs",
     labs:"BNP 2,450 pg/mL (baseline 900) · Cr 1.6 (baseline 1.2) · hs-troponin I 22 ng/L (flat)",testing:"TTE (Stanford, 08/2025): LVEF 30%, moderate MR",
     meds:"Furosemide 40 mg IV BID, sacubitril/valsartan, carvedilol"},
  F:{age:64,sex:"M",adm:"Chest pain, observation",pamf:false,hx:"Hypertension, hyperlipidemia; no prior cardiac testing",cardio:"None on file",
     ecg:"Today 10:02 · Sinus rhythm 76, nonspecific ST changes",ecgOk:true,tele:"No events",
     labs:"hs-troponin I 12 → 14 ng/L",testing:"None available",
     meds:"Lisinopril, atorvastatin"},
  G:{age:70,sex:"F",adm:"Hip fracture, post-op day 1",pamf:true,hx:"Hypertension, palpitations",cardio:"Mei Wong, MD (PAMF Cardiology)",
     ecg:"Today 07:40 · Sinus rhythm with PACs",ecgOk:true,tele:"Runs of SVT up to 12 beats",
     labs:"hs-troponin I 10 ng/L · TSH 1.2",testing:"Holter (PAMF, 2024): frequent PACs",
     meds:"Amlodipine",flag:{t:"warn",x:"PAMF patient — guidelines route to PAMF Cardiology"}},
  H:{age:55,sex:"M",adm:"Neutropenic fever",pamf:false,hx:"Diffuse large B-cell lymphoma on R-CHOP (doxorubicin)",cardio:"None on file",
     ecg:"Today 06:15 · Sinus tachycardia 104",ecgOk:true,tele:"Sinus tachycardia",
     labs:"hs-troponin I 18 ng/L · BNP 340 pg/mL",testing:"TTE (Stanford, 10/2025): LVEF 48% (was 60% pre-chemo)",
     meds:"R-CHOP cycle 4, cefepime"},
  I:{age:34,sex:"F",adm:"Palpitations with presyncope",pamf:false,hx:"Repaired tetralogy of Fallot (age 2), pulmonary valve replacement (2018)",cardio:"Peter Lang, MD (Stanford ACHD)",
     ecg:"Today 09:45 · Sinus rhythm, RBBB (known), QRS 168 ms",ecgOk:true,tele:"Non-sustained wide-complex tachycardia, 6 beats",
     labs:"hs-troponin I 5 ng/L · K 4.1 · Mg 2.0",testing:"Cardiac MRI (Stanford, 01/2025): RV mildly dilated",
     meds:"None"},
  J:{age:42,sex:"M",adm:"Pleuritic chest pain after viral illness",pamf:false,hx:"No known cardiac history",cardio:"None on file",
     ecg:"Today 08:20 · Diffuse ST elevation with PR depression",ecgOk:true,tele:"Sinus rhythm",
     labs:"hs-troponin I 45 ng/L · CRP 86 mg/L",testing:"Bedside echo (ED): small pericardial effusion",
     meds:"Ibuprofen 600 mg TID"}
};
const unitOf=room=>UNIT[room]||"7 East";

/* ---------- routes (guideline pagers) and synthetic on-call roster ---------- */
const ROUTES={
  gen:{name:"General Cardiology",pager:"24300",desc:"Consult or on-call cardiology fellow, staffed 24/7"},
  cicu:{name:"CICU / Shock",pager:"24015",desc:"Cardiogenic shock and CICU-level care"},
  ic:{name:"Interventional Cardiology / STEMI",pager:"40088",desc:"STEMI and cath lab evaluation"},
  ep:{name:"Electrophysiology",pager:"24301",desc:"Complex arrhythmia, ablation, EP study"},
  dev:{name:"Device Interrogation",pager:"15590",desc:"Pacemaker and ICD checks"},
  achd:{name:"Adult Congenital Heart Disease",pager:"12243",desc:"Congenital heart disease in adults"},
  echo:{name:"Stat Echo",pager:"Voalte",desc:"Daytime: Lead Sonographer on Voalte · 5 PM–7 AM: fellow on call (24300)"},
  adm:{name:"General Cardiology Admissions",pager:"27112",desc:"Patients being admitted to cardiology — not the consult pager"},
  pamf:{name:"PAMF Cardiology",pager:"PAMF",desc:"PAMF patients are paged to PAMF Cardiology directly"}
};
const ONCALL={
  gen:[["Aisha Rahman, MD","Consult fellow","av","On call · in house"],["Daniel Kim, MD","Consult attending","av","On call"],["Tomás Vega, MD","Second-year fellow","busy","In clinic until 1:00 PM"]],
  cicu:[["Hannah Cole, MD","CICU fellow","av","On call · in house"],["Rajiv Mehta, MD","CICU attending","busy","Rounding in CICU"]],
  ic:[["Lauren Shaw, MD","Interventional fellow","av","On call · in house"],["Victor Ng, MD","Interventional attending","busy","In cath lab until 2:00 PM"]],
  ep:[["Omar Haddad, MD","EP fellow","av","On call · in house"],["Elise Martin, MD","EP attending","busy","In procedure until 2:00 PM"]],
  dev:[["Kim Tran, NP","Device clinic NP","av","On call · device clinic"],["Marco Silva, MD","EP fellow (device backup)","away","Off until 5:00 PM"]],
  achd:[["Sofia Bauer, MD","ACHD fellow","av","On call"],["Peter Lang, MD","ACHD attending","av","On call"]],
  echo:[["Maria Lopez, RDCS","Lead Sonographer · Voalte","av","On shift until 5:00 PM"],["Aisha Rahman, MD","On-call fellow (after 5 PM)","away","Covers 5 PM–7 AM"]],
  adm:[["Grace Liu, MD","Admitting fellow","av","On call · in house"],["Nathan Price, MD","Admitting attending","av","On call"]],
  pamf:[["Mei Wong, MD","PAMF cardiologist on call","av","On call"],["Ravi Desai, MD","PAMF cardiologist","away","Off today"]]
};
const TOPICS=[
  {g:"Symptoms",items:[["chest","Chest pain"],["dysp","Dyspnea"],["palp","Palpitations"],["sync","Presyncope / syncope"],["vol","Volume overload"]]},
  {g:"Conditions",items:[["acs","ACS / MI / CAD"],["hf","Heart failure"],["arr","Tachy- or bradyarrhythmia"],["peri","Pericarditis / effusion / tamponade"],["myo","Myocarditis"],["valve","Valvular heart disease"],["onc","Cardio-oncology"]]}
];
const TOPIC_LABEL=Object.fromEntries(TOPICS.flatMap(g=>g.items));
const TOPIC_Q={
  chest:"Please evaluate chest pain and advise whether further ischemic workup is needed.",
  dysp:"Please evaluate dyspnea for a possible cardiac cause and advise on workup.",
  palp:"Please evaluate palpitations and advise on rhythm monitoring and management.",
  sync:"Please evaluate presyncope/syncope for a cardiac cause and advise on workup.",
  vol:"Please advise on management of volume overload and diuresis.",
  acs:"Please evaluate for acute coronary syndrome and advise on management.",
  hf:"Please advise on heart failure management, including diuresis and guideline-directed therapy.",
  arr:"Please advise on management of the arrhythmia, including rate/rhythm control and anticoagulation.",
  peri:"Please evaluate for pericarditis/pericardial effusion and advise on management.",
  myo:"Please evaluate for myocarditis and advise on workup.",
  valve:"Please evaluate valvular heart disease and advise on further imaging and management.",
  onc:"Please advise on cardiotoxicity risk and cardiac management during cancer therapy."
};
const OTHER_SPECS=["Critical Care","Dermatology","Endocrinology","Gastroenterology","Infectious Diseases","Nephrology","Neurology","Pulmonology"];

/* natural-language router: first match wins */
const RULES=[
  [/admit(ted|ting)? to cardiology|admission to cardiology|transfer to cardiology/i,"adm","acs","Admission to cardiology"],
  [/\bstemi\b|st[- ]elevation (mi|myocardial)|cath(eter)? lab|\bcath\b|occlusion/i,"ic","acs","Possible STEMI / cath evaluation"],
  [/shock|pressor|norepi|levophed|cardiogenic|impella|balloon pump|iabp|\bicu-level/i,"cicu","hf","Possible cardiogenic shock"],
  [/interrogat|device check|pacemaker check|icd check|\bshock(ed)? by (his|her|their) icd/i,"dev","arr","Device interrogation"],
  [/pacemaker|\bicd\b|defibrillator|\bcrt\b/i,"dev","arr","Cardiac device question"],
  [/ablation|\bwpw\b|ventricular tachy|\bvt\b|\bep study|electrophys/i,"ep","arr","Complex arrhythmia (EP)"],
  [/congenital|fallot|fontan|\bachd\b|tetralogy|\basd\b|\bvsd\b/i,"achd","arr","Adult congenital heart disease"],
  [/stat echo|urgent echo|echo (today|now|asap)/i,"echo","peri","Stat echocardiogram"],
  [/a-?fib|atrial fib|flutter|\brvr\b|brady|heart block|tachyarr|\bsvt\b|palpitation|arrhythm/i,"gen","arr","Arrhythmia management"],
  [/chest pain|troponin|\btrop\b|nstemi|\bacs\b|angina|\bcad\b|t-wave|st depression/i,"gen","acs","Chest pain / possible ACS"],
  [/heart failure|\bchf\b|hfref|hfpef|\bbnp\b|volume overload|diures/i,"gen","hf","Heart failure management"],
  [/pericard|effusion|tamponade/i,"gen","peri","Pericarditis / effusion"],
  [/myocarditis/i,"gen","myo","Possible myocarditis"],
  [/valve|stenosis|regurg|murmur|endocarditis|aortic|mitral/i,"gen","valve","Valvular heart disease"],
  [/chemo|anthracycline|doxorubicin|trastuzumab|cardio-?onc|immunotherapy|r-chop/i,"gen","onc","Cardio-oncology"],
  [/syncope|presyncope|faint|passed out/i,"gen","sync","Syncope evaluation"],
  [/dyspnea|short(ness)? of breath|\bsob\b/i,"gen","dysp","Dyspnea evaluation"],
  [/heart|cardi|\becg\b|\bekg\b|telemetry/i,"gen",null,"Cardiology question"]
];
function routeQuestion(q){for(const [re,r,t,reason] of RULES) if(re.test(q)) return {route:r,topic:t,reason};return null}

/* ---------- state ---------- */
const NC={sess:0,step:1,pt:null,imported:false,mode:"pick",route:null,topic:null,clin:null,question:"",reason:"",urg:"Routine",chat:[],chatDone:false,unstable:false,maxStep:1};
let root=null,importRun=0;
function reset(){NC.sess++;NC.busy=false;NC.awaiting=false;Object.assign(NC,{step:1,pt:null,imported:false,mode:"pick",route:null,topic:null,clin:null,question:"",reason:"",urg:"Routine",chat:[],chatDone:false,unstable:false,maxStep:1});importRun++}

/* ---------- searchable, grouped, nested select ---------- */
function Dropdown(o){
  const el=document.createElement("div");el.className="ncd";const lid="ncd"+Math.random().toString(36).slice(2,7);
  let q="",hl=-1,exp=new Set(o.expanded||[]);
  el.innerHTML=`<button type="button" class="ncd-trig" aria-haspopup="listbox" aria-expanded="false" aria-controls="${lid}"></button>
    <div class="ncd-pop"><div><div class="ncd-panel">
      <div class="ncd-search">${I.search}<input type="text" placeholder="${esc(o.search||"Search…")}" aria-label="${esc(o.search||"Search")}"></div>
      <div class="ncd-list" role="listbox" id="${lid}"></div></div></div></div>`;
  const trig=el.querySelector(".ncd-trig"),inp=el.querySelector("input"),list=el.querySelector(".ncd-list");
  const paintTrig=()=>{const v=o.value&&o.find(o.value);trig.innerHTML=(v?`<span class="ncd-val">${o.renderValue(v)}</span>`:`<span class="ncd-ph">${esc(o.placeholder)}</span>`)+I.chev};
  const mark=s=>{if(!q)return esc(s);const i=s.toLowerCase().indexOf(q.toLowerCase());return i<0?esc(s):esc(s.slice(0,i))+"<mark>"+esc(s.slice(i,i+q.length))+"</mark>"+esc(s.slice(i+q.length))};
  const hit=it=>!q||(it.label+" "+(it.sub||"")+" "+(it.meta||"")).toLowerCase().includes(q.toLowerCase());
  const optHTML=it=>`<button type="button" class="ncd-opt" role="option" data-ncv="${esc(it.id)}" aria-selected="${o.value===it.id}"${it.disabled?' aria-disabled="true" tabindex="-1"':""}>
      <span class="t">${mark(it.label)}${it.sub?`<small>${mark(it.sub)}</small>`:""}</span>${it.meta?`<span class="m">${esc(it.meta)}</span>`:""}${it.tag?`<span class="tag">${esc(it.tag)}</span>`:""}${I.ck}</button>`;
  function paintList(){
    let h="";
    for(const g of o.groups){
      let gh="";
      for(const it of g.items){
        if(it.children){
          const kids=it.children.filter(k=>hit(k)||hit(it));if(q&&!kids.length)continue;
          const open=exp.has(it.id)||!!q;
          gh+=`<div class="ncd-grp${open?" exp":""}" data-ncg="${esc(it.id)}"><button type="button" class="ncd-opt" data-tog="${esc(it.id)}" aria-expanded="${open}"><span class="t">${mark(it.label)}${it.sub?`<small>${esc(it.sub)}</small>`:""}</span>${it.meta?`<span class="m">${esc(it.meta)}</span>`:""}${I.cv}</button>
            <div class="ncd-kids"><div>${kids.map(optHTML).join("")}</div></div></div>`;
        } else if(hit(it)) gh+=optHTML(it);
      }
      if(gh) h+=`<div class="ncd-gh">${esc(g.label)}</div>`+gh;
    }
    list.innerHTML=h||`<div class="ncd-empty">No matches for “${esc(q)}”</div>`;hl=-1;
  }
  const opts=()=>[...list.querySelectorAll(q?".ncd-opt[data-ncv]:not([aria-disabled])":".ncd-opt:not([aria-disabled])")].filter(b=>{const k=b.closest(".ncd-kids");return !k||k.parentElement.classList.contains("exp")});
  const setHl=i=>{const a=opts();if(!a.length)return;hl=(i+a.length)%a.length;a.forEach((b,j)=>b.classList.toggle("hl",j===hl));a[hl].scrollIntoView({block:"nearest"})};
  function open(){if(el.classList.contains("open"))return;document.querySelectorAll(".ncd.open").forEach(d=>d!==el&&d._close());q="";inp.value="";paintList();el.classList.add("open");trig.setAttribute("aria-expanded","true");inp.focus({preventScroll:true})}
  function close(focus){el.classList.remove("open");trig.setAttribute("aria-expanded","false");if(focus)trig.focus({preventScroll:true})}
  el._close=close;
  function pick(id){o.value=id;paintTrig();close(true);o.onSelect&&o.onSelect(o.find(id))}
  trig.addEventListener("click",()=>el.classList.contains("open")?close():open());
  inp.addEventListener("input",()=>{q=inp.value.trim();paintList();if(q)setHl(0)});
  list.addEventListener("click",e=>{
    const t=e.target.closest("[data-tog]");if(t){const id=t.dataset.tog,g=t.parentElement;exp.has(id)?exp.delete(id):exp.add(id);g.classList.toggle("exp",exp.has(id));t.setAttribute("aria-expanded",exp.has(id));return}
    const b=e.target.closest(".ncd-opt[data-ncv]");if(b&&!b.hasAttribute("aria-disabled"))pick(b.dataset.ncv);
  });
  el.addEventListener("keydown",e=>{
    if(!el.classList.contains("open")){if(e.key==="ArrowDown"&&e.target===trig){e.preventDefault();open()}return}
    if(e.key==="Escape"){e.preventDefault();close(true)}
    else if(e.key==="ArrowDown"){e.preventDefault();setHl(hl+1)}
    else if(e.key==="ArrowUp"){e.preventDefault();setHl(hl-1)}
    else if(e.key==="Enter"&&hl>=0){e.preventDefault();const b=opts()[hl];b.dataset.tog?b.click():pick(b.dataset.ncv)}
  });
  paintTrig();
  return el;
}
document.addEventListener("pointerdown",e=>{document.querySelectorAll(".ncd.open").forEach(d=>{if(!d.contains(e.target))d._close()})});

/* ---------- page shell ---------- */
function open(){
  if(root)return;reset();
  root=document.createElement("section");root.className="ncp";root.setAttribute("aria-label","New consult");
  document.body.appendChild(root);document.body.classList.add("ncp-open");
  paint();void root.offsetWidth;setTimeout(()=>root&&root.classList.add("in"),16);
  root.querySelector(".ncp-back").focus({preventScroll:true});
}
function close(){
  if(!root)return;const r=root;root=null;importRun++;
  r.classList.remove("in");document.body.classList.remove("ncp-open");
  setTimeout(()=>r.remove(),T(260));
}
function go(n){NC.step=n;NC.maxStep=Math.max(NC.maxStep,n);paint();root.scrollTo({top:0,behavior:RM?"auto":"smooth"})}
function paint(){
  const steps=[["Patient"],["Specialty & consultant"],["Review request"]];
  root.innerHTML=`<div class="ncp-wrap">
    <button type="button" class="ncp-back">${I.back}My consults</button>
    <div class="ncp-h"><div><h1>New consult</h1><p>${["Choose the patient. Their chart is pulled in automatically.","Pick a specialty, or describe your question and we’ll route it.","Check the generated request, then send the page."][NC.step-1]}</p></div><span class="ncp-demo">Demo · Cardiovascular Medicine</span></div>
    <ol class="ncp-steps">${steps.map((s,i)=>{const n=i+1,cur=n===NC.step,done=n<NC.step||n<=NC.maxStep&&!cur;return (i?'<span class="ncp-sep" aria-hidden="true"></span>':"")+`<li><button type="button" class="ncp-step${done&&!cur?" done":""}" data-step="${n}"${cur?' aria-current="step"':""}${done&&!cur?"":" disabled"}><b>${done&&!cur?I.ok:n}</b>${s[0]}</button></li>`}).join("")}</ol>
    <div class="ncp-pane" id="ncpPane"></div></div>
    <div class="ncp-foot"><div id="ncpFoot"></div></div>`;
  root.querySelector(".ncp-back").onclick=close;
  root.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{if(!b.disabled)go(+b.dataset.step)});
  [paint1,paint2,paint3][NC.step-1]();
}
const foot=(hint,btns)=>{root.querySelector("#ncpFoot").innerHTML=`<span class="hint">${hint}</span>${btns}`};

/* ---------- step 1: patient ---------- */
function paint1(){
  const pane=root.querySelector("#ncpPane");
  pane.innerHTML=`<div class="ncp-grid"><div><div class="ncp-card"><h2>Patient</h2><p class="sub">Search by name, room or MRN.</p>
      <label class="ncp-lbl" id="ptLbl">Patient name</label><div id="ptDD"></div><div id="ptImp"></div></div></div>
    <aside class="ncp-card ncs" id="ptSide"></aside></div>`;
  const byUnit={};Object.entries(PT).forEach(([k,p])=>{(byUnit[unitOf(p.room)]=byUnit[unitOf(p.room)]||[]).push({id:k,label:p.name,sub:`${p.room} · ${p.mrn}`,meta:`${CHART[k].age}${CHART[k].sex}`})});
  const items=Object.keys(byUnit).sort().map(u=>({id:"u:"+u,label:u,meta:`${byUnit[u].length} patients`,children:byUnit[u]}));
  const dd=Dropdown({placeholder:"Select a patient",search:"Search patients, room or MRN",value:NC.pt,expanded:items.map(i=>i.id),
    groups:[{label:"My patients · by unit",items}],
    find:id=>({id,...PT[id]}),
    renderValue:p=>`<b>${esc(p.name)}</b><span>${esc(p.room)} · ${esc(p.mrn)}</span>`,
    onSelect:p=>{if(NC.pt!==p.id){NC.pt=p.id;NC.imported=false;NC.route=null;NC.clin=null;NC.chat=[];NC.chatDone=false;NC.maxStep=1;paintSteps();runImport()}}});
  dd.querySelector(".ncd-trig").setAttribute("aria-labelledby","ptLbl");
  pane.querySelector("#ptDD").appendChild(dd);
  if(NC.pt){renderImport(NC.imported?99:0);if(!NC.imported)runImport()}
  side1();foot1();
}
function paintSteps(){const s=root.querySelectorAll(".ncp-step");s.forEach(b=>{const n=+b.dataset.step;if(n>NC.step&&n>NC.maxStep){b.disabled=true;b.classList.remove("done");b.querySelector("b").textContent=n}})}
const IMPORT_ROWS=[["Demographics & room",c=>`${c.age}-year-old ${c.sex==="F"?"woman":"man"} · ${PT[NC.pt].room} · ${unitOf(PT[NC.pt].room)}`],["Admission & primary team",c=>`${c.adm} · ${TEAM}`],["Cardiac history",c=>`${c.hx}<br><span style="color:var(--ink2)">Cardiologist: ${esc(c.cardio)}</span>`],["Latest ECG & telemetry",c=>`${c.ecg}<br><span style="color:var(--ink2)">Telemetry: ${esc(c.tele)}</span>`],["Cardiac labs & trend",c=>c.labs],["Recent cardiac testing",c=>c.testing]];
function renderImport(done){
  const c=CHART[NC.pt],box=root.querySelector("#ptImp");if(!box)return;
  const n=IMPORT_ROWS.length,pct=Math.min(100,Math.round(Math.min(done,n)/n*100)),fin=done>=n;
  box.innerHTML=`<div class="nci ${fin?"done":"run"}" aria-live="polite"><div class="nci-top"><span class="ic">${I.chart}</span><div><b>${fin?"Chart imported":"Importing chart from Epic…"}</b><span>${fin?`${n} sources · ready to use in the request`:`Pulling ${esc(PT[NC.pt].name)}’s record`}</span></div><span class="pct">${pct}%</span></div>
    <div class="nci-bar"><i style="width:${pct}%"></i></div>
    <div class="nci-rows">${IMPORT_ROWS.map(([k,f],i)=>`<div class="nci-row ${i<done?"ok":i===done?"act":""}"><span class="st">${i<done?I.ok:""}</span><span class="k">${k}</span><span class="v">${i<done?f(c):i===done?'<span class="shim"></span>':""}</span></div>`).join("")}
    ${fin&&c.flag?`<div style="padding-top:8px"><span class="nci-flag ${c.flag.t}">${I.warn}${esc(c.flag.x)}</span></div>`:""}</div></div>`;
}
async function runImport(){
  const run=++importRun,n=IMPORT_ROWS.length;foot1();side1();
  for(let i=0;i<=n;i++){if(run!==importRun||!root)return;renderImport(i);if(i<n)await sleep(T(420+Math.random()*260))}
  NC.imported=true;side1();foot1();
}
function side1(){
  const s=root.querySelector("#ptSide");if(!s)return;
  if(!NC.pt){s.innerHTML=`<h3>Before you consult cardiology</h3><div class="ncs-guide">Have these ready — the chart import fills most of them:<ul><li>Prior cardiac history and the patient’s cardiologist</li><li>Updated ECG and pertinent cardiac labs</li><li>Recent cardiac testing (Stanford or outside)</li><li>A clinical question tied to any troponin, ECG or telemetry abnormality</li></ul></div>`;return}
  const p=PT[NC.pt],c=CHART[NC.pt],ini=p.name.split(" ").map(w=>w[0]).join("");
  s.innerHTML=`<h3>Patient</h3><div class="ncs-pt"><span class="ini">${ini}</span><div><b>${esc(p.name)}</b><span>${esc(p.room)} · ${esc(p.mrn)}</span></div></div>
    <dl class="ncs-dl"><dt>Age / sex</dt><dd>${c.age} · ${c.sex}</dd><dt>Admitted for</dt><dd>${esc(c.adm)}</dd><dt>Primary team</dt><dd>${esc(TEAM)}</dd><dt>PAMF patient</dt><dd>${c.pamf?"Yes":"No"}</dd><dt>Chart</dt><dd>${NC.imported?"Imported":"Importing…"}</dd></dl>`;
}
function foot1(){
  foot(NC.pt?(NC.imported?"Chart imported. Next, choose who to consult.":"Importing chart…"):"Select a patient to continue.",`<button type="button" class="ncp-btn" id="n1"${NC.pt&&NC.imported?"":" disabled"}>Continue</button>`);
  root.querySelector("#n1").onclick=()=>go(2);
}

/* ---------- step 2: specialty ---------- */
function paint2(){
  const pane=root.querySelector("#ncpPane"),c=CHART[NC.pt],p=PT[NC.pt];
  pane.innerHTML=`<div class="ncp-grid"><div><div class="ncp-card">
      ${c.pamf?`<div class="ncp-alert warn">${I.warn}<div><b>${esc(p.name)} is a PAMF patient</b>Guidelines say to page PAMF Cardiology directly for the consult.<div class="act"><button type="button" class="ncp-btn sm" id="toPamf">Route to PAMF Cardiology</button></div></div></div>`:""}
      <div class="ncm" role="group" aria-label="How to choose the specialty"><span class="pill" aria-hidden="true"></span><button type="button" data-ncmode="pick" aria-pressed="${NC.mode==="pick"}">${I.list}Pick a specialty</button><button type="button" data-ncmode="ask" aria-pressed="${NC.mode==="ask"}">${I.spark}Ask a question</button></div>
      <div id="modeBody"></div><div id="oncall"></div></div></div>
    <aside id="side2"></aside></div>`;
  const pill=pane.querySelector(".ncm .pill"),movePill=()=>{const b=pane.querySelector(`.ncm [data-ncmode="${NC.mode}"]`);pill.style.left=b.offsetLeft+"px";pill.style.width=b.offsetWidth+"px"};
  requestAnimationFrame(movePill);
  pane.querySelectorAll(".ncm [data-ncmode]").forEach(b=>b.onclick=()=>{if(NC.mode===b.dataset.ncmode)return;if(NC.busy){NC.sess++;NC.chat=[];NC.busy=false;NC.awaiting=false;NC.question=""}NC.mode=b.dataset.ncmode;pane.querySelectorAll(".ncm [data-ncmode]").forEach(x=>x.setAttribute("aria-pressed",x===b));movePill();paintMode()});
  const tp=pane.querySelector("#toPamf");if(tp)tp.onclick=()=>{setRoute("pamf",NC.topic);NC.mode="pick";paint2()};
  paintMode();paintOncall();side2();foot2();
}
function paintMode(){NC.mode==="pick"?paintPick():paintAsk()}
function setRoute(r,topic){if(NC.route!==r)NC.clin=null;NC.route=r;if(topic!==undefined)NC.topic=topic;paintOncall();side2();foot2()}
function paintPick(){
  const body=root.querySelector("#modeBody");
  body.innerHTML=`<div class="ncp-row2"><div><label class="ncp-lbl" id="spLbl">Specialty</label><div id="spDD"></div></div><div><label class="ncp-lbl" id="tpLbl">Consult topic</label><div id="tpDD"></div></div></div>`;
  const cvKids=Object.entries(ROUTES).filter(([k])=>k!=="pamf"||CHART[NC.pt].pamf).map(([k,r])=>({id:k,label:r.name,sub:r.pager==="Voalte"||r.pager==="PAMF"?r.desc:`Pager ${r.pager}`}));
  const sp=Dropdown({placeholder:"Select a specialty",search:"Search specialties",value:NC.route,expanded:["cv"],
    groups:[{label:"Available in this demo",items:[{id:"cv",label:"Cardiovascular Medicine",meta:`${cvKids.length} services`,children:cvKids}]},{label:"Other specialties",items:OTHER_SPECS.map(s=>({id:"x:"+s,label:s,disabled:true,tag:"Not in demo"}))}],
    find:id=>({id,...ROUTES[id]}),
    renderValue:r=>`<b>${esc(r.name)}</b><span>${r.pager==="Voalte"||r.pager==="PAMF"?esc(r.pager):"Pager "+esc(r.pager)}</span>`,
    onSelect:r=>{setRoute(r.id);const sel=root.querySelector("#tpDD .ncd-trig");if(sel&&!NC.topic)setTimeout(()=>sel.click(),T(200))}});
  sp.querySelector(".ncd-trig").setAttribute("aria-labelledby","spLbl");
  const tp=Dropdown({placeholder:"What’s it about?",search:"Search topics",value:NC.topic,
    groups:TOPICS.map(g=>({label:g.g,items:g.items.map(([id,l])=>({id,label:l}))})),
    find:id=>({id,label:TOPIC_LABEL[id]}),renderValue:t=>`<b>${esc(t.label)}</b>`,
    onSelect:t=>{NC.topic=t.id;if(!NC.route)setRoute("gen");else{side2();foot2()}}});
  tp.querySelector(".ncd-trig").setAttribute("aria-labelledby","tpLbl");
  body.querySelector("#spDD").appendChild(sp);body.querySelector("#tpDD").appendChild(tp);
}
/* ask a question: centred composer → docks to the bottom, clarifying questions, then a route */
function paintAsk(){
  const body=root.querySelector("#modeBody");
  body.innerHTML=`<div class="ncc${NC.chat.length?" started":""}" id="ncc"><div class="ncc-hero"><h3>What do you need from cardiology?</h3><p>Describe the question in your own words. We’ll ask a couple of things, then route it.</p></div>
    <div class="ncc-log" id="nccLog" aria-live="polite"></div>
    <div class="ncc-comp"><div class="ncc-box"><textarea id="nccIn" rows="2" placeholder="e.g. New AF with RVR, rates 130s despite metoprolol — rate vs rhythm control and anticoagulation?" aria-label="Consult question"></textarea>
      <div class="ncc-tools"><button type="button" class="ncc-chip" data-ex="Rising troponin 34 → 91 with new T-wave inversions in a patient with prior PCI. Is this ACS or demand?">Try: rising troponin</button><button type="button" class="ncc-chip" data-ex="Pacemaker patient with 2.8 second pauses on telemetry overnight, needs device check">Try: pacemaker pauses</button><button type="button" class="ncc-send" id="nccSend" aria-label="Send question" disabled>${I.up}</button></div></div></div></div>`;
  const log=body.querySelector("#nccLog"),inp=body.querySelector("#nccIn"),send=body.querySelector("#nccSend"),wrap=body.querySelector("#ncc"),comp=body.querySelector(".ncc-comp");
  const setH=()=>wrap.style.setProperty("--ch",comp.offsetHeight+"px");setH();
  NC.chat.forEach(m=>log.insertAdjacentHTML("beforeend",m.html));log.querySelectorAll(".ncc-opts").forEach(o=>o.classList.add("used"));bindRouteCard(log);
  log.scrollTop=log.scrollHeight;
  const sync=()=>{send.disabled=!inp.value.trim()||NC.busy||NC.awaiting;inp.style.height="auto";inp.style.height=Math.min(96,inp.scrollHeight)+"px";setH()};
  inp.addEventListener("input",sync);
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(!send.disabled)send.click()}});
  body.querySelectorAll("[data-ex]").forEach(b=>b.onclick=()=>{inp.value=b.dataset.ex;sync();inp.focus()});
  send.onclick=()=>{const q=inp.value.trim();if(!q)return;inp.value="";sync();ask(q)};
  if(NC.awaiting)inp.placeholder="Choose an option above";
  setTimeout(()=>inp.focus({preventScroll:true}),T(100));
}
function chatAdd(html){NC.chat.push({html});const log=root&&root.querySelector("#nccLog");if(!log)return null;log.insertAdjacentHTML("beforeend",html);log.scrollTo({top:log.scrollHeight,behavior:RM?"auto":"smooth"});return log.lastElementChild}
async function aiSay(parts){
  const log=root.querySelector("#nccLog");if(!log)return;
  const t=chatAdd(`<div class="ncc-ai"><span class="dot">${I.spark}</span><div class="txt"><span class="ncc-typing"><i></i><i></i><i></i></span></div></div>`);
  await sleep(T(700));const txt=t.querySelector(".txt");txt.innerHTML="";
  for(const p of parts){
    if(p.text){const el=document.createElement("p");txt.appendChild(el);const s=p.text;for(let i=0;i<=s.length;i+=3){el.innerHTML=s.slice(0,i).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");log.scrollTop=log.scrollHeight;if(!RM)await sleep(12)}el.innerHTML=s.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>")}
    if(p.html){txt.insertAdjacentHTML("beforeend",p.html);log.scrollTop=log.scrollHeight}
  }
  NC.chat[NC.chat.length-1].html=t.outerHTML;return t;
}
function choose(t,opts){
  return new Promise(res=>{
    NC.awaiting=true;const inp=root.querySelector("#nccIn");if(inp)inp.placeholder="Choose an option above";
    const box=document.createElement("div");box.className="ncc-opts";box.innerHTML=opts.map(([v,l])=>`<button type="button" data-ncv="${v}">${esc(l)}</button>`).join("");
    t.querySelector(".txt").appendChild(box);const idx=NC.chat.length-1;
    box.onclick=e=>{const b=e.target.closest("button");if(!b)return;b.classList.add("pick");box.classList.add("used");NC.chat[idx].html=t.outerHTML;NC.awaiting=false;if(inp)inp.placeholder="Add more detail…";
      chatAdd(`<div class="ncc-me">${esc(b.textContent)}</div>`);res(b.dataset.ncv)};
    root.querySelector("#nccLog").scrollTop=1e6;
  });
}
async function ask(q){
  const wrap=root.querySelector("#ncc");wrap.classList.add("started");NC.busy=true;const sess=NC.sess,dead=()=>sess!==NC.sess||!root||!root.querySelector("#nccLog");
  chatAdd(`<div class="ncc-me">${esc(q)}</div>`);
  NC.question=NC.question?NC.question+" "+q:q;
  const r=routeQuestion(NC.question),p=PT[NC.pt],c=CHART[NC.pt];
  if(!r){await aiSay([{text:"I couldn’t match that to a cardiology question. This demo only covers **Cardiovascular Medicine** — try describing the cardiac concern (symptom, ECG, troponin, rhythm, device…), or switch to **Pick a specialty**."}]);NC.question="";NC.busy=false;return}
  NC.reason=r.reason;NC.topic=r.topic||NC.topic;
  if(dead())return;const t1=await aiSay([{text:`Got it — this sounds like a **${r.reason}** question for ${p.name}. Two quick checks before I route it.`},{text:"Is the patient hemodynamically stable right now?"}]);
  if(dead())return;const st=await choose(t1,[["stable","Stable"],["unstable","Unstable / worsening"]]);
  if(st==="unstable"){
    NC.unstable=true;NC.urg="Urgent";
    if(dead())return;const t=await aiSay([{html:`<div class="ncp-alert bad" style="margin:6px 0 0">${I.warn}<div><b>Call a Rapid Response (RRT) or code now</b>The cardiology fellow can’t act as an emergent responder. Activate the local emergency response first — you can still send the consult.</div></div>`},{text:"Continue with the consult request?"}]);
    if(dead())return;const go2=await choose(t,[["go","Yes, continue"],["stop","Stop here"]]);
    if(go2==="stop"){await aiSay([{text:"Okay. Use **My consults** to come back when the patient is stabilized."}]);NC.busy=false;return}
  } else {NC.unstable=false;NC.urg="Routine"}
  let route=r.route;
  if(route!=="adm"){
    if(dead())return;const t2=await aiSay([{text:"Is this a new consult during this admission, or is the patient being admitted to a cardiology service?"}]);
    if(dead())return;const ad=await choose(t2,[["consult","New consult"],["admit","Admitting to cardiology"]]);
    if(ad==="admit")route="adm";
  }
  if(c.pamf&&route!=="adm")route="pamf";
  if(/troponin|trop\b|t-wave|telemetry|ecg|ekg/i.test(NC.question)&&!/\?/.test(NC.question)){
    if(dead())return;const t3=await aiSay([{text:"Guidelines ask that troponin, ECG and telemetry findings come with a clinical question. What do you want cardiology to answer?"}]);
    if(dead())return;const qq=await choose(t3,[["acs","Is this ACS or demand?"],["mgmt","How should we manage it?"],["test","Is further testing needed?"]]);
    NC.question+=" "+{acs:"Is this ACS versus demand ischemia?",mgmt:"How should we manage this?",test:"Is further cardiac testing needed?"}[qq];
  }
  const R=ROUTES[route],why=[r.reason+" → "+(route==="pamf"?"PAMF patients go to PAMF Cardiology":route==="adm"?"admissions use the admission pager, not the consult pager":R.desc)];
  if(c.flag&&!(c.flag.t==="bad"&&/\?/.test(NC.question)))why.push(c.flag.x);
  if(NC.unstable)why.push("Marked urgent — RRT advised");
  const card=`<div class="ncc-route" data-route="${route}"><div class="r">Cardiovascular Medicine <i>›</i> ${esc(R.name)}</div><div class="pg">${R.pager==="Voalte"||R.pager==="PAMF"?esc(R.desc):"Pager "+R.pager}</div><ul>${why.map(w=>`<li>${esc(w)}</li>`).join("")}</ul><button type="button" class="ncp-btn sm" data-use>Show who’s on call</button> <button type="button" class="ncp-btn sm ghost" data-alt>Pick a different service</button></div>`;
  if(dead())return;await aiSay([{text:"Here’s where this should go:"},{html:card}]);if(dead())return;
  NC.busy=false;NC.chatDone=true;bindRouteCard(root.querySelector("#nccLog"));
}
function bindRouteCard(log){
  log.querySelectorAll(".ncc-route").forEach(card=>{
    const use=card.querySelector("[data-use]"),alt=card.querySelector("[data-alt]");
    if(use)use.onclick=()=>{setRoute(card.dataset.route);const oc=root.querySelector("#oncall");oc&&oc.scrollIntoView({behavior:RM?"auto":"smooth",block:"start"})};
    if(alt)alt.onclick=()=>{NC.route=card.dataset.route;NC.mode="pick";paint2()};
  });
}
function paintOncall(){
  const box=root.querySelector("#oncall");if(!box)return;
  if(!NC.route){box.innerHTML="";return}
  const R=ROUTES[NC.route],list=ONCALL[NC.route];
  if(!NC.clin){const a=list.find(x=>x[2]==="av");NC.clin=a?a[0]:null}
  box.innerHTML=`<div class="nco"><div class="nco-h"><b>On call now · ${esc(R.name)}</b><span>${R.pager==="Voalte"||R.pager==="PAMF"?esc(R.pager):"Pager "+esc(R.pager)} · ${fmtNow()}</span></div>
    <div class="nco-list" role="radiogroup" aria-label="Clinician to page">${list.map((x,i)=>`<button type="button" class="nco-it" role="radio" aria-checked="${NC.clin===x[0]}" data-ncc="${esc(x[0])}" style="animation-delay:${i*70}ms"><span class="rad"></span>${av(x[0],36)}<span class="who"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></span><span class="nco-st s-${x[2]}">${esc(x[3])}</span></button>`).join("")}</div>
    ${NC.route==="echo"?`<p class="nco-note">During the day, message the Lead Sonographer on Voalte. Between 5 PM and 7 AM the on-call fellow (24300) triages stat echo requests.</p>`:""}
    ${list.find(x=>x[0]===NC.clin&&x[2]!=="av")?`<p class="nco-note">This clinician isn’t immediately available — the page still goes to the ${esc(R.name)} pager.</p>`:""}</div>`;
  box.querySelectorAll(".nco-it").forEach(b=>b.onclick=()=>{NC.clin=b.dataset.ncc;box.querySelectorAll(".nco-it").forEach(x=>{x.setAttribute("aria-checked",x===b);x.style.animation="none";x.style.opacity=1;x.style.transform="none"});side2();foot2();
    const note=list.find(x=>x[0]===NC.clin&&x[2]!=="av"),old=box.querySelector(".nco-note:last-child");if(old&&!old.textContent.startsWith("During"))old.remove();if(note)box.querySelector(".nco").insertAdjacentHTML("beforeend",`<p class="nco-note">This clinician isn’t immediately available — the page still goes to the ${esc(R.name)} pager.</p>`)});
}
const fmtNow=()=>typeof fmt==="function"&&typeof NOW==="string"?fmt(NOW):"now";
function side2(){
  const s=root.querySelector("#side2");if(!s)return;const p=PT[NC.pt];
  s.innerHTML=`<div class="ncp-card ncs"><h3>Patient</h3><div class="ncs-pt"><span class="ini">${p.name.split(" ").map(w=>w[0]).join("")}</span><div><b>${esc(p.name)}</b><span>${esc(p.room)} · ${esc(p.mrn)}</span></div></div></div>
    <div class="ncp-card ncs"><h3>Routing</h3>${NC.route?`<dl class="ncs-dl" style="margin:0"><dt>Service</dt><dd>${esc(ROUTES[NC.route].name)}</dd><dt>Pager</dt><dd>${esc(ROUTES[NC.route].pager)}</dd><dt>Topic</dt><dd>${NC.topic?esc(TOPIC_LABEL[NC.topic]):"—"}</dd><dt>Clinician</dt><dd>${NC.clin?esc(NC.clin):"—"}</dd></dl>`:`<p class="ncs-empty">Pick a service, or ask a question to get one suggested.</p>`}</div>
    <div class="ncp-card ncs"><h3>Avoid a consult when</h3><div class="ncs-guide"><ul style="margin:0"><li>The patient is being admitted to cardiology — use the admission pager 27112</li><li>It’s an outpatient follow-up — send a referral instead</li><li>It’s a non-urgent question at discharge</li></ul></div></div>`;
}
function foot2(){
  const ok=NC.route&&NC.clin;
  foot(ok?`Paging ${esc(NC.clin)} · ${esc(ROUTES[NC.route].name)}`:"Choose a service and a clinician to continue.",`<button type="button" class="ncp-btn ghost" id="b2">Back</button><button type="button" class="ncp-btn" id="n2"${ok?"":" disabled"}>Generate request</button>`);
  root.querySelector("#b2").onclick=()=>go(1);root.querySelector("#n2").onclick=()=>go(3);
}

/* ---------- step 3: generated template ---------- */
const lc=t=>/^[A-Z][a-z]/.test(t)?t[0].toLowerCase()+t.slice(1):t;
const nowStamp=()=>`Today · ${fmtNow()}`;
function buildFields(){
  const p=PT[NC.pt],c=CHART[NC.pt];
  const q=NC.question||(NC.topic?TOPIC_Q[NC.topic]:"");
  return {
    name:p.name,mrn:p.mrn,room:p.room,team:TEAM,req:`${typeof ME==="string"?ME:"Destiny Jones, MD"} · Attending hospitalist`,cb:typeof CALLBACK==="string"?CALLBACK:"",at:nowStamp(),need:NC.urg==="Urgent"?"Within 1 hour":"Today",
    summary:`${c.age}-year-old ${c.sex==="F"?"woman":"man"} with ${/^No known/.test(c.hx)?"no known cardiac history":lc(c.hx)}, admitted for ${lc(c.adm)}.`,
    question:q,
    history:`${c.hx}. Current medications: ${c.meds}.`,
    results:`ECG: ${c.ecg}. Telemetry: ${c.tele}. Labs: ${c.labs}. Testing: ${c.testing}.`,
    cardio:`${c.hx} · Cardiologist: ${c.cardio}`,tele:c.tele,labs:c.labs,pamf:c.pamf,ecgOk:c.ecgOk
  };
}
function paint3(){
  const pane=root.querySelector("#ncpPane"),f=buildFields(),R=ROUTES[NC.route];
  const fld=(k,label,req,cls,ta,src)=>`<div class="nct-f ${cls||""}" data-nck="${k}"><label for="f-${k}">${label}${req?" <i>*</i>":""}</label>${ta?`<textarea id="f-${k}" rows="${ta}"${req?" data-req":""}></textarea>`:`<input id="f-${k}" type="text"${req?" data-req":""}>`}${src?`<span class="src">${src}</span>`:""}</div>`;
  pane.innerHTML=`<div class="ncp-grid"><div>
      <div class="nct-gen" id="gen"><span class="spin"></span>Generating the request from the chart and your answers…</div>
      <div id="secs" hidden>
      <section class="nct-sec" style="animation-delay:0ms"><div class="nct-sh"><b>1</b>Patient and requester</div><div class="nct-body">
        ${fld("name","Patient name",1,"s3")}${fld("mrn","MRN",1,"s2")}${fld("room","Room",1,"s1")}
        ${fld("team","Primary team",1,"s3")}${fld("req","Requester name and role",1,"s3")}
        ${fld("cb","Callback number",1,"s2")}${fld("at","Requested date and time",1,"s2")}${fld("need","Needed by",0,"s2")}</div></section>
      <section class="nct-sec" style="animation-delay:90ms"><div class="nct-sh"><b>2</b>Clinical request</div><div class="nct-body">
        ${fld("summary","One-line patient summary",1,"",2,"From chart import")}
        ${fld("question","Focused consult question",1,"",3,NC.mode==="ask"&&NC.chat.length?"From your question":"From the consult topic — edit to make it specific")}
        ${fld("history","Relevant history, treatments, and recent change",0,"",3,"From chart import")}
        ${fld("results","Pertinent results available now and tests still pending",0,"",3,"From chart import")}</div></section>
      <section class="nct-sec" style="animation-delay:180ms"><div class="nct-sh"><b>3</b>Urgency and safety</div><div class="nct-body"><div class="nct-f">
        <div class="nct-radios" role="radiogroup" aria-label="Urgency"><label><input type="radio" name="urg" value="Routine">Routine</label><label><input type="radio" name="urg" value="Urgent">Urgent</label><label class="bad"><input type="radio" name="urg" value="Unstable">Patient unstable — activate local emergency response</label></div>
        <div id="urgNote"></div></div></div></section>
      <section class="nct-sec" style="animation-delay:270ms"><div class="nct-sh"><b>4</b>Cardiovascular details</div><div class="nct-body">
        <div class="nct-f s2"><label>PAMF patient</label><div class="nct-radios"><label><input type="radio" name="pamf" value="yes">Yes</label><label><input type="radio" name="pamf" value="no">No</label></div></div>
        <div class="nct-f s4"><label>Updated ECG</label><div class="nct-radios"><label><input type="radio" name="ecg" value="yes">Available</label><label><input type="radio" name="ecg" value="no">Not available</label></div></div>
        ${fld("cardio","Prior cardiac history and cardiologist",1,"",2,"From chart import")}
        ${fld("tele","Telemetry issue",0,"s3")}${fld("labs","Pertinent cardiac labs and trend",1,"s3")}</div></section>
      </div></div>
    <aside class="nct-side" id="side3"></aside></div>`;
  side3(true);foot3(true);
  setTimeout(async()=>{
    if(!root||NC.step!==3)return;
    pane.querySelector("#gen").remove();pane.querySelector("#secs").hidden=false;
    pane.querySelector(`input[name=urg][value="${NC.unstable?"Unstable":NC.urg}"]`).checked=true;
    pane.querySelector(`input[name=pamf][value="${f.pamf?"yes":"no"}"]`).checked=true;
    pane.querySelector(`input[name=ecg][value="${f.ecgOk?"yes":"no"}"]`).checked=true;
    urgNote();
    const order=["name","mrn","room","team","req","cb","at","need","summary","question","history","results","cardio","tele","labs"];
    for(const k of order){
      const el=pane.querySelector("#f-"+k);if(!el||!root)continue;const v=f[k]||"",w=el.closest(".nct-f");w.classList.add("fill");
      if(RM||v.length<4){el.value=v}else{for(let i=0;i<=v.length;i+=Math.max(2,Math.ceil(v.length/22))){el.value=v.slice(0,i);await sleep(14)}el.value=v}
      setTimeout(()=>w.classList.remove("fill"),T(900));
    }
    pane.querySelectorAll("input,textarea").forEach(el=>el.addEventListener("input",()=>{validate();side3()}));
    pane.querySelectorAll("input[name=urg]").forEach(el=>el.addEventListener("change",()=>{urgNote();side3()}));
    pane.querySelectorAll("input[name=pamf],input[name=ecg]").forEach(el=>el.addEventListener("change",()=>side3()));
    validate();side3();
  },T(1100));
}
function urgNote(){const v=root.querySelector("input[name=urg]:checked")?.value,n=root.querySelector("#urgNote");if(!n)return;
  n.innerHTML=v==="Unstable"?`<div class="ncp-alert bad" style="margin:12px 0 0">${I.warn}<div><b>Call an RRT or code first</b>The cardiology fellow cannot act as an emergent responder. Send the consult after the emergency response is activated.</div></div>`:
  v==="Urgent"?`<div class="ncp-alert info" style="margin:12px 0 0">${I.info}<div>Urgent pages are fine any time. Re-page only for an acute change or if it’s been more than 1 hour.</div></div>`:
  `<div class="ncp-alert info" style="margin:12px 0 0">${I.info}<div>For low-acuity or late non-urgent consults, the fellow may give preliminary recommendations and see the patient tomorrow. Please avoid non-urgent pages 10 PM–7 AM and Tuesdays 7:30–9 AM.</div></div>`}
const val=k=>(root.querySelector("#f-"+k)?.value||"").trim();
function validate(){let ok=true;root.querySelectorAll("[data-req]").forEach(el=>{const miss=!el.value.trim();el.closest(".nct-f").classList.toggle("miss",miss);if(miss)ok=false});foot3(false,ok);return ok}
function side3(loading){
  const s=root.querySelector("#side3");if(!s)return;const R=ROUTES[NC.route],c=CHART[NC.pt],p=PT[NC.pt];
  const q=val("question"),hasQ=q.length>15,abn=/rising|elevat|inversion|st elev|pause|tachy|wide/i.test(c.labs+" "+c.ecg+" "+c.tele);
  const items=[
    ["Patient name, MRN, brief history, focused question, and callback are included.",!loading&&val("name")&&val("mrn")&&val("summary")&&hasQ&&val("cb")],
    ["Prior cardiac history and the patient’s cardiologist are identified.",!loading&&val("cardio").length>8],
    ["Updated ECG and pertinent cardiac laboratory trends are available or pending.",!loading&&!!root.querySelector("input[name=ecg]:checked")&&val("labs")],
    ["Recent Stanford or outside cardiac testing is summarized.",!loading&&/testing/i.test(val("results"))],
    ["Troponin, ECG, or telemetry abnormalities are linked to a clinical question.",!loading&&(!abn||/\?/.test(q))],
    ["The correct general, admission, or subspecialty cardiology route is selected.",!loading&&!!NC.route&&(!c.pamf||NC.route==="pamf"||NC.route==="adm")]
  ];
  const msg=`New consult — ${R.name}\n${p.name} · MRN ${p.mrn} · Rm ${p.room}\n${val("summary")||"…"}\nQ: ${q||"…"}\nCallback ${val("cb")||"…"} · ${typeof ME==="string"?ME:""}`;
  s.innerHTML=`<div class="ncp-card"><h2 style="font-size:14.5px;margin-bottom:12px">Page goes to</h2><div class="nct-route">${av(NC.clin,40)}<div><b>${esc(NC.clin)}</b><span>${esc(R.name)}</span></div></div>
      <div class="nct-pg">${R.pager==="Voalte"||R.pager==="PAMF"?esc(R.desc):`Pager <b>${esc(R.pager)}</b> · ${esc(R.desc)}`}</div>
      <div class="nct-msg" aria-label="Page preview">${esc(msg)}</div></div>
    <div class="ncp-card"><h2 style="font-size:14.5px;margin-bottom:12px">Specialty checklist</h2><ul class="nct-ck">${items.map(([t,on])=>`<li class="${on?"on":""}"><span class="b">${on?I.ok:""}</span>${esc(t)}</li>`).join("")}</ul></div>`;
}
function foot3(loading,ok){
  foot(loading?"Generating…":ok?"Ready to send. The fellow will call back to acknowledge.":"Fill the required fields marked *.",`<button type="button" class="ncp-btn ghost" id="b3">Back</button><button type="button" class="ncp-btn" id="send"${loading||!ok?" disabled":""}>Send page</button>`);
  root.querySelector("#b3").onclick=()=>go(2);root.querySelector("#send").onclick=sendPage;
}
async function sendPage(){
  const b=root.querySelector("#send");b.disabled=true;b.innerHTML='<span class="spin"></span>Sending…';
  await sleep(T(900));if(!root)return;
  const R=ROUTES[NC.route],urg=root.querySelector("input[name=urg]:checked")?.value||"Routine",q=val("question");
  const time=B.tick(),id="n"+Date.now().toString(36);
  const reason=NC.reason||(NC.topic?TOPIC_LABEL[NC.topic]:q.split(/[.?]/)[0].slice(0,60));
  C.push({id,pt:NC.pt,svc:"Cardiology",who:NC.clin,whoRole:R.name,urg:urg==="Unstable"?"Emergent":urg,emergent:urg==="Unstable",reason,ordered:time,question:q,requester:typeof ME==="string"?ME:undefined,
    status:"paged",time,note:`Page sent to ${R.name}${/^\d+$/.test(R.pager)?" (pager "+R.pager+")":""} for ${NC.clin}. No acknowledgement yet.`,
    events:[[time,"Order created","SEAL consult request · chart imported","ok"],[time,"Paged",`${R.name}${/^\d+$/.test(R.pager)?" · pager "+R.pager:""} · ${NC.clin}`,"blue"]]});
  const name=PT[NC.pt].name;close();
  try{B.render()}catch(e){console.error(e)}
  requestAnimationFrame(()=>{const r=document.querySelector(`.tr.row[data-id="${id}"]`);if(r){r.classList.add("ncp-new");r.scrollIntoView({block:"center",behavior:RM?"auto":"smooth"})}});
  toast(`Page sent to ${R.name} for ${name}`);
  const live=document.getElementById("tdlive");if(live)live.textContent=`Consult page sent to ${R.name} for ${name}.`;
}
function toast(msg){
  const t=document.createElement("div");t.className="ncp-toast";t.setAttribute("role","status");t.innerHTML=`<span class="ok">${I.ok}</span>${esc(msg)}`;
  document.body.appendChild(t);void t.offsetWidth;setTimeout(()=>t.classList.add("in"),16);
  setTimeout(()=>{t.classList.remove("in");setTimeout(()=>t.remove(),400)},3600);
}

/* ---------- wiring ---------- */
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest(".topnew,.newc,.acct-m .btn.primary");
  if(!b)return;e.preventDefault();
  open();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&root&&!document.querySelector(".ncd.open")&&!e.target.closest("textarea,input"))close()});
window.NewConsult={open,close};
})();
