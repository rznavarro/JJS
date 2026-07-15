// GET /api/estado-lead?leadId=recXXX
// Devuelve estado actual del lead + maestro asignado + cotización si existe
module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { leadId } = req.query;
  if (!leadId) return res.status(400).json({ error: "leadId requerido" });

  const H   = { Authorization: "Bearer " + process.env.AIRTABLE_API_KEY };
  const BASE = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;

  try {
    const lRes = await fetch(`${BASE}/${process.env.AIRTABLE_LEADS}/${leadId}`, { headers: H });
    if (!lRes.ok) return res.status(404).json({ error: "Lead no encontrado" });
    const lead = await lRes.json();
    const f    = lead.fields;

    let maestro     = null;
    let cotizacion  = null;

    // Si hay maestro asignado, obtenemos sus datos
    if (f.maestro_asignado && f.maestro_asignado.length > 0) {
      const mid  = f.maestro_asignado[0];
      const mRes = await fetch(`${BASE}/${process.env.AIRTABLE_MAESTROS}/${mid}`, { headers: H });
      if (mRes.ok) {
        const m      = await mRes.json();
        const nombre = m.fields["Nombre Maestro"] || "";
        maestro = {
          id:            mid,
          nombre,
          iniciales:     nombre.split(" ").filter(Boolean).map(w => w[0]).join("").substring(0, 2).toUpperCase(),
          oficio:        (m.fields["Especialidades"] || [])[0] || "",
          telefono:      (m.fields["Teléfono"] || "").replace(/\D/g, ""),
          rating:        String(m.fields["Calificación promedio"] || "4.9"),
          badge:         "Verificado",
          trabajos:      0,
          anios:         0,
          comuna:        (m.fields["Comunas Disponibles"] || [])[0] || "",
        };
      }
    }

    // Si hay cotización, obtenemos su contenido
    if (f.cotizaciones && f.cotizaciones.length > 0) {
      const cid  = f.cotizaciones[0];
      const cRes = await fetch(`${BASE}/${process.env.AIRTABLE_COTIZACIONES}/${cid}`, { headers: H });
      if (cRes.ok) {
        const c = await cRes.json();
        cotizacion = {
          id:     cid,
          monto:  c.fields["Monto CLP"] || 0,
          estado: c.fields["Estado Cotización"] || "enviada",
        };
      }
    }

    res.json({ estado: f.estado || "pendiente", maestro, cotizacion });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
