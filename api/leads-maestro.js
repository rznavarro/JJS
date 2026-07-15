// GET /api/leads-maestro?maestroId=recXXX
// GET /api/leads-maestro?maestroId=recXXX&tipo=historial  → leads aceptados por este maestro
// Solo devuelve leads que califican por oficio + comuna del maestro, y solo si está Disponible.
module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { maestroId, tipo } = req.query;
  if (!maestroId) return res.status(400).json({ error: "maestroId requerido" });

  const H = { Authorization: "Bearer " + process.env.AIRTABLE_API_KEY };
  const BASE = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;

  try {
    // 1. Obtener datos del maestro
    const mRes = await fetch(`${BASE}/${process.env.AIRTABLE_MAESTROS}/${maestroId}`, { headers: H });
    if (!mRes.ok) return res.status(404).json({ error: "Maestro no encontrado" });
    const m = await mRes.json();

    if (!m.fields["Verificado"]) return res.status(403).json({ error: "Maestro no verificado aún" });

    const especialidades = m.fields["Especialidades"] || [];
    const comunas        = m.fields["Comunas Disponibles"] || [];
    const nombre          = m.fields["Nombre Maestro"] || "";
    const disponible      = m.fields["Disponible"] !== false;

    const maestroInfo = {
      id: maestroId,
      nombre,
      iniciales: nombre.split(" ").map(w => w[0] || "").join("").substring(0, 2).toUpperCase(),
      especialidades,
      comunas,
      telefono: m.fields["Teléfono"] || "",
      disponible,
    };

    // Si el maestro se desactivó, no le llegan trabajos nuevos (pero sí puede ver su historial)
    if (tipo !== "historial" && !disponible) {
      return res.json({ maestro: maestroInfo, leads: [] });
    }

    // 2. Filtro: historial = aceptados por este maestro; normal = pendientes que califican por oficio + zona
    let filtro;
    if (tipo === "historial") {
      filtro = `AND({estado}="aceptado",{maestro_id}="${maestroId}")`;
    } else {
      const condiciones = [`{estado}="pendiente"`];

      const oficioPartes = especialidades.map(e => `{oficio}="${e}"`);
      if (oficioPartes.length) {
        condiciones.push(oficioPartes.length === 1 ? oficioPartes[0] : `OR(${oficioPartes.join(",")})`);
      }

      const comunaPartes = comunas.map(c => `{comuna}="${c}"`);
      if (comunaPartes.length) {
        condiciones.push(comunaPartes.length === 1 ? comunaPartes[0] : `OR(${comunaPartes.join(",")})`);
      }

      filtro = `AND(${condiciones.join(",")})`;
    }

    const lRes = await fetch(
      `${BASE}/${process.env.AIRTABLE_LEADS}?filterByFormula=${encodeURIComponent(filtro)}&maxRecords=50&sort[0][field]=id_lead&sort[0][direction]=desc`,
      { headers: H }
    );
    const lData = await lRes.json();

    res.json({
      maestro: maestroInfo,
      leads: (lData.records || []).map(r => ({
        id: r.id,
        oficio:         r.fields.oficio || "",
        descripcion:    r.fields.descripcion || "",
        comuna:         r.fields.comuna || "",
        direccion:      r.fields.direccion || "",
        urgencia:       r.fields.urgencia || "",
        nombre_cliente: r.fields.nombre_cliente || "",
        creado:         r.createdTime,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
