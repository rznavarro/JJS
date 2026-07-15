// Utilidades de auth: hash de contraseñas (PBKDF2 built-in) + tokens JWT custom
// No requiere npm install — usa solo módulos de Node
const crypto = require("crypto");

const SECRET = () => process.env.JWT_SECRET || "jjs-dev-secret-change-in-prod";

function pbkdf2(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 32, "sha256", (err, key) => {
      if (err) reject(err);
      else resolve(key.toString("hex"));
    });
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await pbkdf2(password, salt);
  return `$pbkdf2$${salt}$${hash}`;
}

async function verifyPassword(password, stored) {
  const parts = stored.split("$");
  if (parts.length < 4) return false;
  const salt     = parts[2];
  const expected = parts[3];
  const actual   = await pbkdf2(password, salt);
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function b64url(str) {
  return Buffer.from(str).toString("base64url");
}

function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body   = b64url(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
  const sig    = crypto.createHmac("sha256", SECRET()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyToken(token) {
  if (!token) throw new Error("No token");
  const [header, body, sig] = (token || "").split(".");
  if (!header || !body || !sig) throw new Error("Token inválido");
  const expected = crypto.createHmac("sha256", SECRET()).update(`${header}.${body}`).digest("base64url");
  if (sig !== expected) throw new Error("Firma inválida");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp < Date.now()) throw new Error("Token expirado");
  return payload;
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
