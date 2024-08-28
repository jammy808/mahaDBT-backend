const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

require("dotenv").config();

// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => {
//     console.log('Connected to MongoDB');
//   })
//   .catch((error) => {
//     console.error('Could not connect to MongoDB:', error.message);
//   });

const studentSchema = mongoose.Schema({
  firstName: String,
  lastName: String,
  username: String,
  password: String,
  email: String,
  token: Number,
  verified: Boolean,
  // events: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Event",
  //   },
  // ],
});

studentSchema.plugin(plm);

module.exports = mongoose.model("Student", studentSchema);
