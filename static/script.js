
let preguntasNiño = 0;
let preguntasMIA = 0;
let preguntasHechasPorMIA = [];
const maxPreguntas = 3;
async function cargarVoces() {
    return new Promise((resolve) => {
        let voces = speechSynthesis.getVoices();
        if (voces.length !== 0) {
            resolve();
        } else {
            speechSynthesis.onvoiceschanged = () => resolve();
        }
    });
}

async function iniciarConversacion() {
    
    document.getElementById("btn-iniciar").style.display = "none";
    actualizarVinedaIA("Hola amigos de Grupo REFORMA, yo soy MIA, yo soy parte de una Inteligencia Artificial, yo puedo platicar contigo, me puedes preguntar lo que tú quieras, también yo te haré algunas preguntas, por cierto: ¿Me puedes decir tu nombre?");
    document.getElementById("robot").src = "/static/images/robot-hablando.png";

    await cargarVoces();
    await hablar(".");
    await hablar("Hola amigos de Grupo REFORMA, yo soy MIA, yo soy parte de una Inteligencia Artificial, yo puedo platicar contigo, me puedes preguntar lo que tú quieras, también yo te haré algunas preguntas, por cierto: ¿Me puedes decir tu nombre?");
    await escuchar("nombre");
}
async function escuchar(tipo) {
    document.getElementById("robot").src = "/static/images/robot-escuchando.png";

    try {
        const response = await fetch("/escuchar", { method: "POST" });
        const data = await response.json();

        if (!data.mensaje) {
            await hablar("No entendí, ¿puedes repetirlo?");
            return await escuchar(tipo);
        }

        actualizarVinedaUsuario(data.mensaje);

        if (tipo === "nombre") {
            await fetch("/guardar_dato", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tipo: "nombre", valor: data.mensaje })
            });
            await hablar(`Mucho gusto, ${data.mensaje}. ¿Cuántos años tienes?`);
            actualizarVinedaIA(`Mucho gusto, ${data.mensaje}. ¿Cuántos años tienes?`);
            await escuchar("edad");
        } else if (tipo === "edad") {
            await fetch("/guardar_dato", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tipo: "edad", valor: data.mensaje })
            });
            await hablar("Gracias, ahora dime, ¿cuál es tu animal favorito?");
            actualizarVinedaIA("Gracias, ahora dime, ¿cuál es tu animal favorito?");
            await escuchar("animal");
        } else if (tipo === "animal") {
            await fetch("/guardar_dato", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tipo: "animal", valor: data.mensaje })
            });
            await hablar("Interesante elección. Ahora puedes hacerme tres preguntas, Preguntame lo que quieras o cuentame algo.");
            actualizarVinedaIA("Interesante elección. Ahora puedes hacerme tres preguntas, Preguntame lo que quieras o cuentame algo");
            await escuchar("pregunta");
        } else if (tipo === "pregunta") {
            preguntasNiño++;
            await fetch("/guardar_respuesta_nino", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ respuesta: data.mensaje })
            });
            await obtenerRespuesta(data.mensaje);
        } else if (tipo === "pregunta_mia") {
            preguntasMIA++;
            await fetch("/guardar_respuesta_mia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ respuesta: data.mensaje })
            });
            if (preguntasMIA < maxPreguntas) {
                await hacerPreguntaMIA();
            } else {
                await preguntarAgregarAlgoMas();
            }
        } else if (tipo === "agregar") {
            await finalizarInteraccion();
        }
    } catch (error) {
        console.error("Error:", error);
        await hablar("Hubo un problema al escuchar, intenta nuevamente.");
        await escuchar(tipo);
    }
}

async function obtenerRespuesta(pregunta) {
    document.getElementById("robot").src = "/static/images/robot-pensando.png";
    try {
        const response = await fetch("/interactuar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensaje: pregunta })
        });
        const data = await response.json();
        if (data.respuesta) {
            actualizarVinedaIA(data.respuesta);
            await hablar(data.respuesta);

            if (preguntasNiño < maxPreguntas) {
                // ✅ Intercalar la frase solo después de la primera y segunda pregunta
                if (preguntasNiño === 1 || preguntasNiño === 2) {
                    await preguntame_lo_que_quieras();
                }
                await escuchar("pregunta");
            } else {
                await presentacionPreguntasMIA();
            }
        }
    } catch (error) {
        console.error("Error al obtener respuesta:", error);
    }
}

async function iniciarpreguntas() {
    document.getElementById("robot").src = "/static/images/robot-hablando.png";
    await hablar("Ahora yo te haré tres preguntas");
    await hacerPreguntaMA();
}


async function presentacionPreguntasMIA() {
    const mensaje = "Ahora yo te haré tres preguntas.";
    actualizarVinedaIA(mensaje);
    await hablar(mensaje);
    await hacerPreguntaMIA(); // Comienza con la primera pregunta
}

