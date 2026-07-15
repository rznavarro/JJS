// GET  /api/mensajes?leadId=recXXX  → trae mensajes de esa conversación
// POST /api/mensajes                → guarda un mensaje nuevo
//   monto (opcional, Number) → si viene, el mensaje se renderiza como tarjeta de cotización
module.exports = async function handler(req, res) {
  const H    = { Authorization: "Bearer " + process.env.AIRTABLE_API_KEY, "Content-Type": "application/json" };
  const BASE = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { leadId } = req.query;
    if (!leadId) return res.status(400).json({ error: "leadId requerido" });

    try {
      const formula = encodeURIComponent(`{lead_id}="${leadId}"`);
      const r = await fetch(
        `${BASE}/${process.env.AIRTABLE_MENSAJES}?filterByFormula=${formula}&sort[0][field]=creado_en&sort[0][direction]=asc&maxRecords=200`,
        { headers: H }
      );
      const data = await r.json();
      const mensajes = (data.records || []).map(rec => ({
        id:        rec.id,
        lead_id:   rec.fields.lead_id  || "",
        texto:     rec.fields.texto    || "",
        de:        rec.fields.de       || "cliente",
        monto:     rec.fields.monto    || 0,
        creado_en: rec.createdTime,
      }));
      return res.json({ mensajes });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST ──────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { leadId, texto, de, monto } = req.body || {};
    if (!leadId || !texto || !de) return res.status(400).json({ error: "leadId, texto y de son requeridos" });
    if (!["cliente", "maestro"].includes(de)) return res.status(400).json({ error: "de debe ser 'cliente' o 'maestro'" });

    const montoNum = Number(monto) || 0;
    const fields = { lead_id: leadId, texto, de };
    if (montoNum > 0) fields.monto = montoNum;

    try {
      const r = await fetch(`${BASE}/${process.env.AIRTABLE_MENSAJES}`, {
        method: "POST",
        headers: H,
        body: JSON.stringify({ fields }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      return res.json({
        ok: true,
        mensaje: { id: data.id, lead_id: leadId, texto, de, monto: montoNum, creado_en: data.createdTime },
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
};
