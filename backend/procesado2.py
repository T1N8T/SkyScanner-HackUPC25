import json

def filtrar_por_presupuesto(json_data, presupuesto_maximo):
    """
    Filtra los elementos de un JSON según un presupuesto máximo.

    Args:
        json_data (str): Cadena JSON con los datos.
        presupuesto_maximo (float): Presupuesto máximo permitido.

    Returns:
        list: Lista de elementos que cumplen con el presupuesto.
    """
    try:
        datos = json.loads(json_data)
        if not isinstance(datos, list):
            raise ValueError("El JSON debe contener una lista de elementos.")
        
        filtrados = [item for item in datos if item.get('precio', float('inf')) <= presupuesto_maximo]
        return filtrados
    except json.JSONDecodeError:
        print("Error: El JSON proporcionado no es válido.")
        return []
    except Exception as e:
        print(f"Error: {e}")
        return []

# Ejemplo de uso
if __name__ == "__main__":
    json_ejemplo = '''
    [
        {"nombre": "Producto 1", "precio": 50},
        {"nombre": "Producto 2", "precio": 150},
        {"nombre": "Producto 3", "precio": 30}
    ]
    '''
    presupuesto = 100
    resultado = filtrar_por_presupuesto(json_ejemplo, presupuesto)
    print("Elementos dentro del presupuesto:")
    print(resultado)

    