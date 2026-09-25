const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

// Verifies the JWT on every protected request and attaches either
// req.isAdmin or req.student — routes never trust a role sent by the
// client, only what's inside a token this server itself signed.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing authentication token." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role === "admin") {
      req.isAdmin = true;
      return next();
    }
    const student = await Student.findById(payload.id);
    if (!student) return res.status(401).json({ message: "This account no longer exists." });
    req.student = student;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired session — please log in again." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ message: "Admin access required." });
  next();
}

module.exports = { requireAuth, requireAdmin };
