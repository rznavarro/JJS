// POST /api/resenas
// Body: { maestroId, estrellas, texto, nombre_cliente }
// Guarda la reseña y recalcula el promedio de calificación del maestro, que es lo que
// se le muestra al cliente y lo que en el futuro puede usarse para priorizar matches.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { maestroId, estrellas, texto, nombre_cliente } = req.body || {};
  if (!maestroId || !estrellas) return res.status(400).json({ error: "maestroId y estrellas son requeridos" });

  const H    = { Authorization: "Bearer " + process.env.AIRTABLE_API_KEY, "Content-Type": "application/json" };
  const BASE = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;

  try {
    await fetch(`${BASE}/${process.env.AIRTABLE_RESEÑAS}`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        fields: {
          maestro:        [maestroId],
          estrellas:      Number(estrellas),
          texto:          texto || "",
          nombre_cliente: nombre_cliente || "",
        },
      }),
    });

    // Recalcular calificación promedio del maestro. Airtable no permite filtrar directo
    // por ID dentro de un link field con filterByFormula, así que traemos las reseñas
    // recientes y filtramos acá (suficiente para el volumen actual del negocio).
    const rRes  = await fetch(`${BASE}/${process.env.AIRTABLE_RESEÑAS}?maxRecords=100&sort[0][field]=estrellas&sort[0][direction]=desc`, { headers: H });
    const rData = await rRes.json();
    const delMaestro = (rData.records || []).filter(r => (r.fields.maestro || []).includes(maestroId));
    const promedio = delMaestro.length
      ? delMaestro.reduce((sum, r) => sum + (Number(r.fields.estrellas) || 0), 0) / delMaestro.length
      : Number(estrellas);
    const promedioRedondeado = Math.round(promedio * 10) / 10;

    await fetch(`${BASE}/${process.env.AIRTABLE_MAESTROS}/${maestroId}`, {
      method: "PATCH",
      headers: H,
      body: JSON.stringify({ fields: { "Calificación promedio": promedioRedondeado } }),
    });

    res.json({ ok: true, promedio: promedioRedondeado });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
