// POST/GET /api/webhook-mercadopago
// Mercado Pago llama a esta URL cuando el estado de un pago cambia. Nunca se
// confía en el contenido de la notificación tal cual llega: siempre se vuelve
// a consultar el pago directo a la API de Mercado Pago con el Access Token
// propio antes de dar nada por bueno.
//
// Si el pago está aprobado: calcula la comisión del 10% del lado del servidor,
// registra el pago en Airtable (tabla Pagos, cuenta única de JJS — sin Split
// por maestro) y recién ahí marca el trabajo (Lead) como "completado".
//
// Idempotente: Mercado Pago puede reintentar la misma notificación varias
// veces; si ya existe un Pago para ese lead, no se duplica.
module.exports = async function handler(req, res) {
  const paymentId = (req.body && req.body.data && req.body.data.id) || req.query["data.id"] || req.query.id;
  const type = (req.body && req.body.type) || req.query.type || req.query.topic;

  // Cualquier notificación que no sea de un pago se reconoce y se ignora.
  if (type !== "payment" || !paymentId) return res.status(200).json({ ok: true, ignorado: true });

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return res.status(500).json({ error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN en las variables de entorno" });
  }

  const MPH = { Authorization: "Bearer " + process.env.MERCADOPAGO_ACCESS_TOKEN };
  const H   = { Authorization: "Bearer " + process.env.AIRTABLE_API_KEY, "Content-Type": "application/json" };
  const BASE = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;

  try {
    // 1) Re-verificar el pago directo con Mercado Pago (nunca confiar en el body del webhook)
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: MPH });
    if (!payRes.ok) throw new Error("No se pudo verificar el pago en Mercado Pago");
    const pago = await payRes.json();

    if (pago.status !== "approved") return res.status(200).json({ ok: true, estado: pago.status });

    const leadId    = pago.external_reference || (pago.metadata && pago.metadata.lead_id);
    const maestroId = pago.metadata && pago.metadata.maestro_id;
    const montoNum  = Number(pago.transaction_amount) || 0;
    if (!leadId || !maestroId || !montoNum) throw new Error("El pago no trae leadId/maestroId/monto válidos");

    // 2) Idempotencia: si ya existe un Pago para este lead, no se duplica
    const existentesRes = await fetch(`${BASE}/${process.env.AIRTABLE_PAGOS}?maxRecords=100`, { headers: H });
    const existentesData = await existentesRes.json();
    const yaExiste = (existentesData.records || []).some(r => (r.fields.lead || []).includes(leadId));
    if (yaExiste) return res.status(200).json({ ok: true, duplicado: true });

    // 3) Comisión del 10%, calculada en el servidor
    const COMISION_PORCENTAJE = 10;
    const montoComision = Math.round((montoNum * COMISION_PORCENTAJE) / 100);
    const montoMaestro  = montoNum - montoComision;

    await fetch(`${BASE}/${process.env.AIRTABLE_PAGOS}`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        fields: {
          lead:                [leadId],
          maestro:             [maestroId],
          monto_total_clp:     montoNum,
          porcentaje_comision: COMISION_PORCENTAJE,
          monto_comision_clp:  montoComision,
          monto_maestro_clp:   montoMaestro,
          estado:              "retenido_escrow",
          proveedor_pago:      "mercado_pago",
        },
      }),
    });

    // 4) Recién ahora el trabajo pasa a completado
    await fetch(`${BASE}/${process.env.AIRTABLE_LEADS}/${leadId}`, {
      method: "PATCH",
      headers: H,
      body: JSON.stringify({ fields: { estado: "completado" } }),
    });

    res.status(200).json({ ok: true, montoComision, montoMaestro });
  } catch (e) {
    // Estado no-200 para que Mercado Pago reintente la notificación más tarde
    res.status(500).json({ error: e.message });
  }
};
