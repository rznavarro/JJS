// POST /api/aceptar-lead
// Body: { leadId, maestroId, accion: "aceptar"|"rechazar" }
// "aceptar" es de un solo tap: no pide precio (eso se cotiza después, por chat).
// Antes de aceptar, confirma que el trabajo siga "pendiente" para reducir la carrera
// entre dos maestros aceptando el mismo lead casi al mismo tiempo.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { leadId, maestroId, accion } = req.body;
  if (!leadId || !maestroId) return res.status(400).json({ error: "leadId y maestroId requeridos" });

  const H    = { Authorization: "Bearer " + process.env.AIRTABLE_API_KEY, "Content-Type": "application/json" };
  const BASE = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;

  try {
    if (accion === "rechazar") {
      // Solo quitamos la asignación y dejamos pendiente para otro maestro
      const r = await fetch(`${BASE}/${process.env.AIRTABLE_LEADS}/${leadId}`, {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ fields: { estado: "pendiente" } }),
      });
      if (!r.ok) throw new Error(await r.text());
      return res.json({ ok: true, estado: "pendiente" });
    }

    // Aceptar: primero confirmamos que el trabajo siga disponible
    const checkRes = await fetch(`${BASE}/${process.env.AIRTABLE_LEADS}/${leadId}`, { headers: H });
    if (!checkRes.ok) throw new Error("No se pudo verificar el estado del trabajo");
    const checkData = await checkRes.json();
    if (checkData.fields.estado !== "pendiente") {
      return res.status(409).json({ error: "Este trabajo ya fue tomado por otro maestro" });
    }

    const r = await fetch(`${BASE}/${process.env.AIRTABLE_LEADS}/${leadId}`, {
      method: "PATCH",
      headers: H,
      body: JSON.stringify({
        fields: {
          estado:           "aceptado",
          maestro_asignado: [maestroId],
          maestro_id:       maestroId,
        },
      }),
    });
    if (!r.ok) throw new Error(await r.text());

    res.json({ ok: true, estado: "aceptado" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
