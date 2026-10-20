// Verb data, the conjugation engine, explanations and hints. Pure: no DOM, imported by the page and by tests.
const PERS=["yo","tú","él / ella / Ud.","nosotros","vosotros","ellos / Uds."];
const REG={
 ar:{pres:["o","as","a","amos","áis","an"],pret:["é","aste","ó","amos","asteis","aron"]},
 er:{pres:["o","es","e","emos","éis","en"],pret:["í","iste","ió","imos","isteis","ieron"]},
 ir:{pres:["o","es","e","imos","ís","en"],pret:["í","iste","ió","imos","isteis","ieron"]}
};
const REGULAR=["hablar","trabajar","comprar","escuchar","viajar","cantar","comer","beber","aprender","vender","vivir","escribir","abrir","decidir"];
const IRR={
 ser:{ru:"быть",pres:"soy eres es somos sois son",pret:"fui fuiste fue fuimos fuisteis fueron"},
 estar:{ru:"находиться",pres:"estoy estás está estamos estáis están",pret:"estuve estuviste estuvo estuvimos estuvisteis estuvieron"},
 ir:{ru:"идти",pres:"voy vas va vamos vais van",pret:"fui fuiste fue fuimos fuisteis fueron"},
 tener:{ru:"иметь",pres:"tengo tienes tiene tenemos tenéis tienen",pret:"tuve tuviste tuvo tuvimos tuvisteis tuvieron"},
 hacer:{ru:"делать",pres:"hago haces hace hacemos hacéis hacen",pret:"hice hiciste hizo hicimos hicisteis hicieron"},
 poder:{ru:"мочь",pres:"puedo puedes puede podemos podéis pueden",pret:"pude pudiste pudo pudimos pudisteis pudieron"},
 querer:{ru:"хотеть",pres:"quiero quieres quiere queremos queréis quieren",pret:"quise quisiste quiso quisimos quisisteis quisieron"},
 decir:{ru:"сказать",pres:"digo dices dice decimos decís dicen",pret:"dije dijiste dijo dijimos dijisteis dijeron"},
 venir:{ru:"приходить",pres:"vengo vienes viene venimos venís vienen",pret:"vine viniste vino vinimos vinisteis vinieron"},
 poner:{ru:"класть",pres:"pongo pones pone ponemos ponéis ponen",pret:"puse pusiste puso pusimos pusisteis pusieron"},
 saber:{ru:"знать",pres:"sé sabes sabe sabemos sabéis saben",pret:"supe supiste supo supimos supisteis supieron"},
 dar:{ru:"давать",pres:"doy das da damos dais dan",pret:"di diste dio dimos disteis dieron"},
 ver:{ru:"видеть",pres:"veo ves ve vemos veis ven",pret:"vi viste vio vimos visteis vieron"},
 salir:{ru:"выходить",pres:"salgo sales sale salimos salís salen",pret:"salí saliste salió salimos salisteis salieron"}
};
// Russian: infinitive, 6 present forms, past [sg, pl], optional hint for ambiguous verbs
const RU={
 hablar:["разговаривать","разговариваю разговариваешь разговаривает разговариваем разговариваете разговаривают",["поговорил","поговорили"]],
 trabajar:["работать","работаю работаешь работает работаем работаете работают",["работал","работали"]],
 comprar:["покупать","покупаю покупаешь покупает покупаем покупаете покупают",["купил","купили"]],
 escuchar:["слушать","слушаю слушаешь слушает слушаем слушаете слушают",["послушал","послушали"]],
 viajar:["путешествовать","путешествую путешествуешь путешествует путешествуем путешествуете путешествуют",["путешествовал","путешествовали"]],
 cantar:["петь","пою поёшь поёт поём поёте поют",["спел","спели"]],
 comer:["есть (кушать)","ем ешь ест едим едите едят",["поел","поели"]],
 beber:["пить","пью пьёшь пьёт пьём пьёте пьют",["выпил","выпили"]],
 aprender:["учить, изучать","учу учишь учит учим учите учат",["выучил","выучили"]],
 vender:["продавать","продаю продаёшь продаёт продаём продаёте продают",["продал","продали"]],
 vivir:["жить","живу живёшь живёт живём живёте живут",["жил","жили"]],
 escribir:["писать","пишу пишешь пишет пишем пишете пишут",["написал","написали"]],
 abrir:["открывать","открываю открываешь открывает открываем открываете открывают",["открыл","открыли"]],
 decidir:["решать","решаю решаешь решает решаем решаете решают",["решил","решили"]],
 ser:["быть (кто, какой)","есть есть есть есть есть есть",["был","были"],"ser: кто / какой"],
 estar:["быть, находиться (где, как)","нахожусь находишься находится находимся находитесь находятся",["был","были"],"estar: где / как"],
 ir:["идти, ехать","иду идёшь идёт идём идёте идут",["сходил","сходили"]],
 tener:["иметь","имею имеешь имеет имеем имеете имеют",["имел","имели"]],
 hacer:["делать","делаю делаешь делает делаем делаете делают",["сделал","сделали"]],
 poder:["мочь","могу можешь может можем можете могут",["смог","смогли"]],
 querer:["хотеть","хочу хочешь хочет хотим хотите хотят",["захотел","захотели"]],
 decir:["сказать","говорю говоришь говорит говорим говорите говорят",["сказал","сказали"],"decir: сказать что-то"],
 venir:["приходить","прихожу приходишь приходит приходим приходите приходят",["пришёл","пришли"]],
 poner:["класть, ставить","кладу кладёшь кладёт кладём кладёте кладут",["положил","положили"]],
 saber:["знать","знаю знаешь знает знаем знаете знают",["узнал","узнали"],"в pretérito saber = «узнал»"],
 dar:["давать","даю даёшь даёт даём даёте дают",["дал","дали"]],
 ver:["видеть","вижу видишь видит видим видите видят",["увидел","увидели"]],
 salir:["выходить","выхожу выходишь выходит выходим выходите выходят",["вышел","вышли"]]
};
// tiers: 1 = основные (above), 2 = частые, 3 = регулярно используемые, 4 = расширенные
const TIER={}; REGULAR.concat(Object.keys(IRR)).forEach(v=>TIER[v]=1);
const TIER_NAME={1:"Основные",2:"Частые",3:"Регулярно используемые",4:"Расширенные"};
function addTier(n,reg,irr,ru){
  reg.forEach(v=>{REGULAR.push(v);TIER[v]=n;});
  for(const v in irr){IRR[v]={pres:irr[v][0],pret:irr[v][1]};TIER[v]=n;}
  Object.assign(RU,ru);
}
addTier(2,["llamar","llevar","pasar","tomar","esperar","mirar","necesitar","deber"],{
 llegar:["llego llegas llega llegamos llegáis llegan","llegué llegaste llegó llegamos llegasteis llegaron"],
 buscar:["busco buscas busca buscamos buscáis buscan","busqué buscaste buscó buscamos buscasteis buscaron"],
 empezar:["empiezo empiezas empieza empezamos empezáis empiezan","empecé empezaste empezó empezamos empezasteis empezaron"],
 pedir:["pido pides pide pedimos pedís piden","pedí pediste pidió pedimos pedisteis pidieron"],
 dormir:["duermo duermes duerme dormimos dormís duermen","dormí dormiste durmió dormimos dormisteis durmieron"],
 sentir:["siento sientes siente sentimos sentís sienten","sentí sentiste sintió sentimos sentisteis sintieron"],
 conocer:["conozco conoces conoce conocemos conocéis conocen","conocí conociste conoció conocimos conocisteis conocieron"],
 traer:["traigo traes trae traemos traéis traen","traje trajiste trajo trajimos trajisteis trajeron"],
 oír:["oigo oyes oye oímos oís oyen","oí oíste oyó oímos oísteis oyeron"],
 pensar:["pienso piensas piensa pensamos pensáis piensan","pensé pensaste pensó pensamos pensasteis pensaron"],
 volver:["vuelvo vuelves vuelve volvemos volvéis vuelven","volví volviste volvió volvimos volvisteis volvieron"],
 encontrar:["encuentro encuentras encuentra encontramos encontráis encuentran","encontré encontraste encontró encontramos encontrasteis encontraron"],
 jugar:["juego juegas juega jugamos jugáis juegan","jugué jugaste jugó jugamos jugasteis jugaron"],
 seguir:["sigo sigues sigue seguimos seguís siguen","seguí seguiste siguió seguimos seguisteis siguieron"],
 leer:["leo lees lee leemos leéis leen","leí leíste leyó leímos leísteis leyeron"],
 creer:["creo crees cree creemos creéis creen","creí creíste creyó creímos creísteis creyeron"]
},{
 llamar:["звонить, звать","звоню звонишь звонит звоним звоните звонят",["позвонил","позвонили"]],
 llevar:["нести, носить","несу несёшь несёт несём несёте несут",["отнёс","отнесли"]],
 pasar:["проходить, проводить (время)","прохожу проходишь проходит проходим проходите проходят",["прошёл","прошли"]],
 tomar:["брать, пить","беру берёшь берёт берём берёте берут",["взял","взяли"]],
 esperar:["ждать, надеяться","жду ждёшь ждёт ждём ждёте ждут",["подождал","подождали"]],
 mirar:["смотреть","смотрю смотришь смотрит смотрим смотрите смотрят",["посмотрел","посмотрели"]],
 necesitar:["нуждаться","нуждаюсь нуждаешься нуждается нуждаемся нуждаетесь нуждаются",["нуждался","нуждались"]],
 deber:["быть должным","должен должен должен должны должны должны",["был должен","были должны"]],
 llegar:["приезжать, прибывать","приезжаю приезжаешь приезжает приезжаем приезжаете приезжают",["приехал","приехали"]],
 buscar:["искать","ищу ищешь ищет ищем ищете ищут",["искал","искали"]],
 empezar:["начинать","начинаю начинаешь начинает начинаем начинаете начинают",["начал","начали"]],
 pedir:["просить, заказывать","прошу просишь просит просим просите просят",["попросил","попросили"]],
 dormir:["спать","сплю спишь спит спим спите спят",["поспал","поспали"]],
 sentir:["чувствовать","чувствую чувствуешь чувствует чувствуем чувствуете чувствуют",["почувствовал","почувствовали"]],
 conocer:["знать (кого-то, место)","знаком знаком знаком знакомы знакомы знакомы",["познакомился","познакомились"],"conocer: знать кого-то · в pretérito «познакомился»"],
 traer:["приносить","приношу приносишь приносит приносим приносите приносят",["принёс","принесли"]],
 oír:["слышать","слышу слышишь слышит слышим слышите слышат",["услышал","услышали"]],
 pensar:["думать","думаю думаешь думает думаем думаете думают",["подумал","подумали"]],
 volver:["возвращаться","возвращаюсь возвращаешься возвращается возвращаемся возвращаетесь возвращаются",["вернулся","вернулись"]],
 encontrar:["находить","нахожу находишь находит находим находите находят",["нашёл","нашли"]],
 jugar:["играть","играю играешь играет играем играете играют",["сыграл","сыграли"]],
 seguir:["продолжать, следовать","продолжаю продолжаешь продолжает продолжаем продолжаете продолжают",["продолжил","продолжили"]],
 leer:["читать","читаю читаешь читает читаем читаете читают",["прочитал","прочитали"]],
 creer:["верить, полагать","верю веришь верит верим верите верят",["поверил","поверили"]]
});
addTier(3,["ayudar","cambiar","dejar","terminar","usar","preguntar","olvidar","correr","recibir","subir"],{
 entender:["entiendo entiendes entiende entendemos entendéis entienden","entendí entendiste entendió entendimos entendisteis entendieron"],
 perder:["pierdo pierdes pierde perdemos perdéis pierden","perdí perdiste perdió perdimos perdisteis perdieron"],
 contar:["cuento cuentas cuenta contamos contáis cuentan","conté contaste contó contamos contasteis contaron"],
 recordar:["recuerdo recuerdas recuerda recordamos recordáis recuerdan","recordé recordaste recordó recordamos recordasteis recordaron"],
 preferir:["prefiero prefieres prefiere preferimos preferís prefieren","preferí preferiste prefirió preferimos preferisteis prefirieron"],
 servir:["sirvo sirves sirve servimos servís sirven","serví serviste sirvió servimos servisteis sirvieron"],
 repetir:["repito repites repite repetimos repetís repiten","repetí repetiste repitió repetimos repetisteis repitieron"],
 morir:["muero mueres muere morimos morís mueren","morí moriste murió morimos moristeis murieron"],
 conducir:["conduzco conduces conduce conducimos conducís conducen","conduje condujiste condujo condujimos condujisteis condujeron"],
 caer:["caigo caes cae caemos caéis caen","caí caíste cayó caímos caísteis cayeron"],
 andar:["ando andas anda andamos andáis andan","anduve anduviste anduvo anduvimos anduvisteis anduvieron"],
 pagar:["pago pagas paga pagamos pagáis pagan","pagué pagaste pagó pagamos pagasteis pagaron"],
 sacar:["saco sacas saca sacamos sacáis sacan","saqué sacaste sacó sacamos sacasteis sacaron"],
 tocar:["toco tocas toca tocamos tocáis tocan","toqué tocaste tocó tocamos tocasteis tocaron"],
 almorzar:["almuerzo almuerzas almuerza almorzamos almorzáis almuerzan","almorcé almorzaste almorzó almorzamos almorzasteis almorzaron"]
},{
 ayudar:["помогать","помогаю помогаешь помогает помогаем помогаете помогают",["помог","помогли"]],
 cambiar:["менять","меняю меняешь меняет меняем меняете меняют",["поменял","поменяли"]],
 dejar:["оставлять","оставляю оставляешь оставляет оставляем оставляете оставляют",["оставил","оставили"]],
 terminar:["заканчивать","заканчиваю заканчиваешь заканчивает заканчиваем заканчиваете заканчивают",["закончил","закончили"]],
 usar:["использовать","использую используешь использует используем используете используют",["использовал","использовали"]],
 preguntar:["спрашивать","спрашиваю спрашиваешь спрашивает спрашиваем спрашиваете спрашивают",["спросил","спросили"]],
 olvidar:["забывать","забываю забываешь забывает забываем забываете забывают",["забыл","забыли"]],
 correr:["бегать","бегаю бегаешь бегает бегаем бегаете бегают",["побежал","побежали"]],
 recibir:["получать","получаю получаешь получает получаем получаете получают",["получил","получили"]],
 subir:["подниматься","поднимаюсь поднимаешься поднимается поднимаемся поднимаетесь поднимаются",["поднялся","поднялись"]],
 entender:["понимать","понимаю понимаешь понимает понимаем понимаете понимают",["понял","поняли"]],
 perder:["терять","теряю теряешь теряет теряем теряете теряют",["потерял","потеряли"]],
 contar:["рассказывать, считать","рассказываю рассказываешь рассказывает рассказываем рассказываете рассказывают",["рассказал","рассказали"]],
 recordar:["помнить","помню помнишь помнит помним помните помнят",["вспомнил","вспомнили"]],
 preferir:["предпочитать","предпочитаю предпочитаешь предпочитает предпочитаем предпочитаете предпочитают",["предпочёл","предпочли"]],
 servir:["служить, подавать","служу служишь служит служим служите служат",["послужил","послужили"]],
 repetir:["повторять","повторяю повторяешь повторяет повторяем повторяете повторяют",["повторил","повторили"]],
 morir:["умирать","умираю умираешь умирает умираем умираете умирают",["умер","умерли"]],
 conducir:["водить (машину)","вожу водишь водит водим водите водят",["вёл","вели"],"conducir: водить машину"],
 caer:["падать","падаю падаешь падает падаем падаете падают",["упал","упали"]],
 andar:["ходить пешком, гулять","хожу ходишь ходит ходим ходите ходят",["прошёлся","прошлись"],"andar: ходить пешком"],
 pagar:["платить","плачу платишь платит платим платите платят",["заплатил","заплатили"]],
 sacar:["доставать, вынимать","достаю достаёшь достаёт достаём достаёте достают",["достал","достали"]],
 tocar:["трогать, играть на инструменте","трогаю трогаешь трогает трогаем трогаете трогают",["потрогал","потрогали"]],
 almorzar:["обедать","обедаю обедаешь обедает обедаем обедаете обедают",["пообедал","пообедали"]]
});
// level 4: расширенные — the next ~200 most frequent verbs
addTier(4,["duchar","preocupar","enfadar","casar","afeitar","peinar","quejar","quedar", "crear", "considerar", "tratar", "presentar", "lograr", "entrar", "desarrollar", "resultar", "señalar", "formar", "acabar", "intentar", "contestar", "ganar", "gastar", "guardar", "enseñar", "estudiar", "limpiar", "cocinar", "preparar", "bailar", "nadar", "descansar", "visitar", "invitar", "llorar", "gritar", "regalar", "cuidar", "celebrar", "amar", "odiar", "arreglar", "mandar", "desear", "evitar", "pintar", "fumar", "firmar", "alquilar", "aceptar", "apoyar", "aumentar", "bajar", "cortar", "dibujar", "echar", "imaginar", "levantar", "luchar", "matar", "notar", "observar", "ocupar", "parar", "participar", "quitar", "robar", "saltar", "salvar", "separar", "tirar", "votar", "ahorrar", "lavar", "mejorar", "comprender", "responder", "prometer", "romper", "meter", "temer", "depender", "esconder", "sorprender", "cumplir", "permitir", "existir", "insistir", "compartir", "discutir", "partir", "añadir", "unir", "sufrir", "asistir", "admitir", "dividir", "describir", "descubrir", "cubrir", "resistir"],{
 "explicar":["explico explicas explica explicamos explicáis explican", "expliqué explicaste explicó explicamos explicasteis explicaron"],
 "practicar":["practico practicas practica practicamos practicáis practican", "practiqué practicaste practicó practicamos practicasteis practicaron"],
 "colocar":["coloco colocas coloca colocamos colocáis colocan", "coloqué colocaste colocó colocamos colocasteis colocaron"],
 "dedicar":["dedico dedicas dedica dedicamos dedicáis dedican", "dediqué dedicaste dedicó dedicamos dedicasteis dedicaron"],
 "indicar":["indico indicas indica indicamos indicáis indican", "indiqué indicaste indicó indicamos indicasteis indicaron"],
 "marcar":["marco marcas marca marcamos marcáis marcan", "marqué marcaste marcó marcamos marcasteis marcaron"],
 "aplicar":["aplico aplicas aplica aplicamos aplicáis aplican", "apliqué aplicaste aplicó aplicamos aplicasteis aplicaron"],
 "publicar":["publico publicas publica publicamos publicáis publican", "publiqué publicaste publicó publicamos publicasteis publicaron"],
 "comunicar":["comunico comunicas comunica comunicamos comunicáis comunican", "comuniqué comunicaste comunicó comunicamos comunicasteis comunicaron"],
 "entregar":["entrego entregas entrega entregamos entregáis entregan", "entregué entregaste entregó entregamos entregasteis entregaron"],
 "apagar":["apago apagas apaga apagamos apagáis apagan", "apagué apagaste apagó apagamos apagasteis apagaron"],
 "cruzar":["cruzo cruzas cruza cruzamos cruzáis cruzan", "crucé cruzaste cruzó cruzamos cruzasteis cruzaron"],
 "organizar":["organizo organizas organiza organizamos organizáis organizan", "organicé organizaste organizó organizamos organizasteis organizaron"],
 "utilizar":["utilizo utilizas utiliza utilizamos utilizáis utilizan", "utilicé utilizaste utilizó utilizamos utilizasteis utilizaron"],
 "alcanzar":["alcanzo alcanzas alcanza alcanzamos alcanzáis alcanzan", "alcancé alcanzaste alcanzó alcanzamos alcanzasteis alcanzaron"],
 "realizar":["realizo realizas realiza realizamos realizáis realizan", "realicé realizaste realizó realizamos realizasteis realizaron"],
 "lanzar":["lanzo lanzas lanza lanzamos lanzáis lanzan", "lancé lanzaste lanzó lanzamos lanzasteis lanzaron"],
 "abrazar":["abrazo abrazas abraza abrazamos abrazáis abrazan", "abracé abrazaste abrazó abrazamos abrazasteis abrazaron"],
 "avanzar":["avanzo avanzas avanza avanzamos avanzáis avanzan", "avancé avanzaste avanzó avanzamos avanzasteis avanzaron"],
 "coger":["cojo coges coge cogemos cogéis cogen", "cogí cogiste cogió cogimos cogisteis cogieron"],
 "escoger":["escojo escoges escoge escogemos escogéis escogen", "escogí escogiste escogió escogimos escogisteis escogieron"],
 "recoger":["recojo recoges recoge recogemos recogéis recogen", "recogí recogiste recogió recogimos recogisteis recogieron"],
 "proteger":["protejo proteges protege protegemos protegéis protegen", "protegí protegiste protegió protegimos protegisteis protegieron"],
 "dirigir":["dirijo diriges dirige dirigimos dirigís dirigen", "dirigí dirigiste dirigió dirigimos dirigisteis dirigieron"],
 "exigir":["exijo exiges exige exigimos exigís exigen", "exigí exigiste exigió exigimos exigisteis exigieron"],
 "elegir":["elijo eliges elige elegimos elegís eligen", "elegí elegiste eligió elegimos elegisteis eligieron"],
 "corregir":["corrijo corriges corrige corregimos corregís corrigen", "corregí corregiste corrigió corregimos corregisteis corrigieron"],
 "parecer":["parezco pareces parece parecemos parecéis parecen", "parecí pareciste pareció parecimos parecisteis parecieron"],
 "ofrecer":["ofrezco ofreces ofrece ofrecemos ofrecéis ofrecen", "ofrecí ofreciste ofreció ofrecimos ofrecisteis ofrecieron"],
 "aparecer":["aparezco apareces aparece aparecemos aparecéis aparecen", "aparecí apareciste apareció aparecimos aparecisteis aparecieron"],
 "reconocer":["reconozco reconoces reconoce reconocemos reconocéis reconocen", "reconocí reconociste reconoció reconocimos reconocisteis reconocieron"],
 "crecer":["crezco creces crece crecemos crecéis crecen", "crecí creciste creció crecimos crecisteis crecieron"],
 "establecer":["establezco estableces establece establecemos establecéis establecen", "establecí estableciste estableció establecimos establecisteis establecieron"],
 "merecer":["merezco mereces merece merecemos merecéis merecen", "merecí mereciste mereció merecimos merecisteis merecieron"],
 "agradecer":["agradezco agradeces agradece agradecemos agradecéis agradecen", "agradecí agradeciste agradeció agradecimos agradecisteis agradecieron"],
 "desaparecer":["desaparezco desapareces desaparece desaparecemos desaparecéis desaparecen", "desaparecí desapareciste desapareció desaparecimos desaparecisteis desaparecieron"],
 "pertenecer":["pertenezco perteneces pertenece pertenecemos pertenecéis pertenecen", "pertenecí perteneciste perteneció pertenecimos pertenecisteis pertenecieron"],
 "nacer":["nazco naces nace nacemos nacéis nacen", "nací naciste nació nacimos nacisteis nacieron"],
 "obedecer":["obedezco obedeces obedece obedecemos obedecéis obedecen", "obedecí obedeciste obedeció obedecimos obedecisteis obedecieron"],
 "traducir":["traduzco traduces traduce traducimos traducís traducen", "traduje tradujiste tradujo tradujimos tradujisteis tradujeron"],
 "producir":["produzco produces produce producimos producís producen", "produje produjiste produjo produjimos produjisteis produjeron"],
 "reducir":["reduzco reduces reduce reducimos reducís reducen", "reduje redujiste redujo redujimos redujisteis redujeron"],
 "introducir":["introduzco introduces introduce introducimos introducís introducen", "introduje introdujiste introdujo introdujimos introdujisteis introdujeron"],
 "construir":["construyo construyes construye construimos construís construyen", "construí construiste construyó construimos construisteis construyeron"],
 "destruir":["destruyo destruyes destruye destruimos destruís destruyen", "destruí destruiste destruyó destruimos destruisteis destruyeron"],
 "incluir":["incluyo incluyes incluye incluimos incluís incluyen", "incluí incluiste incluyó incluimos incluisteis incluyeron"],
 "contribuir":["contribuyo contribuyes contribuye contribuimos contribuís contribuyen", "contribuí contribuiste contribuyó contribuimos contribuisteis contribuyeron"],
 "distribuir":["distribuyo distribuyes distribuye distribuimos distribuís distribuyen", "distribuí distribuiste distribuyó distribuimos distribuisteis distribuyeron"],
 "concluir":["concluyo concluyes concluye concluimos concluís concluyen", "concluí concluiste concluyó concluimos concluisteis concluyeron"],
 "sustituir":["sustituyo sustituyes sustituye sustituimos sustituís sustituyen", "sustituí sustituiste sustituyó sustituimos sustituisteis sustituyeron"],
 "cerrar":["cierro cierras cierra cerramos cerráis cierran", "cerré cerraste cerró cerramos cerrasteis cerraron"],
 "despertar":["despierto despiertas despierta despertamos despertáis despiertan", "desperté despertaste despertó despertamos despertasteis despertaron"],
 "recomendar":["recomiendo recomiendas recomienda recomendamos recomendáis recomiendan", "recomendé recomendaste recomendó recomendamos recomendasteis recomendaron"],
 "negar":["niego niegas niega negamos negáis niegan", "negué negaste negó negamos negasteis negaron"],
 "comenzar":["comienzo comienzas comienza comenzamos comenzáis comienzan", "comencé comenzaste comenzó comenzamos comenzasteis comenzaron"],
 "encender":["enciendo enciendes enciende encendemos encendéis encienden", "encendí encendiste encendió encendimos encendisteis encendieron"],
 "defender":["defiendo defiendes defiende defendemos defendéis defienden", "defendí defendiste defendió defendimos defendisteis defendieron"],
 "extender":["extiendo extiendes extiende extendemos extendéis extienden", "extendí extendiste extendió extendimos extendisteis extendieron"],
 "atender":["atiendo atiendes atiende atendemos atendéis atienden", "atendí atendiste atendió atendimos atendisteis atendieron"],
 "costar":["cuesto cuestas cuesta costamos costáis cuestan", "costé costaste costó costamos costasteis costaron"],
 "mostrar":["muestro muestras muestra mostramos mostráis muestran", "mostré mostraste mostró mostramos mostrasteis mostraron"],
 "probar":["pruebo pruebas prueba probamos probáis prueban", "probé probaste probó probamos probasteis probaron"],
 "soñar":["sueño sueñas sueña soñamos soñáis sueñan", "soñé soñaste soñó soñamos soñasteis soñaron"],
 "sonar":["sueno suenas suena sonamos sonáis suenan", "soné sonaste sonó sonamos sonasteis sonaron"],
 "aprobar":["apruebo apruebas aprueba aprobamos aprobáis aprueban", "aprobé aprobaste aprobó aprobamos aprobasteis aprobaron"],
 "demostrar":["demuestro demuestras demuestra demostramos demostráis demuestran", "demostré demostraste demostró demostramos demostrasteis demostraron"],
 "volar":["vuelo vuelas vuela volamos voláis vuelan", "volé volaste voló volamos volasteis volaron"],
 "colgar":["cuelgo cuelgas cuelga colgamos colgáis cuelgan", "colgué colgaste colgó colgamos colgasteis colgaron"],
 "mover":["muevo mueves mueve movemos movéis mueven", "moví moviste movió movimos movisteis movieron"],
 "devolver":["devuelvo devuelves devuelve devolvemos devolvéis devuelven", "devolví devolviste devolvió devolvimos devolvisteis devolvieron"],
 "resolver":["resuelvo resuelves resuelve resolvemos resolvéis resuelven", "resolví resolviste resolvió resolvimos resolvisteis resolvieron"],
 "envolver":["envuelvo envuelves envuelve envolvemos envolvéis envuelven", "envolví envolviste envolvió envolvimos envolvisteis envolvieron"],
 "morder":["muerdo muerdes muerde mordemos mordéis muerden", "mordí mordiste mordió mordimos mordisteis mordieron"],
 "mentir":["miento mientes miente mentimos mentís mienten", "mentí mentiste mintió mentimos mentisteis mintieron"],
 "sugerir":["sugiero sugieres sugiere sugerimos sugerís sugieren", "sugerí sugeriste sugirió sugerimos sugeristeis sugirieron"],
 "convertir":["convierto conviertes convierte convertimos convertís convierten", "convertí convertiste convirtió convertimos convertisteis convirtieron"],
 "advertir":["advierto adviertes advierte advertimos advertís advierten", "advertí advertiste advirtió advertimos advertisteis advirtieron"],
 "vestir":["visto vistes viste vestimos vestís visten", "vestí vestiste vistió vestimos vestisteis vistieron"],
 "medir":["mido mides mide medimos medís miden", "medí mediste midió medimos medisteis midieron"],
 "despedir":["despido despides despide despedimos despedís despiden", "despedí despediste despidió despedimos despedisteis despidieron"],
 "impedir":["impido impides impide impedimos impedís impiden", "impedí impediste impidió impedimos impedisteis impidieron"],
 "competir":["compito compites compite competimos competís compiten", "competí competiste compitió competimos competisteis compitieron"],
 "conseguir":["consigo consigues consigue conseguimos conseguís consiguen", "conseguí conseguiste consiguió conseguimos conseguisteis consiguieron"],
 "enviar":["envío envías envía enviamos enviáis envían", "envié enviaste envió enviamos enviasteis enviaron"],
 "continuar":["continúo continúas continúa continuamos continuáis continúan", "continué continuaste continuó continuamos continuasteis continuaron"],
 "prohibir":["prohíbo prohíbes prohíbe prohibimos prohibís prohíben", "prohibí prohibiste prohibió prohibimos prohibisteis prohibieron"],
 "mantener":["mantengo mantienes mantiene mantenemos mantenéis mantienen", "mantuve mantuviste mantuvo mantuvimos mantuvisteis mantuvieron"],
 "obtener":["obtengo obtienes obtiene obtenemos obtenéis obtienen", "obtuve obtuviste obtuvo obtuvimos obtuvisteis obtuvieron"],
 "contener":["contengo contienes contiene contenemos contenéis contienen", "contuve contuviste contuvo contuvimos contuvisteis contuvieron"],
 "sostener":["sostengo sostienes sostiene sostenemos sostenéis sostienen", "sostuve sostuviste sostuvo sostuvimos sostuvisteis sostuvieron"],
 "detener":["detengo detienes detiene detenemos detenéis detienen", "detuve detuviste detuvo detuvimos detuvisteis detuvieron"],
 "suponer":["supongo supones supone suponemos suponéis suponen", "supuse supusiste supuso supusimos supusisteis supusieron"],
 "proponer":["propongo propones propone proponemos proponéis proponen", "propuse propusiste propuso propusimos propusisteis propusieron"],
 "componer":["compongo compones compone componemos componéis componen", "compuse compusiste compuso compusimos compusisteis compusieron"],
 "disponer":["dispongo dispones dispone disponemos disponéis disponen", "dispuse dispusiste dispuso dispusimos dispusisteis dispusieron"],
 "prevenir":["prevengo previenes previene prevenimos prevenís previenen", "previne previniste previno previnimos previnisteis previnieron"],
 "convenir":["convengo convienes conviene convenimos convenís convienen", "convine conviniste convino convinimos convinisteis convinieron"],
 "deshacer":["deshago deshaces deshace deshacemos deshacéis deshacen", "deshice deshiciste deshizo deshicimos deshicisteis deshicieron"],
 "atraer":["atraigo atraes atrae atraemos atraéis atraen", "atraje atrajiste atrajo atrajimos atrajisteis atrajeron"],
 "distraer":["distraigo distraes distrae distraemos distraéis distraen", "distraje distrajiste distrajo distrajimos distrajisteis distrajeron"],
 "valer":["valgo vales vale valemos valéis valen", "valí valiste valió valimos valisteis valieron"],
 "caber":["quepo cabes cabe cabemos cabéis caben", "cupe cupiste cupo cupimos cupisteis cupieron"],
 "poseer":["poseo posees posee poseemos poseéis poseen", "poseí poseíste poseyó poseímos poseísteis poseyeron"],
 "sentar":["siento sientas sienta sentamos sentáis sientan", "senté sentaste sentó sentamos sentasteis sentaron"],
 "acostar":["acuesto acuestas acuesta acostamos acostáis acuestan", "acosté acostaste acostó acostamos acostasteis acostaron"],
 "divertir":["divierto diviertes divierte divertimos divertís divierten", "divertí divertiste divirtió divertimos divertisteis divirtieron"],
 "acordar":["acuerdo acuerdas acuerda acordamos acordáis acuerdan", "acordé acordaste acordó acordamos acordasteis acordaron"],
 "equivocar":["equivoco equivocas equivoca equivocamos equivocáis equivocan", "equivoqué equivocaste equivocó equivocamos equivocasteis equivocaron"]
},{
 "quedar":["оставаться", "остаюсь остаёшься остаётся остаёмся остаётесь остаются", ["остался", "остались"]],
 "crear":["создавать", "создаю создаёшь создаёт создаём создаёте создают", ["создал", "создали"]],
 "considerar":["считать (полагать)", "считаю считаешь считает считаем считаете считают", ["посчитал", "посчитали"], "considerar: полагать"],
 "tratar":["обращаться (с кем-то)", "обращаюсь обращаешься обращается обращаемся обращаетесь обращаются", ["обошёлся", "обошлись"]],
 "presentar":["представлять", "представляю представляешь представляет представляем представляете представляют", ["представил", "представили"]],
 "lograr":["добиваться", "добиваюсь добиваешься добивается добиваемся добиваетесь добиваются", ["добился", "добились"]],
 "entrar":["входить", "вхожу входишь входит входим входите входят", ["вошёл", "вошли"]],
 "desarrollar":["развивать", "развиваю развиваешь развивает развиваем развиваете развивают", ["развил", "развили"]],
 "resultar":["оказываться", "оказываюсь оказываешься оказывается оказываемся оказываетесь оказываются", ["оказался", "оказались"]],
 "señalar":["указывать (пальцем)", "указываю указываешь указывает указываем указываете указывают", ["указал", "указали"]],
 "formar":["образовывать", "образую образуешь образует образуем образуете образуют", ["образовал", "образовали"]],
 "acabar":["кончать", "кончаю кончаешь кончает кончаем кончаете кончают", ["кончил", "кончили"]],
 "intentar":["пытаться", "пытаюсь пытаешься пытается пытаемся пытаетесь пытаются", ["попытался", "попытались"]],
 "contestar":["отвечать", "отвечаю отвечаешь отвечает отвечаем отвечаете отвечают", ["ответил", "ответили"]],
 "ganar":["зарабатывать, выигрывать", "зарабатываю зарабатываешь зарабатывает зарабатываем зарабатываете зарабатывают", ["заработал", "заработали"]],
 "gastar":["тратить", "трачу тратишь тратит тратим тратите тратят", ["потратил", "потратили"]],
 "guardar":["хранить", "храню хранишь хранит храним храните хранят", ["сохранил", "сохранили"]],
 "enseñar":["преподавать, учить (кого-то)", "преподаю преподаёшь преподаёт преподаём преподаёте преподают", ["научил", "научили"]],
 "estudiar":["учиться, изучать", "учусь учишься учится учимся учитесь учатся", ["изучил", "изучили"]],
 "limpiar":["убирать, чистить", "убираю убираешь убирает убираем убираете убирают", ["убрал", "убрали"]],
 "cocinar":["готовить (еду)", "готовлю готовишь готовит готовим готовите готовят", ["приготовил", "приготовили"]],
 "preparar":["подготавливать", "подготавливаю подготавливаешь подготавливает подготавливаем подготавливаете подготавливают", ["подготовил", "подготовили"]],
 "bailar":["танцевать", "танцую танцуешь танцует танцуем танцуете танцуют", ["потанцевал", "потанцевали"]],
 "nadar":["плавать", "плаваю плаваешь плавает плаваем плаваете плавают", ["поплавал", "поплавали"]],
 "descansar":["отдыхать", "отдыхаю отдыхаешь отдыхает отдыхаем отдыхаете отдыхают", ["отдохнул", "отдохнули"]],
 "visitar":["навещать, посещать", "навещаю навещаешь навещает навещаем навещаете навещают", ["навестил", "навестили"]],
 "invitar":["приглашать", "приглашаю приглашаешь приглашает приглашаем приглашаете приглашают", ["пригласил", "пригласили"]],
 "llorar":["плакать", "плачу плачешь плачет плачем плачете плачут", ["поплакал", "поплакали"], "llorar: плакать"],
 "gritar":["кричать", "кричу кричишь кричит кричим кричите кричат", ["крикнул", "крикнули"]],
 "regalar":["дарить", "дарю даришь дарит дарим дарите дарят", ["подарил", "подарили"]],
 "cuidar":["заботиться, ухаживать", "забочусь заботишься заботится заботимся заботитесь заботятся", ["позаботился", "позаботились"]],
 "celebrar":["праздновать", "праздную празднуешь празднует празднуем празднуете празднуют", ["отпраздновал", "отпраздновали"]],
 "amar":["любить", "люблю любишь любит любим любите любят", ["полюбил", "полюбили"]],
 "odiar":["ненавидеть", "ненавижу ненавидишь ненавидит ненавидим ненавидите ненавидят", ["возненавидел", "возненавидели"]],
 "arreglar":["чинить", "чиню чинишь чинит чиним чините чинят", ["починил", "починили"]],
 "mandar":["отправлять, приказывать", "отправляю отправляешь отправляет отправляем отправляете отправляют", ["отправил", "отправили"]],
 "desear":["желать", "желаю желаешь желает желаем желаете желают", ["пожелал", "пожелали"]],
 "evitar":["избегать", "избегаю избегаешь избегает избегаем избегаете избегают", ["избежал", "избежали"]],
 "pintar":["рисовать (красками), красить", "рисую рисуешь рисует рисуем рисуете рисуют", ["нарисовал", "нарисовали"]],
 "fumar":["курить", "курю куришь курит курим курите курят", ["покурил", "покурили"]],
 "firmar":["подписывать", "подписываю подписываешь подписывает подписываем подписываете подписывают", ["подписал", "подписали"]],
 "alquilar":["снимать (жильё), арендовать", "снимаю снимаешь снимает снимаем снимаете снимают", ["снял", "сняли"]],
 "aceptar":["принимать, соглашаться", "принимаю принимаешь принимает принимаем принимаете принимают", ["принял", "приняли"]],
 "apoyar":["поддерживать", "поддерживаю поддерживаешь поддерживает поддерживаем поддерживаете поддерживают", ["поддержал", "поддержали"]],
 "aumentar":["увеличивать", "увеличиваю увеличиваешь увеличивает увеличиваем увеличиваете увеличивают", ["увеличил", "увеличили"]],
 "bajar":["спускаться", "спускаюсь спускаешься спускается спускаемся спускаетесь спускаются", ["спустился", "спустились"]],
 "cortar":["резать", "режу режешь режет режем режете режут", ["отрезал", "отрезали"]],
 "dibujar":["рисовать (карандашом)", "рисую рисуешь рисует рисуем рисуете рисуют", ["нарисовал", "нарисовали"]],
 "echar":["бросать, выбрасывать", "бросаю бросаешь бросает бросаем бросаете бросают", ["бросил", "бросили"]],
 "imaginar":["воображать", "воображаю воображаешь воображает воображаем воображаете воображают", ["вообразил", "вообразили"]],
 "levantar":["поднимать", "поднимаю поднимаешь поднимает поднимаем поднимаете поднимают", ["поднял", "подняли"]],
 "luchar":["бороться", "борюсь борешься борется боремся боретесь борются", ["поборолся", "поборолись"]],
 "matar":["убивать", "убиваю убиваешь убивает убиваем убиваете убивают", ["убил", "убили"]],
 "notar":["замечать", "замечаю замечаешь замечает замечаем замечаете замечают", ["заметил", "заметили"]],
 "observar":["наблюдать", "наблюдаю наблюдаешь наблюдает наблюдаем наблюдаете наблюдают", ["понаблюдал", "понаблюдали"]],
 "ocupar":["занимать", "занимаю занимаешь занимает занимаем занимаете занимают", ["занял", "заняли"]],
 "parar":["останавливаться", "останавливаюсь останавливаешься останавливается останавливаемся останавливаетесь останавливаются", ["остановился", "остановились"]],
 "participar":["участвовать", "участвую участвуешь участвует участвуем участвуете участвуют", ["поучаствовал", "поучаствовали"]],
 "quitar":["забирать, убирать", "забираю забираешь забирает забираем забираете забирают", ["забрал", "забрали"]],
 "robar":["красть", "краду крадёшь крадёт крадём крадёте крадут", ["украл", "украли"]],
 "saltar":["прыгать", "прыгаю прыгаешь прыгает прыгаем прыгаете прыгают", ["прыгнул", "прыгнули"]],
 "salvar":["спасать", "спасаю спасаешь спасает спасаем спасаете спасают", ["спас", "спасли"]],
 "separar":["разделять", "разделяю разделяешь разделяет разделяем разделяете разделяют", ["разделил", "разделили"]],
 "tirar":["кидать", "кидаю кидаешь кидает кидаем кидаете кидают", ["кинул", "кинули"]],
 "votar":["голосовать", "голосую голосуешь голосует голосуем голосуете голосуют", ["проголосовал", "проголосовали"]],
 "ahorrar":["экономить", "экономлю экономишь экономит экономим экономите экономят", ["сэкономил", "сэкономили"]],
 "lavar":["мыть, стирать", "мою моешь моет моем моете моют", ["помыл", "помыли"]],
 "mejorar":["улучшать", "улучшаю улучшаешь улучшает улучшаем улучшаете улучшают", ["улучшил", "улучшили"]],
 "comprender":["понимать", "понимаю понимаешь понимает понимаем понимаете понимают", ["понял", "поняли"]],
 "responder":["отвечать", "отвечаю отвечаешь отвечает отвечаем отвечаете отвечают", ["ответил", "ответили"]],
 "prometer":["обещать", "обещаю обещаешь обещает обещаем обещаете обещают", ["пообещал", "пообещали"]],
 "romper":["ломать, разбивать", "ломаю ломаешь ломает ломаем ломаете ломают", ["сломал", "сломали"]],
 "meter":["засовывать, класть внутрь", "засовываю засовываешь засовывает засовываем засовываете засовывают", ["засунул", "засунули"]],
 "temer":["бояться", "боюсь боишься боится боимся боитесь боятся", ["испугался", "испугались"]],
 "depender":["зависеть", "завишу зависишь зависит зависим зависите зависят", ["зависел", "зависели"]],
 "esconder":["прятать", "прячу прячешь прячет прячем прячете прячут", ["спрятал", "спрятали"]],
 "sorprender":["удивлять", "удивляю удивляешь удивляет удивляем удивляете удивляют", ["удивил", "удивили"]],
 "cumplir":["выполнять", "выполняю выполняешь выполняет выполняем выполняете выполняют", ["выполнил", "выполнили"]],
 "permitir":["разрешать", "разрешаю разрешаешь разрешает разрешаем разрешаете разрешают", ["разрешил", "разрешили"]],
 "existir":["существовать", "существую существуешь существует существуем существуете существуют", ["просуществовал", "просуществовали"]],
 "insistir":["настаивать", "настаиваю настаиваешь настаивает настаиваем настаиваете настаивают", ["настоял", "настояли"]],
 "compartir":["делиться", "делюсь делишься делится делимся делитесь делятся", ["поделился", "поделились"]],
 "discutir":["спорить, обсуждать", "спорю споришь спорит спорим спорите спорят", ["поспорил", "поспорили"]],
 "partir":["отправляться", "отправляюсь отправляешься отправляется отправляемся отправляетесь отправляются", ["отправился", "отправились"]],
 "añadir":["добавлять", "добавляю добавляешь добавляет добавляем добавляете добавляют", ["добавил", "добавили"]],
 "unir":["соединять", "соединяю соединяешь соединяет соединяем соединяете соединяют", ["соединил", "соединили"]],
 "sufrir":["страдать", "страдаю страдаешь страдает страдаем страдаете страдают", ["пострадал", "пострадали"]],
 "asistir":["присутствовать", "присутствую присутствуешь присутствует присутствуем присутствуете присутствуют", ["присутствовал", "присутствовали"]],
 "admitir":["признавать, допускать", "признаю признаёшь признаёт признаём признаёте признают", ["признал", "признали"]],
 "dividir":["делить", "делю делишь делит делим делите делят", ["разделил", "разделили"]],
 "describir":["описывать", "описываю описываешь описывает описываем описываете описывают", ["описал", "описали"]],
 "descubrir":["обнаруживать, открывать", "обнаруживаю обнаруживаешь обнаруживает обнаруживаем обнаруживаете обнаруживают", ["обнаружил", "обнаружили"]],
 "cubrir":["покрывать", "покрываю покрываешь покрывает покрываем покрываете покрывают", ["покрыл", "покрыли"]],
 "resistir":["выдерживать", "выдерживаю выдерживаешь выдерживает выдерживаем выдерживаете выдерживают", ["выдержал", "выдержали"]],
 "explicar":["объяснять", "объясняю объясняешь объясняет объясняем объясняете объясняют", ["объяснил", "объяснили"]],
 "practicar":["заниматься (спортом), практиковать", "практикую практикуешь практикует практикуем практикуете практикуют", ["попрактиковал", "попрактиковали"]],
 "colocar":["размещать", "размещаю размещаешь размещает размещаем размещаете размещают", ["разместил", "разместили"]],
 "dedicar":["посвящать", "посвящаю посвящаешь посвящает посвящаем посвящаете посвящают", ["посвятил", "посвятили"]],
 "indicar":["указывать", "указываю указываешь указывает указываем указываете указывают", ["указал", "указали"]],
 "marcar":["отмечать", "отмечаю отмечаешь отмечает отмечаем отмечаете отмечают", ["отметил", "отметили"]],
 "aplicar":["применять", "применяю применяешь применяет применяем применяете применяют", ["применил", "применили"]],
 "publicar":["публиковать", "публикую публикуешь публикует публикуем публикуете публикуют", ["опубликовал", "опубликовали"]],
 "comunicar":["сообщать", "сообщаю сообщаешь сообщает сообщаем сообщаете сообщают", ["сообщил", "сообщили"]],
 "entregar":["вручать, сдавать", "вручаю вручаешь вручает вручаем вручаете вручают", ["вручил", "вручили"]],
 "apagar":["выключать, гасить", "выключаю выключаешь выключает выключаем выключаете выключают", ["выключил", "выключили"]],
 "cruzar":["переходить, пересекать", "перехожу переходишь переходит переходим переходите переходят", ["перешёл", "перешли"]],
 "organizar":["организовывать", "организую организуешь организует организуем организуете организуют", ["организовал", "организовали"]],
 "utilizar":["использовать", "использую используешь использует используем используете используют", ["использовал", "использовали"]],
 "alcanzar":["догонять, достигать", "догоняю догоняешь догоняет догоняем догоняете догоняют", ["догнал", "догнали"]],
 "realizar":["осуществлять", "осуществляю осуществляешь осуществляет осуществляем осуществляете осуществляют", ["осуществил", "осуществили"]],
 "lanzar":["запускать, бросать", "запускаю запускаешь запускает запускаем запускаете запускают", ["запустил", "запустили"]],
 "abrazar":["обнимать", "обнимаю обнимаешь обнимает обнимаем обнимаете обнимают", ["обнял", "обняли"]],
 "avanzar":["продвигаться", "продвигаюсь продвигаешься продвигается продвигаемся продвигаетесь продвигаются", ["продвинулся", "продвинулись"]],
 "coger":["хватать, брать", "хватаю хватаешь хватает хватаем хватаете хватают", ["схватил", "схватили"]],
 "escoger":["выбирать", "выбираю выбираешь выбирает выбираем выбираете выбирают", ["выбрал", "выбрали"]],
 "recoger":["собирать, забирать", "собираю собираешь собирает собираем собираете собирают", ["собрал", "собрали"]],
 "proteger":["защищать", "защищаю защищаешь защищает защищаем защищаете защищают", ["защитил", "защитили"]],
 "dirigir":["руководить, направлять", "руковожу руководишь руководит руководим руководите руководят", ["руководил", "руководили"]],
 "exigir":["требовать", "требую требуешь требует требуем требуете требуют", ["потребовал", "потребовали"]],
 "elegir":["выбирать", "выбираю выбираешь выбирает выбираем выбираете выбирают", ["выбрал", "выбрали"]],
 "corregir":["исправлять", "исправляю исправляешь исправляет исправляем исправляете исправляют", ["исправил", "исправили"]],
 "parecer":["казаться", "кажусь кажешься кажется кажемся кажетесь кажутся", ["показался", "показались"]],
 "ofrecer":["предлагать", "предлагаю предлагаешь предлагает предлагаем предлагаете предлагают", ["предложил", "предложили"]],
 "aparecer":["появляться", "появляюсь появляешься появляется появляемся появляетесь появляются", ["появился", "появились"]],
 "reconocer":["узнавать, признавать", "узнаю узнаёшь узнаёт узнаём узнаёте узнают", ["узнал", "узнали"]],
 "crecer":["расти", "расту растёшь растёт растём растёте растут", ["вырос", "выросли"]],
 "establecer":["устанавливать", "устанавливаю устанавливаешь устанавливает устанавливаем устанавливаете устанавливают", ["установил", "установили"]],
 "merecer":["заслуживать", "заслуживаю заслуживаешь заслуживает заслуживаем заслуживаете заслуживают", ["заслужил", "заслужили"]],
 "agradecer":["благодарить", "благодарю благодаришь благодарит благодарим благодарите благодарят", ["поблагодарил", "поблагодарили"]],
 "desaparecer":["исчезать", "исчезаю исчезаешь исчезает исчезаем исчезаете исчезают", ["исчез", "исчезли"]],
 "pertenecer":["принадлежать", "принадлежу принадлежишь принадлежит принадлежим принадлежите принадлежат", ["принадлежал", "принадлежали"]],
 "nacer":["рождаться", "рождаюсь рождаешься рождается рождаемся рождаетесь рождаются", ["родился", "родились"]],
 "obedecer":["слушаться", "слушаюсь слушаешься слушается слушаемся слушаетесь слушаются", ["послушался", "послушались"]],
 "traducir":["переводить", "перевожу переводишь переводит переводим переводите переводят", ["перевёл", "перевели"]],
 "producir":["производить", "произвожу производишь производит производим производите производят", ["произвёл", "произвели"]],
 "reducir":["сокращать", "сокращаю сокращаешь сокращает сокращаем сокращаете сокращают", ["сократил", "сократили"]],
 "introducir":["вводить", "ввожу вводишь вводит вводим вводите вводят", ["ввёл", "ввели"]],
 "construir":["строить", "строю строишь строит строим строите строят", ["построил", "построили"]],
 "destruir":["разрушать", "разрушаю разрушаешь разрушает разрушаем разрушаете разрушают", ["разрушил", "разрушили"]],
 "incluir":["включать (в состав)", "включаю включаешь включает включаем включаете включают", ["включил", "включили"]],
 "contribuir":["способствовать", "способствую способствуешь способствует способствуем способствуете способствуют", ["поспособствовал", "поспособствовали"]],
 "distribuir":["распределять", "распределяю распределяешь распределяет распределяем распределяете распределяют", ["распределил", "распределили"]],
 "concluir":["завершать", "завершаю завершаешь завершает завершаем завершаете завершают", ["завершил", "завершили"]],
 "sustituir":["заменять", "заменяю заменяешь заменяет заменяем заменяете заменяют", ["заменил", "заменили"]],
 "cerrar":["закрывать", "закрываю закрываешь закрывает закрываем закрываете закрывают", ["закрыл", "закрыли"]],
 "despertar":["будить", "бужу будишь будит будим будите будят", ["разбудил", "разбудили"]],
 "recomendar":["советовать, рекомендовать", "советую советуешь советует советуем советуете советуют", ["посоветовал", "посоветовали"]],
 "negar":["отрицать", "отрицаю отрицаешь отрицает отрицаем отрицаете отрицают", ["отрицал", "отрицали"]],
 "comenzar":["начинать", "начинаю начинаешь начинает начинаем начинаете начинают", ["начал", "начали"]],
 "encender":["зажигать, включать", "зажигаю зажигаешь зажигает зажигаем зажигаете зажигают", ["зажёг", "зажгли"]],
 "defender":["защищать", "защищаю защищаешь защищает защищаем защищаете защищают", ["защитил", "защитили"]],
 "extender":["расширять, растягивать", "расширяю расширяешь расширяет расширяем расширяете расширяют", ["расширил", "расширили"]],
 "atender":["обслуживать", "обслуживаю обслуживаешь обслуживает обслуживаем обслуживаете обслуживают", ["обслужил", "обслужили"]],
 "costar":["стоить", "стою стоишь стоит стоим стоите стоят", ["стоил", "стоили"]],
 "mostrar":["показывать", "показываю показываешь показывает показываем показываете показывают", ["показал", "показали"]],
 "probar":["пробовать", "пробую пробуешь пробует пробуем пробуете пробуют", ["попробовал", "попробовали"]],
 "soñar":["мечтать, видеть сны", "мечтаю мечтаешь мечтает мечтаем мечтаете мечтают", ["помечтал", "помечтали"]],
 "sonar":["звучать, звенеть", "звучу звучишь звучит звучим звучите звучат", ["прозвучал", "прозвучали"]],
 "aprobar":["одобрять, сдавать (экзамен)", "одобряю одобряешь одобряет одобряем одобряете одобряют", ["одобрил", "одобрили"]],
 "demostrar":["доказывать", "доказываю доказываешь доказывает доказываем доказываете доказывают", ["доказал", "доказали"]],
 "volar":["летать", "летаю летаешь летает летаем летаете летают", ["полетел", "полетели"]],
 "colgar":["вешать", "вешаю вешаешь вешает вешаем вешаете вешают", ["повесил", "повесили"]],
 "mover":["двигать", "двигаю двигаешь двигает двигаем двигаете двигают", ["подвинул", "подвинули"]],
 "devolver":["возвращать (вещь)", "возвращаю возвращаешь возвращает возвращаем возвращаете возвращают", ["вернул", "вернули"]],
 "resolver":["решать (проблему)", "решаю решаешь решает решаем решаете решают", ["решил", "решили"]],
 "envolver":["заворачивать", "заворачиваю заворачиваешь заворачивает заворачиваем заворачиваете заворачивают", ["завернул", "завернули"]],
 "morder":["кусать", "кусаю кусаешь кусает кусаем кусаете кусают", ["укусил", "укусили"]],
 "mentir":["врать", "вру врёшь врёт врём врёте врут", ["соврал", "соврали"]],
 "sugerir":["подсказывать, предлагать (идею)", "подсказываю подсказываешь подсказывает подсказываем подсказываете подсказывают", ["подсказал", "подсказали"]],
 "convertir":["превращать", "превращаю превращаешь превращает превращаем превращаете превращают", ["превратил", "превратили"]],
 "advertir":["предупреждать", "предупреждаю предупреждаешь предупреждает предупреждаем предупреждаете предупреждают", ["предупредил", "предупредили"]],
 "vestir":["одевать", "одеваю одеваешь одевает одеваем одеваете одевают", ["одел", "одели"]],
 "medir":["измерять", "измеряю измеряешь измеряет измеряем измеряете измеряют", ["измерил", "измерили"]],
 "despedir":["провожать, увольнять", "провожаю провожаешь провожает провожаем провожаете провожают", ["проводил", "проводили"]],
 "impedir":["мешать, препятствовать", "мешаю мешаешь мешает мешаем мешаете мешают", ["помешал", "помешали"]],
 "competir":["соревноваться", "соревнуюсь соревнуешься соревнуется соревнуемся соревнуетесь соревнуются", ["посоревновался", "посоревновались"]],
 "conseguir":["добиваться, доставать", "добиваюсь добиваешься добивается добиваемся добиваетесь добиваются", ["добился", "добились"]],
 "enviar":["отправлять", "отправляю отправляешь отправляет отправляем отправляете отправляют", ["отправил", "отправили"]],
 "continuar":["продолжать", "продолжаю продолжаешь продолжает продолжаем продолжаете продолжают", ["продолжил", "продолжили"]],
 "prohibir":["запрещать", "запрещаю запрещаешь запрещает запрещаем запрещаете запрещают", ["запретил", "запретили"]],
 "mantener":["сохранять, поддерживать", "сохраняю сохраняешь сохраняет сохраняем сохраняете сохраняют", ["сохранил", "сохранили"]],
 "obtener":["получать", "получаю получаешь получает получаем получаете получают", ["получил", "получили"]],
 "contener":["содержать", "содержу содержишь содержит содержим содержите содержат", ["содержал", "содержали"]],
 "sostener":["держать", "держу держишь держит держим держите держат", ["подержал", "подержали"]],
 "detener":["задерживать", "задерживаю задерживаешь задерживает задерживаем задерживаете задерживают", ["задержал", "задержали"]],
 "suponer":["предполагать", "предполагаю предполагаешь предполагает предполагаем предполагаете предполагают", ["предположил", "предположили"]],
 "proponer":["предлагать", "предлагаю предлагаешь предлагает предлагаем предлагаете предлагают", ["предложил", "предложили"]],
 "componer":["сочинять, составлять", "сочиняю сочиняешь сочиняет сочиняем сочиняете сочиняют", ["сочинил", "сочинили"]],
 "disponer":["располагать", "располагаю располагаешь располагает располагаем располагаете располагают", ["расположил", "расположили"]],
 "prevenir":["предотвращать", "предотвращаю предотвращаешь предотвращает предотвращаем предотвращаете предотвращают", ["предотвратил", "предотвратили"]],
 "convenir":["подходить, быть выгодным", "подхожу подходишь подходит подходим подходите подходят", ["подошёл", "подошли"]],
 "deshacer":["распаковывать, разбирать", "распаковываю распаковываешь распаковывает распаковываем распаковываете распаковывают", ["распаковал", "распаковали"]],
 "atraer":["привлекать", "привлекаю привлекаешь привлекает привлекаем привлекаете привлекают", ["привлёк", "привлекли"]],
 "distraer":["отвлекать", "отвлекаю отвлекаешь отвлекает отвлекаем отвлекаете отвлекают", ["отвлёк", "отвлекли"]],
 "valer":["стоить, иметь ценность", "стою стоишь стоит стоим стоите стоят", ["стоил", "стоили"]],
 "caber":["помещаться", "помещаюсь помещаешься помещается помещаемся помещаетесь помещаются", ["поместился", "поместились"]],
 "poseer":["обладать", "обладаю обладаешь обладает обладаем обладаете обладают", ["обладал", "обладали"]],
 "duchar":["мыть под душем", "мою моешь моет моем моете моют", ["помыл", "помыли"], "ducharse — принимать душ"],
 "preocupar":["беспокоить", "беспокою беспокоишь беспокоит беспокоим беспокоите беспокоят", ["обеспокоил", "обеспокоили"]],
 "enfadar":["сердить", "сержу сердишь сердит сердим сердите сердят", ["рассердил", "рассердили"]],
 "casar":["женить, венчать", "венчаю венчаешь венчает венчаем венчаете венчают", ["обвенчал", "обвенчали"]],
 "afeitar":["брить", "брею бреешь бреет бреем бреете бреют", ["побрил", "побрили"]],
 "peinar":["причёсывать", "причёсываю причёсываешь причёсывает причёсываем причёсываете причёсывают", ["причесал", "причесали"]],
 "quejar":["жаловаться", "жалуюсь жалуешься жалуется жалуемся жалуетесь жалуются", ["пожаловался", "пожаловались"], "quejar(se) — жаловаться"],
 "sentar":["сажать", "сажаю сажаешь сажает сажаем сажаете сажают", ["посадил", "посадили"]],
 "acostar":["укладывать (спать)", "укладываю укладываешь укладывает укладываем укладываете укладывают", ["уложил", "уложили"]],
 "divertir":["развлекать", "развлекаю развлекаешь развлекает развлекаем развлекаете развлекают", ["развлёк", "развлекли"]],
 "acordar":["договариваться", "договариваюсь договариваешься договаривается договариваемся договариваетесь договариваются", ["договорился", "договорились"]],
 "equivocar":["путать, вводить в заблуждение", "путаю путаешь путает путаем путаете путают", ["перепутал", "перепутали"]]
});
// every meaning of each verb, for search and the verb card; RU[v][0] stays the short gloss used in prompts
const MEAN={
 "quedar":"оставаться; договариваться о встрече (quedar con); подходить (об одежде); находиться; оставаться (о количестве)",
 "crear":"создавать; творить; основывать",
 "considerar":"считать, полагать; рассматривать; учитывать",
 "tratar":"обращаться (с кем-то); пытаться (tratar de); лечить; касаться (темы); речь идёт о (se trata de)",
 "presentar":"представлять; знакомить; подавать (документы); вести (передачу)",
 "lograr":"добиваться; достигать; суметь (lograr + инфинитив)",
 "entrar":"входить; заходить; поступать (в вуз); помещаться",
 "desarrollar":"развивать; разрабатывать; проявлять (плёнку)",
 "resultar":"оказываться; получаться; приводить к",
 "señalar":"указывать; показывать пальцем; отмечать; обозначать",
 "formar":"образовывать; формировать; составлять; обучать, готовить (специалистов)",
 "acabar":"кончать; заканчивать(ся); только что сделать (acabar de + инфинитив)",
 "intentar":"пытаться; стараться; пробовать",
 "contestar":"отвечать; отвечать на звонок; возражать",
 "ganar":"зарабатывать; выигрывать; побеждать; завоёвывать; набирать (вес)",
 "gastar":"тратить; расходовать; изнашивать",
 "guardar":"хранить; сохранять; убирать на место; беречь; соблюдать (тайну)",
 "enseñar":"учить (кого-то); преподавать; обучать; показывать",
 "estudiar":"учиться; изучать; заниматься (уроками); рассматривать",
 "limpiar":"убирать; чистить; мыть; очищать",
 "cocinar":"готовить еду; варить; стряпать",
 "preparar":"готовить; подготавливать; приготовить (еду); готовиться (prepararse)",
 "bailar":"танцевать; плясать",
 "nadar":"плавать",
 "descansar":"отдыхать; передохнуть; покоиться",
 "visitar":"навещать; посещать; осматривать (город, музей)",
 "invitar":"приглашать; угощать (te invito — я угощаю)",
 "llorar":"плакать; оплакивать",
 "gritar":"кричать; орать; выкрикивать",
 "regalar":"дарить; отдавать даром",
 "cuidar":"заботиться; ухаживать; присматривать (за детьми); беречь",
 "celebrar":"праздновать; отмечать (праздник); проводить (встречу)",
 "amar":"любить (сильно, глубоко)",
 "odiar":"ненавидеть; терпеть не мочь",
 "arreglar":"чинить; приводить в порядок; улаживать; наряжаться (arreglarse)",
 "mandar":"отправлять; посылать; приказывать; командовать",
 "desear":"желать; хотеть",
 "evitar":"избегать; предотвращать; уклоняться",
 "pintar":"рисовать красками; писать (картину); красить; краситься (pintarse)",
 "fumar":"курить",
 "firmar":"подписывать; расписываться",
 "alquilar":"снимать (квартиру); арендовать; брать напрокат; сдавать в аренду",
 "aceptar":"принимать; соглашаться; одобрять",
 "apoyar":"поддерживать; опирать; прислонять; опираться (apoyarse)",
 "aumentar":"увеличивать(ся); повышать; расти",
 "bajar":"спускаться; опускать; снижать; выходить (из транспорта); скачивать",
 "cortar":"резать; стричь; отключать; прерывать; порезаться (cortarse)",
 "dibujar":"рисовать (карандашом); чертить; изображать",
 "echar":"бросать; выбрасывать; наливать; выгонять; скучать (echar de menos)",
 "imaginar":"представлять себе; воображать; предполагать",
 "levantar":"поднимать; вставать (levantarse); возводить",
 "luchar":"бороться; сражаться; драться",
 "matar":"убивать",
 "notar":"замечать; чувствовать; ощущать; быть заметным (notarse)",
 "observar":"наблюдать; замечать; соблюдать",
 "ocupar":"занимать (место, время); оккупировать; заниматься (ocuparse de)",
 "parar":"останавливать(ся); прекращать; переставать",
 "participar":"участвовать; сообщать",
 "quitar":"убирать; снимать (одежду, quitarse); отнимать; забирать",
 "robar":"красть; воровать; грабить",
 "saltar":"прыгать; скакать; пропускать (страницу)",
 "salvar":"спасать; сохранять (файл); преодолевать",
 "separar":"разделять; отделять; разлучать; расходиться (separarse)",
 "tirar":"бросать; кидать; выбрасывать; тянуть (на дверях: tirar — к себе); стрелять",
 "votar":"голосовать",
 "ahorrar":"экономить; копить; беречь",
 "lavar":"мыть; стирать (одежду); умываться (lavarse)",
 "mejorar":"улучшать(ся); поправляться",
 "comprender":"понимать; включать в себя; охватывать",
 "responder":"отвечать; откликаться; отвечать за (responder de)",
 "prometer":"обещать",
 "romper":"ломать; разбивать; рвать; расставаться (romper con)",
 "meter":"класть внутрь; засовывать; вставлять; вмешиваться (meterse)",
 "temer":"бояться; опасаться",
 "depender":"зависеть",
 "esconder":"прятать; скрывать; прятаться (esconderse)",
 "sorprender":"удивлять; заставать врасплох; удивляться (sorprenderse)",
 "cumplir":"выполнять; исполнять (обещание); исполняться (годы: cumplir años)",
 "permitir":"разрешать; позволять",
 "existir":"существовать; быть, иметься",
 "insistir":"настаивать; упорствовать",
 "compartir":"делиться; разделять (мнение); пользоваться вместе",
 "discutir":"спорить; обсуждать; ссориться",
 "partir":"отправляться; уезжать; делить; разламывать; начиная с (a partir de)",
 "añadir":"добавлять; прибавлять",
 "unir":"соединять; объединять; присоединяться (unirse)",
 "sufrir":"страдать; терпеть; переносить",
 "asistir":"присутствовать; посещать (занятия); помогать, ассистировать",
 "admitir":"признавать; допускать; принимать (в организацию)",
 "dividir":"делить; разделять",
 "describir":"описывать",
 "descubrir":"обнаруживать; открывать (новое); раскрывать",
 "cubrir":"покрывать; накрывать; закрывать; освещать (новости)",
 "resistir":"выдерживать; сопротивляться; терпеть",
 "explicar":"объяснять; разъяснять",
 "practicar":"практиковать; заниматься (спортом); тренироваться",
 "colocar":"ставить; класть; размещать; устраивать (на работу)",
 "dedicar":"посвящать; заниматься (чем-то, dedicarse a)",
 "indicar":"указывать; показывать (дорогу); сообщать; означать",
 "marcar":"отмечать; набирать (номер); забивать (гол)",
 "aplicar":"применять; наносить (крем); подавать заявку",
 "publicar":"публиковать; издавать",
 "comunicar":"сообщать; связывать; общаться (comunicarse)",
 "entregar":"вручать; доставлять; сдавать (работу); отдавать",
 "apagar":"выключать; гасить; тушить",
 "cruzar":"переходить (улицу); пересекать; скрещивать",
 "organizar":"организовывать; устраивать; упорядочивать",
 "utilizar":"использовать; применять; пользоваться",
 "alcanzar":"достигать; догонять; дотягиваться; хватать (о количестве)",
 "realizar":"осуществлять; выполнять; проводить (мероприятие)",
 "lanzar":"бросать; запускать; выпускать (продукт)",
 "abrazar":"обнимать; охватывать",
 "avanzar":"продвигаться; двигаться вперёд; развиваться",
 "coger":"брать; хватать; ловить; садиться на (транспорт: coger el autobús)",
 "escoger":"выбирать; отбирать",
 "recoger":"собирать; подбирать; забирать (кого-то); убирать (со стола)",
 "proteger":"защищать; охранять; оберегать",
 "dirigir":"руководить; направлять; управлять; режиссировать; обращаться (dirigirse a)",
 "exigir":"требовать",
 "elegir":"выбирать; избирать (голосованием)",
 "corregir":"исправлять; проверять (работы)",
 "parecer":"казаться; мне кажется (me parece); быть похожим (parecerse)",
 "ofrecer":"предлагать; дарить; оказывать",
 "aparecer":"появляться; показываться; находиться (о потерянном)",
 "reconocer":"узнавать (кого-то); признавать; осматривать (врач)",
 "crecer":"расти; увеличиваться",
 "establecer":"устанавливать; основывать; поселяться (establecerse)",
 "merecer":"заслуживать; стоить того (merece la pena)",
 "agradecer":"благодарить; быть признательным",
 "desaparecer":"исчезать; пропадать",
 "pertenecer":"принадлежать; относиться (к группе)",
 "nacer":"рождаться; появляться; брать начало",
 "obedecer":"слушаться; подчиняться; повиноваться",
 "traducir":"переводить (текст); переводиться",
 "producir":"производить; вызывать (эффект); выпускать",
 "reducir":"сокращать; уменьшать; снижать (скорость)",
 "introducir":"вводить; вставлять; внедрять",
 "construir":"строить; сооружать; конструировать",
 "destruir":"разрушать; уничтожать",
 "incluir":"включать (в состав); содержать; учитывать",
 "contribuir":"способствовать; вносить вклад; платить налоги",
 "distribuir":"распределять; раздавать; распространять",
 "concluir":"завершать; заключать; делать вывод",
 "sustituir":"заменять; замещать",
 "cerrar":"закрывать; запирать; закрываться",
 "despertar":"будить; пробуждать; просыпаться (despertarse)",
 "recomendar":"рекомендовать; советовать",
 "negar":"отрицать; отказывать; отказываться (negarse a)",
 "comenzar":"начинать; начинаться",
 "encender":"зажигать; включать (свет, прибор); разжигать",
 "defender":"защищать; отстаивать; обороняться (defenderse)",
 "extender":"расширять; растягивать; распространять; простираться (extenderse)",
 "atender":"обслуживать (клиента); заниматься (кем-то); обращать внимание; отвечать (на звонок)",
 "costar":"стоить (о цене); даваться с трудом (me cuesta)",
 "mostrar":"показывать; демонстрировать",
 "probar":"пробовать; примерять (probarse); испытывать; доказывать",
 "soñar":"мечтать; видеть во сне (soñar con)",
 "sonar":"звучать; звенеть; звонить (о телефоне); казаться знакомым (me suena)",
 "aprobar":"одобрять; сдавать (экзамен); утверждать (закон)",
 "demostrar":"доказывать; демонстрировать; проявлять",
 "volar":"летать; лететь; взрывать",
 "colgar":"вешать; класть трубку; выкладывать (в сеть)",
 "mover":"двигать; передвигать; шевелить; двигаться (moverse)",
 "devolver":"возвращать (вещь); отдавать обратно; тошнить",
 "resolver":"решать (проблему, задачу); разрешать; решаться (resolverse a)",
 "envolver":"заворачивать; упаковывать; окутывать",
 "morder":"кусать; грызть",
 "mentir":"врать; лгать",
 "sugerir":"предлагать (идею); советовать; подсказывать; наводить на мысль",
 "convertir":"превращать; обращать (в веру); становиться (convertirse en); конвертировать",
 "advertir":"предупреждать; замечать",
 "vestir":"одевать; одеваться (vestirse); носить (одежду)",
 "medir":"измерять; иметь рост, размер (mide dos metros)",
 "despedir":"провожать; увольнять; прощаться (despedirse)",
 "impedir":"мешать; препятствовать; не давать",
 "competir":"соревноваться; конкурировать",
 "conseguir":"добиваться; достигать; доставать, раздобыть; получать; суметь (conseguir + инфинитив)",
 "enviar":"отправлять; посылать",
 "continuar":"продолжать; продолжаться",
 "prohibir":"запрещать",
 "mantener":"поддерживать; сохранять; содержать (семью); утверждать",
 "obtener":"получать; добывать; достигать",
 "contener":"содержать (в себе); сдерживать",
 "sostener":"держать; поддерживать; утверждать",
 "detener":"задерживать; арестовывать; останавливать; останавливаться (detenerse)",
 "suponer":"предполагать; означать; наверное (supongo que)",
 "proponer":"предлагать (идею, план); намереваться (proponerse)",
 "componer":"сочинять (музыку); составлять; состоять из (componerse de)",
 "disponer":"располагать (чем-то, disponer de); размещать; распоряжаться; собираться (disponerse a)",
 "prevenir":"предотвращать; предупреждать; заранее готовить",
 "convenir":"подходить; быть выгодным (me conviene); договариваться (convenir en)",
 "deshacer":"распаковывать (чемодан); разбирать; развязывать; разрушать; избавляться (deshacerse de)",
 "atraer":"привлекать; притягивать",
 "distraer":"отвлекать; развлекать",
 "valer":"стоить; иметь ценность; годиться; ладно, хорошо (vale)",
 "caber":"помещаться; вмещаться; нет сомнений (no cabe duda)",
 "poseer":"обладать; владеть; иметь",
 "duchar":"мыть под душем; принимать душ (ducharse)",
 "preocupar":"беспокоить; волноваться (preocuparse)",
 "enfadar":"сердить; злиться, сердиться (enfadarse)",
 "casar":"женить, венчать; жениться, выходить замуж (casarse)",
 "afeitar":"брить; бриться (afeitarse)",
 "peinar":"причёсывать; причёсываться (peinarse)",
 "quejar":"жаловаться (quejarse)",
 "sentar":"сажать; садиться (sentarse); подходить, идти (об одежде, еде: sentar bien)",
 "acostar":"укладывать спать; ложиться (acostarse)",
 "divertir":"развлекать; веселиться (divertirse)",
 "acordar":"договариваться; вспоминать, помнить (acordarse de)",
 "equivocar":"путать; ошибаться (equivocarse)",
 "hablar":"говорить; разговаривать; беседовать",
 "trabajar":"работать; трудиться; обрабатывать",
 "comprar":"покупать",
 "escuchar":"слушать; выслушивать; прислушиваться",
 "viajar":"путешествовать; ездить; ехать",
 "cantar":"петь; исполнять (песню)",
 "comer":"есть; кушать; обедать",
 "beber":"пить; выпивать",
 "aprender":"учить; изучать; учиться; научиться; узнавать",
 "vender":"продавать",
 "vivir":"жить; проживать; переживать (опыт)",
 "escribir":"писать; написать",
 "abrir":"открывать; открываться",
 "decidir":"решать; принимать решение; решаться (decidirse)",
 "ser":"быть; являться; быть родом (ser de); происходить, случаться",
 "estar":"быть; находиться; чувствовать себя",
 "ir":"идти; ехать; ходить; ездить; собираться (ir a + инфинитив); уходить (irse)",
 "tener":"иметь; обладать; держать; быть должным (tener que); быть … лет (tener … años)",
 "hacer":"делать; совершать; заставлять; о погоде (hace frío — холодно); … назад (hace dos años)",
 "poder":"мочь; уметь; быть в состоянии",
 "querer":"хотеть; любить",
 "decir":"сказать; говорить; сообщать",
 "venir":"приходить; приезжать; идти (сюда)",
 "poner":"класть; ставить; помещать; включать (телевизор); надевать (ponerse)",
 "saber":"знать; уметь (saber + инфинитив); узнать (в pretérito); иметь вкус (saber a)",
 "dar":"давать; дарить; отдавать",
 "ver":"видеть; смотреть (телевизор, фильм); встречаться",
 "salir":"выходить; уходить; уезжать; встречаться (salir con); получаться",
 "llamar":"звонить; звать; называть; стучать (в дверь)",
 "llevar":"нести; носить (одежду); везти; отвозить; проводить (время); вести",
 "pasar":"проходить; проводить (время); проезжать; передавать; случаться",
 "tomar":"брать; пить; есть; принимать (лекарство); ехать на (транспорте)",
 "esperar":"ждать; надеяться; ожидать",
 "mirar":"смотреть; глядеть; рассматривать",
 "necesitar":"нуждаться; мне нужно (necesito)",
 "deber":"быть должным; быть обязанным; быть в долгу",
 "llegar":"приезжать; прибывать; приходить; доходить; достигать",
 "buscar":"искать; разыскивать; заезжать за (кем-то)",
 "empezar":"начинать; начинаться",
 "pedir":"просить; заказывать; требовать",
 "dormir":"спать",
 "sentir":"чувствовать; ощущать; сожалеть (lo siento); чувствовать себя (sentirse)",
 "conocer":"знать (кого-то, место); быть знакомым; познакомиться (в pretérito)",
 "traer":"приносить; привозить; приводить",
 "oír":"слышать; слушать",
 "pensar":"думать; полагать; собираться (pensar + инфинитив)",
 "volver":"возвращаться; вернуться; снова делать (volver a + инфинитив)",
 "encontrar":"находить; встречать; найти",
 "jugar":"играть",
 "seguir":"продолжать; следовать; идти за",
 "leer":"читать",
 "creer":"верить; полагать; считать; думать",
 "ayudar":"помогать",
 "cambiar":"менять; изменять; обменивать; меняться",
 "dejar":"оставлять; позволять (dejar + инфинитив); бросать (привычку, dejar de)",
 "terminar":"заканчивать; кончать; завершать",
 "usar":"использовать; пользоваться; носить (одежду)",
 "preguntar":"спрашивать; задавать вопрос",
 "olvidar":"забывать",
 "correr":"бегать; бежать; мчаться",
 "recibir":"получать; принимать (гостей)",
 "subir":"подниматься; поднимать; садиться (в транспорт); повышать; выкладывать (в сеть)",
 "entender":"понимать",
 "perder":"терять; проигрывать; опаздывать (на поезд)",
 "contar":"рассказывать; считать",
 "recordar":"помнить; вспоминать; напоминать",
 "preferir":"предпочитать",
 "servir":"служить; подавать (еду); годиться",
 "repetir":"повторять",
 "morir":"умирать",
 "conducir":"водить (машину); вести; управлять",
 "caer":"падать; нравиться (о человеке: caer bien)",
 "andar":"ходить пешком; гулять; идти; работать (о механизме)",
 "pagar":"платить; оплачивать",
 "sacar":"доставать; вынимать; получать (оценку); делать (фото)",
 "tocar":"трогать; касаться; играть (на инструменте); выпадать (об очереди: te toca)",
 "almorzar":"обедать"
};
const RUP=["я","ты","он","мы","вы (vosotros)","они"];
function ruPhrase(v,t,p){
  const r=RU[v]; const f=t==="pres"?r[1].split(" ")[p]:r[2][p<3?0:1];
  return RUP[p]+" "+f;
}
// ---- tenses ----
// g = color group: pres | past | fut | subj | imp
const TENSES=[
 {k:"pres", mood:"Indicativo", name:"presente", ru:"настоящее · сейчас", g:"pres"},
 {k:"pret", mood:"Indicativo", name:"pretérito indefinido", short:"pretérito", ru:"прошедшее · законченное действие", g:"past"},
 {k:"imp",  mood:"Indicativo", name:"pretérito imperfecto", short:"imperfecto", ru:"прошедшее · фон, привычка, «бывало»", g:"past"},
 {k:"perf", mood:"Indicativo", name:"pretérito perfecto", short:"perfecto", ru:"прошедшее, связанное с сейчас · he hablado", g:"past"},
 {k:"plus", mood:"Indicativo", name:"pluscuamperfecto", short:"pluscuamp.", ru:"предпрошедшее · уже сделал до того", g:"past"},
 {k:"ant",  mood:"Indicativo", name:"pretérito anterior", short:"anterior", ru:"книжное · как только сделал · hube hablado", g:"past"},
 {k:"fut",  mood:"Indicativo", name:"futuro simple", short:"futuro", ru:"будущее · сделаю", g:"fut"},
 {k:"futp", mood:"Indicativo", name:"futuro perfecto", short:"futuro perf.", ru:"будет сделано к моменту · habré hablado", g:"fut"},
 {k:"cond", mood:"Indicativo", name:"condicional", ru:"условное · сделал бы", g:"fut"},
 {k:"condp",mood:"Indicativo", name:"condicional perfecto", short:"cond. perf.", ru:"сделал бы тогда · habría hablado", g:"fut"},
 {k:"sp",   mood:"Subjuntivo", name:"presente de subjuntivo", short:"subj. presente", ru:"желание, сомнение · que hable", g:"subj"},
 {k:"si",   mood:"Subjuntivo", name:"imperfecto de subjuntivo", short:"subj. imperfecto", ru:"si / ojalá в прошлом · que hablara", g:"subj"},
 {k:"spf",  mood:"Subjuntivo", name:"perfecto de subjuntivo", short:"subj. perfecto", ru:"que haya hablado", g:"subj"},
 {k:"spl",  mood:"Subjuntivo", name:"pluscuamperfecto de subjuntivo", short:"subj. pluscuamp.", ru:"si hubiera hablado", g:"subj"},
 {k:"fs",   mood:"Subjuntivo", name:"futuro de subjuntivo", short:"subj. futuro", ru:"книжное, в законах · quien hablare", g:"subj"},
 {k:"fps",  mood:"Subjuntivo", name:"futuro perfecto de subjuntivo", short:"subj. futuro perf.", ru:"книжное · hubiere hablado", g:"subj"},
 {k:"impa", mood:"Imperativo", name:"imperativo afirmativo", short:"imp. afirmativo", ru:"приказ, просьба · ¡habla!", g:"imp"},
 {k:"impn", mood:"Imperativo", name:"imperativo negativo", short:"imp. negativo", ru:"запрет · ¡no hables!", g:"imp"}
];
const TMAP={}; TENSES.forEach(t=>TMAP[t.k]=t);
const DEFAULT_TENSES=["pres","pret"];
const IMP_PERS=["—","tú","usted","nosotros","vosotros","ustedes"];
const isImp=t=>t==="impa"||t==="impn";
const persLabel=(t,p)=>isImp(t)?IMP_PERS[p]:PERS[p];
const hasPerson=(t,p)=>!(isImp(t)&&p===0);

