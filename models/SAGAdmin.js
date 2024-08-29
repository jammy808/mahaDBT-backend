const mongoose = require("mongoose");
// const plm = require("passport-local-mongoose");

require("dotenv").config();

const SAGAdminSchema = mongoose.Schema({
  adminFirstName: String,
  adminLastName: String,
  adminEmail: String,
  adminPassword: String,
});

// SAGAdminSchema.plugin(plm);

module.exports = mongoose.model("SAGAdmin", SAGAdminSchema);
