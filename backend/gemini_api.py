from google import genai
from dotenv import load_dotenv
from prompts import *
import os

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# Obtener la API Key desde las variables de entorno
api_key = os.getenv("GEMINI_API_KEY")

# Crear el cliente de GenAI
client = genai.Client(api_key=api_key)

def obtener_iatas_con_gemini(origen):
    prompt = (
        f"Dame solo una lista separada por comas de los códigos IATA de todos los aeropuertos "
        f"de la ciudad de {origen} (puede haber más de uno, por ejemplo en Londres). "
        f"Devuélveme solo los códigos IATA, sin explicaciones."
    )
    response = client.models.generate_content(
        model="gemini-2.0-flash", contents=prompt,
    )
    # Procesar la respuesta para obtener una lista de IATA
    texto = response.text.strip()
    # Quitar posibles palabras y dejar solo los códigos
    # Ejemplo de respuesta: "LHR, LGW, LCY, STN, LTN"
    iatas = [iata.strip().upper() for iata in texto.replace('\n', ',').split(',') if iata.strip()]
    return iatas

def obtener_recomendacion_gemini(trip_id):
    promt = obtener_prompt_recomendacion(trip_id)
    if "No se encontraron aeropuertos" in promt["prompt"]:
        return promt["prompt"]
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=promt["prompt"]
    )
    return response.text.strip()