const studentModel = require("../models/student");
const Scholarship = require("../models/scholarship")
const studentVerify = require("../models/studentVerify");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const { sendFlutterVerificationEmail } = require("../helpers/email");

require("dotenv").config();

const passport = require("passport");
const localStratergy = require("passport-local");
passport.use(new localStratergy(studentModel.authenticate()));

// Helper function to send verification email
const sendVerificationEmail = ({ _id, email }, res) => {
  const currentUrl = "https://localhost:8080/";
  const uniqueString = uuidv4() + _id;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Ready for messages");
      console.log(success);
    }
  });

  const mailOptions = {
    from: process.env.AUTH_EMAIL,
    to: email,
    subject: "Verify your Email",
    html: `<p>Verify your email in 6 hrs <a href="${currentUrl}verify/${_id}/${uniqueString}">here</a></p>`,
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
              let msg =
                "Verification mail has been sent to the registered email, check your inbox";
              res.send({ msg });
            })
            .catch((error) => {
              console.log(error);
              res.json({
                status: "Failed",
                message: "Verification mail failed",
              });
            });
        })
        .catch((error) => {
          console.log(error);
          res.json({
            status: "Failed",
            message: "Couldn't save email",
          });
        });
    })
    .catch(() => {
      res.json({
        status: "Failed",
        message: "Error occurred",
      });
    });
};

// Soham's Controllers
exports.registerStudent = async (req, res, next) => {
  var studentData = new studentModel({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    email: req.body.email,
    verified: false,
  });

  studentModel
    .register(studentData, req.body.password)
    .then((result) => {

      passport.authenticate("local")(req, res, async function () {

        const scholarship = new Scholarship({
          student: studentData._id,
          rejected: false,
          feedback: '',
        });

        await scholarship.save();

        studentData.scholarship = scholarship._id;
        await studentData.save();

        sendVerificationEmail(result, res);
      });
    })
    .catch(next);
};

exports.loginStudent = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({
        message: "An error occurred during authentication.",
        error: err,
      });
    }
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Failed to log in user.", error: err });
      }
      return res.status(200).json({ message: "Login successful", user: user });
    });
  })(req, res, next);
};

exports.update = async (req, res, next) => {
 
  const { id , firstName, lastName, birthDate, mobileNo, address} = req.body;
  console.log(id);
  try {
    const student = await studentModel.findByIdAndUpdate(
      id,
      { firstName, lastName, birthDate, mobileNo, address},
      { new: true }
    );

    res.status(200).json({ message: "Student information updated successfully"});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.logout = async (req, res, next) => {
  req.logout(function(err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to log out user.", error: err });
    }
    return res.status(200).json({ message: "Logout successful"});
  });
};

exports.ensureAuthenticated = (req, res, next) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    return next();
  }
  res
    .status(401)
    .json({ message: "You are not authenticated. Please log in." });
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
          studentVerify.deleteOne({ userId }).then(() => {
            studentModel.deleteOne({ _id: userId }).then(() => {
              let msg = "Link has expired. Please sign up again.";
              res.render("verify", { msg });
            });
          });
        } else {
          bcrypt.compare(uniqueString, hashedUniqueString).then((result) => {
            if (result) {
              studentModel
                .updateOne({ _id: userId }, { verified: true })
                .then(() => {
                  studentVerify.deleteOne({ userId }).then(() => {
                    let msg = "Verification Successful";
                    res.render("verify", { msg });
                  });
                });
            } else {
              let msg =
                "Invalid verification details passed. Please check your inbox.";
              res.render("verify", { msg });
            }
          });
        }
      } else {
        let msg =
          "Account record doesn't exist or has been verified already. Please sign up or log in.";
          res.render("verify", { msg });
      }
    })
    .catch((error) => {
      console.log(error);
      let msg = "An error occurred while checking for the existing record.";
      res.render("verify", { msg });
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
  res.render("verify");
};

// Atharva's Controller - {Flutter App}
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    console.log(req.body);

    var studentData = new studentModel({
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      token: verificationCode,
      verified: false,
    });

    // Check for existing user
    let result = await studentModel.register(studentData, password);
    console.log("Result");
    console.log(result);

    passport.authenticate("local")(req, res, async function () {
      let response = await sendFlutterVerificationEmail(
        result,
        verificationCode
      );

      if (response == "ok") {
        return res.status(200).json({ message: result });
      }
    });
  } catch (error) {
    console.log(error);
    if (error.name === "UserExistsError") {
      return res.status(400).json({ message: "Username already exists" });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.isUserVerified = async (req, res) => {
  try {
    const { token, email } = req.body;

    const user = await studentModel.findOneAndUpdate(
      { email: email, token: token },
      {
        $set: {
          verified: true,
        },
      },
      { new: true }
    );

    console.log("user");
    console.log(user);

    if (user != null && user.verified) {
      return res.status(200).json({ message: "ok" });
    }

    return res.status(200).json({ message: "fail" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.login = async (req, res, next) => {
  try {
    const authenticate = (req, res) => {
      return new Promise((resolve, reject) => {
        passport.authenticate("local", (err, user, info) => {
          if (err) return reject(err);
          if (!user) return resolve(null);
          resolve(user);
        })(req, res, next);
      });
    };

    const logIn = (user) => {
      return new Promise((resolve, reject) => {
        req.logIn(user, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    };

    const user = await authenticate(req, res);
    if (!user) {
      return res.status(200).json({ message: "creds" });
    }

    await logIn(user);
    return res.status(200).json({ message: "ok", user: user });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err,
    });
  }
};