// ---- conjugation engine ----
const vt=v=>v.endsWith("ar")?"ar":v.endsWith("er")?"er":"ir"; // oír → ir
const base=v=>v.slice(0,-2);
function basic(v,t,p){ // presente / pretérito: explicit forms for irregulars, endings for regulars
  if(IRR[v]) return IRR[v][t].split(" ")[p];
  return base(v)+REG[vt(v)][t][p];
}
const IMPF_IRR={ser:"era eras era éramos erais eran",ir:"iba ibas iba íbamos ibais iban",ver:"veía veías veía veíamos veíais veían"};
const IMPF={ar:["aba","abas","aba","ábamos","abais","aban"],er:["ía","ías","ía","íamos","íais","ían"],ir:["ía","ías","ía","íamos","íais","ían"]};
const FUT_STEM={tener:"tendr",poner:"pondr",salir:"saldr",venir:"vendr",poder:"podr",saber:"sabr",querer:"querr",hacer:"har",decir:"dir","oír":"oir",
 mantener:"mantendr",obtener:"obtendr",contener:"contendr",sostener:"sostendr",detener:"detendr",suponer:"supondr",proponer:"propondr",componer:"compondr",disponer:"dispondr",
 prevenir:"prevendr",convenir:"convendr",deshacer:"deshar",valer:"valdr",caber:"cabr"};
