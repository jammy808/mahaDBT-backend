const mongoose = require('mongoose');


const studentVerifySchema = mongoose.Schema({

  userId : String, 
  uniqueString : String,
  createdAt : Date,
  expiresAt : Date,
  verified : Boolean,
  events : [{
    type : mongoose.Schema.Types.ObjectId,
    ref : "Event"
  }]
  
  
})


module.exports = mongoose.model('StudentVerify',studentVerifySchema);
