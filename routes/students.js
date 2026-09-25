const router = require("express").Router();
const Student = require("../models/Student");
const { decorateStudent } = require("../services/scoring");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// GET /api/students/me — the logged-in student's own decorated profile.
router.get("/me", requireAuth, (req, res) => {
  if (req.isAdmin) return res.status(400).json({ message: "Admin accounts don't have a student profile." });
  res.json(decorateStudent(req.student));
});

// GET /api/students — admin-only search/filter, mirrors the frontend's
// Students table filters (branch, min CGPA, skill + min skill score, grad year).
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { branch, minCgpa, skill, minSkillScore, gradYear, q } = req.query;
    const query = {};
    if (branch) query.branch = branch;
    if (gradYear) query.gradYear = Number(gradYear);
    if (minCgpa) query.cgpa = { $gte: Number(minCgpa) };
    if (skill) query["skills.name"] = skill;
    if (q) query.name = { $regex: q, $options: "i" };

    const docs = await Student.find(query).limit(500);
    let decorated = docs.map(decorateStudent);

    if (skill && minSkillScore) {
      decorated = decorated.filter((s) => {
        const rec = s.skills.find((sk) => sk.name === skill);
        return rec && rec.score >= Number(minSkillScore);
      });
    }
    res.json(decorated);
  } catch (err) {
    res.status(500).json({ message: "Could not load students.", error: err.message });
  }
});

// GET /api/students/:id — admin-only single-student detail view.
router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found." });
  res.json(decorateStudent(student));
});

// --- Self-service "Add" endpoints, matching the frontend's Add buttons ---
// Each takes an optional relatedSkill so a course/cert/project can nudge
// that skill's component score, the same rule the frontend applies locally.

router.post("/me/skills", requireAuth, async (req, res) => {
  if (req.isAdmin) return res.status(400).json({ message: "Admins don't have a student profile." });
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Skill name is required." });
  const student = req.student;
  if (student.skills.some((s) => s.name === name)) {
    return res.status(409).json({ message: "That skill is already on your profile." });
  }
  student.skills.push({ name, test: 0, course: 0, cert: 0, project: 0 });
  await student.save();
  res.status(201).json(decorateStudent(student));
});

function registerAddRoute(field, boost) {
  router.post(`/me/${field}`, requireAuth, async (req, res) => {
    if (req.isAdmin) return res.status(400).json({ message: "Admins don't have a student profile." });
    const student = req.student;
    const { relatedSkill, ...item } = req.body;
    student[field].unshift(item);
    if (relatedSkill) {
      const sk = student.skills.find((s) => s.name === relatedSkill);
      if (sk) sk[boost.field] = Math.max(sk[boost.field], boost.value);
    }
    await student.save();
    res.status(201).json(decorateStudent(student));
  });
}
registerAddRoute("courses", { field: "course", value: 82 });
registerAddRoute("certifications", { field: "cert", value: 85 });
registerAddRoute("projects", { field: "project", value: 78 });

router.post("/me/resume", requireAuth, async (req, res) => {
  if (req.isAdmin) return res.status(400).json({ message: "Admins don't have a student profile." });
  req.student.resumeUploaded = true;
  req.student.resumeVersion = (req.student.resumeVersion || 0) + 1;
  await req.student.save();
  res.json(decorateStudent(req.student));
});

module.exports = router;