const FUT=["é","ás","á","emos","éis","án"], COND=["ía","ías","ía","íamos","íais","ían"];
const PART_IRR={hacer:"hecho",decir:"dicho",poner:"puesto",ver:"visto",escribir:"escrito",abrir:"abierto",volver:"vuelto",morir:"muerto",leer:"leído",creer:"creído","oír":"oído",traer:"traído",caer:"caído",
 romper:"roto",describir:"descrito",descubrir:"descubierto",cubrir:"cubierto",devolver:"devuelto",resolver:"resuelto",envolver:"envuelto",
 suponer:"supuesto",proponer:"propuesto",componer:"compuesto",disponer:"dispuesto",deshacer:"deshecho",atraer:"atraído",distraer:"distraído",poseer:"poseído"};
const part=v=>PART_IRR[v]||base(v)+(vt(v)==="ar"?"ado":"ido");
const HABER={perf:"he has ha hemos habéis han",plus:"había habías había habíamos habíais habían",futp:"habré habrás habrá habremos habréis habrán",condp:"habría habrías habría habríamos habríais habrían",spf:"haya hayas haya hayamos hayáis hayan",spl:"hubiera hubieras hubiera hubiéramos hubierais hubieran",
 ant:"hube hubiste hubo hubimos hubisteis hubieron",fps:"hubiere hubieres hubiere hubiéremos hubiereis hubieren"};
