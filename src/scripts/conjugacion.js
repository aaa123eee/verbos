// The conjugation trainer page: cheat sheet tables, trainer state, settings, drill, dialog, search.
import {PERS,REG,REGULAR,IRR,RU,TIER,TIER_NAME,addTier,MEAN,RUP,ruPhrase,TENSES,TMAP,DEFAULT_TENSES,IMP_PERS,isImp,persLabel,hasPerson,vt,base,basic,IMPF_IRR,IMPF,FUT_STEM,FUT,PART_IRR,part,HABER,HABER_SE,SP_OVR,SP_NOS_IR,SP_NOS_INF,spell,SP_END,subjPres,raForm,subjImpf,altForm,IMP_TU,IMP_ROOT,imperative,form,F,PN,ACC,plain,listF,SPELL_RULE,stemChange,kindBasic,whyBasic,whySp,HABER_NAME,explain,regularForm,hintRegular,hintBasic,hintSp,hintRule,hintEndings,COND} from "../lib/conjugation.js";

// irregular table
(function(){
  let out="",voc="";
  for(const n of [1,2,3,4]){
    let h='<h3>'+TIER_NAME[n]+'</h3><div class="tbl"><table><thead><tr><th>глагол</th><th>время</th>'+PERS.map(p=>'<th>'+p+'</th>').join('')+'</tr></thead><tbody>';
    for(const v in IRR){
      if(TIER[v]!==n) continue;
      ["pres","pret"].forEach((t,i)=>{
        h+='<tr>'+(i===0?'<td rowspan="2"><span class="f e">'+v+'</span><br><span class="p" style="font-size:12px;color:var(--muted)">'+RU[v][0]+'</span></td>':'')+
        '<td class="p">'+(t==="pres"?"presente":"pretérito")+'</td>'+IRR[v][t].split(" ").map(x=>'<td class="f">'+x+'</td>').join('')+'</tr>';
      });
    }
    out+=h+'</tbody></table></div>';
    voc+='<h3>Правильные · '+TIER_NAME[n]+'</h3><div class="vocab">'+REGULAR.filter(v=>TIER[v]===n).map(v=>'<div><span class="f e">'+v+'</span><span>'+RU[v][0]+'</span></div>').join("")+'</div>';
  }
  document.getElementById("irrTables").innerHTML=out;
  document.getElementById("vocab").innerHTML=voc;
})();

