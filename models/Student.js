const mongoose = require("mongoose");

const SkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    test: { type: Number, default: 0 },
    course: { type: Number, default: 0 },
    cert: { type: Number, default: 0 },
    project: { type: Number, default: 0 },
  },
  { _id: false }
);

const CertificationSchema = new mongoose.Schema(
  {
    name: String,
    org: String,
    domain: String,
    issueDate: String,
  },
  { _id: false }
);

const CourseSchema = new mongoose.Schema(
  {
    name: String,
    provider: String,
    status: { type: String, enum: ["In Progress", "Completed"], default: "In Progress" },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    name: String,
    tech: String,
    github: String,
  },
  { _id: false }
);

// This is the StudentProfile model from the architecture doc. Scores
// (skill score, placement readiness, etc.) are deliberately NOT stored
// here — they're derived on every read by services/scoring.js, the same
// way the frontend derives them, so the formula only lives in one place.
const StudentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    dob: { type: String, required: true }, // stored for display (Personal Info)
    passwordHash: { type: String, required: true }, // bcrypt hash of the DOB — never the plain value

    branch: { type: String, default: "Computer Science" },
    course: { type: String, default: "B.Tech" },
    semester: { type: Number, default: 1 },
    gradYear: { type: Number },
    cgpa: { type: Number, default: 0 },

    skills: [SkillSchema],
    certifications: [CertificationSchema],
    courses: [CourseSchema],
    projects: [ProjectSchema],

    resumeUploaded: { type: Boolean, default: false },
    resumeVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);