const HABER_SE="hubiese hubieses hubiese hubiésemos hubieseis hubiesen"; // accepted alternative for spl
const SP_OVR={ser:"sea seas sea seamos seáis sean",estar:"esté estés esté estemos estéis estén",ir:"vaya vayas vaya vayamos vayáis vayan",saber:"sepa sepas sepa sepamos sepáis sepan",dar:"dé des dé demos deis den"};
// subjuntivo nosotros/vosotros: -ir stem-changers keep e→i / o→u; -ar/-er stem-changers go back to the infinitive stem
const SP_NOS_IR={sentir:"sint",dormir:"durm",preferir:"prefir",morir:"mur",mentir:"mint",sugerir:"sugir",convertir:"convirt",advertir:"advirt",divertir:"divirt"};
const SP_NOS_INF=new Set(["querer","poder","empezar","pensar","volver","encontrar","jugar","entender","perder","contar","recordar","almorzar",
 "cerrar","despertar","recomendar","negar","comenzar","encender","defender","extender","atender","costar","mostrar","probar","soñar","sonar","aprobar",
 "demostrar","volar","colgar","mover","devolver","resolver","envolver","morder","enviar","continuar","prohibir",
 "sentar","acostar","acordar"]);
const spell=(v,st)=>/car$/.test(v)?st.replace(/c$/,"qu"):/gar$/.test(v)?st.replace(/g$/,"gu"):/zar$/.test(v)?st.replace(/z$/,"c"):st;
const SP_END={ar:["e","es","e","emos","éis","en"],er:["a","as","a","amos","áis","an"],ir:["a","as","a","amos","áis","an"]};
function subjPres(v,p){
  if(SP_OVR[v]) return SP_OVR[v].split(" ")[p];
  let st=basic(v,"pres",0).slice(0,-1);
  if(p===3||p===4){ if(SP_NOS_IR[v]) st=SP_NOS_IR[v]; else if(SP_NOS_INF.has(v)) st=base(v); }
  return spell(v,st)+SP_END[vt(v)][p];
}
function raForm(st,p,x="ra"){ // st = ellos pretérito minus -ron; x = ra / se / re; nosotros stresses the last vowel
  const acc=st.slice(0,-1)+({a:"á",e:"é"}[st.slice(-1)]||st.slice(-1));
  return [st+x,st+x+"s",st+x,acc+x+"mos",st+x+"is",st+x+"n"][p];
}
const subjImpf=(v,p,x)=>raForm(basic(v,"pret",5).slice(0,-3),p,x);
// a second correct answer: the -se form of the imperfect subjunctive (and of hubiera in spl)
const altForm=(v,t,p)=>t==="si"?subjImpf(v,p,"se"):t==="spl"?HABER_SE.split(" ")[p]+" "+part(v):null;
const IMP_TU={decir:"di",hacer:"haz",ir:"ve",poner:"pon",salir:"sal",ser:"sé",tener:"ten",venir:"ven",
 mantener:"mantén",obtener:"obtén",contener:"contén",sostener:"sostén",detener:"detén",suponer:"supón",proponer:"propón",componer:"compón",disponer:"dispón",
 prevenir:"prevén",convenir:"convén",deshacer:"deshaz"};
