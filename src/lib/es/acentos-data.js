// Data for the accents page. Every word is written correctly; tests check that each one follows the accent rules.
// "word|translation"
export const WORDS = `
canción|песня
corazón|сердце
ratón|мышь
jabón|мыло
avión|самолёт
camión|грузовик
balcón|балкон
limón|лимон
melón|дыня
salón|гостиная
estación|станция, вокзал
habitación|комната
información|информация
televisión|телевидение
lección|урок
razón|причина, разум
opinión|мнение
región|регион
reunión|собрание
sillón|кресло
cajón|ящик
pantalón|брюки
millón|миллион
autobús|автобус
inglés|английский
francés|французский
japonés|японский
portugués|португальский
interés|интерес
después|после
además|кроме того
también|тоже
jamás|никогда
quizás|может быть
atrás|назад
detrás|позади
café|кофе
sofá|диван
mamá|мама
papá|папа
bebé|младенец
menú|меню
champú|шампунь
colibrí|колибри
esquí|лыжи
bambú|бамбук
alemán|немецкий
capitán|капитан
almacén|склад
andén|перрон
ningún|никакой
algún|какой-нибудь
común|общий
atún|тунец
según|согласно
aquí|здесь
allí|там
así|так
reloj|часы
ciudad|город
verdad|правда
universidad|университет
pared|стена
salud|здоровье
hotel|отель
papel|бумага
animal|животное
español|испанский
azul|синий
color|цвет
calor|жара
amor|любовь
mujer|женщина
feliz|счастливый
actriz|актриса
nariz|нос
arroz|рис
capaz|способный
usted|вы
señor|господин
profesor|учитель
doctor|врач
hospital|больница
final|конец
árbol|дерево
fácil|лёгкий
difícil|трудный
útil|полезный
débil|слабый
móvil|мобильный
ágil|ловкий
frágil|хрупкий
lápiz|карандаш
césped|газон
cárcel|тюрьма
azúcar|сахар
carácter|характер
fútbol|футбол
túnel|туннель
mármol|мрамор
álbum|альбом
ángel|ангел
cráter|кратер
cóctel|коктейль
dólar|доллар
récord|рекорд
huésped|гость
hábil|умелый
fértil|плодородный
cadáver|труп
casa|дом
mesa|стол
libro|книга
joven|молодой
examen|экзамен
imagen|изображение
origen|происхождение
crimen|преступление
orden|порядок
volumen|объём
resumen|краткое изложение
lunes|понедельник
martes|вторник
crisis|кризис
virus|вирус
ventana|окно
puerta|дверь
escuela|школа
problema|проблема
zapato|ботинок
camisa|рубашка
música|музыка
médico|врач
teléfono|телефон
rápido|быстрый
pájaro|птица
sábado|суббота
miércoles|среда
plátano|банан
número|число
página|страница
lámpara|лампа
brújula|компас
máquina|машина, механизм
cámara|камера
química|химия
matemáticas|математика
último|последний
público|публика
océano|океан
película|фильм
gramática|грамматика
económico|экономический
fantástico|фантастический
simpático|симпатичный
práctico|практичный
político|политик
técnico|технический
clásico|классический
típico|типичный
murciélago|летучая мышь
relámpago|молния
búsqueda|поиск
sílaba|слог
vehículo|транспортное средство
artículo|статья
capítulo|глава
espíritu|дух
fábrica|фабрика
kilómetro|километр
círculo|круг
triángulo|треугольник
músculo|мышца
lágrima|слеза
pirámide|пирамида
sótano|подвал
día|день
país|страна
río|река
frío|холодный
tío|дядя
maíz|кукуруза
raíz|корень
oído|слух, ухо
baúl|сундук
búho|сова
todavía|ещё, пока
policía|полиция
alegría|радость
biología|биология
energía|энергия
geografía|география
economía|экономика
panadería|булочная
librería|книжный магазин
cafetería|кафе
tranvía|трамвай
garantía|гарантия
compañía|компания
sandía|арбуз
ataúd|гроб
egoísta|эгоист
increíble|невероятный
caída|падение
heroína|героиня
ahí|там (рядом)
bueno|хороший
tiempo|время
agua|вода
fuego|огонь
nieve|снег
cielo|небо
aire|воздух
causa|причина
viuda|вдова
ruido|шум
cuidado|осторожно
fue|он был, он пошёл
dio|он дал
vio|он увидел
fui|я был, я пошёл
pie|ступня
sol|солнце
mar|море
pan|хлеб
sal|соль
luz|свет
voz|голос
mes|месяц
tren|поезд
dos|два
tres|три
seis|шесть
diez|десять
rápidamente|быстро
fácilmente|легко
últimamente|в последнее время
cortésmente|вежливо
normalmente|обычно
felizmente|к счастью
lentamente|медленно
`.trim().split("\n").map((l) => { const [w, ru] = l.split("|"); return { w, ru }; });

