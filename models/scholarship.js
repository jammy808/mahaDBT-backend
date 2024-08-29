const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB:', error.message);
  });

const scholarshipSchema = mongoose.Schema({

    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    college: String,
    course: String,
    bankAccountNo: String,
    rejected: { type: Boolean, default: false },
    feedback: { type: String }
    
  })
  
  scholarshipSchema.plugin(plm);
  
  module.exports = mongoose.model('Scholarship', scholarshipSchema);
  