const IMP_ROOT=v=>["tener","poner","venir","hacer"].find(r=>v!==r&&v.endsWith(r)); // mantener → tener
function imperative(v,p){
  if(p===0) return null;
  if(p===1) return IMP_TU[v]||basic(v,"pres",2);
  if(p===4) return v.slice(0,-1)+"d";
  if(p===3&&v==="ir") return "vamos";
  return subjPres(v,p);
}
function form(v,t,p){
  switch(t){
    case "pres": case "pret": return basic(v,t,p);
    case "imp": return IMPF_IRR[v]?IMPF_IRR[v].split(" ")[p]:base(v)+IMPF[vt(v)][p];
    case "fut": return (FUT_STEM[v]||v)+FUT[p];
    case "cond": return (FUT_STEM[v]||v)+COND[p];
    case "perf": case "plus": case "ant": case "futp": case "condp": case "spf": case "spl": case "fps":
      return HABER[t].split(" ")[p]+" "+part(v);
    case "sp": return subjPres(v,p);
    case "si": return subjImpf(v,p);
    case "fs": return subjImpf(v,p,"re");
    case "impa": return imperative(v,p);
    case "impn": return p===0?null:"no "+subjPres(v,p);
  }
  return null;
}
// ---- explanation: the rule and the steps from the infinitive to the form; mirrors form() ----
const F=s=>'<b class="f">'+s+'</b>';
const PN=["yo","tú","él","nosotros","vosotros","ellos"];
const ACC={"á":"a","é":"e","í":"i","ó":"o","ú":"u"};
const plain=s=>s.replace(/[áéíóú]/g,c=>ACC[c]);
const listF=(s,p)=>s.split(" ").map((x,i)=>i===p?F(x):x).join(", ");
const SPELL_RULE=v=>/car$/.test(v)?"c → qu":/gar$/.test(v)?"g → gu":/zar$/.test(v)?"z → c":"";
function stemChange(a,b){ // which vowel change turns stem a into stem b
  for(const [x,y] of [["e","ie"],["o","ue"],["u","ue"],["e","i"],["o","u"]])
    for(let i=a.indexOf(x);i>=0;i=a.indexOf(x,i+1)) if(a.slice(0,i)+y+a.slice(i+1)===b) return x+" → "+y;
  return "";
}
function kindBasic(v,t,p){ // classify a presente/pretérito form; drives both the explanation and the rule hint
  const c=basic(v,t,p),st=base(v),g=vt(v),end=REG[g][t][p],reg=st+end,K={c,st,g,end,reg};
  const r=(k,o)=>Object.assign(K,{k},o);
  if(c===reg) return r("reg");
  if(v==="ser"||v==="ir") return r("memo");
  if(t==="pres"){
    const gs=s=>(s.match(/g/g)||[]).length;
    if(p===0&&/zco$/.test(c)) return r("zco");
    if(p===0&&/g[ei]r$/.test(v)&&/jo$/.test(c)) return r("gj",{ch:stemChange(st,c.slice(0,-2)+"g")});
    if(p===0&&/guir$/.test(v)) return r("guir");
    if(p===0&&/go$/.test(c)&&gs(c)>gs(st)) return r("go");
    if(p===0&&/oy$/.test(c)) return r("oy");
    if(plain(c)===plain(reg)) return r("accent");
    if(c.endsWith(end)&&p!==3&&p!==4){
      const st2=c.slice(0,-end.length),ch=stemChange(st,st2);
      if(ch) return r("stem",{st2,ch});
      if(st2===st+"y") return r("y",{st2});
    }
  }else{
    const P=IRR[v].pret.split(" ");
    if(v==="dar"||v==="ver") return r("darver");
    if(/[^é]e$/.test(P[0])&&/o$/.test(P[2])){ const s2=P[0].slice(0,-1); return r("strong",{s2,j:/j$/.test(s2)}); } // new stem + unstressed endings
    if(p===0&&SPELL_RULE(v)) return r("spell");
    if(plain(c)===plain(reg)) return r("accent");
    if(reg.replace("ió","yó").replace("ieron","yeron")===c) return r("iy");
    if((p===2||p===5)&&g==="ir"){ const st2=c.slice(0,-end.length),ch=stemChange(st,st2); if(ch) return r("irstem",{st2,ch}); }
  }
  return r("memo");
}
function whyBasic(v,t,p){
  const K=kindBasic(v,t,p),{c,st,g,end,reg}=K,tn=t==="pres"?"presente":"pretérito",all=IRR[v]&&IRR[v][t];
  const how="основа "+F(st+"-")+" + окончание "+F("-"+end)+" ("+tn+", -"+g+", "+PN[p]+")";
  switch(K.k){
    case "reg": return ["Отрезаем -"+g+": "+how+" = "+F(c)+"."].concat(IRR[v]?["В этой форме "+v+" спрягается по правилу."]:[]);
    case "zco": return ["-cer / -cir после гласной → -zco в yo: c превращается в zc: "+F(c)+". Остальные формы обычные."];
    case "gj": return ["Перед o буква g превращается в j, чтобы сохранить звук [х]"+(K.ch?", и корень меняется "+K.ch:"")+": "+F(c)+"."];
    case "guir": return ["Смена корня e → i и орфография: перед o пишется g, а не gu (u нужна только перед e и i): "+F(c)+"."];
    case "go": return ["Yo на -go: в yo появляется g — "+F(c)+". Так же tengo, pongo, salgo, vengo, hago, digo, traigo, caigo, oigo."];
    case "oy": return ["Yo на -oy: "+F(c)+". Так же soy, estoy, voy, doy."];
    case "accent": return t==="pres"
      ? ["По общему правилу: "+how+" = "+reg+", но пишется "+F(c)+(c===plain(c)?" без ударения: в форме один слог.":" с ударением.")]
      : ["По общему правилу: "+how+" = "+reg+", но i рядом с гласной корня получает ударение: "+F(c)+"."];
    case "stem": return ["Смена корня "+K.ch+": "+F(st+"-")+" → "+F(K.st2+"-")+" + "+F("-"+end)+" = "+F(c)+".","Корень меняется во всех формах, кроме nosotros и vosotros: там ударение уходит на окончание."];
    case "y": return ["Между гласными появляется y: "+F(K.st2+"-")+" + "+F("-"+end)+" = "+F(c)+"."];
    case "darver": return ["dar и ver в pretérito: короткие формы без ударений, окончания как у -er/-ir: "+listF(all,p)+"."];
    case "strong": {
      const out=["Сильный pretérito: новый корень "+F(K.s2+"-")+" (вместо "+st+"-) + окончания -e, -iste, -o, -imos, -isteis, -"+(K.j?"eron":"ieron")+", без ударений: "+F(c)+"."];
      if(v.endsWith("hacer")&&p===2) out.push("В él c → z перед o, чтобы сохранить звук: "+c+".");
      if(K.j&&p===5) out.push("После j окончание -eron, без i.");
      return out;
    }
    case "spell": return ["Орфография: "+how+" = "+reg+", но перед é пишется "+SPELL_RULE(v)+", чтобы сохранить звук: "+F(c)+"."];
    case "iy": return ["i между гласными превращается в y: "+reg+" → "+F(c)+"."];
    case "irstem": return ["У -ir глаголов со сменой корня в pretérito корень меняется только в él и ellos: "+K.ch+". "+F(K.st2+"-")+" + "+F("-"+end)+" = "+F(c)+"."];
  }
  if(v==="ser"||v==="ir") return [t==="pres"?"Полностью неправильный глагол, формы надо запомнить: "+listF(all,p)+".":"ser и ir в pretérito совпадают, формы надо запомнить: "+listF(all,p)+"."];
  return ["Неправильная форма, её надо запомнить: "+listF(all,p)+"."];
}
function whySp(v,p){
  if(SP_OVR[v]) return ["Исключение: subjuntivo от "+v+" надо запомнить: "+listF(SP_OVR[v],p)+"."];
  const yo=basic(v,"pres",0),out=[]; let st=yo.slice(0,-1);
  out.push("Берём yo из presente "+F(yo)+" и убираем "+F("-o")+" → "+F(st+"-")+".");
  if(p===3||p===4){
    if(SP_NOS_IR[v]){ st=SP_NOS_IR[v]; out.push("У -ir со сменой корня в nosotros и vosotros корень меняется только на одну гласную (e → i, o → u): "+F(st+"-")+"."); }
    else if(SP_NOS_INF.has(v)){ st=base(v); out.push("Смена корня не идёт в nosotros и vosotros: берём корень инфинитива "+F(st+"-")+"."); }
  }
  const sp=spell(v,st);
  if(sp!==st){ out.push("Орфография: перед e пишется "+SPELL_RULE(v)+", чтобы сохранить звук: "+F(sp+"-")+"."); st=sp; }
  const e=SP_END[vt(v)][p];
  out.push("Ставим «чужую» гласную (у -ar → e, у -er/-ir → a): "+F(st+"-")+" + "+F("-"+e)+" = "+F(st+e)+".");
  return out;
}
const HABER_NAME={perf:"presente",plus:"imperfecto",ant:"pretérito indefinido",futp:"futuro",condp:"condicional",spf:"presente de subjuntivo",spl:"imperfecto de subjuntivo",fps:"futuro de subjuntivo"};
function explain(v,t,p){
  const c=form(v,t,p);
  switch(t){
    case "pres": case "pret": return whyBasic(v,t,p);
    case "imp":
      if(IMPF_IRR[v]) return ["В imperfecto неправильных всего три: ser, ir, ver. Формы надо запомнить: "+listF(IMPF_IRR[v],p)+"."];
      return ["Отрезаем -"+vt(v)+": основа "+F(base(v)+"-")+" + окончание "+F("-"+IMPF[vt(v)][p])+" = "+F(c)+".","У -ar окончания на -aba, у -er/-ir на -ía."+(p===3&&vt(v)==="ar"?" В nosotros ударение: -ábamos.":"")];
    case "fut": case "cond": {
      const e=(t==="fut"?FUT:COND)[p],nm=t==="fut"?"futuro":"condicional";
      if(v==="oír") return ["oír теряет ударение: основа "+F("oir-")+" + "+F("-"+e)+" = "+F(c)+"."];
      if(FUT_STEM[v]) return ["У "+v+" особая основа "+F(FUT_STEM[v]+"-")+" (не "+v+"-), она одна для futuro и condicional: + "+F("-"+e)+" = "+F(c)+"."];
      return [nm[0].toUpperCase()+nm.slice(1)+": к целому инфинитиву "+F(v)+" добавляем "+F("-"+e)+" = "+F(c)+".","Окончания одинаковые для -ar, -er, -ir."];
    }
    case "perf": case "plus": case "ant": case "futp": case "condp": case "spf": case "spl": case "fps": {
      const h=HABER[t].split(" ")[p],pt=part(v),out=["Составное время: haber в "+HABER_NAME[t]+" ("+F(h)+") + participio ("+F(pt)+")."];
      if(t==="spl") out.push("Вариант с "+F(HABER_SE.split(" ")[p])+" тоже правильный и засчитывается.");
      if(t==="ant"||t==="fps") out.push("Книжное время: в живой речи почти не встречается.");
      if(PART_IRR[v]) out.push(/í/.test(pt)?"Participio с ударением: "+F(pt)+" — i стоит после гласной корня.":"Participio неправильный, его надо запомнить: "+F(pt)+".");
      else out.push("Participio: основа "+F(base(v)+"-")+" + "+F(vt(v)==="ar"?"-ado":"-ido")+" = "+F(pt)+".");
      return out;
    }
    case "sp": return whySp(v,p);
    case "si": {
      const ell=basic(v,"pret",5),st=ell.slice(0,-3),e=["ra","ras","ra","ramos","rais","ran"][p];
      const out=["Берём ellos из pretérito "+F(ell)+", убираем "+F("-ron")+" → "+F(st+"-")+" и добавляем "+F("-"+e)+"."];
      out.push(p===3?"В nosotros ударение на гласную перед -ramos: "+F(c)+".":"Получается "+F(c)+".");
      out.push("Вариант на -se ("+F(subjImpf(v,p,"se"))+") тоже правильный и засчитывается.");
      return out;
    }
    case "fs": {
      const ell=basic(v,"pret",5),st=ell.slice(0,-3),e=["re","res","re","remos","reis","ren"][p];
      return ["Как subjuntivo imperfecto, только с -re: ellos из pretérito "+F(ell)+" без "+F("-ron")+" → "+F(st+"-")+" + "+F("-"+e)+" = "+F(c)+".",
        (p===3?"В nosotros ударение на гласную перед -remos. ":"")+"Книжное время: встречается в законах и пословицах."];
    }
    case "impn":
      return ["Отрицательный imperativo: no + subjuntivo presente, для всех лиц (и для tú, и для vosotros)."].concat(whySp(v,p),["Добавляем no: "+F(c)+"."]);
    case "impa":
      if(p===1) return IMP_TU[v]?(IMP_ROOT(v)?["Особая короткая форма tú, как у "+IMP_ROOT(v)+" ("+IMP_TU[IMP_ROOT(v)]+"), только с приставкой и ударением: "+F(c)+"."]:["Особая короткая форма tú, её надо запомнить: "+F(c)+". Таких восемь: di, haz, ve, pon, sal, sé, ten, ven."]):["tú = форма él из presente: "+F(c)+"."];
      if(p===4) return ["vosotros = инфинитив без "+F("-r")+" + d: "+F(v.slice(0,-1)+"-")+" + "+F("d")+" = "+F(c)+"."];
      if(p===3&&v==="ir") return ["Для ir в nosotros особая форма: "+F("vamos")+"."];
      return [IMP_PERS[p]+" = subjuntivo presente:"].concat(whySp(v,p));
  }
  return [];
}
// ---- hints: shown before answering, never contain the answer ----
function regularForm(v,t,p){ // what the plain rules give, ignoring every exception list
  const b=base(v),g=vt(v),rp=(tt,pp)=>b+REG[g][tt][pp],rsp=pp=>b+SP_END[g][pp];
  switch(t){
    case "pres": case "pret": return rp(t,p);
    case "imp": return b+IMPF[g][p];
    case "fut": return v+FUT[p];
    case "cond": return v+COND[p];
    case "sp": return rsp(p);
    case "si": return raForm(rp("pret",5).slice(0,-3),p);
    case "fs": return raForm(rp("pret",5).slice(0,-3),p,"re");
    case "impa": return p===1?rp("pres",2):p===4?v.slice(0,-1)+"d":rsp(p);
    case "impn": return "no "+rsp(p);
  }
  return HABER[t].split(" ")[p]+" "+b+(g==="ar"?"ado":"ido");
}
function hintRegular(v,t,p){
  return [IRR[v]?"Глагол с особенностями (в списке неправильных).":"Глагол правильный.",
    form(v,t,p)===regularForm(v,t,p)?"Эта форма строится по общему правилу.":"В этой форме есть особенность: общее правило не сработает как есть."];
}
function hintBasic(v,t,p){
  const K=kindBasic(v,t,p);
  switch(K.k){
    case "reg": return ["Основа + обычное окончание, без сюрпризов."];
    case "zco": return ["В yo: -cer / -cir после гласной → -zco."];
    case "gj": return ["В yo g → j перед o"+(K.ch?", и корень "+K.ch:"")+"."];
    case "guir": return ["Корень e → i, а перед o пишется g вместо gu."];
    case "go": return ["Yo на -go: в yo появляется g."];
    case "oy": return ["Yo на -oy."];
    case "accent": return [t==="pres"?(K.c===plain(K.c)?"Форма односложная, поэтому без ударения.":"Не забудь ударение."):"i рядом с гласной корня получает ударение."];
    case "stem": return ["Смена корня "+K.ch+" (во всех формах, кроме nosotros и vosotros)."];
    case "y": return ["Между гласными появляется y."];
    case "darver": return ["Короткие формы без ударений, окончания как у -er/-ir."];
    case "strong": return ["Сильный pretérito: новый корень + окончания -e, -iste, -o, -imos, -isteis, -"+(K.j?"eron":"ieron")+", без ударений."]
      .concat(v.endsWith("hacer")&&p===2?["В él c → z перед o."]:[]);
    case "spell": return ["Орфография перед é: "+SPELL_RULE(v)+"."];
    case "iy": return ["i между гласными превращается в y."];
    case "irstem": return ["-ir со сменой корня: в él и ellos "+K.ch+"."];
  }
  return ["Форма полностью неправильная, её надо помнить."];
}
function hintSp(v,p){
  if(SP_OVR[v]) return ["Исключение: subjuntivo не строится от yo, его надо помнить."];
  const yo=basic(v,"pres",0),out=["Основа — yo из presente без -o."]; let st=yo.slice(0,-1);
  if((p===3||p===4)&&SP_NOS_IR[v]){ st=SP_NOS_IR[v]; out.push("В nosotros и vosotros корень меняет только одну гласную: e → i, o → u."); }
  else if((p===3||p===4)&&SP_NOS_INF.has(v)){ st=base(v); out.push("В nosotros и vosotros смены корня нет: корень инфинитива."); }
  else if(st!==base(v)) out.push("Yo presente у этого глагола особый — бери именно его.");
  if(spell(v,st)!==st) out.push("Орфография перед e: "+SPELL_RULE(v)+".");
  out.push("Гласная «чужая»: у -ar → e, у -er/-ir → a.");
  return out;
}
function hintRule(v,t,p){
  switch(t){
    case "pres": case "pret": return hintBasic(v,t,p);
    case "imp": return [IMPF_IRR[v]?"Один из трёх неправильных глаголов в imperfecto: форму надо помнить.":"Основа + окончание imperfecto (-aba у -ar, -ía у -er/-ir). Исключений нет."];
    case "fut": case "cond": return [v==="oír"?"Основа — инфинитив, но без ударения на i.":FUT_STEM[v]?"Основа особая, укороченная — не целый инфинитив.":"Основа — целый инфинитив, к нему окончание."];
    case "sp": return hintSp(v,p);
    case "si": {
      const out=["Основа — ellos из pretérito без -ron, дальше -ra, -ras, -ra…"];
      if(basic(v,"pret",5)!==base(v)+REG[vt(v)].pret[5]) out.push("ellos pretérito у этого глагола неправильный.");
      if(p===3) out.push("В nosotros нужно ударение перед -ramos.");
      return out;
    }
    case "fs": {
      const out=["Как subjuntivo imperfecto, только -re вместо -ra: основа — ellos из pretérito без -ron."];
      if(basic(v,"pret",5)!==base(v)+REG[vt(v)].pret[5]) out.push("ellos pretérito у этого глагола неправильный.");
      if(p===3) out.push("В nosotros нужно ударение перед -remos.");
      return out;
    }
    case "impn": return ["no + subjuntivo presente, для всех лиц."].concat(hintSp(v,p));
    case "impa":
      if(p===1) return IMP_TU[v]?[IMP_ROOT(v)?"Особая короткая форма tú, как у глагола без приставки, плюс ударение.":"Особая короткая форма tú (одна из восьми)."]:["tú = форма él из presente."].concat(basic(v,"pres",2)!==regularForm(v,"pres",2)?["А в él presente у этого глагола: "+hintBasic(v,"pres",2)[0].toLowerCase()]:[]);
      if(p===4) return ["Инфинитив без -r + d."];
      if(p===3&&v==="ir") return ["У этого глагола в nosotros — особая форма."];
      return [IMP_PERS[p]+" = subjuntivo presente."].concat(hintSp(v,p));
  }
  const pt=PART_IRR[v];
  return ["haber в "+HABER_NAME[t]+" + participio.", pt?(/í/.test(pt)?"Participio с ударением на í.":"Participio неправильный."):"Participio правильный: -ado / -ido."];
}
function hintEndings(v,t,p){ // six endings of this tense for this verb group, current person marked
  const g=vt(v),pl=[0,1,2,3,4,5].map(i=>persLabel(t,i).split(" ")[0]);
  const row=(arr,pre)=>arr.map((e,i)=>hasPerson(t,i)?'<span class="nw">'+(i===p?"<b>":"")+pl[i]+" "+(pre??"-")+e+(i===p?"</b>":"")+'</span>':"").filter(Boolean).join(" · ");
  switch(t){
    case "pres": case "pret": {
      if(IRR[v]&&kindBasic(v,t,p).k==="memo") return ["Форма неправильная: общие окончания тут не помогут."];
      if(t==="pret"&&IRR[v]&&kindBasic(v,t,p).k==="strong") return ["Сильный pretérito: "+row(["e","iste","o","imos","isteis",kindBasic(v,t,p).j?"eron":"ieron"])];
      return [(t==="pres"?"Presente":"Pretérito")+", -"+g+": "+row(REG[g][t])];
    }
    case "imp": return ["Imperfecto, -"+g+": "+row(IMPF[g])];
    case "fut": return ["Futuro (к основе): "+row(FUT)];
    case "cond": return ["Condicional (к основе): "+row(COND)];
    case "sp": return ["Subjuntivo, -"+g+": "+row(SP_END[g])];
    case "si": return ["Subjuntivo imperfecto (к основе): "+row(["ra","ras","ra","ramos","rais","ran"])+". Можно и на -se."];
    case "fs": return ["Futuro de subjuntivo (к основе): "+row(["re","res","re","remos","reis","ren"])];
    case "impn": return ["Imperativo negativo: no + subjuntivo, -"+g+": "+row(SP_END[g],"no -")];
    case "impa": return ["Imperativo: "+row(["","él presente","subj. presente","subj. presente","инфинитив − r + d","subj. presente"],"= ")];
  }
  return ["haber ("+HABER_NAME[t]+"): "+row(HABER[t].split(" "),"")+" + participio"];
}