// nouns for the plural task; irregular stress shifts are listed with their plural
export const PLURALS = `
canción|песня
corazón|сердце
avión|самолёт
estación|станция
lección|урок
examen|экзамен
joven|молодой человек
imagen|изображение
origen|происхождение
crimen|преступление
orden|порядок
volumen|объём
resumen|краткое изложение
inglés|англичанин
francés|француз
alemán|немец
interés|интерес
lápiz|карандаш
nariz|нос
actriz|актриса
luz|свет
voz|голос
pez|рыба
país|страна
maíz|кукуруза
raíz|корень
baúl|сундук
árbol|дерево
ciudad|город
pared|стена
reloj|часы
mujer|женщина
color|цвет
papel|бумага
animal|животное
móvil|мобильный телефон
autobús|автобус
mes|месяц
tren|поезд
sol|солнце
mar|море
rey|король
ley|закон
sofá|диван
café|кофе
menú|меню
bebé|младенец
lunes|понедельник
crisis|кризис
carácter|характер|caracteres
régimen|режим|regímenes
`.trim().split("\n").map((l) => { const [w, ru, pl] = l.split("|"); return { w, ru, pl }; });

// written accent that tells two words apart; "s" has ___ where the word goes, "w" is the right word, "pair" the two spellings
export const DIACRITIC = [
  { s: "¿___ vienes a la fiesta?", w: "tú", pair: "tú / tu", ru: "Ты придёшь на вечеринку?" },
  { s: "¿Dónde está ___ coche?", w: "tu", pair: "tú / tu", ru: "Где твоя машина?" },
  { s: "___ hermana es muy simpática.", w: "tu", pair: "tú / tu", ru: "Твоя сестра очень милая." },
  { s: "Lo haces ___ mejor que yo.", w: "tú", pair: "tú / tu", ru: "Ты делаешь это лучше меня." },
  { s: "Esto es para ___.", w: "ti", pair: "ti", ru: "Это для тебя." },
  { s: "___ libro está en la mesa.", w: "el", pair: "él / el", ru: "Книга на столе." },
  { s: "Este regalo es para ___.", w: "él", pair: "él / el", ru: "Этот подарок для него." },
  { s: "___ siempre llega tarde.", w: "él", pair: "él / el", ru: "Он всегда опаздывает." },
  { s: "Vamos a ver ___ partido.", w: "el", pair: "él / el", ru: "Пойдём смотреть матч." },
  { s: "___ casa es tu casa.", w: "mi", pair: "mí / mi", ru: "Мой дом — твой дом." },
  { s: "¿Esto es para ___?", w: "mí", pair: "mí / mi", ru: "Это для меня?" },
  { s: "A ___ me gusta el café.", w: "mí", pair: "mí / mi", ru: "Мне нравится кофе." },
  { s: "Te presento a ___ madre.", w: "mi", pair: "mí / mi", ru: "Познакомься с моей мамой." },
  { s: "___ llueve, no salimos.", w: "si", pair: "sí / si", ru: "Если пойдёт дождь, мы не выйдем." },
  { s: "—¿Vienes? —___, claro.", w: "sí", pair: "sí / si", ru: "— Придёшь? — Да, конечно." },
  { s: "No sé ___ tiene tiempo.", w: "si", pair: "sí / si", ru: "Не знаю, есть ли у него время." },
  { s: "Dijo que ___.", w: "sí", pair: "sí / si", ru: "Он сказал, что да." },
  { s: "Habla mucho de ___ misma.", w: "sí", pair: "sí / si", ru: "Она много говорит о себе." },
  { s: "¿Quieres un ___?", w: "té", pair: "té / te", ru: "Хочешь чаю?" },
  { s: "___ quiero mucho.", w: "te", pair: "té / te", ru: "Я тебя очень люблю." },
  { s: "Prefiero el ___ verde.", w: "té", pair: "té / te", ru: "Я предпочитаю зелёный чай." },
  { s: "¿___ llamo mañana?", w: "te", pair: "té / te", ru: "Позвонить тебе завтра?" },
  { s: "Es la casa ___ mi abuela.", w: "de", pair: "dé / de", ru: "Это дом моей бабушки." },
  { s: "Quiero que me ___ el libro.", w: "dé", pair: "dé / de", ru: "Хочу, чтобы он дал мне книгу." },
  { s: "Espero que nos ___ una respuesta.", w: "dé", pair: "dé / de", ru: "Надеюсь, он даст нам ответ." },
  { s: "Soy ___ Rusia.", w: "de", pair: "dé / de", ru: "Я из России." },
  { s: "No ___ dónde está.", w: "sé", pair: "sé / se", ru: "Не знаю, где он." },
  { s: "___ llama Ana.", w: "se", pair: "sé / se", ru: "Её зовут Ана." },
  { s: "Ya lo ___.", w: "sé", pair: "sé / se", ru: "Я уже знаю." },
  { s: "Aquí ___ habla español.", w: "se", pair: "sé / se", ru: "Здесь говорят по-испански." },
  { s: "¿___ hora es?", w: "qué", pair: "qué / que", ru: "Который час?" },
  { s: "Creo ___ tienes razón.", w: "que", pair: "qué / que", ru: "Думаю, ты прав." },
  { s: "¡___ bonito!", w: "qué", pair: "qué / que", ru: "Как красиво!" },
  { s: "No sé ___ hacer.", w: "qué", pair: "qué / que", ru: "Не знаю, что делать." },
  { s: "El libro ___ compré es interesante.", w: "que", pair: "qué / que", ru: "Книга, которую я купил, интересная." },
  { s: "Dime ___ quieres.", w: "qué", pair: "qué / que", ru: "Скажи, что ты хочешь." },
  { s: "¿___ estás?", w: "cómo", pair: "cómo / como", ru: "Как дела?" },
  { s: "Es alto ___ su padre.", w: "como", pair: "cómo / como", ru: "Он высокий, как его отец." },
  { s: "No sé ___ se dice.", w: "cómo", pair: "cómo / como", ru: "Не знаю, как это сказать." },
  { s: "___ no llamaste, me fui.", w: "como", pair: "cómo / como", ru: "Раз ты не позвонил, я ушёл." },
  { s: "¿___ empieza la clase?", w: "cuándo", pair: "cuándo / cuando", ru: "Когда начинается урок?" },
  { s: "___ llego a casa, ceno.", w: "cuando", pair: "cuándo / cuando", ru: "Когда прихожу домой, ужинаю." },
  { s: "No me dijo ___ vuelve.", w: "cuándo", pair: "cuándo / cuando", ru: "Он не сказал мне, когда вернётся." },
  { s: "¿___ vives?", w: "dónde", pair: "dónde / donde", ru: "Где ты живёшь?" },
  { s: "Es la ciudad ___ nací.", w: "donde", pair: "dónde / donde", ru: "Это город, где я родился." },
  { s: "Pregúntale ___ está la estación.", w: "dónde", pair: "dónde / donde", ru: "Спроси его, где вокзал." },
  { s: "¿___ es ese chico?", w: "quién", pair: "quién / quien", ru: "Кто этот парень?" },
  { s: "Fue mi hermano ___ lo hizo.", w: "quien", pair: "quién / quien", ru: "Это сделал мой брат." },
  { s: "No sé ___ ha llamado.", w: "quién", pair: "quién / quien", ru: "Не знаю, кто звонил." },
  { s: "¿___ cuesta?", w: "cuánto", pair: "cuánto / cuanto", ru: "Сколько стоит?" },
  { s: "¡___ tiempo sin verte!", w: "cuánto", pair: "cuánto / cuanto", ru: "Сколько лет, сколько зим!" },
  { s: "Come ___ quieras.", w: "cuanto", pair: "cuánto / cuanto", ru: "Ешь сколько хочешь." },
  { s: "___ no ha llegado.", w: "aún", pair: "aún / aun", ru: "Он ещё не пришёл." },
  { s: "___ así, no lo creo.", w: "aun", pair: "aún / aun", ru: "Даже так я в это не верю." },
];

