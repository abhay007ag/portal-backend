// Mirrors the SKILL_WEIGHTS / READINESS_WEIGHTS in the frontend. If you
// change one, change the other — in a full build this would live in a
// single shared SystemConfig collection the admin can edit.
const SKILL_WEIGHTS = { test: 0.4, course: 0.25, cert: 0.2, project: 0.15 };
const READINESS_WEIGHTS = { skill: 0.35, cgpa: 0.3, test: 0.2, profile: 0.15 };

function scoreOf(sk) {
  return Math.round(
    sk.test * SKILL_WEIGHTS.test +
    sk.course * SKILL_WEIGHTS.course +
    sk.cert * SKILL_WEIGHTS.cert +
    sk.project * SKILL_WEIGHTS.project
  );
}

// Takes a Mongoose Student document (or plain object) and returns a plain
// object with every derived field the frontend expects, and with the
// password hash stripped out. Never send passwordHash to the client.
function decorateStudent(doc) {
  const student = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

  const skills = (student.skills || []).map((s) => ({ ...s, score: scoreOf(s) }));
  const testAvg = skills.length ? Math.round(skills.reduce((a, s) => a + s.test, 0) / skills.length) : 0;
  const overallSkillScore = skills.length ? Math.round(skills.reduce((a, s) => a + s.score, 0) / skills.length) : 0;

  const profileFields = [
    true, true, true,
    skills.length > 0,
    (student.certifications || []).length > 0,
    (student.courses || []).length > 0,
    (student.projects || []).length > 0,
    student.resumeUploaded,
  ];
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);

  const placementReadiness = Math.round(
    overallSkillScore * READINESS_WEIGHTS.skill +
    ((student.cgpa || 0) / 10) * 100 * READINESS_WEIGHTS.cgpa +
    testAvg * READINESS_WEIGHTS.test +
    profileCompletion * READINESS_WEIGHTS.profile
  );

  const { passwordHash, __v, ...rest } = student;
  return { ...rest, id: String(student._id), skills, testAvg, overallSkillScore, profileCompletion, placementReadiness };
}

module.exports = { decorateStudent, scoreOf };
