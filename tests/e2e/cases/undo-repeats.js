// runs inside the page module (see the e2e hook); pushes "ok …" / "FAIL …" into R and writes them to document.title
const R=[];const t=(n,c)=>R.push((c?"ok ":"FAIL ")+n);
try{
 const right=()=>form(...cur.split("|").map((x,i)=>i===2?+x:x));
 cur="hablar|pres|0"; $("ans").value="zzz"; check(); undo();
 t("undo marks prompt",undone&&!S.review[cur]&&S.total===0);
 $("ans").value=right(); check();
 t("correct after undo: no streak",S.streak===0&&S.right===1);
 t("card comes back once",S.review[cur]&&S.review[cur].need===1&&S.review[cur].due>S.t);
 t("message says it returns",$("fb").textContent.includes("После отмены"));
 step(); t("next prompt clears flag",!undone);
 const k=cur; $("ans").value=right(); check(); t("normal correct → streak",S.streak===1&&!S.review[k]);
 // undo on a card already in review: the review entry is kept, not reset to need 1
 step(); const k2=cur; S.review[k2]={need:3,gap:4,due:S.t}; $("ans").value="zzz"; check(); undo(); $("ans").value=right(); check();
 t("existing review kept",S.review[k2]&&S.review[k2].need===3);
}catch(e){R.push("ERR "+e.stack)}
document.title=R.join(" | ");
