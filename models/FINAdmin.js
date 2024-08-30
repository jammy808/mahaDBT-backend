const mongoose = require("mongoose");
// const plm = require("passport-local-mongoose");

require("dotenv").config();

const FINAdminSchema = mongoose.Schema({
  adminFirstName: String,
  adminLastName: String,
  adminEmail: String,
  adminPassword: String,
  createdAt: { type: Date, default: Date.now() }
});

// SAGAdminSchema.plugin(plm);

module.exports = mongoose.model("FINAdmin", FINAdminSchema);
