// POST  /api/maestros  Body: { fields }              → crea un maestro (postulación)
// PATCH /api/maestros  Body: { maestroId, fields }    → actualiza campos (ej. Disponible)
module.exports = async function handler(req, res) {
  const H   = { Authorization: "Bearer " + process.env.AIRTABLE_API_KEY, "Content-Type": "application/json" };
  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_MAESTROS}`;

  if (req.method === "POST") {
    try {
      const r = await fetch(url, { method: "POST", headers: H, body: JSON.stringify(req.body) });
      const data = await r.json();
      return res.status(r.status).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "PATCH") {
    const { maestroId, fields } = req.body || {};
    if (!maestroId || !fields) return res.status(400).json({ error: "maestroId y fields requeridos" });
    try {
      const r = await fetch(`${url}/${maestroId}`, { method: "PATCH", headers: H, body: JSON.stringify({ fields }) });
      const data = await r.json();
      return res.status(r.status).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
};
