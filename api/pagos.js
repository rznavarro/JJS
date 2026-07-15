// POST /api/pagos
// Body: { leadId, maestroId, monto }
// Calcula la comisión de la plataforma (10%) del lado del servidor —nunca confiar en el
// cliente para esto—, registra el pago y recién ahí marca el trabajo como "completado".
//
// Punto de integración real de pasarela de pago: acá es donde se debe llamar a
// Transbank Webpay Plus (`initTransaction` + confirmar en el retorno/webhook con
// `commitTransaction`) o a Mercado Pago (`preferences.create` + webhook de notificación).
// Por ahora, sin credenciales de pasarela, el pago se simula como aprobado de inmediato.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { leadId, maestroId, monto } = req.body || {};
  if (!leadId || !maestroId || !monto) return res.status(400).json({ error: "leadId, maestroId y monto son requeridos" });

  const montoNum = Number(monto);
  if (!montoNum || montoNum <= 0) return res.status(400).json({ error: "monto inválido" });

  const COMISION_PORCENTAJE = 10;
  const montoComision = Math.round((montoNum * COMISION_PORCENTAJE) / 100);
  const montoMaestro  = montoNum - montoComision;

  const H    = { Authorization: "Bearer " + process.env.AIRTABLE_API_KEY, "Content-Type": "application/json" };
  const BASE = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;

  try {
    // TODO: reemplazar este bloque por la confirmación real de la pasarela antes de continuar.
    const pagoRes = await fetch(`${BASE}/${process.env.AIRTABLE_PAGOS}`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        fields: {
          lead:                 [leadId],
          maestro:              [maestroId],
          monto_total_clp:      montoNum,
          porcentaje_comision:  COMISION_PORCENTAJE,
          monto_comision_clp:   montoComision,
          monto_maestro_clp:    montoMaestro,
          estado:               "pagado",
          proveedor_pago:       "webpay_placeholder",
        },
      }),
    });
    if (!pagoRes.ok) throw new Error(await pagoRes.text());
    const pagoData = await pagoRes.json();

    await fetch(`${BASE}/${process.env.AIRTABLE_LEADS}/${leadId}`, {
      method: "PATCH",
      headers: H,
      body: JSON.stringify({ fields: { estado: "completado" } }),
    });

    res.json({ ok: true, pagoId: pagoData.id, montoComision, montoMaestro });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
