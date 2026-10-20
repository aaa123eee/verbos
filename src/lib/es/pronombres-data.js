// Data for the pronouns page, covering every verb of the engine that it applies to.
//
// OBJ: verbs with a direct object. "verb io|object; object; …" — io = 1 if "a alguien" (an indirect object) is natural.
// An object is "article noun" (the pronoun follows the article: el → lo, la → la, los → los, las → las)
// or "phrase=pronoun" when the article doesn't tell it (personal a: "a tu madre=la", or "el agua=la").
const OBJ_SRC = `
dar 1|el libro; la llave; los regalos; las fotos
decir 1|la verdad; el secreto; las noticias
traer 1|el café; la cuenta; los platos
mandar 1|la carta; el mensaje; los documentos
enviar 1|el paquete; las fotos; la invitación
explicar 1|el problema; la regla; los ejercicios
enseñar 1|la ciudad; las fotos; el camino
mostrar 1|el piso; las fotos; el camino
comprar 1|el regalo; la camiseta; los zapatos; las flores
regalar 1|el libro; las flores; la bicicleta
devolver 1|el dinero; las llaves; los libros
pedir 1|el favor; la cuenta; los documentos
vender 1|el coche; la casa; los muebles
escribir 1|la carta; el correo; las postales
contar 1|la historia; el chiste; los detalles
entregar 1|el informe; las llaves; la tarea
ofrecer 1|el trabajo; la ayuda; los dulces
preparar 1|la cena; el desayuno; los bocadillos
leer 1|el cuento; la carta; las noticias
llevar 1|la maleta; el abrigo; los niños; las bolsas
hablar 0|el español; el inglés; el francés
cantar 1|la canción; el himno; las canciones
escuchar 0|la música; el disco; las noticias; la radio
comer 0|la manzana; el pan; los dulces; las verduras
beber 0|el agua=la; la leche; el vino
aprender 0|la lección; el idioma; las palabras
abrir 1|la puerta; la ventana; el regalo; las cajas
llamar 0|a tu madre=la; al médico=lo; el taxi
pasar 1|la sal; el balón; los platos
tomar 0|el café; el autobús; la medicina; las pastillas
esperar 0|el autobús; el tren; a tus amigos=los
mirar 0|la televisión; el mapa; las fotos
necesitar 0|el dinero; la ayuda; las llaves
ayudar 0|a tu hermano=lo; a la vecina=la; a los niños=los
cambiar 1|el dinero; la rueda; las sábanas
dejar 1|las llaves; el coche; la propina
terminar 0|el trabajo; la tarea; los deberes
usar 0|el ordenador; la tarjeta; las tijeras
preguntar 1|la hora; el precio; la dirección
olvidar 0|las llaves; el paraguas; la contraseña
recibir 0|el paquete; la carta; los regalos
subir 1|la maleta; las bolsas; el volumen
crear 0|la empresa; el programa; los diseños
presentar 1|el proyecto; el informe; a tu novia=la
lograr 0|el objetivo; la victoria
desarrollar 0|el proyecto; la idea; los planes
señalar 1|el camino; la salida; los errores
acabar 0|el libro; la cena; los deberes
contestar 1|la pregunta; el correo; las cartas
ganar 0|el partido; la carrera; los premios
gastar 0|el dinero; la paga; los ahorros
guardar 1|el secreto; la comida; los documentos
estudiar 0|el tema; las reglas; la historia
limpiar 1|la casa; el coche; los platos
cocinar 1|la cena; el arroz; las patatas
bailar 0|el tango; la salsa
visitar 0|el museo; la ciudad; a tus abuelos=los
invitar 0|a tus amigos=los; a María=la; a los vecinos=los
cuidar 0|el jardín; a los niños=los; la casa
celebrar 0|el cumpleaños; la victoria; las fiestas
amar 0|a su mujer=la; a sus hijos=los
odiar 0|el frío; la lluvia; los lunes
arreglar 1|el coche; la bicicleta; los zapatos
desear 1|la suerte; el éxito
evitar 0|el tráfico; los problemas; la pregunta
pintar 1|la pared; el cuadro; las puertas
fumar 0|el cigarro; la pipa
firmar 1|el contrato; la carta; los papeles
alquilar 1|el piso; la casa; el coche
aceptar 0|la oferta; el trabajo; las condiciones
apoyar 0|la idea; el proyecto; a sus compañeros=los
aumentar 1|el sueldo; el precio
bajar 1|la maleta; el volumen; las persianas
cortar 1|el pan; la carne; el pelo
dibujar 1|el mapa; la casa; los planos
echar 1|la sal; el azúcar; la basura
levantar 0|la mano; la caja; las cajas
matar 0|el mosquito; la araña
notar 0|el cambio; la diferencia
observar 0|el cielo; las estrellas; el paisaje
ocupar 0|el asiento; la mesa; el sitio
parar 0|el coche; el taxi; la música
quitar 1|el abrigo; las llaves; los zapatos
robar 1|el bolso; la cartera; el dinero
salvar 0|la vida; el gato; a los niños=los
separar 0|la basura; los papeles; a los niños=los
tirar 1|la basura; el balón; las piedras
votar 0|la ley; la propuesta
ahorrar 0|el dinero; el agua=la; la energía
lavar 1|la ropa; el coche; los platos
mejorar 0|el texto; la oferta; los resultados
comprender 0|la pregunta; el problema; las reglas
responder 1|la pregunta; el correo; las cartas
prometer 1|el viaje; la bicicleta; el regalo
romper 1|el vaso; la ventana; los platos
meter 0|la ropa; el dinero; las llaves
esconder 1|el dinero; la llave; los regalos
sorprender 0|a tu madre=la; a los niños=los
cumplir 0|la promesa; las reglas; el plan
permitir 1|la entrada; el uso; las visitas
compartir 0|la comida; el piso; las fotos
discutir 0|el plan; el precio; los detalles
partir 1|el pan; la tarta; las naranjas
añadir 0|la sal; el azúcar; los huevos
unir 0|las piezas; los cables
admitir 0|el error; la culpa; los fallos
dividir 0|el pastel; la tarta; los gastos
describir 1|la casa; el paisaje; los detalles
descubrir 0|el secreto; la verdad; los errores
cubrir 0|la mesa; el sofá; las plantas
tener 0|el pasaporte; la llave; las entradas
hacer 1|la cena; la tarea; los deberes; el favor
poner 1|la mesa; la tele; los platos
saber 0|la respuesta; la verdad; los nombres
ver 0|la película; el partido; las fotos
buscar 1|las llaves; el móvil; el trabajo
empezar 0|el libro; la clase; los deberes
conocer 0|la ciudad; el barrio; a tus padres=los
oír 0|la música; el ruido; las noticias
encontrar 1|las llaves; el móvil; la solución
seguir 0|el camino; las instrucciones; el consejo
creer 0|la historia; las noticias
entender 0|la pregunta; el problema; las instrucciones
perder 0|las llaves; el tren; el partido
recordar 1|la cita; el nombre; las reglas
preferir 0|el café; la playa; las vacaciones
servir 1|la sopa; el vino; los platos
repetir 1|la pregunta; el número; las palabras
conducir 0|el coche; la moto; el camión
pagar 1|la cuenta; el alquiler; las facturas
sacar 1|la basura; la foto; las entradas
tocar 0|la guitarra; el piano; la puerta
querer 0|el helado; la casa; los zapatos
practicar 0|el español; la natación; el piano
colocar 0|los libros; la silla; las flores
dedicar 1|el libro; la canción; las fotos
indicar 1|el camino; la salida; la dirección
marcar 0|el número; el gol; las respuestas
aplicar 0|la regla; la crema; las normas
publicar 0|el libro; la noticia; las fotos
comunicar 1|la noticia; la decisión; los resultados
apagar 0|la luz; el ordenador; las velas
cruzar 0|la calle; el puente; el río
organizar 1|la fiesta; el viaje; las reuniones
utilizar 0|el móvil; la tarjeta; las herramientas
alcanzar 1|la sal; el libro; la meta
realizar 0|el proyecto; la tarea; los cambios
lanzar 1|la pelota; el balón; las piedras
abrazar 0|a su madre=la; a los niños=los
coger 1|el autobús; el taxi; las llaves
escoger 0|el regalo; la ropa; los colores
recoger 1|los juguetes; la ropa; a los niños=los
proteger 0|el medio ambiente; la casa; a los niños=los
dirigir 0|la empresa; el proyecto; la película
exigir 1|el dinero; la verdad; las explicaciones
elegir 1|el regalo; la ropa; el vino
corregir 1|el examen; los errores; las faltas
reconocer 0|el error; la voz; a su amigo=lo
establecer 0|las reglas; el horario; la fecha
merecer 0|el premio; el descanso
agradecer 1|el regalo; la ayuda; los consejos
obedecer 0|las reglas; las órdenes; a sus padres=los
traducir 1|el texto; la carta; los documentos
producir 0|el vino; el aceite; los coches
reducir 0|el precio; la velocidad; los gastos
introducir 0|la tarjeta; el código; los datos
construir 1|la casa; el puente; los muebles
destruir 0|el edificio; la ciudad; las pruebas
incluir 0|el desayuno; la bebida; los gastos
distribuir 0|la comida; los folletos; las tareas
concluir 0|el informe; la reunión; el trabajo
sustituir 0|la pieza; el profesor; las ruedas
cerrar 1|la puerta; la ventana; los ojos
despertar 0|a los niños=los; a su hermano=lo
recomendar 1|el libro; la película; el restaurante
negar 1|el permiso; la entrada; los hechos
comenzar 0|el curso; la reunión; los estudios
encender 1|la luz; el ordenador; las velas
defender 0|la idea; el país; a sus amigos=los
extender 0|el mapa; la mano; los brazos
atender 0|a los clientes=los; el teléfono; la llamada
probar 1|la sopa; el vino; los zapatos
aprobar 0|el examen; la ley; los cambios
demostrar 1|la teoría; la verdad; los hechos
colgar 0|el abrigo; el cuadro; las fotos
mover 0|la mesa; el coche; las sillas
resolver 1|el problema; la duda; los ejercicios
envolver 1|el regalo; los paquetes; la caja
morder 0|la manzana; el hueso
sugerir 1|la idea; el plan; los cambios
vestir 0|a los niños=los; al bebé=lo
medir 0|la habitación; la mesa; las ventanas
despedir 0|a los trabajadores=los; al empleado=lo
impedir 1|la entrada; el paso
conseguir 1|las entradas; el trabajo; la beca
continuar 0|el trabajo; la historia; los estudios
prohibir 1|la entrada; el alcohol; las visitas
mantener 0|la casa; el ritmo; la calma
obtener 0|el título; el permiso; los resultados
sostener 1|la puerta; la bolsa; el bebé
detener 0|el coche; al ladrón=lo; a los sospechosos=los
proponer 1|el plan; la idea; los cambios
componer 0|la canción; la música; los poemas
prevenir 0|los accidentes; la enfermedad
deshacer 0|la maleta; la cama; los nudos
atraer 0|a los turistas=los; la atención; los clientes
distraer 0|a los niños=los; al conductor=lo
poseer 0|la casa; las tierras
sentar 0|al bebé=lo; a los invitados=los
acostar 0|a los niños=los; al bebé=lo
divertir 0|a los niños=los; al público=lo
`;

