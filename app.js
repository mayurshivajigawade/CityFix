"use strict";
const CATS={pothole:"Pothole or damaged road",garbage:"Garbage or waste",streetlight:"Broken streetlight",water:"Water supply or leak",drainage:"Drainage or flooding",other:"Something else"};
const STAT=["submitted","acknowledged","in_progress","resolved"];
const LABEL={submitted:"Submitted",acknowledged:"Acknowledged",in_progress:"In progress",resolved:"Resolved"};
const SEED=[
 {id:"d1",title:"Deep pothole near the bus stop",category:"pothole",description:"About 30 cm wide. Two-wheelers swerve to avoid it.",loc:"Station Road, near the bus stop",status:"in_progress",at:"2026-11-20T09:00:00Z",demo:1},
 {id:"d2",title:"Garbage not collected for a week",category:"garbage",description:"Bins are overflowing at the corner.",loc:"Market Lane",status:"acknowledged",at:"2026-11-22T14:30:00Z",demo:1},
 {id:"d3",title:"Streetlight out on the school lane",category:"streetlight",description:"It’s dark after 7 PM.",loc:"School Lane",status:"resolved",at:"2026-11-15T18:10:00Z",demo:1}];

/* ---- data layer (mock). Swap these three functions for real fetch calls later. ---- */
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let mem={issues:SEED.slice(),mine:[]};
const ls={get(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
mem.issues=ls.get("cityfix.issues",SEED);const session=()=>ls.get("cityfix.session",null);const mineKey=()=>{const u=session();return u?"cityfix.mine."+u.id:null};const getMine=()=>{const k=mineKey();return k?ls.get(k,[]):[]};
const api={
 async list(){await delay(650);return mem.issues.slice().sort((a,b)=>b.at.localeCompare(a.at))},
 async mine(){await delay(650);return mem.issues.filter(i=>getMine().includes(i.id)).sort((a,b)=>b.at.localeCompare(a.at))},
 async create(d){await delay(900);const i={id:"l"+Date.now(),status:"submitted",at:new Date().toISOString(),...d};
  mem.issues=[i,...mem.issues];{const k=mineKey();if(k)ls.set(k,[i.id,...getMine()])}ls.set("cityfix.issues",mem.issues);return i}
};

const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=s=>document.querySelector(s);
const main=$("#main");
let token=0;

function hero(){return `<section class="hero" aria-labelledby="h">
<h1 id="h"><span>Spot it.</span><span>Report it.</span><span>Watch it get fixed.</span></h1>
<p>Report potholes, garbage, broken lights and leaks in under a minute, then follow each report until it’s resolved.</p>
<div class="cta"><a class="btn btn-primary" href="#report">Report an issue</a><a class="btn" href="#feed">Browse city reports</a></div>
<svg class="sky" viewBox="0 0 800 176" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<rect class="cloud" x="60" y="20" width="110" height="18" rx="9"/><rect class="cloud" x="90" y="10" width="60" height="18" rx="9" style="animation-delay:-12s"/>
<g fill="#0a2430"><rect x="20" y="70" width="70" height="106"/><rect x="100" y="40" width="60" height="136"/><rect x="170" y="86" width="80" height="90"/><rect x="262" y="52" width="64" height="124"/><rect x="560" y="64" width="72" height="112"/><rect x="644" y="34" width="62" height="142"/><rect x="716" y="80" width="70" height="96"/></g>
<g>
<rect class="win" x="34" y="84" width="9" height="11"/><rect class="win" x="54" y="108" width="9" height="11"/><rect class="win" x="34" y="132" width="9" height="11"/>
<rect class="win" x="114" y="56" width="9" height="11"/><rect class="win" x="134" y="84" width="9" height="11"/><rect class="win" x="114" y="112" width="9" height="11"/><rect class="win" x="134" y="140" width="9" height="11"/>
<rect class="win" x="186" y="100" width="9" height="11"/><rect class="win" x="216" y="124" width="9" height="11"/>
<rect class="win" x="278" y="66" width="9" height="11"/><rect class="win" x="298" y="94" width="9" height="11"/><rect class="win" x="278" y="122" width="9" height="11"/>
<rect class="win" x="576" y="80" width="9" height="11"/><rect class="win" x="602" y="110" width="9" height="11"/>
<rect class="win" x="660" y="50" width="9" height="11"/><rect class="win" x="682" y="78" width="9" height="11"/><rect class="win" x="660" y="106" width="9" height="11"/><rect class="win" x="682" y="134" width="9" height="11"/>
<rect class="win" x="732" y="96" width="9" height="11"/><rect class="win" x="754" y="124" width="9" height="11"/>
</g>
<g><circle class="lamp-glow" cx="420" cy="84" r="46"/><rect x="417" y="84" width="6" height="92" fill="#06161d"/><rect x="408" y="80" width="26" height="6" rx="3" fill="#06161d"/></g>
<g class="car"><rect x="0" y="152" width="46" height="13" rx="5" fill="#ffc933"/><rect x="10" y="144" width="24" height="10" rx="4" fill="#ffc933"/><circle cx="11" cy="166" r="5" fill="#06161d"/><circle cx="35" cy="166" r="5" fill="#06161d"/></g>
<rect x="0" y="170" width="800" height="6" fill="#06161d"/>
<path d="M0 173h800" stroke="#ffc933" stroke-width="2" stroke-dasharray="14 12"/>
</svg></section>`}

function skeleton(){return `<div role="status" aria-live="polite"><span class="hint">Loading reports…</span><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>`}
function card(i,n){const step=STAT.indexOf(i.status);
 return `<li class="card" style="--i:${n}"><div class="head"><h3>${esc(i.title)}</h3><span class="badge ${i.status}">${LABEL[i.status]}</span></div>
 <p class="meta">${esc(CATS[i.category]||i.category)}. ${esc(i.loc)}. ${new Date(i.at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p>
 ${i.description?`<p>${esc(i.description)}</p>`:""}
 <ol class="steps" aria-label="Progress: ${LABEL[i.status]}">${STAT.map((s,k)=>`<li style="--k:${k}" data-on="${k<=step?1:0}">${LABEL[s]}</li>`).join("")}</ol>
 ${i.demo?`<p class="demo">Demo data</p>`:""}</li>`}

async function listView(kind){
 const my=++token, isFeed=kind==="feed";
 main.innerHTML=`<section class="page"><h2>${isFeed?"City feed":"My reports"}</h2><p class="lede">${isFeed?"Recent reports from around the city.":"Issues you’ve reported from this device."}</p><div id="body">${skeleton()}</div></section>`;
 const body=$("#body");
 const run=async()=>{
  body.innerHTML=skeleton();
  let items;
  try{items=await (isFeed?api.list():api.mine())}catch(e){
   if(my!==token)return;
   body.innerHTML=`<div class="state bad" role="alert"><p><strong>We couldn’t load reports.</strong> Check your connection and try again.</p><button class="btn" id="retry">Try again</button></div>`;
   $("#retry").onclick=run;return}
  if(my!==token)return;
  if(!items.length){body.innerHTML=`<div class="state"><p><strong>${isFeed?"No reports yet. Be the first.":"You haven’t reported anything yet."}</strong></p><a class="btn btn-primary" href="#report">Report an issue</a></div>`;return}
  let f="all";
  const draw=()=>{
   const shown=items.filter(i=>f==="all"||(f==="open"?i.status!=="resolved":i.status==="resolved"));
   body.innerHTML=`<div class="chips" role="group" aria-label="Filter reports">${[["all","All"],["open","Open"],["done","Resolved"]].map(([v,l])=>`<button class="chip" data-f="${v}" aria-pressed="${f===v}">${l}</button>`).join("")}</div>
   ${shown.length?`<ul class="list">${shown.map(card).join("")}</ul>`:`<div class="state"><p>No ${f==="done"?"resolved":"open"} reports to show.</p></div>`}`;
   body.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{f=b.dataset.f;draw();body.querySelector(`[data-f="${f}"]`).focus()});
   requestAnimationFrame(()=>requestAnimationFrame(()=>body.querySelectorAll(".steps li[data-on='1']").forEach(l=>l.classList.add("on"))));
  };
  draw();
 };
 run();
}

function reportView(){
 ++token;
 main.innerHTML=`<section class="page" aria-labelledby="rt"><h2 id="rt">Report an issue</h2><p class="lede">The more precise the location, the faster someone can find it.</p>
 <form id="f" novalidate>
 <label for="title">What’s the problem?</label><input id="title" autocomplete="off"><p class="err" id="e-title" hidden></p>
 <label for="cat">Type</label><select id="cat">${Object.entries(CATS).map(([v,l])=>`<option value="${v}">${l}</option>`).join("")}</select>
 <label for="desc">Details <span class="opt">(optional)</span></label><textarea id="desc" rows="4"></textarea>
 <label for="loc">Where is it?</label><input id="loc" placeholder="Street, landmark, ward" autocomplete="off"><p class="err" id="e-loc" hidden></p>
 <div><button type="button" class="btn" id="gps">Use my location</button> <span class="hint" id="geo" role="status"></span></div>
 <label for="photo">Photo <span class="opt">(optional)</span></label><input id="photo" type="file" accept="image/*" aria-describedby="pn"><img id="pv" class="preview" alt="Preview of the photo you chose" hidden>
 <p class="hint" id="pn">Avoid capturing faces and vehicle number plates. Retake or crop if they appear. In demo mode, photos stay on your device.</p>
 <p class="err" id="e-sub" role="alert" hidden></p>
 <button class="btn btn-primary" id="go" type="submit">Send report</button></form></section>`;
 let coords=null;
 $("#gps").onclick=()=>{const g=$("#geo");
  if(!navigator.geolocation){g.textContent="Your browser can’t share location. Type the address instead.";return}
  g.textContent="Finding you…";
  navigator.geolocation.getCurrentPosition(p=>{coords=[p.coords.latitude,p.coords.longitude];g.textContent="Location added. You can still describe the spot."},()=>{g.textContent="We couldn’t get your location. Allow access or type the address."},{timeout:10000})};
 $("#photo").onchange=e=>{const f=e.target.files[0],pv=$("#pv");if(!f){pv.hidden=true;return}pv.src=URL.createObjectURL(f);pv.hidden=false};
 const mark=(id,eid,msg)=>{const el=$("#"+id),er=$("#"+eid);if(msg){el.setAttribute("aria-invalid","true");el.setAttribute("aria-describedby",eid);er.textContent=msg;er.hidden=false}else{el.removeAttribute("aria-invalid");er.hidden=true}};
 $("#f").onsubmit=async e=>{e.preventDefault();
  const t=$("#title").value.trim(),l=$("#loc").value.trim();
  const bad1=t.length<5?"Add a short title, at least 5 characters.":"",bad2=(!l&&!coords)?"Tell us where this is, or use your location.":"";
  mark("title","e-title",bad1);mark("loc","e-loc",bad2);
  if(bad1||bad2){$(bad1?"#title":"#loc").focus();return}
  const b=$("#go");b.disabled=true;b.innerHTML='<span class="spin"></span> Sending…';$("#e-sub").hidden=true;
  try{await api.create({title:t,category:$("#cat").value,description:$("#desc").value.trim(),loc:l||"Pinned by GPS"});
   main.innerHTML=`<section class="success" role="status"><svg class="check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28"/><path d="M20 33l8 8 17-18"/></svg><h2>Report received</h2><p class="lede">Follow its progress under My reports.</p><a class="btn btn-primary" href="#mine">See my reports</a> <a class="btn" href="#report" id="again">Report another</a></section>`;
   $("#again").onclick=ev=>{ev.preventDefault();reportView()};
  }catch(err){b.disabled=false;b.textContent="Send report";const s=$("#e-sub");s.textContent="We couldn’t send your report. Your details are still here. Try again.";s.hidden=false}
 };
}

function gateView(r){++token;main.innerHTML=`<section class="state"><h2>Log in to ${r==="report"?"report an issue":"see your reports"}</h2><p class="lede">It takes a few seconds, and it lets you follow your reports.</p><a class="btn btn-primary" href="auth.html?next=index.html%23${r}">Log in or register</a></section>`}
function authSlot(){const u=session(),el=$("#auth");
 el.innerHTML=u?`<span class="who">Hi, ${esc(u.name.split(" ")[0])}</span><button class="btn lo" id="out">Log out</button>`:`<a class="btn lo" href="auth.html?next=index.html%23home">Log in</a>`;
 if(u)$("#out").onclick=()=>{try{localStorage.removeItem("cityfix.session")}catch(e){}location.hash="#home";route()}}
function route(){
 authSlot();
 const r=(location.hash||"#home").slice(1);
 document.querySelectorAll("nav a").forEach(a=>a.dataset.r===r?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current"));
 if((r==="report"||r==="mine")&&!session())gateView(r);else if(r==="report")reportView();else if(r==="mine")listView("mine");else if(r==="feed")listView("feed");else{++token;main.innerHTML=hero()}
 window.scrollTo(0,0);
}
addEventListener("hashchange",()=>{route();main.focus({preventScroll:true})});
route();
