// POST /api/maestro-verificado
// Webhook llamado por Airtable Automation cuando Verificado = true
// Devuelve el link personal del maestro y la URL de WhatsApp lista para enviar
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { maestroId, nombre, telefono } = req.body;
  if (!maestroId) return res.status(400).json({ error: "maestroId requerido" });

  const SITE = process.env.VERCEL_URL
    ? "https://" + process.env.VERCEL_URL
    : "https://jjs.vercel.app";

  const linkMaestro = `${SITE}/?maestro=${maestroId}`;

  const mensaje = encodeURIComponent(
    `¡Hola ${nombre || ""}! 🎉 Felicidades, has sido aceptado como maestro en JJS.\n\n` +
    `Tu perfil ya está activo. Desde este link verás los trabajos disponibles y podrás aceptarlos:\n\n` +
    `${linkMaestro}\n\n` +
    `¡Bienvenido al equipo! 🔧`
  );

  const numeroLimpio = (telefono || "").replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${numeroLimpio}?text=${mensaje}`;

  res.json({
    ok: true,
    maestroId,
    linkMaestro,
    whatsappUrl,
    mensaje: decodeURIComponent(mensaje),
  });
};