// state
const KEY="conj-trainer-v1";
let S={t:0,review:{},total:0,right:0,streak:0};
try{const s=JSON.parse(localStorage.getItem(KEY)||"null"); if(s&&s.review) S=Object.assign(S,s);}catch(e){}
// IndexedDB key-value store: progress stays in this browser
const IDB={db:null,
  open(){return new Promise((res,rej)=>{const r=indexedDB.open("conjugacion",1);
    r.onupgradeneeded=()=>r.result.createObjectStore("kv");
    r.onsuccess=()=>res(this.db=r.result); r.onerror=()=>rej(r.error);});},
  get(k){return new Promise((res,rej)=>{const q=this.db.transaction("kv").objectStore("kv").get(k);
    q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error);});},
  set(k,v){return new Promise((res,rej)=>{const tx=this.db.transaction("kv","readwrite");
    tx.objectStore("kv").put(v,k); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error);});}
};
let idbReady=false,writing=false,dirty=false,timer=null;
const setNote=s=>{const n=document.getElementById("syncNote"); if(n) n.textContent=s;};
function save(){ dirty=true; clearTimeout(timer); timer=setTimeout(flush,400); }
async function flush(){
  if(!dirty||writing) return;
  dirty=false;
  if(!idbReady){ try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){} return; }
  writing=true;
  try{ await IDB.set("progress",JSON.parse(JSON.stringify(S))); }
  catch(e){ setNote("Не получилось сохранить прогресс в браузере."); }
  writing=false;
  if(dirty) flush();
}
const $=id=>document.getElementById(id);
// tense checkboxes, grouped by mood; selection remembered in this browser
const TKEY="conj-tenses-v1";
let selTenses=DEFAULT_TENSES.slice();
try{const s=JSON.parse(localStorage.getItem(TKEY)||"null"); if(Array.isArray(s)){const ok=s.filter(k=>TMAP[k]); if(ok.length) selTenses=ok;}}catch(e){}
function renderTenses(){
  const moods=[...new Set(TENSES.map(t=>t.mood))];
  $("tenses").innerHTML=moods.map(m=>'<div class="mood"><b>'+m+'</b>'+
    TENSES.filter(t=>t.mood===m).map(t=>'<label class="tchip" style="--tc:var(--t-'+t.k+')"><input type="checkbox" id="tn-'+t.k+'" value="'+t.k+'"'+(selTenses.includes(t.k)?" checked":"")+'><span>'+(t.short||t.name).replace(/^(subj|imp)\. /,"")+'</span></label>').join("")+'</div>').join("")+
    '<div class="tbtns"><span class="cap">Быстрый выбор</span><button type="button" data-set="def">Presente + pretérito</button><button type="button" data-set="ind">Весь indicativo</button><button type="button" data-set="all">Все</button></div>';
}
function setTenses(list){
  selTenses=list.slice();
  try{localStorage.setItem(TKEY,JSON.stringify(selTenses));}catch(e){}
  document.querySelectorAll('#tenses input').forEach(i=>i.checked=selTenses.includes(i.value));
  show();
}
const opt=()=>({mode:document.querySelector('input[name=mode]:checked').value,tenses:selTenses,group:document.querySelector('input[name=group]:checked').value,tier:document.querySelector('input[name=tier]:checked').value,vos:$("vos").checked,strict:$("strict").checked});
function pool(){
  const o=opt(),items=[];
  const verbs=(o.group==="reg"?REGULAR:o.group==="irr"?Object.keys(IRR):REGULAR.concat(Object.keys(IRR)))
    .filter(v=>o.tier==="all"||TIER[v]===+o.tier);
  for(const v of verbs)for(const t of o.tenses)for(let p=0;p<6;p++){ if(p===4&&!o.vos)continue; if(!hasPerson(t,p))continue; items.push(v+"|"+t+"|"+p); }
  return items;
}
let cur=null,last=null,answered=false,prevS=null,curRu=false,undone=false; // undone: this prompt's answer was undone once
const ICO={check:'<path d="M20 6 9 17l-5-5"/>',next:'<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>'};
const setGo=done=>{ $("go").innerHTML='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+ICO[done?"next":"check"]+'</svg><span>'+(done?"Дальше":"Проверить")+'</span><kbd>Enter ↵</kbd>'; $("undo").disabled=!done; syncHints(); };
// hints: each button once (Буква repeats); using any hint brings the card back once more
let hintUsed=new Set(),letters=0;
const HINT_NAME={rule:"Правило",reg:"Правильный?",end:"Окончания"};
function letterCap(){ const c=form(...cur.split("|").map((x,i)=>i===2?+x:x)); return c.length-1; }
function syncHints(){
  document.querySelectorAll("#hintbar button").forEach(b=>{ const k=b.dataset.h;
    b.disabled=answered||!cur||(k==="letter"?letters>=letterCap():hintUsed.has(k)); });
}
function resetHints(){ hintUsed=new Set(); letters=0; $("hints").innerHTML=""; $("hints").hidden=true; }
function useHint(k){
  if(answered||!cur) return;
  const [v,t,p]=cur.split("|"),h=$("hints"); hintUsed.add(k);
  if(k==="letter"){
    const c=form(v,t,+p); letters++; if(c[letters-1]===" ") letters++;
    let el=h.querySelector(".lt-row"); if(!el){ el=document.createElement("div"); el.className="lt-row"; h.appendChild(el); }
    el.innerHTML='<i>Начало</i><span class="lt">'+esc(c.slice(0,letters))+'…</span>';
  }else{
    const lines=(k==="rule"?hintRule:k==="reg"?hintRegular:hintEndings)(v,t,+p);
    const el=document.createElement("div"); el.innerHTML='<i>'+HINT_NAME[k]+'</i>'+lines.join(" ");
    h.insertBefore(el,h.querySelector(".lt-row"));
  }
  h.hidden=false; syncHints(); $("ans").focus({preventScroll:true});
}
function pick(){
  const P=pool(),set=new Set(P);
  const due=Object.entries(S.review).filter(([k,r])=>set.has(k)&&r.due<=S.t&&k!==last).sort((a,b)=>a[1].due-b[1].due);
  if(due.length) return due[0][0];
  // prefer fresh cards; if everything is under review and not yet due, take the soonest one
  const fresh=P.filter(k=>k!==last&&!(S.review[k]&&S.review[k].due>S.t));
  if(fresh.length) return fresh[Math.floor(Math.random()*fresh.length)];
  const soon=P.filter(k=>k!==last).sort((a,b)=>S.review[a].due-S.review[b].due);
  return soon[0]||P[0];
}
function show(){
  if(S.drill){ const [dv,dt]=S.drill.split("|"); if(RU[dv]&&TMAP[dt]){ startDrill(); return; } S.drill=null; }
  drilling=false; $("drill").hidden=true; $("drill").innerHTML="";
  document.querySelector(".answer").hidden=false; $("hintbar").hidden=false;
  cur=pick(); last=cur; answered=false;
  const [v,t,p]=cur.split("|");
  const T=TMAP[t];
  $("pTense").textContent=T.name;
  $("pWhen").textContent=T.ru;
  document.querySelector(".trainer").style.setProperty("--tc","var(--t-"+T.k+")");
  // Russian prompts exist only for presente and pretérito; other tenses fall back to Spanish
  const m=opt().mode, ruOk=t==="pres"||t==="pret", ru=ruOk&&(m==="ru"||(m==="mix"&&Math.random()<.5));
  curRu=ru; $("pPron").hidden=ru; $("pSep").hidden=ru;
  if(ru){ $("pVerb").textContent=ruPhrase(v,t,+p); $("pRu").textContent=RU[v][3]||"переведи на испанский"; }
  else { $("pPron").textContent=persLabel(t,+p); $("pVerb").textContent=v; $("pRu").textContent=RU[v][0]; }
  const r=S.review[cur];
  $("pTag").textContent=r?"повтор · осталось верных: "+r.need:"";
  $("ans").value=""; $("ans").focus({preventScroll:true});
  resetHints(); undone=false; setGo(false);
  const fb=$("fb"); fb.className="feedback idle"; fb.textContent=FB_IDLE; fb.hidden=S.total>0;
}
const norm=s=>s.trim().toLowerCase().replace(/\s+/g," ");
const deacc=s=>s.normalize("NFD").replace(/[́]/g,"").normalize("NFC");
const esc=s=>s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
function diff(u,c){
  let a=0; while(a<u.length&&a<c.length&&u[a]===c[a])a++;
  let b=0; while(b<u.length-a&&b<c.length-a&&u[u.length-1-b]===c[c.length-1-b])b++;
  const cm=c.slice(a,c.length-b),um=u.slice(a,u.length-b);
  return {
    c:esc(c.slice(0,a))+(cm?'<mark>'+esc(cm)+'</mark>':'<mark>∧</mark>')+esc(c.slice(c.length-b)),
    u:esc(u.slice(0,a))+(um?'<del>'+esc(um)+'</del>':'<del>∧</del>')+esc(u.slice(u.length-b))
  };
}
function trLine(v,t,p,c){
  const head=v+" · "+persLabel(t,p)+" → "+c;
  return (t==="pres"||t==="pret")? head+" — "+ruPhrase(v,t,p) : head+" — "+RU[v][0]+" ("+TMAP[t].name+")";
}
const whyHtml=(v,t,p)=>'<div class="why"><h3>Как получается</h3>'+explain(v,t,p).map(l=>'<div>'+l+'</div>').join("")+'</div>';
// the whole tense for this verb; the asked person is highlighted, forms off the general rule are colored
function tenseHtml(v,t,p){
  let odd=false;
  const rows=[0,1,2,3,4,5].map(q=>{
    if(!hasPerson(t,q)) return '<div></div>';
    const f=form(v,t,q),x=q!==p&&f!==regularForm(v,t,q); odd=odd||x;
    return '<div'+(q===p?' class="me"':'')+'><span>'+persLabel(t,q).split(" ")[0]+'</span><span'+(x?' class="x"':'')+'>'+f+'</span></div>';
  }).join("");
  return '<div class="why"><h3>'+esc(TMAP[t].name)+' · '+v+'</h3><div class="vt">'+rows+'</div>'+(odd?'<small class="vtn">Цветом — формы не по общему правилу.</small>':'')+'</div>';
}
// Russian prompts can be ambiguous (начинать = empezar / comenzar): any verb with the same Russian phrase counts
function synonymFor(v,t,p,same){
  const ph=ruPhrase(v,t,p);
  return REGULAR.concat(Object.keys(IRR)).find(w=>w!==v&&RU[w]&&ruPhrase(w,t,p)===ph&&same(form(w,t,p)))||"";
}
function check(){
  const [v,t,p]=cur.split("|"),c=form(v,t,+p),u=norm($("ans").value);
  if(!u)return false;
  prevS=JSON.stringify(S);
  const o=opt(),same=f=>f!=null&&(u===f||(!o.strict&&deacc(u)===deacc(f)));
  // also right: the -se form, or (in a Russian prompt) a synonym verb whose Russian phrase is the same
  const via=u===c?"":same(altForm(v,t,+p))?"alt":curRu?synonymFor(v,t,+p,same):"";
  let ok=u===c||!!via, accentOnly=!ok&&deacc(u)===deacc(c);
  if(accentOnly&&!o.strict) ok=true;
  S.t++; S.total++;
  const fb=$("fb"); fb.hidden=false;
  if(ok){
    S.right++;
    const r=S.review[cur];
    let msg=accentOnly?"Засчитано, но ударение: "+c:via==="alt"?"Верно: форма на -se. Чаще говорят "+c+".":via?"Засчитано: "+via+" тоже подходит по смыслу. Загадан был "+v+" — "+c+".":"Верно.";
    if(hintUsed.size||undone){ // after a hint or an undo: no streak, and the card comes back once to answer cleanly
      msg+=hintUsed.size?" С подсказкой — вопрос вернётся, чтобы ответить без неё.":" После отмены — вопрос вернётся ещё раз позже.";
      if(r) r.due=S.t+r.gap; else S.review[cur]={need:1,gap:4,due:S.t+4+Math.floor(Math.random()*3)};
    }else{
      S.streak++;
      if(r){ r.need--; if(r.need<=0){delete S.review[cur]; msg+=" Убрано из повторения.";} else { r.gap=Math.round(r.gap*1.8); r.due=S.t+r.gap; } }
    }
    fb.className="feedback ok"; fb.innerHTML='<div>'+esc(msg)+'</div><div class="tr">'+esc(trLine(v,t,+p,c))+'</div>';
  }else{
    S.streak=0;
    const d=diff(u,c);
    S.review[cur]={need:3,gap:4,due:S.t+4+Math.floor(Math.random()*3)};
    const drill=noteMiss(v,t);
    fb.className="feedback bad";
    fb.innerHTML='<div>'+(accentOnly?"Ошибка в ударении.":"Ошибка.")+'</div><div class="row">ты: '+d.u+'</div><div class="row">надо: '+d.c+'</div><div class="tr">'+esc(trLine(v,t,+p,c))+'</div>'+whyHtml(v,t,+p)+tenseHtml(v,t,+p)+
      (drill?'<div class="drillnote">Вторая ошибка в '+esc(v)+' ('+esc(TMAP[t].name)+'). Дальше — написать все формы этого времени по памяти.</div>':'');
  }
  save(); render(); answered=true; setGo(true);
  return true;
}
function render(){
  const pct=S.total?Math.round(S.right/S.total*100):0;
  const n=Object.keys(S.review).length;
  $("stats").innerHTML='<span>ответов <b>'+S.total+'</b></span><span>верно <b>'+pct+'%</b></span><span>серия <b>'+S.streak+'</b></span><span>на повторении <b>'+n+'</b></span>';
  $("mini").innerHTML=S.total?'серия <b>'+S.streak+'</b> · верно <b>'+pct+'%</b>':'';
  const w=$("weak");
  if(!n){w.innerHTML='<span class="empty">Пусто. Ошибки появятся здесь и будут возвращаться, пока не ответишь трижды.</span>';return;}
  w.innerHTML=Object.entries(S.review).sort((a,b)=>a[1].due-b[1].due).map(([k,r])=>{const [v,t,p]=k.split("|");if(!TMAP[t]) return ""; return '<span class="chip">'+esc(persLabel(t,+p).split(" ")[0])+' '+v+' <i>'+esc(TMAP[t].short||TMAP[t].name)+' · ×'+r.need+'</i></span>';}).join("");
}
// no <form>: Enter is handled here, so nothing submits or reloads the page
const step=()=>{ if(drilling) drillCheck(); else if(answered) show(); else check(); };
// drill: a second mistake in the same verb and tense within DRILL_WINDOW turns → type every form of that tense.
// S.miss = {"verb|tense": {n, t}} (old entries pruned); S.drill = "verb|tense" until the drill is done, so it survives reloads
const DRILL_WINDOW=40;
let drilling=false,typeTarget=null;
function noteMiss(v,t){
  S.miss=S.miss||{};
  for(const k in S.miss) if(S.t-S.miss[k].t>DRILL_WINDOW) delete S.miss[k];
  const k=v+"|"+t,m=S.miss[k];
  S.miss[k]={n:m?m.n+1:1,t:S.t};
  if(S.miss[k].n<2) return false;
  delete S.miss[k]; S.drill=k; return true;
}
function startDrill(){
  const [v,t]=S.drill.split("|"),T=TMAP[t],o=opt();
  drilling=true; answered=false; cur=null; prevS=null; curRu=false;
  $("pTense").textContent=T.name; $("pWhen").textContent=T.ru;
  document.querySelector(".trainer").style.setProperty("--tc","var(--t-"+t+")");
  $("pPron").hidden=true; $("pSep").hidden=true; $("pVerb").textContent=v; $("pRu").textContent=RU[v][0];
  $("pTag").textContent="две ошибки в этом времени · напиши все формы";
  $("drill").innerHTML=[0,1,2,3,4,5].filter(p=>hasPerson(t,p)&&(o.vos||p!==4)).map(p=>
    '<label class="dr" data-p="'+p+'"><span class="pl">'+esc(persLabel(t,p).split(" ")[0])+'</span><input type="text" autocomplete="off" spellcheck="false" autocapitalize="off" autocorrect="off" aria-label="'+esc(persLabel(t,p))+'"><span class="st" aria-live="polite"></span></label>').join("");
  $("drill").hidden=false; document.querySelector(".answer").hidden=true; $("hintbar").hidden=true; resetHints();
  const fb=$("fb"); fb.hidden=false; fb.className="feedback idle"; fb.textContent="Пиши формы по памяти, Enter — проверить строку. Ошибся — увидишь правильную форму и напишешь её ещё раз.";
  setGo(false); $("undo").disabled=true;
  $("drill").querySelector("input").focus({preventScroll:true});
}
function drillCheck(row){
  const rows=[...$("drill").querySelectorAll(".dr:not(.ok)")];
  if(!row||row.classList.contains("ok")) row=rows.find(r=>r.contains(document.activeElement))||rows[0];
  if(!row) return;
  const [v,t]=S.drill.split("|"),i=row.querySelector("input"),c=form(v,t,+row.dataset.p),u=norm(i.value);
  if(!u){ i.focus(); return; }
  const alt=altForm(v,t,+row.dataset.p);
  if([c,alt].some(f=>f&&(u===f||(!opt().strict&&deacc(u)===deacc(f))))){
    row.className="dr ok"; i.readOnly=true; i.value=c; row.querySelector(".st").textContent="";
    const next=$("drill").querySelector(".dr:not(.ok) input");
    if(next) next.focus(); else finishDrill();
  }else{
    row.className="dr bad"; row.querySelector(".st").innerHTML='надо: <b>'+esc(c)+'</b> — напиши ещё раз'; i.value=""; i.focus();
  }
}
function finishDrill(){
  drilling=false; S.drill=null; save();
  answered=true; setGo(true); $("undo").disabled=true; $("go").focus({preventScroll:true});
  const fb=$("fb"); fb.className="feedback ok"; fb.textContent="Готово: все формы написаны. Enter — дальше.";
}
// undo: misclick or misread task → forget the last answer and ask the same prompt again
const FB_IDLE=$("fb").textContent;
function undo(){
  if(!answered||!prevS) return;
  S=JSON.parse(prevS); prevS=null; undone=true; save(); render();
  answered=false; setGo(false);
  const r=S.review[cur]; $("pTag").textContent=r?"повтор · осталось верных: "+r.need:"";
  const fb=$("fb"); fb.hidden=false; fb.className="feedback idle"; fb.textContent="Ответ отменён, попробуй ещё раз. Этот вопрос потом вернётся ещё раз.";
  $("ans").value=""; $("ans").focus({preventScroll:true});
}
$("go").addEventListener("click",step);
$("undo").addEventListener("click",undo);
$("hintbar").addEventListener("click",e=>{ const b=e.target.closest("button[data-h]"); if(b) useHint(b.dataset.h); });
// settings: a side panel on desktop, a drawer behind «Настройки» on phones
const side=$("side"),narrow=matchMedia("(max-width:899.98px)");
const drawerOpen=()=>side.classList.contains("open");
function setDrawer(open){
  if(open&&!narrow.matches) return;
  side.classList.toggle("open",open); $("scrim").hidden=!open;
  $("cfgOpen").setAttribute("aria-expanded",open);
  document.querySelectorAll(".top,.main,.about").forEach(x=>x.inert=open);
  if(open) side.focus(); else $("ans").focus({preventScroll:true});
}
$("cfgOpen").addEventListener("click",()=>setDrawer(true));
$("cfgClose").addEventListener("click",()=>setDrawer(false));
$("scrim").addEventListener("click",()=>setDrawer(false));
narrow.addEventListener("change",()=>{ if(!narrow.matches&&drawerOpen()) setDrawer(false); });
document.addEventListener("keydown",e=>{
  if(e.key!=="Escape"||$("sheet").open) return;
  if(drawerOpen()){ e.preventDefault(); setDrawer(false); }
  else if(answered){ e.preventDefault(); undo(); }
});
$("ans").addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.isComposing){ e.preventDefault(); step(); } });
$("drill").addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.isComposing&&e.target.matches("input")){ e.preventDefault(); if(drilling) drillCheck(e.target.closest(".dr")); } });
// accent keys type into the last focused field: the answer or a drill row
document.querySelector(".trainer").addEventListener("focusin",e=>{ if(e.target.matches("input")) typeTarget=e.target; });
document.querySelectorAll(".keys button").forEach(b=>b.addEventListener("click",()=>{
  const i=typeTarget&&!typeTarget.readOnly&&!typeTarget.closest("[hidden]")&&document.contains(typeTarget)?typeTarget:$("ans"),s=i.selectionStart??i.value.length,en=i.selectionEnd??s;
  i.value=i.value.slice(0,s)+b.dataset.k+i.value.slice(en); i.focus(); i.setSelectionRange(s+1,s+1);
}));
renderTenses();
$("tenses").addEventListener("change",e=>{
  const list=[...document.querySelectorAll('#tenses input:checked')].map(i=>i.value);
  if(!list.length){ e.target.checked=true; return; } // keep at least one tense
  setTenses(TENSES.map(t=>t.k).filter(k=>list.includes(k)));
});
$("tenses").addEventListener("click",e=>{
  const b=e.target.closest("button[data-set]"); if(!b) return;
  const s=b.dataset.set;
  setTenses(s==="def"?DEFAULT_TENSES:s==="ind"?TENSES.filter(t=>t.mood==="Indicativo").map(t=>t.k):TENSES.map(t=>t.k));
});
// the other settings (verb type, level, prompt language, accents, vosotros) survive reloads too
const SKEY="conj-settings-v1",SET_IDS=["g-all","g-reg","g-irr","l-1","l-2","l-3","l-4","l-all","m-es","m-ru","m-mix","strict","vos"];
const saveSettings=()=>{ try{localStorage.setItem(SKEY,JSON.stringify(SET_IDS.filter(id=>$(id).checked)));}catch(e){} };
try{ const on=JSON.parse(localStorage.getItem(SKEY)||"null"); if(Array.isArray(on)) SET_IDS.forEach(id=>$(id).checked=on.includes(id)); }catch(e){}
document.querySelectorAll('input[name=group],input[name=tier],input[name=mode],#vos').forEach(x=>x.addEventListener("change",()=>{ saveSettings(); show(); }));
$("strict").addEventListener("change",saveSettings);
// two-step confirm: first click arms the button for 3 s
function confirmBtn(id,action){
  const b=$(id),lbl=b.querySelector("span"); let armed=false,tm=null;
  b.addEventListener("click",()=>{
    if(!armed){ armed=true; lbl.textContent="Точно?"; tm=setTimeout(()=>{armed=false;lbl.textContent=b.dataset.label;},3000); return; }
    clearTimeout(tm); armed=false; lbl.textContent=b.dataset.label; action();
  });
}
const resetProgress=()=>{ S={t:0,review:{},total:0,right:0,streak:0}; prevS=null; save(); render(); $("fb").className="feedback idle"; $("fb").textContent=FB_IDLE; };
confirmBtn("reset",()=>{ resetProgress(); show(); });
confirmBtn("resetAll",()=>{
  resetProgress();
  ["g-all","l-1","m-es","strict","vos"].forEach(id=>$(id).checked=true);
  setTenses(DEFAULT_TENSES); // also calls show() and stores the list, which we drop below
  try{localStorage.removeItem(TKEY);localStorage.removeItem(SKEY);}catch(e){}
});
// ---- cheat sheet dialog: opened by the header buttons, one tab per section ----
const sheet=$("sheet");
function openSheet(tab){
  document.querySelectorAll("#sheet [data-tab]").forEach(b=>b.setAttribute("aria-selected",b.dataset.tab===tab));
  document.querySelectorAll("#sheet .panel").forEach(x=>x.hidden=x.id!==tab);
  $("sheetBody").scrollTop=0;
  if(!sheet.open){ try{sheet.showModal();}catch(e){sheet.setAttribute("open","");} }
  if(tab==="search"){ renderSearch(); $("q").focus(); }
  else document.querySelector('#sheet [data-tab="'+tab+'"]').focus();
}
document.querySelector("nav.tools").addEventListener("click",e=>{ const b=e.target.closest("[data-open]"); if(b) openSheet(b.dataset.open); });
document.querySelector("#sheet .tabs").addEventListener("click",e=>{ const b=e.target.closest("[data-tab]"); if(b) openSheet(b.dataset.tab); });
$("sheetClose").addEventListener("click",()=>sheet.close());
sheet.addEventListener("click",e=>{ if(e.target===sheet) sheet.close(); }); // click on the backdrop
sheet.addEventListener("close",()=>$("ans").focus({preventScroll:true}));

