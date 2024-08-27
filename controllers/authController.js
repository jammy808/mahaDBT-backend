const studentModel = require('../models/student');
const studentVerify = require('../models/studentVerify');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

require("dotenv").config();

const passport = require('passport');
const localStratergy = require('passport-local');
passport.use(new localStratergy(studentModel.authenticate()));


let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready for messages");
    console.log(success);
  }
});

// Helper function to send verification email
const sendVerificationEmail = ({ _id, email }, res) => {
  const currentUrl = "https://localhost:8080/";
  const uniqueString = uuidv4() + _id;

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify your Email",
    html: `<p>Verify your email in 6 hrs <a href="${currentUrl}verify/${_id}/${uniqueString}">here</a></p>`
  };

  const saltRounds = 10;
  bcrypt
    .hash(uniqueString, saltRounds)
    .then((hashedUniqueString) => {
      const newVerification = new studentVerify({
        userId: _id,
        uniqueString: hashedUniqueString,
        createdAt: Date.now(),
        expiresAt: Date.now() + 21600000,
      });

      newVerification
        .save()
        .then(() => {
          transporter
            .sendMail(mailOptions)
            .then(() => {
              let msg = "Verification mail has been sent to the registered email, check your inbox";
              res.send({ msg });
            })
            .catch((error) => {
              console.log(error);
              res.json({
                status: "Failed",
                message: "Verification mail failed"
              });
            });
        })
        .catch((error) => {
          console.log(error);
          res.json({
            status: "Failed",
            message: "Couldn't save email"
          });
        });
    })
    .catch(() => {
      res.json({
        status: "Failed",
        message: "Error occurred"
      });
    });
};

// Controller functions
exports.registerStudent = async (req, res, next) => {
  var studentData = new studentModel({
    username: req.body.username,
    email: req.body.email,
    verified: false
  });

  studentModel.register(studentData, req.body.password)
    .then((result) => {
      passport.authenticate("local")(req, res, function () {
        sendVerificationEmail(result, res);
      });
    })
    .catch(next);
};

exports.loginStudent = (req, res, next) => {
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
};

exports.ensureAuthenticated = (req, res, next) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'You are not authenticated. Please log in.' });
};

exports.verifyStudent = async (req, res, next) => {
  const { userId, uniqueString } = req.params;

  studentVerify
    .find({ userId: userId })
    .then((result) => {
      if (result.length > 0) {
        const { expiresAt } = result[0];
        const hashedUniqueString = result[0].uniqueString;

        if (expiresAt < Date.now()) {
          studentVerify.deleteOne({ userId })
            .then(() => {
              studentModel.deleteOne({ _id: userId })
                .then(() => {
                  let msg = "Link has expired. Please sign up again.";
                  res.render('verify', { msg });
                });
            });
        } else {
          bcrypt
            .compare(uniqueString, hashedUniqueString)
            .then((result) => {
              if (result) {
                studentModel
                  .updateOne({ _id: userId }, { verified: true })
                  .then(() => {
                    studentVerify.deleteOne({ userId })
                      .then(() => {
                        let msg = "Verification Successful";
                        res.render('verify', { msg });
                      });
                  });
              } else {
                let msg = "Invalid verification details passed. Please check your inbox.";
                res.render('verify', { msg });
              }
            });
        }
      } else {
        let msg = "Account record doesn't exist or has been verified already. Please sign up or log in.";
        res.send({ msg });
      }
    })
    .catch((error) => {
      console.log(error);
      let msg = "An error occurred while checking for the existing record.";
      res.send({ msg });
    });
};

exports.isVerified = async (req, res, next) => {
  const student = await studentModel.findOne({ username: req.body.username });
  if (student.verified) {
    return next();
  }
  console.log("Not verified");
};

// Render verification page , will do something of this
exports.renderVerificationPage = (req, res) => {
  res.render('verify');
};