const ART = { el: "lo", la: "la", los: "los", las: "las", al: "lo" };
export const OBJ = Object.fromEntries(OBJ_SRC.trim().split("\n").map((l) => {
  const [head, objs] = l.split("|"), [v, io] = head.split(" ");
  return [v, { io: io === "1", objs: objs.split("; ").map((o) => {
    const [ph, pr] = o.split("=");
    return { ph, pr: pr || ART[ph.split(" ")[0]] };
  }) }];
}));

// REFL: every verb with a common pronominal (se) use, with the Russian meaning of that use
export const REFL = {
  levantar: "вставать", quedar: "оставаться", llamar: "называться (меня зовут)", lavar: "мыться", ir: "уходить", sentir: "чувствовать себя",
  dormir: "засыпать", poner: "надевать; становиться", quitar: "снимать (с себя)", parecer: "быть похожим", olvidar: "забывать",
  mover: "двигаться", preparar: "готовиться", cuidar: "беречь себя", perder: "теряться, заблудиться", caer: "падать",
  arreglar: "собираться, наряжаться", vestir: "одеваться", sentar: "садиться", despertar: "просыпаться", acostar: "ложиться спать",
  divertir: "веселиться", acordar: "помнить, вспоминать", equivocar: "ошибаться", llevar: "ладить; уносить с собой", pasar: "заходить, перебарщивать",
  tomar: "выпивать, съедать (tomarse un café)", mirar: "смотреть на себя", cambiar: "переодеваться", acabar: "заканчиваться (у кого-то)",
  esconder: "прятаться", romper: "ломаться; ломать себе (руку)", meter: "вмешиваться; залезать", sorprender: "удивляться",
  unir: "присоединяться", separar: "расходиться, расставаться", parar: "останавливаться", bajar: "выходить (из транспорта)",
  subir: "садиться (в транспорт)", cortar: "порезаться; подстричься", echar: "ложиться; бросаться", mejorar: "поправляться",
  dedicar: "заниматься (чем-то)", convertir: "становиться, превращаться", despedir: "прощаться", detener: "останавливаться",
  encontrar: "встречаться; находиться", volver: "оборачиваться; становиться", negar: "отказываться", morir: "умирать",
  ocupar: "заниматься (чем-то)", preguntar: "задаваться вопросом", imaginar: "представлять себе", decidir: "решаться",
  mantener: "держаться", hacer: "становиться, делаться", distraer: "отвлекаться", dirigir: "обращаться; направляться",
  establecer: "поселяться", presentar: "представляться", comunicar: "общаться", organizar: "организоваться, распланировать",
  apoyar: "опираться", cubrir: "укрываться", proteger: "защищаться", defender: "защищаться", probar: "примерять",
  conocer: "знакомиться", comer: "съедать (целиком)", beber: "выпивать (целиком)",
  duchar: "принимать душ", preocupar: "волноваться", enfadar: "злиться", casar: "жениться, выходить замуж",
  afeitar: "бриться", peinar: "причёсываться", quejar: "жаловаться",
};
