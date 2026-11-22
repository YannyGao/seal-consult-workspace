/* =====================================================================
   New consult page.
   Opens from any "New consult" button as its own page (one centred column under the top bar).
   1 Patient — the field is the search; picking a patient runs the simulated chart import
   2 Specialty & consultant — pick specialty + topic, or ask a question and get routed after
     clarifying questions; once both are known, the clinicians on call appear
   3 Review request — generated from the Cardiovascular Medicine Consult Request Form → Send page
   Routing and pagers follow the cardiovascular consultation guidelines supplied for the demo.
   All patients, clinicians and chart data are synthetic. Not for clinical use.
   Reads the workboard through window.SEAL_BRIDGE (set at the end of the main script).
   ===================================================================== */
(function(){
"use strict";
const B=window.SEAL_BRIDGE;if(!B){console.warn("New consult: SEAL_BRIDGE missing");return}
const {C,PT,av,ME,TEAM,CALLBACK,NOW,fmt}=B;
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
const T=ms=>RM?0:ms;
const SV=(p,w)=>`<svg width="${w||16}" height="${w||16}" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const I={
  chev:SV('<path d="M4 6l4 4 4-4"/>'),
  back:SV('<path d="M10 3.5L5.5 8l4.5 4.5"/>'),
  ckm:SV('<path d="M3.5 8.5l3 3 6-7"/>',14),
  ck:'<svg class="nc-ck" width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="url(#ncG)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ckGreen:'<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.6l3.2 3.2L13 4.6" fill="none" stroke="url(#ncGreen)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ok:'<svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  spark:'<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l1.6 4.4 4.4 1.6-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6z" fill="url(#ncG)"/></svg>',
  sparkSm:'<svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l1.6 4.4 4.4 1.6-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6z" fill="url(#ncG)"/></svg>',
  sparkIn:SV('<path d="M8 1.5l1.6 4.4 4.4 1.6-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6z" fill="currentColor" stroke="none"/>',13),
  up:SV('<path d="M8 13V3.5M3.8 7.5L8 3.3l4.2 4.2"/>'),
  list:SV('<path d="M5.5 4h8M5.5 8h8M5.5 12h8"/><circle cx="2.5" cy="4" r=".6"/><circle cx="2.5" cy="8" r=".6"/><circle cx="2.5" cy="12" r=".6"/>',14),
  clock:SV('<circle cx="8" cy="8" r="5.8"/><path d="M8 5v3.2l2 1.3"/>',12),
  moon:SV('<path d="M12.5 9.8A5 5 0 0 1 6.2 3.5a5 5 0 1 0 6.3 6.3z"/>',12),
  chevR:SV('<path d="M6 4l4 4-4 4"/>',14),
  x:SV('<path d="M4 4l8 8M12 4l-8 8"/>'),
  warn:SV('<path d="M8 2l6.5 11.5h-13z"/><path d="M8 6.5v3.2"/><circle cx="8" cy="11.6" r=".5"/>'),
  info:SV('<circle cx="8" cy="8" r="6.2"/><path d="M8 7.2v4"/><circle cx="8" cy="4.9" r=".5"/>'),
  /* thinking icons — each one moves a little while its step runs */
  person:SV('<circle cx="8" cy="5.5" r="2.5"/><path d="M3.5 13.5c.6-2.4 2.4-3.6 4.5-3.6s3.9 1.2 4.5 3.6"/>'),
  doc:SV('<rect x="3.5" y="2" width="9" height="12" rx="1.8"/><path class="nc-l1" d="M6 6h4"/><path class="nc-l2" d="M6 8.5h4"/><path class="nc-l3" d="M6 11h2.5"/>'),
  heart:SV('<path class="nc-beat" d="M8 13.2S2.5 10 2.5 6.3A2.8 2.8 0 0 1 8 5a2.8 2.8 0 0 1 5.5 1.3C13.5 10 8 13.2 8 13.2z"/>'),
  ecg:SV('<path class="nc-trace" d="M1.5 8.5h3l1.5-4 2.5 8 1.8-5.5 1 1.5h3.2"/>'),
  labs:SV('<path class="nc-b1" d="M4 13V9"/><path class="nc-b2" d="M8 13V5"/><path class="nc-b3" d="M12 13V7.5"/>'),
  scope:SV('<g class="nc-scan"><circle cx="7" cy="7" r="3.8"/><path d="M10 10l3.2 3.2"/></g>'),
  route:SV('<g class="nc-scan"><circle cx="4" cy="4" r="1.6"/><circle cx="12" cy="12" r="1.6"/><path d="M5.6 4H10a2 2 0 0 1 0 4H6a2 2 0 0 0 0 4h4.4"/></g>'),
  people:SV('<circle cx="6" cy="6" r="2.2"/><path d="M2 13c.5-2 2-3 4-3s3.5 1 4 3"/><path class="nc-l1" d="M11 4.2a2 2 0 0 1 0 3.6"/><path class="nc-l2" d="M12.2 10.3c1 .4 1.6 1.3 1.8 2.7"/>'),
  pen:SV('<path d="M10.5 3l2.5 2.5L6 12.5 3 13l.5-3z"/><path class="nc-l1" d="M3 15h6"/>'),
  link:SV('<g class="nc-scan"><path d="M6.5 9.5l3-3"/><path d="M7.5 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M8.5 11.5l-1 1A2.5 2.5 0 0 1 4 9l1-1"/></g>'),
  form:SV('<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path class="nc-l1" d="M5 6h6"/><path class="nc-l2" d="M5 8.5h6"/><path class="nc-l3" d="M5 11h3.5"/>'),
  think:SV('<g class="nc-orbit"><circle cx="8" cy="3" r="1.3" fill="currentColor" stroke="none"/><circle cx="12.3" cy="10.5" r="1.1" fill="currentColor" stroke="none" opacity=".6"/><circle cx="3.7" cy="10.5" r=".9" fill="currentColor" stroke="none" opacity=".35"/></g>')
};
/* shared gradient defs for strokes/fills */
if(!document.getElementById("ncG"))document.body.insertAdjacentHTML("beforeend",`<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  <linearGradient id="ncG" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1F2328"/><stop offset="1" stop-color="#5E6470"/></linearGradient>
  <linearGradient id="ncGreen" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1FA463"/><stop offset="1" stop-color="#14B8A6"/></linearGradient></defs></svg>`);

/* one status line that swaps smoothly (icon + shimmering label), like a chain-of-thought indicator */
function Thinker(){
  const el=document.createElement("div");el.className="nc-think";el.setAttribute("aria-live","polite");
  el.innerHTML='<span class="nc-think-ic"></span><span class="nc-think-line"></span>';
  const ic=el.firstChild,line=el.lastChild;let cur=null,curIc=null;
  el.set=(text,icon,shimmer)=>{
    if(icon!==curIc){ic.innerHTML=icon?`<span>${I[icon]}</span>`:"";curIc=icon}
    const s=document.createElement("span");s.className="nc-think-t"+(shimmer===false?"":" nc-shimmer");s.textContent=text;
    if(cur){const o=cur;o.classList.add("out");setTimeout(()=>o.remove(),T(380));s.classList.add("in")}
    line.appendChild(s);cur=s;
  };
  return el;
}

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
const NC={sess:0};
let root=null,importRun=0,ocRun=0;
function reset(){NC.sess++;importRun++;ocRun++;Object.assign(NC,{step:1,maxStep:1,pt:null,imported:false,mode:"pick",route:null,topic:null,clin:null,question:"",reason:"",urg:"Routine",chat:[],busy:false,awaiting:false,askRouted:false,askResult:null,unstable:false,ocKey:null})}
const isPager=p=>/^\d+$/.test(p);
const pagerText=r=>isPager(r.pager)?"Pager "+r.pager:r.pager;
const initials=n=>n.replace(/,.*$/,"").split(/\s+/).map(w=>w[0]).join("").slice(0,2);
const fmtNow=()=>fmt(NOW);

/* ---------- combobox: the field is the search (no second search box) ---------- */
function Combo(o){
  const el=document.createElement("div");el.className="ncd";const lid="ncd"+Math.random().toString(36).slice(2,7);
  let q="",hl=-1;const exp=new Set(o.expanded||[]);
  el.innerHTML=`<div class="ncd-field"><input class="ncd-in" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${lid}" autocomplete="off" spellcheck="false" placeholder="${esc(o.placeholder)}"${o.labelledby?` aria-labelledby="${o.labelledby}"`:""}><span class="ncd-meta"></span><button type="button" class="ncd-chev" tabindex="-1" aria-label="Show options">${I.chev}</button></div>
    <div class="ncd-pop"><div><div class="ncd-panel"><div class="ncd-list" role="listbox" id="${lid}"></div></div></div></div>`;
  const inp=el.querySelector(".ncd-in"),meta=el.querySelector(".ncd-meta"),list=el.querySelector(".ncd-list"),chev=el.querySelector(".ncd-chev"),field=el.querySelector(".ncd-field");
  const sel=()=>o.value?o.find(o.value):null;
  const isOpen=()=>el.classList.contains("open");
  function paintVal(){const v=sel();inp.value=v?v.label:"";meta.textContent=v&&v.meta?v.meta:"";el.classList.toggle("has",!!v)}
  const mark=s=>{if(!q)return esc(s);const i=s.toLowerCase().indexOf(q.toLowerCase());return i<0?esc(s):esc(s.slice(0,i))+"<mark>"+esc(s.slice(i,i+q.length))+"</mark>"+esc(s.slice(i+q.length))};
  const hit=it=>!q||(it.label+" "+(it.sub||"")+" "+(it.meta||"")).toLowerCase().includes(q.toLowerCase());
  const optHTML=it=>`<button type="button" class="ncd-opt" role="option" tabindex="-1" data-ncv="${esc(it.id)}" aria-selected="${o.value===it.id}"${it.disabled?' aria-disabled="true"':""}><span class="ncd-t">${mark(it.label)}${it.sub?`<small>${mark(it.sub)}</small>`:""}</span>${it.meta?`<span class="ncd-m">${esc(it.meta)}</span>`:""}${it.tag?`<span class="ncd-tag">${esc(it.tag)}</span>`:""}<span class="ncd-ckm">${I.ckm}</span></button>`;
  function paintList(){
    let h="";
    for(const g of o.groups){
      let gh="";
      for(const it of g.items){
        if(it.children){
          const kids=it.children.filter(k=>hit(k)||hit(it));if(q&&!kids.length)continue;
          const opn=exp.has(it.id)||!!q;
          gh+=`<div class="ncd-grp${opn?" ncd-exp":""}"><button type="button" class="ncd-opt" tabindex="-1" data-nctog="${esc(it.id)}" aria-expanded="${opn}"><span class="ncd-t">${mark(it.label)}</span>${it.meta?`<span class="ncd-m">${esc(it.meta)}</span>`:""}<span class="ncd-cv">${I.chev}</span></button><div class="ncd-kids"><div>${kids.map(optHTML).join("")}</div></div></div>`;
        } else if(hit(it)) gh+=optHTML(it);
      }
      if(gh)h+=`<div class="ncd-gh">${esc(g.label)}</div>`+gh;
    }
    list.innerHTML=h||`<div class="ncd-empty">No matches for “${esc(q)}”</div>`;hl=-1;
  }
  const opts=()=>[...list.querySelectorAll(q?".ncd-opt[data-ncv]:not([aria-disabled])":".ncd-opt:not([aria-disabled])")].filter(b=>{const k=b.closest(".ncd-kids");return !k||k.parentElement.classList.contains("ncd-exp")});
  const setHl=i=>{const a=opts();if(!a.length)return;hl=(i+a.length)%a.length;a.forEach((b,j)=>b.classList.toggle("ncd-hl",j===hl));a[hl].scrollIntoView({block:"nearest"})};
  function open(){if(isOpen())return;document.querySelectorAll(".ncd.open").forEach(d=>d!==el&&d._close());q="";paintList();el.classList.add("open");inp.setAttribute("aria-expanded","true");if(sel())inp.select()}
  function close(){if(!isOpen())return;el.classList.remove("open");inp.setAttribute("aria-expanded","false");q="";paintVal()}
  el._close=close;
  function pick(id){o.value=id;el.classList.remove("open");inp.setAttribute("aria-expanded","false");q="";paintVal();o.onSelect&&o.onSelect(o.find(id))}
  inp.addEventListener("focus",open);
  inp.addEventListener("mousedown",()=>{if(document.activeElement===inp&&!isOpen())open()});
  field.addEventListener("mousedown",e=>{if(e.target===field){e.preventDefault();inp.focus()}});
  chev.addEventListener("mousedown",e=>e.preventDefault());
  chev.addEventListener("click",()=>{if(isOpen())close();else{if(document.activeElement===inp)open();else inp.focus()}});
  inp.addEventListener("input",()=>{if(!isOpen())open();q=inp.value.trim();paintList();if(q)setHl(0)});
  list.addEventListener("mousedown",e=>e.preventDefault());
  list.addEventListener("click",e=>{
    const t=e.target.closest("[data-nctog]");if(t){const id=t.dataset.nctog,g=t.parentElement;exp.has(id)?exp.delete(id):exp.add(id);g.classList.toggle("ncd-exp",exp.has(id));t.setAttribute("aria-expanded",exp.has(id));return}
    const b=e.target.closest(".ncd-opt[data-ncv]");if(b&&!b.hasAttribute("aria-disabled"))pick(b.dataset.ncv);
  });
  inp.addEventListener("keydown",e=>{
    if(!isOpen()){if(e.key==="ArrowDown"){e.preventDefault();open()}return}
    if(e.key==="Escape"){e.preventDefault();e.stopPropagation();close()}
    else if(e.key==="ArrowDown"){e.preventDefault();setHl(hl+1)}
    else if(e.key==="ArrowUp"){e.preventDefault();setHl(hl-1)}
    else if(e.key==="Enter"){e.preventDefault();if(hl<0&&q)setHl(0);const b=opts()[hl];if(b)b.dataset.nctog?b.click():pick(b.dataset.ncv)}
    else if(e.key==="Tab")close();
  });
  inp.addEventListener("blur",()=>setTimeout(()=>{if(!el.contains(document.activeElement))close()},0));
  paintVal();
  el.focusInput=()=>inp.focus();
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
  if(!root)return;const r=root;root=null;NC.sess++;importRun++;ocRun++;
  r.classList.remove("in");document.body.classList.remove("ncp-open");
  setTimeout(()=>r.remove(),T(260));
}
function go(n){NC.step=n;NC.maxStep=Math.max(NC.maxStep,n);paint();root.scrollTo({top:0,behavior:RM?"auto":"smooth"})}
function paint(){
  const steps=["Patient","Specialty & consultant","Review request"];
  root.innerHTML=`<div class="ncp-wrap${NC.step===3?" nc-wide":""}">
    <button type="button" class="ncp-back">${I.back}My consults</button>
    <h1 class="ncp-title" id="ncTitle">${titleText()}</h1>
    <ol class="ncp-steps">${steps.map((s,i)=>{const n=i+1,cur=n===NC.step,done=!cur&&n<=NC.maxStep;return (i?'<li class="ncp-sep" aria-hidden="true"></li>':"")+`<li><button type="button" class="ncp-step${done?" done":""}" data-ncstep="${n}"${cur?' aria-current="step"':""}${done?"":" disabled"}><span class="nc-num">${done?I.ck:n}</span>${s}</button></li>`}).join("")}</ol>
    <div class="ncp-pane" id="ncpPane"></div>
    <div class="ncp-actions" id="ncpAct"></div></div>`;
  root.querySelector(".ncp-back").onclick=close;
  root.querySelectorAll("[data-ncstep]").forEach(b=>b.onclick=()=>{if(!b.disabled)go(+b.dataset.ncstep)});
  [paint1,paint2,paint3][NC.step-1]();
}
const titleText=()=>NC.pt?`Consult for ${esc(PT[NC.pt].name)}`:"New consult";
function setTitle(){const h=root&&root.querySelector("#ncTitle");if(!h)return;h.classList.remove("nc-swap");void h.offsetWidth;h.innerHTML=titleText();h.classList.add("nc-swap")}
function actions(hint,btns){root.querySelector("#ncpAct").innerHTML=`<span class="ncp-hint">${hint||""}</span>${btns}`}
function lockAhead(){NC.maxStep=NC.step;root.querySelectorAll("[data-ncstep]").forEach(b=>{const n=+b.dataset.ncstep;if(n>NC.step){b.disabled=true;b.classList.remove("done");b.querySelector(".nc-num").textContent=n}})}
const ptChip=()=>{const p=PT[NC.pt];return `<div class="nc-ptchip"><span class="nc-ini">${initials(p.name)}</span><b>${esc(p.name)}</b><span class="nc-ptid">${esc(p.room)} · ${esc(p.mrn)}</span><button type="button" data-ncgo="1">Change</button></div>`};
function bindChip(){const b=root.querySelector("[data-ncgo]");if(b)b.onclick=()=>go(1)}

/* ---------- step 1: patient ---------- */
const IMPORT=[
  {k:"Demographics & room",think:"Reading demographics",ic:"person",v:c=>`${c.age}-year-old ${c.sex==="F"?"woman":"man"} · ${esc(PT[NC.pt].room)} · ${unitOf(PT[NC.pt].room)}`},
  {k:"Admission & team",think:"Checking the admission note",ic:"doc",v:c=>`${esc(c.adm)}<small>${esc(TEAM)}</small>`},
  {k:"Cardiac history",think:"Reviewing cardiac history",ic:"heart",v:c=>`${esc(c.hx)}<small>Cardiologist: ${esc(c.cardio)}</small>`},
  {k:"Latest ECG & telemetry",think:"Reading the latest ECG",ic:"ecg",v:c=>`${esc(c.ecg)}<small>Telemetry: ${esc(c.tele)}</small>`},
  {k:"Cardiac labs & trend",think:"Trending cardiac labs",ic:"labs",v:c=>esc(c.labs)},
  {k:"Recent cardiac testing",think:"Looking for recent testing",ic:"scope",v:c=>esc(c.testing)}
];
function paint1(){
  const pane=root.querySelector("#ncpPane");
  pane.innerHTML=`<label class="ncp-lbl" id="ptLbl">Patient</label><div id="ptDD"></div><div id="ptImp"></div>`;
  const byUnit={};Object.entries(PT).forEach(([k,p])=>{(byUnit[unitOf(p.room)]=byUnit[unitOf(p.room)]||[]).push({id:k,label:p.name,sub:`${p.room} · ${p.mrn}`,meta:`${CHART[k].age} ${CHART[k].sex}`})});
  const items=Object.keys(byUnit).sort().map(u=>({id:"u:"+u,label:u,meta:`${byUnit[u].length} patients`,children:byUnit[u]}));
  const dd=Combo({placeholder:"Search or select a patient",labelledby:"ptLbl",value:NC.pt,expanded:items.map(i=>i.id),
    groups:[{label:"My patients",items}],
    find:id=>({id,label:PT[id].name,meta:`${PT[id].room} · ${PT[id].mrn}`}),
    onSelect:p=>{if(NC.pt===p.id)return;Object.assign(NC,{pt:p.id,imported:false,route:null,topic:null,clin:null,chat:[],askRouted:false,askResult:null,question:"",reason:"",ocKey:null});NC.sess++;lockAhead();setTitle();runImport()}});
  pane.querySelector("#ptDD").appendChild(dd);
  if(NC.pt&&NC.imported)importStatic();else if(NC.pt)runImport();
  act1();
}
function act1(){
  actions(NC.pt&&!NC.imported?"Reading the chart…":"",`<button type="button" class="ncp-btn" id="n1"${NC.pt&&NC.imported?"":" disabled"}>Continue</button>`);
  root.querySelector("#n1").onclick=()=>go(2);
}
function importShell(done){
  const p=PT[NC.pt],box=root.querySelector("#ptImp");
  box.innerHTML=`<div class="nci ${done?"nci-done nci-static":"nci-run"}"><div class="nci-head"><span class="nc-tile${done?"":" nc-live"}">${I.spark}</span><div class="nci-hc"><b class="nci-title">${done?"Chart imported":`Reading ${esc(p.name)}’s chart`}</b><div class="nci-status"></div></div><span class="nci-count">${done?IMPORT.length:0}/${IMPORT.length}</span></div><div class="nci-prog"><i></i></div><div class="nci-list"></div></div>`;
  return box.firstElementChild;
}
const rowHTML=(s,c)=>`<div class="nci-row"><div><span class="nci-ck">${I.ck}</span><span class="nci-k">${s.k}</span><span class="nci-v">${s.v(c)}</span></div></div>`;
const flagHTML=c=>c.flag?`<div class="nci-flag nc-${c.flag.t}"><span class="nc-alert-ic">${I.warn}</span><span>${esc(c.flag.x)}</span></div>`:"";
function importStatic(){
  const card=importShell(true),c=CHART[NC.pt];
  card.querySelector(".nci-list").innerHTML=IMPORT.map(s=>rowHTML(s,c)).join("");
  const th=Thinker();card.querySelector(".nci-status").appendChild(th);th.set(`${IMPORT.length} sources · ready to use in the request`,null,false);
  card.insertAdjacentHTML("beforeend",flagHTML(c));
}
async function runImport(){
  const run=++importRun,c=CHART[NC.pt],n=IMPORT.length,D=T(760);
  const card=importShell(false),list=card.querySelector(".nci-list"),bar=card.querySelector(".nci-prog i"),count=card.querySelector(".nci-count"),title=card.querySelector(".nci-title"),tile=card.querySelector(".nc-tile");
  const th=Thinker();card.querySelector(".nci-status").appendChild(th);
  act1();
  const alive=()=>run===importRun&&root&&root.contains(card);
  bar.style.transition=`width ${D}ms linear`;
  for(let i=0;i<n;i++){
    if(!alive())return;
    th.set(IMPORT[i].think+"…",IMPORT[i].ic);
    bar.style.width=((i+1)/n*100)+"%";
    await sleep(D);if(!alive())return;
    list.insertAdjacentHTML("beforeend",rowHTML(IMPORT[i],c));count.textContent=`${i+1}/${n}`;
  }
  await sleep(T(300));if(!alive())return;
  NC.imported=true;
  card.classList.remove("nci-run");card.classList.add("nci-done");tile.classList.remove("nc-live");
  title.textContent="Chart imported";
  th.set(`${n} sources · ready to use in the request`,null,false);
  card.insertAdjacentHTML("beforeend",flagHTML(c));
  act1();
}

/* ---------- step 2: specialty & consultant ---------- */
function paint2(){
  const pane=root.querySelector("#ncpPane"),c=CHART[NC.pt],p=PT[NC.pt];
  pane.innerHTML=`${ptChip()}
    <div class="ncm" role="group" aria-label="How to choose the specialty"><span class="ncm-thumb" aria-hidden="true"></span><button type="button" data-ncmode="pick" aria-pressed="${NC.mode==="pick"}">${I.list}Pick a specialty</button><button type="button" data-ncmode="ask" aria-pressed="${NC.mode==="ask"}">${I.sparkIn}Help me choose</button></div>
    <div id="modeBody"></div><div id="askRes"></div><div id="pamfNote"></div><div id="oncall"></div>`;
  bindChip();
  const thumb=pane.querySelector(".ncm-thumb"),place=()=>{thumb.style.transform=NC.mode==="ask"?"translateX(100%)":"none"};place();
  pane.querySelectorAll("[data-ncmode]").forEach(b=>b.onclick=()=>{
    if(NC.mode===b.dataset.ncmode)return;
    if(NC.busy){NC.sess++;NC.chat=[];NC.busy=false;NC.awaiting=false;NC.question=""}
    NC.mode=b.dataset.ncmode;pane.querySelectorAll("[data-ncmode]").forEach(x=>x.setAttribute("aria-pressed",x===b));place();paintMode();paintAskResult();paintOncall();act2()});
  paintMode();paintAskResult();paintOncall();act2();
}
function paintMode(){NC.mode==="pick"?paintPick():paintAsk()}
function paintPick(){
  const body=root.querySelector("#modeBody"),c=CHART[NC.pt];
  body.innerHTML=`<div class="ncp-row2"><div><label class="ncp-lbl" id="spLbl">Specialty</label><div id="spDD"></div></div><div><label class="ncp-lbl" id="tpLbl">Consult topic</label><div id="tpDD"></div></div></div>`;
  const cvKids=Object.entries(ROUTES).filter(([k])=>k!=="pamf"||c.pamf).map(([k,r])=>({id:k,label:r.name,sub:isPager(r.pager)?"Pager "+r.pager:r.desc}));
  const sp=Combo({placeholder:"Search or select a specialty",labelledby:"spLbl",value:NC.route,expanded:["cv"],
    groups:[{label:"Available",items:[{id:"cv",label:"Cardiovascular Medicine",meta:`${cvKids.length} services`,children:cvKids}]},{label:"Other specialties",items:OTHER_SPECS.map(s=>({id:"x:"+s,label:s,disabled:true,tag:"Not in demo"}))}],
    find:id=>({id,label:ROUTES[id].name,meta:pagerText(ROUTES[id])}),
    onSelect:r=>{if(NC.route!==r.id){NC.route=r.id;NC.clin=null}paintOncall();act2();if(!NC.topic)setTimeout(()=>{const t=root&&root.querySelector("#tpDD .ncd-in");t&&t.focus()},T(150))}});
  const tp=Combo({placeholder:"Search or select a topic",labelledby:"tpLbl",value:NC.topic,
    groups:TOPICS.map(g=>({label:g.g,items:g.items.map(([id,l])=>({id,label:l}))})),
    find:id=>({id,label:TOPIC_LABEL[id]}),
    onSelect:t=>{NC.topic=t.id;paintOncall();act2();if(!NC.route)setTimeout(()=>{const s=root&&root.querySelector("#spDD .ncd-in");s&&s.focus()},T(150))}});
  body.querySelector("#spDD").appendChild(sp);body.querySelector("#tpDD").appendChild(tp);
}
/* ask a question: centred composer → docks to the bottom → clarifying questions → a route */
function paintAsk(){
  const body=root.querySelector("#modeBody");
  body.innerHTML=`<div class="ncc${NC.chat.length?" nc-started":""}" id="ncc"><div class="ncc-hero"><h3>What do you need from the consultant?</h3><p>Describe the question in your own words. We’ll ask a couple of things, then suggest where it goes.</p></div>
    <div class="ncc-log" id="nccLog"></div>
    <div class="ncc-comp"><div class="ncc-box"><textarea id="nccIn" rows="2" placeholder="e.g. New AF with RVR, rates 130s despite metoprolol — rate vs rhythm control and anticoagulation?" aria-label="Consult question"></textarea>
      <div class="ncc-tools"><button type="button" class="ncc-ex" data-ncex="Rising troponin 34 → 91 with new T-wave inversions in a patient with prior PCI. Is this ACS or demand?">Try: rising troponin</button><button type="button" class="ncc-ex" data-ncex="Pacemaker patient with 2.8 second pauses on telemetry overnight, needs device check">Try: pacemaker pauses</button><button type="button" class="ncc-send" id="nccSend" aria-label="Send question" disabled>${I.up}</button></div></div></div></div>`;
  const log=body.querySelector("#nccLog"),inp=body.querySelector("#nccIn"),send=body.querySelector("#nccSend"),wrap=body.querySelector("#ncc"),comp=body.querySelector(".ncc-comp");
  const setH=()=>wrap.style.setProperty("--ch",comp.offsetHeight+"px");setH();
  NC.chat.forEach(m=>log.insertAdjacentHTML("beforeend",m.html));log.querySelectorAll(".ncc-opts").forEach(o=>o.classList.add("nc-used"));bindRouteCard(log);
  log.scrollTop=log.scrollHeight;
  const sync=()=>{send.disabled=!inp.value.trim()||NC.busy;inp.style.height="auto";inp.style.height=Math.min(96,inp.scrollHeight)+"px";setH()};
  inp.addEventListener("input",sync);
  inp.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(!send.disabled)send.click()}});
  body.querySelectorAll("[data-ncex]").forEach(b=>b.onclick=()=>{inp.value=b.dataset.ncex;sync();inp.focus()});
  send.onclick=()=>{const q=inp.value.trim();if(!q)return;inp.value="";sync();ask(q)};
  if(NC.awaiting)inp.placeholder="Choose an option above";
  setTimeout(()=>inp.focus({preventScroll:true}),T(100));
}
function chatAdd(html){NC.chat.push({html});const log=root&&root.querySelector("#nccLog");if(!log)return null;log.insertAdjacentHTML("beforeend",html);log.scrollTo({top:log.scrollHeight,behavior:RM?"auto":"smooth"});return log.lastElementChild}
/* assistant turn: tile + thinking line that cycles, then the answer streams in */
async function aiSay(parts,thinking){
  const log=root&&root.querySelector("#nccLog");if(!log)return null;
  const t=chatAdd(`<div class="ncc-ai"><span class="nc-tile nc-sm nc-live">${I.sparkSm}</span><div class="ncc-txt"></div></div>`);
  const txt=t.querySelector(".ncc-txt"),tile=t.querySelector(".nc-tile"),th=Thinker();txt.appendChild(th);
  for(const [label,icon] of (thinking||[["Thinking","think"]])){th.set(label+"…",icon);await sleep(T(650))}
  th.remove();tile.classList.remove("nc-live");
  for(const p of parts){
    if(p.text){const el=document.createElement("p");txt.appendChild(el);const s=p.text,fmtS=x=>esc(x).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>");for(let i=0;i<=s.length;i+=3){el.innerHTML=fmtS(s.slice(0,i));log.scrollTop=log.scrollHeight;if(!RM)await sleep(12)}el.innerHTML=fmtS(s)}
    if(p.html){txt.insertAdjacentHTML("beforeend",p.html);log.scrollTop=log.scrollHeight}
  }
  NC.chat[NC.chat.length-1].html=t.outerHTML;return t;
}
function choose(t,opts){
  return new Promise(res=>{
    NC.awaiting=true;const inp=root.querySelector("#nccIn");if(inp)inp.placeholder="Choose an option above";
    const box=document.createElement("div");box.className="ncc-opts";box.innerHTML=opts.map(([v,l])=>`<button type="button" data-ncv="${v}">${esc(l)}</button>`).join("");
    t.querySelector(".ncc-txt").appendChild(box);const idx=NC.chat.length-1;
    box.onclick=e=>{const b=e.target.closest("button");if(!b)return;b.classList.add("nc-pick");box.classList.add("nc-used");NC.chat[idx].html=t.outerHTML;NC.awaiting=false;if(inp)inp.placeholder="Add more detail…";
      chatAdd(`<div class="ncc-me">${esc(b.textContent)}</div>`);res(b.dataset.ncv)};
    root.querySelector("#nccLog").scrollTop=1e6;
  });
}
async function ask(q){
  const wrap=root.querySelector("#ncc");wrap.classList.add("nc-started");NC.busy=true;
  const sess=NC.sess,dead=()=>sess!==NC.sess||!root||!root.querySelector("#nccLog");
  chatAdd(`<div class="ncc-me">${esc(q)}</div>`);
  NC.question=NC.question?NC.question+" "+q:q;
  const r=routeQuestion(NC.question),p=PT[NC.pt],c=CHART[NC.pt];
  if(!r){await aiSay([{text:"I couldn’t match that to a service yet. This demo covers **Cardiovascular Medicine** — describe the cardiac concern (symptom, ECG, troponin, rhythm, device…), or switch to **Pick a specialty**."}],[["Reading your question","doc"],["Matching to a service","route"]]);NC.question="";NC.busy=false;return}
  NC.reason=r.reason;if(r.topic)NC.topic=r.topic;
  if(dead())return;const t1=await aiSay([{text:`Got it — this sounds like a **${r.reason}** question for ${p.name}. Two quick checks before I route it.`},{text:"Is the patient hemodynamically stable right now?"}],[["Reading your question","doc"],["Matching to a service","route"],["Checking the consult guidelines","scope"]]);
  if(dead())return;const st=await choose(t1,[["stable","Stable"],["unstable","Unstable / worsening"]]);
  if(st==="unstable"){
    NC.unstable=true;NC.urg="Urgent";
    if(dead())return;const t=await aiSay([{html:`<div class="nc-alert nc-bad" style="margin:6px 0 0"><span class="nc-alert-ic">${I.warn}</span><div><b>Call a Rapid Response (RRT) or code now</b>The cardiology fellow can’t act as an emergent responder. Activate the local emergency response first — you can still send the consult.</div></div>`},{text:"Continue with the consult request?"}]);
    if(dead())return;const g=await choose(t,[["go","Yes, continue"],["stop","Stop here"]]);
    if(g==="stop"){await aiSay([{text:"Okay. Come back from **My consults** when the patient is stabilized."}]);NC.busy=false;return}
  } else {NC.unstable=false;NC.urg="Routine"}
  let route=r.route;
  if(route!=="adm"){
    if(dead())return;const t2=await aiSay([{text:"Is this a new consult during this admission, or is the patient being admitted to a cardiology service?"}]);
    if(dead())return;const ad=await choose(t2,[["consult","New consult"],["admit","Admitting to cardiology"]]);
    if(ad==="admit")route="adm";
  }
  if(c.pamf&&route!=="adm")route="pamf";
  if(/troponin|trop\b|t-wave|telemetry|ecg|ekg/i.test(NC.question)&&!/\?/.test(NC.question)){
    if(dead())return;const t3=await aiSay([{text:"Guidelines ask that troponin, ECG and telemetry findings come with a clinical question. What do you want answered?"}]);
    if(dead())return;const qq=await choose(t3,[["acs","Is this ACS or demand?"],["mgmt","How should we manage it?"],["test","Is further testing needed?"]]);
    NC.question+=" "+{acs:"Is this ACS versus demand ischemia?",mgmt:"How should we manage this?",test:"Is further cardiac testing needed?"}[qq];
  }
  const R=ROUTES[route],why=[r.reason+" → "+(route==="pamf"?"PAMF patients go to PAMF Cardiology":route==="adm"?"admissions use the admission pager, not the consult pager":R.desc)];
  if(c.flag&&!(c.flag.t==="bad"&&/\?/.test(NC.question)))why.push(c.flag.x);
  if(NC.unstable)why.push("Marked urgent — RRT advised");
  if(dead())return;await aiSay([{text:`Routed to **${R.name}**. The suggestion and who’s on call are below the chat.`}],[["Checking the consult guidelines","scope"],["Choosing the service","route"]]);
  if(dead())return;NC.busy=false;NC.askResult={route,why};if(NC.route!==route){NC.route=route;NC.clin=null}NC.askRouted=true;
  paintAskResult();paintOncall();act2();
  setTimeout(()=>{const r=root&&root.querySelector("#askRes");r&&r.scrollIntoView({behavior:RM?"auto":"smooth",block:"start"})},T(120));
}
function paintAskResult(){
  const box=root&&root.querySelector("#askRes");if(!box)return;
  if(NC.mode!=="ask"||!NC.askResult){box.innerHTML="";return}
  const {route,why}=NC.askResult,R=ROUTES[route];
  box.innerHTML=`<div class="nc-route"><div class="nc-route-top"><span class="nc-tile nc-sm">${I.sparkSm}</span><span class="nc-route-eyebrow">Suggested route</span><button type="button" class="nc-link" data-ncalt>Choose a different service</button></div>
    <div class="nc-route-path"><span>Cardiovascular Medicine</span>${I.chevR}<b>${esc(R.name)}</b></div>
    <div class="nc-route-pg">${esc(isPager(R.pager)?"Pager "+R.pager+" · "+R.desc:R.desc)}</div>
    <ul class="nc-route-why">${why.map(w=>`<li><span class="nc-route-ck">${I.ck}</span>${esc(w)}</li>`).join("")}</ul></div>`;
  box.querySelector("[data-ncalt]").onclick=()=>{NC.mode="pick";paint2()};
}
function bindRouteCard(log){
  log.querySelectorAll(".ncc-route").forEach(card=>{
    const use=card.querySelector("[data-ncuse]"),alt=card.querySelector("[data-ncalt]");
    if(use)use.onclick=()=>{if(NC.route!==card.dataset.ncroute){NC.route=card.dataset.ncroute;NC.clin=null}NC.askRouted=true;paintOncall();act2();setTimeout(()=>{const oc=root&&root.querySelector("#oncall");oc&&oc.scrollIntoView({behavior:RM?"auto":"smooth",block:"start"})},T(60))};
    if(alt)alt.onclick=()=>{NC.route=card.dataset.ncroute;NC.clin=null;NC.mode="pick";paint2()};
  });
}
/* on-call list: only once both the service and the topic (or a routed question) are known */
const ocReady=()=>!!NC.route&&(NC.mode==="pick"?!!NC.topic:NC.askRouted);
function paintPamf(){
  const box=root&&root.querySelector("#pamfNote");if(!box)return;const c=CHART[NC.pt],p=PT[NC.pt];
  const show=c.pamf&&NC.mode==="pick"&&NC.route&&NC.route!=="pamf"&&NC.route!=="adm";
  if(!show){box.innerHTML="";return}
  if(box.firstChild)return;
  box.innerHTML=`<div class="nc-alert nc-warn" style="margin:16px 0 0"><span class="nc-alert-ic">${I.warn}</span><div><b>${esc(p.name)} is a PAMF patient</b>Guidelines route cardiology consults for PAMF patients to PAMF Cardiology.<div class="nc-alert-act"><button type="button" class="ncp-btn nc-sm" data-nctopamf>Switch to PAMF Cardiology</button></div></div></div>`;
  box.querySelector("[data-nctopamf]").onclick=()=>{NC.route="pamf";NC.clin=null;NC.ocKey=null;box.innerHTML="";paintPick();paintOncall();act2()};
}
async function paintOncall(){
  paintPamf();
  const box=root&&root.querySelector("#oncall");if(!box)return;
  if(!ocReady()){box.innerHTML="";NC.ocKey=null;return}
  const R=ROUTES[NC.route],list=ONCALL[NC.route],key=NC.route,run=++ocRun;
  if(!NC.clin){const a=list.find(x=>x[2]==="av");NC.clin=a?a[0]:null}
  const fresh=NC.ocKey!==key;NC.ocKey=key;
  if(fresh&&!RM){
    box.innerHTML=`<div class="nco"><div class="nco-think"><span class="nc-tile nc-live">${I.spark}</span></div></div>`;
    const th=Thinker();box.querySelector(".nco-think").appendChild(th);
    th.set(`Checking who’s on call · ${R.name}…`,"people");await sleep(700);if(run!==ocRun||!root)return;
    th.set("Matching availability right now…","think");await sleep(600);if(run!==ocRun||!root)return;
  }
  box.innerHTML=`<div class="nco"><div class="nco-h"><b>On call now · ${esc(R.name)}</b><span>${esc(pagerText(R))} · ${fmtNow()}</span></div>
    <div class="nco-list" role="radiogroup" aria-label="Clinician to page">${list.map((x,i)=>`<button type="button" class="nco-it${fresh?"":" nc-settled"}" role="radio" aria-checked="${NC.clin===x[0]}" data-ncc="${esc(x[0])}" style="animation-delay:${i*80}ms"><span class="nco-rad"></span>${av(x[0],36)}<span class="nco-who"><b>${esc(x[0])}</b><span>${esc(x[1])}</span></span><span class="nco-st nc-s-${x[2]}">${x[2]==="av"?'<i class="nco-live"></i>':x[2]==="busy"?I.clock:I.moon}${esc(x[3])}</span></button>`).join("")}</div>
    ${NC.route==="echo"?`<p class="nco-note">During the day, message the Lead Sonographer on Voalte. Between 5 PM and 7 AM the on-call fellow (24300) triages stat echo requests.</p>`:""}
    <p class="nco-note" id="ncoBusy"${list.find(x=>x[0]===NC.clin&&x[2]!=="av")?"":" hidden"}>This clinician isn’t immediately available — the page still goes to the ${esc(R.name)} pager.</p></div>`;
  box.querySelectorAll(".nco-it").forEach(b=>b.onclick=()=>{NC.clin=b.dataset.ncc;box.querySelectorAll(".nco-it").forEach(x=>{x.setAttribute("aria-checked",x===b);x.classList.add("nc-settled")});
    box.querySelector("#ncoBusy").hidden=!list.find(x=>x[0]===NC.clin&&x[2]!=="av");act2()});
  act2();
}
function act2(){
  const ok=ocReady()&&NC.clin&&root.querySelector(".nco-list");
  actions(ok?`Paging ${esc(NC.clin)} · ${esc(ROUTES[NC.route].name)}`:"",`<button type="button" class="ncp-btn nc-ghost" id="b2">Back</button><button type="button" class="ncp-btn" id="n2"${ok?"":" disabled"}>Generate request</button>`);
  root.querySelector("#b2").onclick=()=>go(1);root.querySelector("#n2").onclick=()=>go(3);
}

/* ---------- step 3: generated template ---------- */
const lc=t=>/^[A-Z][a-z]/.test(t)?t[0].toLowerCase()+t.slice(1):t;
function buildFields(){
  const p=PT[NC.pt],c=CHART[NC.pt],q=NC.question||(NC.topic?TOPIC_Q[NC.topic]:"");
  return {name:p.name,mrn:p.mrn,room:p.room,team:TEAM,req:`${ME} · Attending hospitalist`,cb:CALLBACK,at:`Today · ${fmtNow()}`,need:NC.urg==="Urgent"?"Within 1 hour":"Today",
    summary:`${c.age}-year-old ${c.sex==="F"?"woman":"man"} with ${/^No known/.test(c.hx)?"no known cardiac history":lc(c.hx)}, admitted for ${lc(c.adm)}.`,
    question:q,history:`${c.hx}. Current medications: ${c.meds}.`,
    results:`ECG: ${c.ecg}. Telemetry: ${c.tele}. Labs: ${c.labs}. Testing: ${c.testing}.`,
    cardio:`${c.hx} · Cardiologist: ${c.cardio}`,tele:c.tele,labs:c.labs,pamf:c.pamf,ecgOk:c.ecgOk};
}
function paint3(){
  const pane=root.querySelector("#ncpPane"),f=buildFields(),R=ROUTES[NC.route];
  const src=t=>`<span class="nct-src">${I.sparkSm}${t}</span>`;
  const fld=(k,label,req,cls,ta,s)=>`<div class="nct-f ${cls||""}" data-nck="${k}"><label for="f-${k}">${label}${req?" <i>*</i>":""}</label>${ta?`<textarea id="f-${k}" rows="${ta}"${req?" data-ncreq":""}></textarea>`:`<input id="f-${k}" type="text"${req?" data-ncreq":""}>`}${s?src(s):""}</div>`;
  pane.innerHTML=`<div class="nct-grid"><div class="nct-main">${ptChip()}
    <div class="nct-to">${av(NC.clin,40)}<div class="nct-to-who"><small>Page goes to</small><b>${esc(NC.clin)}</b><span>${esc(R.name)}</span></div><div class="nct-to-pg">${esc(pagerText(R))}</div></div>
    <div class="nct-gen" id="gen"><span class="nc-tile nc-live">${I.spark}</span></div>
    <div id="secs" hidden>
      <section class="nct-sec" style="animation-delay:0ms"><div class="nct-sh"><span class="nc-num">1</span>Patient and requester</div><div class="nct-body">
        ${fld("name","Patient name",1,"nc-s3 nc-lock")}${fld("mrn","MRN",1,"nc-s2 nc-lock")}${fld("room","Room",1,"nc-s1 nc-lock")}
        ${fld("team","Primary team",1,"nc-s3")}${fld("req","Requester name and role",1,"nc-s3")}
        ${fld("cb","Callback number",1,"nc-s2")}${fld("at","Requested date and time",1,"nc-s2")}${fld("need","Needed by",0,"nc-s2")}</div></section>
      <section class="nct-sec" style="animation-delay:90ms"><div class="nct-sh"><span class="nc-num">2</span>Clinical request</div><div class="nct-body">
        ${fld("summary","One-line patient summary",1,"",2,"From the chart")}
        ${fld("question","Focused consult question",1,"",3,NC.mode==="ask"&&NC.chat.length?"From your question":"From the topic — make it specific")}
        ${fld("history","Relevant history, treatments, and recent change",0,"",3,"From the chart")}
        ${fld("results","Pertinent results available now and tests still pending",0,"",3,"From the chart")}</div></section>
      <section class="nct-sec" style="animation-delay:180ms"><div class="nct-sh"><span class="nc-num">3</span>Urgency and safety</div><div class="nct-body"><div class="nct-f">
        <div class="nct-radios" role="radiogroup" aria-label="Urgency"><label><input type="radio" name="ncurg" value="Routine">Routine</label><label><input type="radio" name="ncurg" value="Urgent">Urgent</label><label class="nc-bad"><input type="radio" name="ncurg" value="Unstable">Patient unstable — activate local emergency response</label></div>
        <div id="urgNote"></div></div></div></section>
      <section class="nct-sec" style="animation-delay:270ms"><div class="nct-sh"><span class="nc-num">4</span>Cardiovascular details</div><div class="nct-body">
        <div class="nct-f nc-s2"><label>PAMF patient</label><div class="nct-radios"><label><input type="radio" name="ncpamf" value="yes">Yes</label><label><input type="radio" name="ncpamf" value="no">No</label></div></div>
        <div class="nct-f nc-s4"><label>Updated ECG</label><div class="nct-radios"><label><input type="radio" name="ncecg" value="yes">Available</label><label><input type="radio" name="ncecg" value="no">Not available</label></div></div>
        ${fld("cardio","Prior cardiac history and cardiologist",1,"",2,"From the chart")}
        ${fld("tele","Telemetry issue",0,"nc-s3")}${fld("labs","Pertinent cardiac labs and trend",1,"nc-s3")}</div></section>
    </div></div>
    <aside class="nct-aside" aria-label="Specialty checklist"><div class="nct-cl"><div class="nct-cl-h"><h3>Specialty checklist</h3><span class="nct-cl-n" id="ncCkN">0/6</span></div><div class="nct-cl-bar"><i id="ncCkBar"></i></div><p>Updates as the request fills in and as you edit.</p><ul class="nct-ck" id="ncCk"></ul></div></aside></div>`;
  bindChip();act3(true);summary3();
  const th=Thinker();pane.querySelector("#gen").appendChild(th);
  const run=NC.sess;
  (async()=>{
    for(const [l,i] of [["Reading the imported chart","doc"],["Drafting a one-line summary","pen"],["Linking results to your question","link"],["Filling in the request","form"]]){th.set(l+"…",i);await sleep(T(620));if(!root||NC.step!==3||run!==NC.sess)return}
    pane.querySelector("#gen").remove();pane.querySelector("#secs").hidden=false;
    pane.querySelector(`input[name=ncurg][value="${NC.unstable?"Unstable":NC.urg}"]`).checked=true;
    pane.querySelector(`input[name=ncpamf][value="${f.pamf?"yes":"no"}"]`).checked=true;
    pane.querySelector(`input[name=ncecg][value="${f.ecgOk?"yes":"no"}"]`).checked=true;
    urgNote();summary3();NC.genQ=f.question;pane.querySelectorAll(".nc-lock input").forEach(i=>{i.readOnly=true;i.title="From the patient’s chart"});
    for(const k of ["name","mrn","room","team","req","cb","at","need","summary","question","history","results","cardio","tele","labs"]){
      const el=pane.querySelector("#f-"+k);if(!el||!root||NC.step!==3)return;const v=f[k]||"",w=el.closest(".nct-f");w.classList.add("nc-fill");
      if(RM||v.length<4)el.value=v;else{const st=Math.max(2,Math.ceil(v.length/22));for(let i=0;i<=v.length;i+=st){el.value=v.slice(0,i);await sleep(14)}el.value=v}
      setTimeout(()=>w.classList.remove("nc-fill"),T(900));summary3();
    }
    pane.querySelectorAll("input,textarea").forEach(el=>el.addEventListener("input",()=>{validate();summary3()}));
    pane.querySelectorAll("input[type=radio]").forEach(el=>el.addEventListener("change",()=>{urgNote();summary3()}));
    validate();summary3();
  })();
}
function urgNote(){const v=root.querySelector("input[name=ncurg]:checked")?.value,n=root.querySelector("#urgNote");if(!n)return;
  n.innerHTML=v==="Unstable"?`<div class="nc-alert nc-bad" style="margin:12px 0 0"><span class="nc-alert-ic">${I.warn}</span><div><b>Call an RRT or code first</b>The cardiology fellow cannot act as an emergent responder. Send the consult after the emergency response is activated.</div></div>`:
  v==="Urgent"?`<div class="nc-alert nc-info" style="margin:12px 0 0"><span class="nc-alert-ic">${I.info}</span><div>Urgent pages are fine any time. Re-page only for an acute change or if it’s been more than 1 hour.</div></div>`:
  `<div class="nc-alert nc-info" style="margin:12px 0 0"><span class="nc-alert-ic">${I.info}</span><div>For low-acuity or late non-urgent consults, the fellow may give preliminary recommendations and see the patient tomorrow. Avoid non-urgent pages 10 PM–7 AM and Tuesdays 7:30–9 AM.</div></div>`}
const val=k=>(root.querySelector("#f-"+k)?.value||"").trim();
function validate(){let ok=true;root.querySelectorAll("[data-ncreq]").forEach(el=>{const miss=!el.value.trim();el.closest(".nct-f").classList.toggle("nc-miss",miss);if(miss)ok=false});act3(false,ok);return ok}
function summary3(){
  const ck=root.querySelector("#ncCk");if(!ck)return;
  const R=ROUTES[NC.route],c=CHART[NC.pt],p=PT[NC.pt],q=val("question"),abn=/rising|elevat|inversion|st elev|pause|tachy|wide/i.test(c.labs+" "+c.ecg+" "+c.tele);
  const items=[
    ["Patient name, MRN, brief history, focused question, and callback are included.",val("name")&&val("mrn")&&val("summary")&&q.length>15&&val("cb")],
    ["Prior cardiac history and the patient’s cardiologist are identified.",val("cardio").length>8],
    ["Updated ECG and pertinent cardiac laboratory trends are available or pending.",!!root.querySelector("input[name=ncecg]:checked")&&val("labs")],
    ["Recent Stanford or outside cardiac testing is summarized.",/testing/i.test(val("results"))],
    ["Troponin, ECG, or telemetry abnormalities are linked to a clinical question.",!abn||/\?/.test(q)],
    ["The correct general, admission, or subspecialty cardiology route is selected.",!!NC.route&&(!c.pamf||NC.route==="pamf"||NC.route==="adm")]
  ];
  if(ck.children.length!==items.length)ck.innerHTML=items.map(([t])=>`<li><span class="nct-ck-ic"><svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle class="nct-c" cx="10" cy="10" r="8.25"/><path class="nct-k" d="M6.2 10.4l2.6 2.6 5.1-5.6"/></svg></span><span class="nct-ck-t">${esc(t)}<span class="sr"> (not yet)</span></span></li>`).join("");
  let n=0;items.forEach(([,on],i)=>{on=!!on;if(on)n++;const li=ck.children[i];if(li.classList.contains("nc-on")!==on){li.classList.toggle("nc-on",on);li.querySelector(".sr").textContent=on?" (done)":" (not yet)"}});
  const nEl=root.querySelector("#ncCkN"),bar=root.querySelector("#ncCkBar");
  if(nEl)nEl.textContent=`${n}/${items.length}`;if(bar){bar.style.width=(n/items.length*100)+"%";bar.parentElement.classList.toggle("nc-full",n===items.length)}
}
function act3(loading,ok){
  actions(loading?"":ok?"Ready to send. The fellow will call back to acknowledge.":"Fill the required fields marked *.",`<button type="button" class="ncp-btn nc-ghost" id="b3">Back</button><button type="button" class="ncp-btn" id="send"${loading||!ok?" disabled":""}>Review page</button>`);
  root.querySelector("#b3").onclick=()=>go(2);root.querySelector("#send").onclick=openReview;
}
/* review: the page as the consultant will receive it, in a message-thread preview */
function openReview(){
  if(!validate()||root.querySelector(".nc-modal"))return;
  const R=ROUTES[NC.route],p=PT[NC.pt],urg=root.querySelector("input[name=ncurg]:checked")?.value||"Routine";
  const lines=[["Patient",`${p.name} · MRN ${p.mrn} · Rm ${p.room}`],["Summary",val("summary")],["Question",val("question")],["Urgency",urg==="Unstable"?"Unstable — emergency response activated":urg],["Callback",`${val("cb")} · ${ME}`]];
  const m=document.createElement("div");m.className="nc-modal";m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-labelledby","ncRvT");
  m.innerHTML=`<div class="nc-modal-bd"></div><div class="nc-sheet">
    <div class="nc-sheet-h"><div><h2 id="ncRvT">Review page</h2><p>This is what ${esc(NC.clin)} will receive.</p></div><button type="button" class="nc-x" data-ncclose aria-label="Close">${I.x}</button></div>
    <div class="nc-phone"><div class="nc-phone-to">${av(NC.clin,34)}<div><b>${esc(NC.clin)}</b><span>${esc(R.name)} · ${esc(pagerText(R))}</span></div></div>
      <div class="nc-thread"><div class="nc-stamp">Today ${fmtNow()}</div>
        <div class="nc-bubble"><b class="nc-bubble-h">New consult · ${esc(R.name)}</b>${lines.map(([k,v])=>`<span class="nc-bubble-l"><i>${k}</i>${esc(v)}</span>`).join("")}</div>
        <div class="nc-receipt" id="ncReceipt">Ready to send</div></div></div>
    <div class="nc-sheet-f"><button type="button" class="ncp-btn nc-ghost" data-ncclose>Edit</button><button type="button" class="ncp-btn" data-ncsend>Send page</button></div></div>`;
  root.appendChild(m);
  const prev=document.activeElement,done=()=>{m.classList.add("nc-out");setTimeout(()=>m.remove(),T(220));prev&&prev.focus&&prev.focus({preventScroll:true})};
  m.querySelectorAll("[data-ncclose]").forEach(b=>b.onclick=done);m.querySelector(".nc-modal-bd").onclick=done;
  m.addEventListener("keydown",e=>{if(e.key==="Escape"){e.stopPropagation();done()}});
  const send=m.querySelector("[data-ncsend]");setTimeout(()=>send.focus({preventScroll:true}),T(60));
  send.onclick=async()=>{
    send.disabled=true;send.innerHTML='<span class="nc-spin"></span>Sending…';m.querySelector("[data-ncclose].ncp-btn").disabled=true;
    const rc=m.querySelector("#ncReceipt"),bub=m.querySelector(".nc-bubble");bub.classList.add("nc-sending");rc.textContent="Sending…";
    await sleep(T(900));if(!root)return;
    bub.classList.remove("nc-sending");bub.classList.add("nc-sent");rc.classList.add("nc-delivered");rc.innerHTML=`${I.ok} Delivered to ${esc(pagerText(R))}`;
    await sleep(T(800));if(!root)return;
    commitSend();
  };
}
function commitSend(){
  const R=ROUTES[NC.route],urg=root.querySelector("input[name=ncurg]:checked")?.value||"Routine",q=val("question");
  const time=B.tick(),id="n"+Date.now().toString(36);
  const clause=t=>{const x=t.split(/[.?!]/)[0].trim();return x.length>64?x.slice(0,61).trim()+"…":x};
  const reason=q&&q!==NC.genQ?clause(q):(NC.reason||(NC.topic?TOPIC_LABEL[NC.topic]:clause(q)));
  const requester=(val("req").split(" · ")[0]||ME).trim(),callback=val("cb")||CALLBACK;
  C.push({id,pt:NC.pt,svc:"Cardiology",who:NC.clin,whoRole:R.name,urg:urg==="Unstable"?"Emergent":urg,emergent:urg==="Unstable",reason,ordered:time,question:q,requester,callback,
    status:"paged",time,note:`Page sent to ${R.name}${isPager(R.pager)?" (pager "+R.pager+")":""} for ${NC.clin}. No acknowledgement yet.`,
    events:[[time,"Order created","SEAL consult request · chart imported","ok"],[time,"Paged",`${R.name}${isPager(R.pager)?" · pager "+R.pager:""} · ${NC.clin}`,"blue"]]});
  const name=PT[NC.pt].name;close();
  try{B.render()}catch(e){console.error(e)}
  setTimeout(()=>{const r=document.querySelector(`.tr.row[data-id="${id}"]`);if(r){r.classList.add("ncp-new");r.scrollIntoView({block:"center",behavior:RM?"auto":"smooth"})}},30);
  toast(`Page sent to ${R.name} for ${name}`);
  const live=document.getElementById("tdlive");if(live)live.textContent=`Consult page sent to ${R.name} for ${name}.`;
}
function toast(msg){
  const t=document.createElement("div");t.className="ncp-toast";t.setAttribute("role","status");t.innerHTML=`<span class="ncp-toast-ok">${I.ok}</span>${esc(msg)}`;
  document.body.appendChild(t);void t.offsetWidth;setTimeout(()=>t.classList.add("in"),16);
  setTimeout(()=>{t.classList.remove("in");setTimeout(()=>t.remove(),400)},3600);
}

/* ---------- wiring ---------- */
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest(".topnew,.newc,.acct-m .btn.primary");
  if(!b)return;e.preventDefault();open();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&root&&!document.querySelector(".ncd.open")&&!e.target.closest("textarea,input"))close()});
window.NewConsult={open,close};
})();