// why the accent is there (or not) in each pair
export const DIACRITIC_WHY = {
  "tú / tu": "tú с тильдой — местоимение «ты»; tu без тильды — «твой».",
  ti: "ti никогда не пишется с тильдой: это односложное слово, и пары у него нет.",
  "él / el": "él с тильдой — местоимение «он»; el без тильды — артикль.",
  "mí / mi": "mí с тильдой — «меня, мне» после предлога (para mí, a mí); mi без тильды — «мой».",
  "sí / si": "sí с тильдой — «да» или «себя» (de sí mismo); si без тильды — «если, ли».",
  "té / te": "té с тильдой — «чай»; te без тильды — местоимение «тебя, тебе».",
  "dé / de": "dé с тильдой — форма глагола dar (que me dé); de без тильды — предлог.",
  "sé / se": "sé с тильдой — «знаю» (saber) или «будь» (ser); se без тильды — местоимение.",
  "qué / que": "qué с тильдой — в прямом и косвенном вопросе и в восклицании; que без тильды — союз или «который».",
  "cómo / como": "cómo с тильдой — «как?» в вопросе (в том числе косвенном); como без тильды — «как, подобно» и «раз, так как».",
  "cuándo / cuando": "cuándo с тильдой — «когда?» в вопросе; cuando без тильды — союз «когда».",
  "dónde / donde": "dónde с тильдой — «где?» в вопросе; donde без тильды — «где, в котором».",
  "quién / quien": "quién с тильдой — «кто?» в вопросе; quien без тильды — «который, тот, кто».",
  "cuánto / cuanto": "cuánto с тильдой — «сколько?» в вопросе и восклицании; cuanto без тильды — «сколько, столько сколько».",
  "aún / aun": "aún с тильдой — «ещё» (= todavía); aun без тильды — «даже» (= incluso).",
};
