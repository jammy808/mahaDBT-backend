var express = require('express');
var router = express.Router();
const studentModel = require('../models/student');
const studentVerify = require('../models/studentVerify');


const nodemailer = require('nodemailer');
const {v4: uuidv4} = require('uuid');
const bcrypt = require('bcrypt');

require("dotenv").config();

let transpoter = nodemailer.createTransport({
  service : "gmail",
  auth : {
    user : process.env.AUTH_EMAIL,
    pass : process.env.AUTH_PASS,
  }
})

transpoter.verify((error,success) => {
  if(error){
    console.log(error);
  } else{
    console.log("Ready for messages");
    console.log(success);
  }
})


//---------------------------------------------------------------------------------------------------------
const passport = require('passport');
const localStratergy = require('passport-local');
passport.use(new localStratergy(studentModel.authenticate()));


const { MongoClient } = require('mongodb'); 
const { GridFSBucket } = require('mongodb');
const { createReadStream } = require('fs');
//const Datauri = require('datauri');
const { Readable } = require('stream');
const { error } = require('console');
const { CLIENT_RENEG_LIMIT } = require('tls');

const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect();
const database = client.db('mamu');
const bucket = new GridFSBucket(database);


router.get('/', (req, res) => {
    res.send('Hello');
});

//for student registration/sign up
router.post('/studentReg',async function(req,res,next){
    var studentData = new studentModel({
      username : req.body.username,
      email : req.body.email,
      verified : false
      })
      studentModel.register(studentData, req.body.password)
    .then((result) => {
      passport.authenticate("local")(req, res , function() {})
      sendVerificationEmail(result,res);
    })
})

//for student login
router.post('/studentLog', isVerified, (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return res.status(500).json({ message: 'An error occurred during authentication.', error: err });
      }
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password.' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to log in user.', error: err });
        }
        return res.status(200).json({ message: 'Login successful', user: user });
      });
    })(req, res, next);
});


// middleware/helper to make sure that student is verified
async function isVerified(req,res,next){
    const student = await studentModel.findOne({ username: req.body.username });
    if(student.verified){
      return next();
    }
      console.log("not verified");
  }

//send mail
const sendVerificationEmail = ({_id,email},res) => {

    const currentUrl = "https://localhost:8080/";
  
    const uniqueString = uuidv4() + _id;
  
    const mailOptions = {
      from : process.env.AUTH_EMAIL,
      to : email,
      subject : "Verify your Email",
      html : `<p>verify your email in 6 hrs <a href = ${currentUrl + "verify/" + _id + "/" + uniqueString}>here</a></p>`
    }
  
    //hash the unique string
  
    const saltrounds = 10;
    bcrypt
      .hash(uniqueString,saltrounds)
      .then((hashedUniqueString) => {
  
        const newVerification = new studentVerify({
          userId : _id,
          uniqueString : hashedUniqueString,
          createdAt : Date.now(),
          expiresAt : Date.now() + 21600000,
        });
  
        newVerification
          .save()
          .then(() =>{
            transpoter
              .sendMail(mailOptions)
              .then(() =>{
                let msg = "Verification mail has been sent to the registered email, check your inbox"
                res.send({msg});
              })
              .catch((error) => {
                console.log(error);
                res.json({
                  status : "Failed",
                  message : "verification mail failed"
                })
              })
          })
          .catch((error) => {
            console.log(error);
            res.json({
              status : "Failed",
              message : "Couldnt save email"
            })
          })
      })
      .catch(() => {
        res.json({
          status : "Failed",
          message : "Error occured"
        })
      })
}

//verify email
router.get("/verify/:userId/:uniqueString",(req,res)=>{
    let {userId,uniqueString} = req.params;
  
    studentVerify
      .find({userId : userId})
      .then((result) => {
        if(result.length > 0){
  
          const {expiresAt} = result[0];
          const hashedUniqueString = result[0].uniqueString;
  
          if(expiresAt < Date.now()){
            studentVerify.deleteOne({userId})
              .then(result =>{
                studentModel.deleteOne({_id : userId})
                  .then(()=>{
                    let msg = "Link has expired please sign up again"
                    res.render('verify',{msg});
                  })
              })
          }else{
  
            bcrypt
              .compare(uniqueString,hashedUniqueString)
              .then(result =>{
                if(result){
  
                  studentModel
                    .updateOne({_id : userId},{verified : true})
                    .then(() => {
                      studentVerify.deleteOne({userId})
                        .then(()=>{
                          let msg = "Verification Successfull"
                          res.render('verify',{msg});
                        })
                    })
                }else{
                  let msg = "Invalid verification details passed. Please check your inbox"
                  res.render('verify',{msg});
                }
              })
          }
        } else{
          let msg = "Account record doesn't exist or has been verified Already, Please sign up or log in"
          res.send({msg});
        }
      })
      .catch((error) =>{
        console.log(error);
        let msg = " An Error occured while checking for the existing record"
        res.send({msg});
      })
})
  
router.get("/verify",(req,res)=>{
    res.render('verify');
})



  
module.exports = router;