// ---- verb search: by infinitive, Russian translation or any conjugated form ----
const ALL=REGULAR.concat(Object.keys(IRR)).sort((a,b)=>a.localeCompare(b,"es"));
const skey=s=>deacc(s.toLowerCase().trim()).replace(/\s+/g," ");
let FORMS=null; // deaccented form → [{v,t,p}], built on first search
function formIndex(){
  if(FORMS) return FORMS;
  FORMS=new Map(); const add=(k,x)=>{ if(!FORMS.has(k)) FORMS.set(k,[]); FORMS.get(k).push(x); };
  for(const v of ALL){
    for(const T of TENSES) for(let p=0;p<6;p++){ const f=form(v,T.k,p); if(f!=null) add(skey(f),{v,t:T.k,p}); }
    add(skey(part(v)),{v,part:true});
  }
  return FORMS;
}
// Russian side: every meaning (MEAN) plus the Russian forms used in prompts, so «сказал» finds decir
const rwords=s=>s.toLowerCase().replace(/ё/g,"е").split(/[^а-яa-zñáéíóú]+/).filter(Boolean);
let RUIDX=null;
function ruIndex(){
  if(RUIDX) return RUIDX;
  RUIDX=new Map(ALL.map(v=>[v,{gloss:rwords(RU[v][0]),mean:rwords(MEAN[v]||""),forms:rwords(RU[v][1]+" "+RU[v][2].join(" "))}]));
  return RUIDX;
}
function searchVerbs(q){
  const k=skey(q); if(!k) return ALL.map(v=>({v,sc:9}));
  const hits=new Map(),hit=(v,sc,x)=>{ const o=hits.get(v); if(!o||sc<o.sc) hits.set(v,{v,sc,x}); };
  if(/[а-яё]/i.test(q)){ // Russian: every query word must start a word of the meanings (or of the Russian forms)
    const qw=rwords(q),all=(ws,f)=>qw.every(w=>ws.some(x=>f(x,w)));
    const eq=(x,w)=>x===w,pre=(x,w)=>x.startsWith(w);
    for(const [v,I] of ruIndex()){
      if(all(I.gloss,eq)) hit(v,3); else if(all(I.mean,eq)) hit(v,3.1);
      else if(all(I.gloss,pre)) hit(v,3.2); else if(all(I.mean,pre)) hit(v,3.3);
      else if(all(I.forms,pre)) hit(v,3.6);
    }
    return [...hits.values()].sort((a,b)=>a.sc-b.sc||a.v.localeCompare(b.v,"es")).slice(0,40);
  }
  for(const v of ALL){
    const kv=skey(v);
    if(kv===k) hit(v,0); else if(kv.startsWith(k)) hit(v,1); else if(kv.includes(k)) hit(v,4);
  }
  (formIndex().get(k)||[]).forEach(x=>hit(x.v,2,x));
  return [...hits.values()].sort((a,b)=>a.sc-b.sc||a.v.localeCompare(b.v,"es")).slice(0,30);
}
// all meanings of a verb; the ones that match the Russian query are bold
function meanHtml(v,q){
  const qw=/[а-яё]/i.test(q||"")?rwords(q):[];
  return (MEAN[v]||RU[v][0]).split("; ").map(m=>qw.length&&qw.some(w=>rwords(m).some(x=>x.startsWith(w)))?"<b>"+esc(m)+"</b>":esc(m)).join("; ");
}
const formLabel=x=>x.part?"participio":(TMAP[x.t].short||TMAP[x.t].name)+", "+persLabel(x.t,x.p).split(" ")[0];
let selVerb=null;
function renderSearch(){
  const q=$("q").value,R=searchVerbs(q),k=skey(q);
  if(k&&R.length&&(R.length===1||R[0].sc===0||R[0].sc===2)&&!R.some(r=>r.v===selVerb)) selVerb=R[0].v; // obvious match: open it right away
  if(!R.some(r=>r.v===selVerb)) selVerb=null;
  $("results").classList.toggle("rows",!!k); // with a query: one row per verb with all its meanings
  $("results").innerHTML=R.length?R.map(r=>'<button type="button" data-v="'+r.v+'" aria-pressed="'+(r.v===selVerb)+'"><span class="f">'+r.v+'</span>'+
    (k?'<small>'+(r.x?'<i>'+esc(formLabel(r.x))+'</i> · ':'')+meanHtml(r.v,q)+'</small>':'')+'</button>').join(""):'<span class="empty">Ничего не нашлось. Попробуй инфинитив, перевод или любую форму.</span>';
  renderVerb(selVerb,k);
}
function renderVerb(v,k){
  if(!v){ $("verbCard").innerHTML=""; return; }
  const found=f=>k&&(skey(f)===k||skey(f.split(" ").pop())===k);
  $("verbCard").innerHTML='<div class="vhead"><span class="vname">'+v+'</span><span class="badge">'+(IRR[v]?"с особенностями":"правильный")+' · '+TIER_NAME[TIER[v]]+'</span><p class="means">'+meanHtml(v,$("q").value)+'</p></div>'+
    '<p class="note">Цветом выделены формы, которые не строятся по общему правилу.</p><div class="conj">'+
    TENSES.map(T=>'<div class="card" style="--tc:var(--t-'+T.k+')"><h4>'+T.name+'</h4>'+[0,1,2,3,4,5].filter(p=>hasPerson(T.k,p)).map(p=>{
      const f=form(v,T.k,p);
      return '<div class="ln'+(found(f)?' found':'')+'"><span>'+persLabel(T.k,p).split(" ")[0]+'</span><span class="f'+(f!==regularForm(v,T.k,p)?' x':'')+'">'+f+'</span></div>';
    }).join("")+'</div>').join("")+'</div>';
}
$("q").addEventListener("input",renderSearch);
$("q").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); const b=$("results").querySelector("button"); if(b){ selVerb=b.dataset.v; renderSearch(); } } });
$("results").addEventListener("click",e=>{ const b=e.target.closest("button[data-v]"); if(!b) return; selVerb=b.dataset.v; renderSearch(); });

render(); show();

// load progress from IndexedDB; migrate old localStorage data once
(async()=>{
  try{
    if(!window.indexedDB) return;
    await IDB.open(); idbReady=true;
    const r=await IDB.get("progress");
    if(r&&r.review&&(r.total||0)>=(S.total||0)){
      S=Object.assign({t:0,review:{},total:0,right:0,streak:0},r); render(); if(S.drill&&!drilling) show();
    }else if(S.total>0){ dirty=true; await flush(); }
    try{localStorage.removeItem(KEY);}catch(e){}
    if(dirty) flush();
    setNote("Прогресс хранится в этом браузере (IndexedDB).");
  }catch(e){ idbReady=false; }
})();

// e2e hook: only with ?e2e in the URL, Playwright runs test code inside this module's scope
if(new URLSearchParams(location.search).has("e2e")) window.__verbos=src=>eval(src);
