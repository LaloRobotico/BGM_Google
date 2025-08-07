
from flask import Flask, render_template, request, jsonify
import speech_recognition as sr
import random
import os
from fpdf import FPDF
from time import localtime, asctime
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText 
from email.mime.application import MIMEApplication
import requests

app = Flask(__name__)

# Configuración del servidor SMTP
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
SMTP_USERNAME   = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD   = os.getenv("SMTP_PASSWORD")   # ⚠️ Reemplaza con tu contraseña o App Password

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "models/gemini-2.0-flash"
GEMINI_URL = (
    f'https://generativelanguage.googleapis.com/v1beta/'
    f'{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}'
)
Edad = ""
Animal_favorito = ""
Nombre = ""
respuestas_usuario = []
respuestas_mia = []
preguntasHechasPorMIA = []

historial_txt = "Preguntas y respuestas.txt"
archivo_respuestas = open(historial_txt, "w", encoding="utf-8")

archivo_respuestas.write(asctime(localtime()) + "\n")
archivo_respuestas.write("BullyGuard MIA RELOADED\n\n")

def generar_pdf(nombre_txt, carpeta="reportes"):
    if not os.path.exists(carpeta):
        os.makedirs(carpeta)
    with open(nombre_txt, "r", encoding="utf-8") as file:
        contenido = file.read()
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, contenido)
    numero_reporte = 1
    while os.path.exists(f"{carpeta}/reporte_{numero_reporte}.pdf"):
        numero_reporte += 1
    nombre_pdf = f"{carpeta}/reporte_{numero_reporte}.pdf"
    pdf.output(nombre_pdf)
    return nombre_pdf

@app.route("/")
def index():
    global Nombre, Edad, Animal_favorito, lista_3_variables, pregunta_IA, Respuesta_IA, Pregunta_final_de_IA, pregunta_Quieres_agregar
    Nombre = ''
    Edad = ''
    Animal_favorito = ''
    lista_3_variables = []
    pregunta_IA = ''
    Respuesta_IA = ''
    Pregunta_final_de_IA = ''
    pregunta_Quieres_agregar = ''
    return render_template('index.html')

@app.route("/interactuar", methods=["POST"])
def interactuar():
    global Edad
    data = request.get_json()
    mensaje = data.get("mensaje", "")
    edad = Edad or "10"

    system_text = (
        f"Soy un niño de {edad} años de edad; contesta esta pregunta "
        f"en un resumen máximo de 80 palabras: {mensaje}"
    )

    payload = {
        "contents": [{"parts": [{"text": system_text}]}],
        "generationConfig": {"temperature": 0.7, "topK": 40, "topP": 1.0, "maxOutputTokens": 130}
    }
    try:
        resp = requests.post(GEMINI_URL, json=payload, timeout=15)
        resp.raise_for_status()
        data_g = resp.json()
        texto_respuesta = data_g["candidates"][0]["content"]["parts"][0]["text"]
        archivo_respuestas.write(f"Niño: {mensaje}\nMIA: {texto_respuesta}\n\n")
        return jsonify({"respuesta": texto_respuesta})
    except Exception as e:
        print("Error en /interactuar:", e)
        return jsonify({"respuesta": "Hubo un problema al procesar la respuesta."})

@app.route('/reiniciar', methods=['POST'])
def reiniciar():
    with open("Preguntas y respuestas.txt", "w", encoding="utf-8") as f:
        f.write("")  # Limpia el archivo
    # Aquí también puedes reiniciar variables globales si hace falta
    return jsonify({"status": "ok"})


@app.route("/guardar_dato", methods=["POST"])
def guardar_dato():
    global Nombre, Edad, Animal_favorito
    data = request.get_json()
    tipo = data.get("tipo")
    valor = data.get("valor")
    if tipo == "nombre":
        Nombre = valor
    elif tipo == "edad":
        Edad = valor
    elif tipo == "animal":
        Animal_favorito = valor
    archivo_respuestas.write(f"{tipo.capitalize()}: {valor}\n")
    return jsonify({"estado": "ok"})

@app.route("/guardar_respuesta_mia", methods=["POST"])
def guardar_mia():
    global respuestas_mia
    data = request.get_json()
    respuesta = data.get("respuesta")
    respuestas_mia.append(respuesta)

    # Guardar en el archivo
    with open(historial_txt, "a", encoding="utf-8") as f:
        f.write(f"MIA: {respuesta}\n\n")

    return jsonify({"estado": "ok"})


@app.route("/guardar_respuesta_nino", methods=["POST"])
def guardar_nino():
    global respuestas_usuario
    data = request.get_json()
    respuesta = data.get("respuesta")
    respuestas_usuario.append(respuesta)

    # Guardar en el archivo
    with open(historial_txt, "a", encoding="utf-8") as f:
        f.write(f"Niño: {respuesta}\n")

    return jsonify({"estado": "ok"})

