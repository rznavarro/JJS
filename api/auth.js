// POST /api/auth
// Body: { accion: "login" | "registro", ...campos }
const { hashPassword, verifyPassword, signToken } = require("../lib/auth-utils");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { accion, nombre, email, password, rol } = req.body || {};
  if (!accion) return res.status(400).json({ error: "accion requerida: 'login' o 'registro'" });

  const H    = { Authorization: "Bearer " + process.env.AIRTABLE_API_KEY, "Content-Type": "application/json" };
  const BASE = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;

  // ── REGISTRO ────────────────────────────────────────────────────────────────
  if (accion === "registro") {
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }
    if (!["cliente", "maestro"].includes(rol)) {
      return res.status(400).json({ error: "Rol inválido" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }
    try {
      // Verificar si el email ya existe
      const checkRes  = await fetch(
        `${BASE}/${process.env.AIRTABLE_USUARIOS}?filterByFormula=${encodeURIComponent(`{email}="${email}"`)}`,
        { headers: H }
      );
      const checkData = await checkRes.json();
      if (checkData.records && checkData.records.length > 0) {
        return res.status(409).json({ error: "Este email ya está registrado" });
      }

      const password_hash = await hashPassword(password);

      // Crear usuario
      const createRes = await fetch(`${BASE}/${process.env.AIRTABLE_USUARIOS}`, {
        method: "POST",
        headers: H,
        body: JSON.stringify({ fields: { nombre, email, password_hash, rol } }),
      });
      if (!createRes.ok) throw new Error((await createRes.json()).error?.message || "Error al crear usuario");
      const userRec = await createRes.json();

      // Si es maestro, crear registro en Maestros (pendiente verificación)
      let maestroId = null;
      if (rol === "maestro") {
        const mRes = await fetch(`${BASE}/${process.env.AIRTABLE_MAESTROS}`, {
          method: "POST",
          headers: H,
          body: JSON.stringify({
            fields: {
              "Nombre Maestro":      nombre,
              "Teléfono":            "",
              "Especialidades":      [],
              "Comunas Disponibles": [],
              "Verificado":          false,
            },
          }),
        });
        if (mRes.ok) {
          maestroId = (await mRes.json()).id;
          await fetch(`${BASE}/${process.env.AIRTABLE_USUARIOS}/${userRec.id}`, {
            method: "PATCH",
            headers: H,
            body: JSON.stringify({ fields: { maestroId } }),
          });
        }
      }

      const token = signToken({ userId: userRec.id, nombre, email, rol, maestroId });
      return res.json({ ok: true, token, usuario: { nombre, email, rol, maestroId } });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── LOGIN ───────────────────────────────────────────────────────────────────
  if (accion === "login") {
    if (!email || !password) return res.status(400).json({ error: "Email y contraseña requeridos" });
    try {
      const searchRes  = await fetch(
        `${BASE}/${process.env.AIRTABLE_USUARIOS}?filterByFormula=${encodeURIComponent(`{email}="${email}"`)}`,
        { headers: H }
      );
      const searchData = await searchRes.json();
      if (!searchData.records || searchData.records.length === 0) {
        return res.status(401).json({ error: "Email o contraseña incorrectos" });
      }
      const rec = searchData.records[0];
      const f   = rec.fields;

      const valid = await verifyPassword(password, f.password_hash || "");
      if (!valid) return res.status(401).json({ error: "Email o contraseña incorrectos" });

      const token = signToken({
        userId:    rec.id,
        nombre:    f.nombre    || "",
        email:     f.email     || email,
        rol:       f.rol       || "cliente",
        maestroId: f.maestroId || null,
      });
      return res.json({
        ok: true,
        token,
        usuario: {
          nombre:    f.nombre    || "",
          email:     f.email     || email,
          rol:       f.rol       || "cliente",
          maestroId: f.maestroId || null,
        },
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(400).json({ error: "accion debe ser 'login' o 'registro'" });
};
