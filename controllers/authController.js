const studentModel = require("../models/student");
const Scholarship = require("../models/scholarship")
const studentVerify = require("../models/studentVerify");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const { sendFlutterVerificationEmail } = require("../helpers/email");
const { uploadSingleFileOnCloudinary } = require("../helpers/cloudinary");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

require("dotenv").config();

const passport = require("passport");
const localStratergy = require("passport-local");
passport.use(new localStratergy(studentModel.authenticate()));

// Helper function to send verification email
const sendVerificationEmail = ({ _id, email }, res) => {
  const currentUrl = "localhost:8000/";
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

// exports.updateStudentProfile = async (req, res, next) => {
//   try {
//     const studentId = req.body.studentId;
    
//     // Upload the files (marksheet, income and userImage)
//     // Get the Local Path from the server which will be stored by multer defined in the middleware
//     const userImagePath = req.files?.userImage[0].path;
//     const incomeCertificate = req.files?.incomeCertificate[0].path;
//     const marksheet = req.files?.marksheet[0].path;

//     // If there are no images
//     if (userImagePath == null || incomeCertificate == null || marksheet == null) {
//       return res.status(200).json({message: "file not found"});
//     }

//     // Use the local Path to upload the file to Cloudinary
//     const userImageResult = await uploadSingleFileOnCloudinary(userImagePath);
//     const incomeCertificateResult = await uploadSingleFileOnCloudinary(incomeCertificate);
//     const markSheetCertificateResult = await uploadSingleFileOnCloudinary(marksheet);

//     // Make sure if the file has been uploaded to Cloudinary, store the cloudinary URL in the database
//     if (!userImageResult || !incomeCertificateResult || !markSheetCertificateResult) {
//       return res.status(200).json({message: "fail"});
//     }

//     let student = await studentModel.findOneAndUpdate({
//       _id: new ObjectId(studentId),
//     }, {
//       $set: {
//         "personalDetails": {
//           "firstName": req.body.firstName,
//           "middleName": req.body.middleName,
//           "lastName": req.body.lastName,
//           "mobileNo": req.body.mobileNo,
//           "guardianMobileNo": req.body.guardianMobileNo,
//           "userImage": userImageResult.url,
//           "birthDate": new Date(req.body.birthDate),
//           "address": req.body.address,
//           "gender": req.body.gender,
//           "age": req.body.age,      
//         },
//         "incomeDetails": {
//           "isIncomeCertificateAvailable": req.body.isIncomeCertificateAvailable,
//           "annualIncome": req.body.annualIncome,
//           "incomeCertificateNo": req.body.incomeCertificateNo,
//           "incomeCertificate": incomeCertificateResult.url,
//           "issuedDate": new Date(req.body.issuedDate),
//         },
//         "educationDetails": {
//           "marksheet": markSheetCertificateResult.url,
//           "totalMarks": req.body.totalMarks,
//           "percentage": req.body.percentage,
//           "college": req.body.college,
//           "course": req.body.course,
//         },
//         "bankAccountNo": req.body.bankAccountNo,
//       }
//     }, {new: true}, {runValidators: true});

//     console.log("Student");
    
//     console.log(student);
    

//     res.status(200).json({ message: "Student information updated successfully"});
//   } catch (error) {

//     if (error.name === 'ValidationError') {
//       // Handle validation errors
//       return res.status(400).json({ message: error.message });
//     }

//     res.status(400).json({ error: error.message });
//   }
// };

exports.updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.body._id;

    const userImageFile = req.files?.userImage?.[0];
    const incomeCertificateFile = req.files?.incomeCertificate?.[0];
    const marksheetFile = req.files?.marksheet?.[0];

    if (!userImageFile || !incomeCertificateFile || !marksheetFile) {
      return res.status(400).json({ message: "Required files are missing" });
    }

    const userImagePath = userImageFile.path;
    const incomeCertificatePath = incomeCertificateFile.path;
    const marksheetPath = marksheetFile.path;

    const userImageResult = await uploadSingleFileOnCloudinary(userImagePath);
    const incomeCertificateResult = await uploadSingleFileOnCloudinary(incomeCertificatePath);
    const markSheetCertificateResult = await uploadSingleFileOnCloudinary(marksheetPath);

    if (!userImageResult || !incomeCertificateResult || !markSheetCertificateResult) {
      return res.status(500).json({ message: "Failed to upload files" });
    }

    let student = await studentModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(studentId) },
      {
        $set: {
          "personalDetails.firstName": req.body.firstName,
          "personalDetails.middleName": req.body.middleName,
          "personalDetails.lastName": req.body.lastName,
          "personalDetails.mobileNo": req.body.mobileNo,
          "personalDetails.guardianMobileNo": req.body.guardianMobileNo,
          "personalDetails.userImage": userImageResult.url,
          "personalDetails.birthDate": new Date(req.body.birthDate),
          "personalDetails.address": req.body.address,
          "personalDetails.gender": req.body.gender,
          "personalDetails.age": req.body.age,
          "incomeDetails.isIncomeCertificateAvailable": req.body.isIncomeCertificateAvailable,
          "incomeDetails.annualIncome": req.body.annualIncome,
          "incomeDetails.incomeCertificateNo": req.body.incomeCertificateNo,
          "incomeDetails.incomeCertificate": incomeCertificateResult.url,
          "incomeDetails.issuedDate": new Date(req.body.issuedDate),
          "educationDetails.marksheet": markSheetCertificateResult.url,
          "educationDetails.totalMarks": req.body.totalMarks,
          "educationDetails.percentage": req.body.percentage,
          "educationDetails.college": req.body.college,
          "educationDetails.course": req.body.course,
          "bankAccountNo": req.body.bankAccountNo,
        },
      },
      // { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ message: "Student information updated successfully", student });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(fieldError => {
        return `${fieldError.path.split('.').pop()} is ${fieldError.kind === 'required' ? 'required' : fieldError.message}`;
      });

      return res.status(400).json({ message: errorMessages.join(', ') });
    }
    
    res.status(500).json({ error: error.message });
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

exports.applyForScholarship = async (req, res)=>{
  try {
    const studentId = req.params.studentId;
    console.log(studentId)
    
    let scholarshipObj = {
      studentId: new ObjectId(studentId),
    }
    let scholarship = await Scholarship.create(scholarshipObj);

    return res.status(200).json({message: "Scholarship Applied"});
  } catch (error) {
    console.log(error);
  }
}


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

exports.editProfile = async (req, res) => {
  try {
    console.log("Request File");

    // If you are sending only one file only use req.file
    console.log(req.file);

    // Get the Local Path from the server which will be stored by multer defined in the middleware
    const image = req.file?.path;

    console.log("LocalPath: ", image);

    if (image == null) {
      return res.status(200).json({ message: "file not found" });
    }

    // Use the local Path to upload the file to Cloudinary
    const result = await uploadSingleFileOnCloudinary(image);

    console.log("Result" + result);

    // Make sure if the file has been uploaded to Cloudinary, store the cloudinary URL in the database
    if (result == null) {
      return res.status(200).json({ message: "fail" });
    }

    // We need to update the user also
    const { firstName, lastName, email } = req.body;
    console.log(req.body);
    console.log(result.url);

    const user = await studentModel.findOneAndUpdate(
      { email: email },
      {
        $set: {
          firstName: firstName,
          lastName: lastName,
          userImage: result.url,
        },
      },
      { new: true }
    );

    console.log(user);

    return res.status(200).json({ message: "ok", userImage: user.userImage });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
