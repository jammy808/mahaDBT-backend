const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

require("dotenv").config();

const studentSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  password: String,
  email: String,
  token: Number,
  verified: Boolean,
  birthDate: Date,
  mobileNo: String,
  address: String,
  scholarship: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship' }
});

studentSchema.plugin(plm);

module.exports = mongoose.model("Student", studentSchema);
