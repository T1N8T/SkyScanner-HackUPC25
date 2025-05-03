import unittest
from unittest.mock import patch
import sys
import os
import google.generativeai as genai

# Añadir el directorio backend al path para importar app.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import buscar_vuelos_presupuesto

class TestBuscarVuelosPresupuesto(unittest.TestCase):
    @patch("app.crear_busqueda")
    @patch("app.obtener_resultados")
    @patch("app.extraer_datos_clientes")
    @patch("app.media_ponderada_presupuesto")
    def test_buscar_vuelos_presupuesto(self, mock_media, mock_extraer, mock_resultados, mock_crear):
        # Mock presupuesto medio
        mock_media.return_value = 100

        # Mock clientes con IATA y fechaInicio
        mock_extraer.return_value = [
            {"iata": "MAD", "fechaInicio": "2025-05-18"},
            {"iata": "BCN", "fechaInicio": "2025-05-18"}
        ]

        # Mock crear_busqueda devuelve un token
        mock_crear.return_value = "fake_token"

        # Mock resultados de Skyscanner
        mock_resultados.return_value = {
            "content": {
                "results": {
                    "itineraries": {
                        "it1": {
                            "pricingOptions": [
                                {"price": {"amount": 90}}
                            ]
                        },
                        "it2": {
                            "pricingOptions": [
                                {"price": {"amount": 120}}
                            ]
                        }
                    }
                }
            }
        }

        # Prepara trip_candidates.json con un trip_id de prueba
        trip_id = "test_trip"
        trip_candidates = [
            {"trip_id": trip_id, "iatas": ["LON", "PAR"]}
        ]
        with open(os.path.join("db", "trip_candidates.json"), "w", encoding="utf-8") as f:
            import json
            json.dump(trip_candidates, f, ensure_ascii=False, indent=2)

        resultados = buscar_vuelos_presupuesto(trip_id)
        # Solo debe devolver el vuelo con precio <= 100
        self.assertTrue(any(r["precio"] == 90 for r in resultados))
        self.assertFalse(any(r["precio"] == 120 for r in resultados))

if __name__ == "__main__":
    unittest.main()