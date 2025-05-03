from google import genai
from dotenv import load_dotenv
import os

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# Obtener la API Key desde las variables de entorno
api_key = os.getenv("GEMINI_API_KEY")

# Crear el cliente de GenAI
client = genai.Client(api_key=api_key)

def obtener_iata_con_gemini(origen):
    prompt = f"Dame solo el código IATA del aeropuerto más cercano a {origen} en España."
    response = client.models.generate_content(
        model="gemini-2.0-flash", contents=prompt,
    )
    # Extrae el IATA del texto de respuesta
    iata = response.text.strip().split()[0]  # Ajusta según el formato de respuesta
    return iata