async function hacerPreguntaMIA() {
    const listaPreguntas = [
        "¿Cómo te sientes en la escuela o con tus amigos?",
        "¿Puedes contarme sobre alguna situación incómoda que hayas vivido recientemente?",
        "¿Has notado algún cambio en cómo te tratan otros niños?",
        "¿Alguien te ha dicho o hecho algo que te haya lastimado?",
        "¿Te incluyen o te dejan fuera de actividades?",
        "¿Cómo te llevas con tus compañeros de clase?",
        "¿Alguna vez te han amenazado o te han hecho sentir inseguro?",
        "¿Has observado comportamientos desagradables o agresivos hacia otros niños?",
        "¿Sientes que te pueden hablar sobre cualquier cosa sin temor a represalias?",
        "¿Hay algún compañero en tu escuela con quien tengas problemas?",
        "¿Tienes amigos con los que te llevas bien en la escuela?",
        "¿Te sientes cómodo o seguro en tu clase o durante el recreo?",
        "¿Has escuchado comentarios que te hagan sentir mal o desagradables hacia ti o hacia otros en la escuela?",
        "¿Con quién juegas en la escuela?",
        "¿Puedes contarme sobre alguien que sea tu amigo en la escuela?",
        "¿Alguna vez has visto que alguien le hace daño a otro niño?",
        "¿Cómo te sientes cuando llega el momento de ir a la escuela?",
        "¿Puedes decirme algo que te haya hecho sentir feliz en la escuela? ¿Y algo que te haya hecho sentir triste?",
        "¿Has notado que alguien se mete contigo o te dice cosas que te hacen sentir mal?",
        "¿Qué haces si alguien te trata de manera no amable?",
        "¿Te han dicho palabras que te hayan hecho sentir triste o enojado?",
        "¿Has hecho llorar a un niño?",
        "¿Te han dicho palabras hirientes?",
        "¿Te han golpeado en la escuela?",
        "¿Alguna vez te has sentido triste o asustado cuando estás con otros niños?"
    ];

    
    let pregunta;
    do {
        pregunta = listaPreguntas[Math.floor(Math.random() * listaPreguntas.length)];
    } while (preguntasHechasPorMIA.includes(pregunta));
    actualizarVinedaIA(pregunta);
    await hablar(pregunta);

    // 🟢 ENVÍA LA PREGUNTA AL BACKEND PARA QUE SE GUARDE
    await fetch("/guardar_pregunta_mia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: pregunta })
    });

    await escuchar("pregunta_mia");
}

async function preguntame_lo_que_quieras() {
    actualizarVinedaIA("Preguntame lo que quieras, o cuentame algo.");
    await hablar("Preguntame lo que quieras, o cuentame algo.");
}

async function preguntarAgregarAlgoMas() {
    actualizarVinedaIA("Muchas gracias por haber platicado conmigo. ¿Quieres agregar algo más?");
    await hablar("Muchas gracias por haber platicado conmigo. ¿Quieres agregar algo más?");
    await escuchar("agregar");
}

// Función para validar el formato del correo electrónico
function validarEmail(email) {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
}

async function finalizarInteraccion() {
    document.getElementById("robot").src = "/static/images/robot-pensando.png";
    const response = await fetch("/analizar", { method: "POST" });
    const data = await response.json();
    actualizarVinedaIA(data.resultado);
    await hablar(data.resultado);

    setTimeout(async () => {
        actualizarVinedaIA("Bye Bye, adiós.");
        await hablar("Bye Bye, adiós.");

        // Obtener el correo electrónico ingresado
        const email = document.getElementById("email").value.trim();

        // Validar el correo electrónico
        if (email && validarEmail(email)) {
            // Enviar el correo electrónico con el reporte
            const emailResponse = await fetch('/enviar_reporte', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            const emailData = await emailResponse.json();
            if (emailData.status === 'success') {
                console.log('Reporte enviado exitosamente.');
            } else {
                console.error('Error al enviar el reporte:', emailData.message);
            }
        } else {
            console.log('No se enviará el reporte por correo electrónico.');
        }

        // Reiniciar la aplicación
        await fetch('/reiniciar', { method: 'POST' });
        location.reload();
    }, 3000);
}


async function hablar(mensaje) {
    document.getElementById("robot").src = "/static/images/robot-hablando.png";
    return new Promise((resolve) => {
        const speech = new SpeechSynthesisUtterance(mensaje);
        const voces = speechSynthesis.getVoices();
        speech.voice = voces.find(voice => voice.name.includes("Microsoft Sabina")) || voces.find(v => v.lang.includes("es"));
        speech.rate = 1;
        speech.pitch = 1.5;
        speech.onend = () => {
            document.getElementById("robot").src = "/static/images/robot-pensando.png";
            resolve();
        };
        window.speechSynthesis.speak(speech);
    });
}

function actualizarVinedaIA(texto) {
    document.getElementById("texto-ia").innerText = texto;
}

function actualizarVinedaUsuario(texto) {
    document.getElementById("texto-usuario").innerText = texto;
}
