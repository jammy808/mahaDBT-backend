const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

require("dotenv").config();

const nonEmptyStringValidator = {
  validator: function(v) {
    return v && v.trim().length > 0;
  },
  message: 'Field cannot be an empty string'
};

const studentSchema = mongoose.Schema({
  username: { 
    type: String
  },
  password: { 
    type: String
  },
  email: { 
    type: String, 
    unique: true
  },
  token: Number,
  verified: Boolean,
  personalDetails: {
    firstName: { 
      type: String
    },
    middleName: { 
      type: String
    },
    lastName: { 
      type: String
    },
    mobileNo: { 
      type: String
    },
    guardianMobileNo: { 
      type: String
    },
    birthDate: { 
      type: Date 
    },
    userImage: { 
      type: String
    },
    address: { 
      type: String
    },
    gender: { 
      type: String
    },
    age: { 
      type: Number 
    },
  },
  incomeDetails: {
    isIncomeCertificateAvailable: { 
      type: Boolean 
    },
    annualIncome: { 
      type: String
    },
    incomeCertificate: { 
      type: String
    },
    incomeCertificateNo: { 
      type: String
    },
    issuedDate: { 
      type: Date 
    },
  },
  educationDetails: {
    marksheet: { 
      type: String
    },
    totalMarks: { 
      type: Number 
    },
    percentage: { 
      type: String
    },
    college: { 
      type: String
    },
    course: { 
      type: String
    },
  },
  bankAccountNo: { 
    type: String
  },
});

studentSchema.plugin(plm);

module.exports = mongoose.model("Student", studentSchema);