// the tense checkboxes of the settings panel, grouped by mood: rendered at build time and again by the page script
function tensesHtml(sel){
  const moods=[...new Set(TENSES.map(t=>t.mood))];
  return moods.map(m=>'<div class="mood"><b>'+m+'</b>'+
    TENSES.filter(t=>t.mood===m).map(t=>'<label class="tchip" style="--tc:var(--t-'+t.k+')"><input type="checkbox" id="tn-'+t.k+'" value="'+t.k+'"'+(sel.includes(t.k)?" checked":"")+'><span>'+(t.short||t.name).replace(/^(subj|imp)\. /,"")+'</span></label>').join("")+'</div>').join("")+
    '<div class="tbtns"><span class="cap">Быстрый выбор</span><button type="button" data-set="def">Presente + pretérito</button><button type="button" data-set="ind">Весь indicativo</button><button type="button" data-set="all">Все</button></div>';
}
export {tensesHtml,PERS,REG,REGULAR,IRR,RU,TIER,TIER_NAME,addTier,MEAN,RUP,ruPhrase,TENSES,TMAP,DEFAULT_TENSES,IMP_PERS,isImp,persLabel,hasPerson,vt,base,basic,IMPF_IRR,IMPF,FUT_STEM,FUT,PART_IRR,part,HABER,HABER_SE,SP_OVR,SP_NOS_IR,SP_NOS_INF,spell,SP_END,subjPres,raForm,subjImpf,altForm,IMP_TU,IMP_ROOT,imperative,form,F,PN,ACC,plain,listF,SPELL_RULE,stemChange,kindBasic,whyBasic,whySp,HABER_NAME,explain,regularForm,hintRegular,hintBasic,hintSp,hintRule,hintEndings,COND};
