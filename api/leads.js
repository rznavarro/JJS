module.exports = async function handler(req, res) {
  const H    = { Authorization: "Bearer " + process.env.AIRTABLE_API_KEY, "Content-Type": "application/json" };
  const BASE = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;

  // ── GET: historial de leads aceptados de un cliente ───────────────────────
  if (req.method === "GET") {
    const { clienteEmail } = req.query;
    if (!clienteEmail) return res.status(400).json({ error: "clienteEmail requerido" });

    try {
      const formula = encodeURIComponent(`AND({email_cliente}="${clienteEmail}",{estado}="aceptado")`);
      const r = await fetch(
        `${BASE}/${process.env.AIRTABLE_LEADS}?filterByFormula=${formula}&maxRecords=50&sort[0][field]=id_lead&sort[0][direction]=desc`,
        { headers: H }
      );
      const data = await r.json();
      const records = data.records || [];

      // Recolectar maestroIds únicos para buscar nombres en un solo request
      const maestroIds = [...new Set(records.flatMap(rec => rec.fields.maestro_asignado || []))];

      let nombresMaestro = {};
      if (maestroIds.length > 0) {
        const mFormula = encodeURIComponent(
          maestroIds.length === 1
            ? `RECORD_ID()="${maestroIds[0]}"`
            : `OR(${maestroIds.map(id => `RECORD_ID()="${id}"`).join(",")})`
        );
        const mRes = await fetch(
          `${BASE}/${process.env.AIRTABLE_MAESTROS}?filterByFormula=${mFormula}`,
          { headers: H }
        );
        const mData = await mRes.json();
        (mData.records || []).forEach(mr => {
          nombresMaestro[mr.id] = mr.fields["Nombre Maestro"] || "Maestro";
        });
      }

      const leads = records.map(rec => {
        const mId = (rec.fields.maestro_asignado || [])[0] || null;
        return {
          id:             rec.id,
          oficio:         rec.fields.oficio         || "",
          descripcion:    rec.fields.descripcion    || "",
          nombre_cliente: rec.fields.nombre_cliente || "",
          nombre_maestro: mId ? (nombresMaestro[mId] || "Maestro") : "Maestro",
          estado:         rec.fields.estado         || "",
          creado:         rec.createdTime,
        };
      });

      return res.json({ leads });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── POST: crear lead ───────────────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const r = await fetch(`${BASE}/${process.env.AIRTABLE_LEADS}`, {
        method: "POST",
        headers: H,
        body: JSON.stringify(req.body),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
};