@app.route("/guardar_pregunta_mia", methods=["POST"])
def guardar_pregunta_mia():
    global preguntasHechasPorMIA
    data = request.get_json()
    pregunta = data.get("pregunta")
    preguntasHechasPorMIA.append(pregunta) 

    with open(historial_txt, "a", encoding="utf-8") as f:
        f.write(f"MIA pregunta: {pregunta}\n")
    
    return jsonify({"estado": "ok"})


@app.route("/analizar", methods=["POST"])
def analizar():
    global respuestas_usuario, respuestas_mia, preguntasHechasPorMIA, Edad, Animal_favorito, historial_txt
    todo = respuestas_usuario + respuestas_mia
    system1 = (
        f"Eres un psicólogo infantil especializado en bullying. Con un máximo de 100 palabras si detectas señales de bullying"
        f"da un consejo directo al niño. Si no, cuenta un chiste tierno (no menciones bullying). El niño tiene {Edad} años y le gusta {Animal_favorito}. Esto dijo: {todo}"
               )
    payload1 = {
        "contents": [{"parts": [{"text": system1}]}],
        "generationConfig": {"temperature": 0.7, "topK": 40, "topP": 1.0, "maxOutputTokens": 150}
    }
    system2 = (
        f"Eres un psicólogo infantil que analiza si un niño sufre bullying. Con un máximo de 300 palabras basado en esto: {todo}"
    )
    payload2 = {
        "contents": [{"parts": [{"text": system2}]}],
        "generationConfig": {"temperature": 0.7, "topK": 40, "topP": 1.0, "maxOutputTokens": 400}
    }
    max_intentos = 3
    intento = 0
    text1 = text2 = None
    
    while intento < max_intentos:
        try:
            res1 = requests.post(GEMINI_URL, json=payload1, timeout=20)
            res1.raise_for_status()
            text1 = res1.json()["candidates"][0]["content"]["parts"][0]["text"]

            res2 = requests.post(GEMINI_URL, json=payload2, timeout=20)
            res2.raise_for_status()
            text2 = res2.json()["candidates"][0]["content"]["parts"][0]["text"]
            break
        except requests.exceptions.HTTPError as e:
                    status = e.response.status_code if e.response else None
                    if status == 503 and intento < max_intentos - 1:
                        intento += 1
                        time.sleep(1)
                        continue
                    print(f"Error en /analizar tras {intento+1} intentos: {e}")
                    return jsonify({"resultado": "Servicio temporalmente no disponible. Intenta de nuevo más tarde."})

        except Exception as e:
                    print(f"Error inesperado en /analizar: {e}")
                    return jsonify({"resultado": "Hubo un problema en el analisis"})
    if text1 and text2:
        with open(historial_txt, "a", encoding="utf-8") as f:
            f.write("\n*** Preguntas de MIA y respuestas del niño ***\n")
            for p, r in zip(preguntasHechasPorMIA, respuestas_mia):
                f.write(f"MIA: {p}\nNiño: {r}\n\n")
            f.write("*** Consejo o chiste ***\n")
            f.write(text1 + "\n\n")
            f.write("*** Análisis de bullying ***\n")
            f.write(text2 + "\n\n")
            f.write("Nota: El uso de esta tecnología no sustituye el diagnotisco y la atencion de un profecional de la salud.\n\n")
        generar_pdf(historial_txt)
        return jsonify({"resultado": text1})
    return jsonify({"resultado": "Hubo un problema en el analisis"})

@app.route('/enviar_reporte', methods=['POST'])
def enviar_reporte():
    data = request.get_json()
    email_destino = data.get('email')

    if not email_destino or '@' not in email_destino:
        return jsonify({'status': 'error', 'message': 'Correo inválido'})

    nombre_pdf = generar_pdf("Preguntas y respuestas.txt")

    mensaje = MIMEMultipart()
    mensaje['From'] = SMTP_USERNAME
    mensaje['To'] = email_destino
    mensaje['Subject'] = 'Reporte generado por MIA'

    cuerpo = MIMEText("Hola, adjunto encontrarás el reporte generado por MIA.\n\nAtentamente,\nMIA")
    mensaje.attach(cuerpo)

    with open(nombre_pdf, 'rb') as f:
        parte = MIMEApplication(f.read(), Name=os.path.basename(nombre_pdf))
        parte['Content-Disposition'] = f'attachment; filename="{os.path.basename(nombre_pdf)}"'
        mensaje.attach(parte)

    try:
        servidor = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        servidor.starttls()
        servidor.login(SMTP_USERNAME, SMTP_PASSWORD)
        servidor.send_message(mensaje)
        servidor.quit()
        return jsonify({'status': 'ok'})
    except Exception as e:
        print(f"Error al enviar correo: {e}")
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
