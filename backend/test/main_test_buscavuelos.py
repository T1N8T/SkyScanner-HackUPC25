import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from procesado import *

if __name__ == "__main__":
    trip_id = input("Introduce el trip_id a testear: ")
    iatas = buscar_vuelos_presupuesto(trip_id)
    print(f"IATAs seleccionados para el viaje '{trip_id}':")
    print(iatas)