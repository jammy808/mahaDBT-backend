const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

const scholarshipSchema = mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  schemeName: { type: String, default: "Prime Minister's Special Scholarship Scheme(PMSSS)" },
  status: { type: String, default: "pending" },
  rejected: { type: Boolean, default: false },
  feedback: { type: String },
  appliedDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now() }
});

scholarshipSchema.plugin(plm);

module.exports = mongoose.model("Scholarship", scholarshipSchema);
