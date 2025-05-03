import { useState } from "react";

export default function SurveyForm() {
  const [form, setForm] = useState({
    nombre: "",
    interes: "",
    presupuesto: "",
    origen: "",
    destino: "",
    fecha: "",
  });
  const [enviado, setEnviado] = useState(false);
  const [resultados, setResultados] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Enviar datos del formulario al backend
    await fetch("http://localhost:5000/api/submit-survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    // Enviar datos de búsqueda de vuelos al backend
    const [año, mes, día] = form.fecha.split("-");
    const response = await fetch("http://localhost:5000/buscar_vuelo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origen: form.origen,
        destino: form.destino,
        año,
        mes,
        día,
      }),
    });

    const data = await response.json();
    console.log("Respuesta del backend:", data);
    setResultados(data.data);
    setEnviado(true);
  };

  if (enviado)
    return (
      <div>
        <p>Has hecho la consulta de vuelos con éxito.</p>
        {resultados && (
          <div>
            <h2>Resultados de vuelos:</h2>
            <pre>{JSON.stringify(resultados, null, 2)}</pre>
          </div>
        )}
      </div>
    );

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Nombre:
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          required
        />
      </label>
      <br />
      <label>
        ¿Qué te interesa más?
        <select
          name="interes"
          value={form.interes}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona una opción</option>
          <option value="playa">Playa</option>
          <option value="cultura">Cultura</option>
          <option value="comida">Comida</option>
          <option value="aventura">Aventura</option>
        </select>
      </label>
      <br />
      <label>
        Presupuesto máximo (€):
        <input
          name="presupuesto"
          type="number"
          value={form.presupuesto}
          onChange={handleChange}
          required
        />
      </label>
      <br />
      <label>
        Origen (IATA):
        <input
          name="origen"
          value={form.origen}
          onChange={handleChange}
          required
        />
      </label>
      <br />
      <label>
        Destino (IATA):
        <input
          name="destino"
          value={form.destino}
          onChange={handleChange}
          required
        />
      </label>
      <br />
      <label>
        Fecha:
        <input
          name="fecha"
          type="date"
          value={form.fecha}
          onChange={handleChange}
          required
        />
      </label>
      <br />
      <button type="submit">Consultar vuelos</button>
    </form>
  );
}