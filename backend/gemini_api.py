from google import genai
from dotenv import load_dotenv
import os

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# Obtener la API Key desde las variables de entorno
api_key = os.getenv("GEMINI_API_KEY")

# Crear el cliente de GenAI
client = genai.Client(api_key=api_key)

# Generar contenido con el modelo
response = client.models.generate_content(
    model="gemini-2.0-flash", contents="dame lista de los 3 IATA más cercanos a la provincia de albacete",
)
print(response.text)