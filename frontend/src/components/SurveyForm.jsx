import { useState } from "react";

export default function SurveyForm() {
  const [form, setForm] = useState({
    nombre: "",
    interes: "",
    presupuesto: "",
  });
  const [enviado, setEnviado] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch("http://localhost:5000/api/submit-survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEnviado(true);
  };

  if (enviado) return <p>¡Gracias por responder!</p>;

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
      <button type="submit">Enviar</button>
    </form>
  );
}