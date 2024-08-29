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
    type: String, 
    required: [true, 'Username is required'],
    validate: nonEmptyStringValidator
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    validate: nonEmptyStringValidator
  },
  email: { 
    type: String, 
    unique: true, 
    required: [true, 'Email is required'],
    validate: nonEmptyStringValidator
  },
  token: Number,
  verified: Boolean,
  personalDetails: {
    firstName: { 
      type: String, 
      required: [true, 'First name is required'],
      validate: nonEmptyStringValidator
    },
    middleName: { 
      type: String, 
      required: [true, 'Middle name is required'],
      validate: nonEmptyStringValidator
    },
    lastName: { 
      type: String, 
      required: [true, 'Last name is required'],
      validate: nonEmptyStringValidator
    },
    mobileNo: { 
      type: String, 
      required: [true, 'Mobile number is required'],
      validate: nonEmptyStringValidator
    },
    guardianMobileNo: { 
      type: String,
      validate: nonEmptyStringValidator
    },
    birthDate: { 
      type: Date, 
      required: [true, 'Birth date is required'] 
    },
    userImage: { 
      type: String,
      required: [true, 'User Image is required'],
      validate: nonEmptyStringValidator
    },
    address: { 
      type: String, 
      required: [true, 'Address is required'],
      validate: nonEmptyStringValidator
    },
    gender: { 
      type: String, 
      required: [true, 'Gender is required'],
      validate: nonEmptyStringValidator
    },
    age: { 
      type: Number, 
      required: [true, 'Age is required'] 
    },
  },
  incomeDetails: {
    isIncomeCertificateAvailable: { 
      type: Boolean, 
      required: [true, 'Income certificate availability is required'] 
    },
    annualIncome: { 
      type: String, 
      required: [true, 'Annual income is required'],
      validate: nonEmptyStringValidator
    },
    incomeCertificate: { 
      type: String, 
      required: [true, 'Income certificate is required'],
      validate: nonEmptyStringValidator
    },
    incomeCertificateNo: { 
      type: String, 
      required: [true, 'Income certificate number is required'],
      validate: nonEmptyStringValidator
    },
    issuedDate: { 
      type: Date, 
      required: [true, 'Issued date is required'] 
    },
  },
  educationDetails: {
    marksheet: { 
      type: String, 
      required: [true, 'Marksheet is required'],
      validate: nonEmptyStringValidator
    },
    totalMarks: { 
      type: Number, 
      required: [true, 'Total marks are required'] 
    },
    percentage: { 
      type: String, 
      required: [true, 'Percentage is required'],
      validate: nonEmptyStringValidator
    },
    college: { 
      type: String, 
      required: [true, 'College is required'],
      validate: nonEmptyStringValidator
    },
    course: { 
      type: String, 
      required: [true, 'Course is required'],
      validate: nonEmptyStringValidator
    },
  },
  bankAccountNo: { 
    type: String, 
    required: [true, 'Bank account number is required'],
    validate: nonEmptyStringValidator
  },
});

studentSchema.plugin(plm);

module.exports = mongoose.model("Student", studentSchema);
