// runs inside the page module (see the e2e hook); pushes "ok …" / "FAIL …" into R and writes them to document.title
const R=[];const t=(n,c)=>R.push((c?"ok ":"FAIL ")+n);
try{
 const ch=(id,v)=>{ $(id).checked=v; $(id).dispatchEvent(new Event("change",{bubbles:true})); };
 if(!sessionStorage.getItem("phase")){
   ch("m-ru",true); ch("l-4",true); ch("g-irr",true); ch("strict",false); ch("vos",false);
   document.querySelector('[data-set="all"]').click();
   sessionStorage.setItem("phase","1"); location.reload(); return;
 }
 t("prompt language kept",$("m-ru").checked&&!$("m-es").checked);
 t("level kept",$("l-4").checked);
 t("verb type kept",$("g-irr").checked);
 t("checkboxes kept",!$("strict").checked&&!$("vos").checked);
 t("tenses kept",selTenses.length===TENSES.length);
 t("pool uses kept settings",TIER[cur.split("|")[0]]===4&&!!IRR[cur.split("|")[0]]&&cur.split("|")[2]!=="4");
 let n=0; const arm=()=>$("resetAll").click(); arm(); arm();
 t("reset all restores defaults",$("m-es").checked&&$("l-1").checked&&$("g-all").checked&&$("strict").checked&&$("vos").checked);
 t("reset all clears storage",localStorage.getItem("conj-settings-v1")===null);
}catch(e){R.push("ERR "+e.stack)}
document.title=R.join(" | ");
