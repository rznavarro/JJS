// POST /api/crear-preferencia
// Body: { leadId, maestroId, monto }
// Crea una preferencia de pago en Mercado Pago (Checkout Pro) y devuelve la URL
// a la que hay que redirigir al cliente para pagar. La cuenta que recibe el
// dinero es la cuenta única de Mercado Pago de JJS (sin Split/Connect por maestro).
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return res.status(500).json({ error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN en las variables de entorno" });
  }

  const { leadId, maestroId, monto } = req.body || {};
  if (!leadId || !maestroId || !monto) {
    return res.status(400).json({ error: "leadId, maestroId y monto son requeridos" });
  }
  const montoNum = Number(monto);
  if (!montoNum || montoNum <= 0) return res.status(400).json({ error: "monto inválido" });

  const SITE = process.env.VERCEL_URL
    ? "https://" + process.env.VERCEL_URL
    : "https://jjs-gamma.vercel.app";

  const retorno = `pago=%ESTADO%&leadId=${encodeURIComponent(leadId)}&maestroId=${encodeURIComponent(maestroId)}&monto=${montoNum}`;

  try {
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.MERCADOPAGO_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: "Trabajo JJS",
            quantity: 1,
            unit_price: montoNum,
            currency_id: "CLP",
          },
        ],
        external_reference: leadId,
        metadata: { lead_id: leadId, maestro_id: maestroId },
        back_urls: {
          success: `${SITE}/?${retorno.replace("%ESTADO%", "exito")}`,
          failure: `${SITE}/?${retorno.replace("%ESTADO%", "fallo")}`,
          pending: `${SITE}/?${retorno.replace("%ESTADO%", "pendiente")}`,
        },
        auto_return: "approved",
        notification_url: `${SITE}/api/webhook-mercadopago`,
      }),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.message || JSON.stringify(data));

    res.json({ ok: true, initPoint: data.init_point || data.sandbox_init_point });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
