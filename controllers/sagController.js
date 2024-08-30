const sagAdmin = require("../models/SAGAdmin");
const finAdmin = require("../models/FINAdmin");
const Scholarship = require("../models/scholarship");
const studentModel = require("../models/student");
var moment = require("moment");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");

exports.loginAdmin = async (req, res) => {
  try {
    const { adminEmail, adminPassword, adminRole } = req.body;

    console.log(req.body);

    if (adminRole == "SAGAdmin") {
      if (adminEmail.trim() === "" || adminPassword.trim() === "") {
        req.flash("errors", "Please enter all the fields.");
        return req.session.save(() => {
          res.redirect("/");
        });
      }

      let admin = await sagAdmin.findOne({ adminEmail: adminEmail });
      console.log(admin);

      if (admin) {
        if (bcrypt.compareSync(adminPassword, admin.adminPassword)) {
          req.session.admin = {
            _id: admin._id,
            firstName: admin.adminFirstName,
            lastName: admin.adminLastName,
            email: admin.adminEmail,
            role: "SAG Admin",
          };
          return req.session.save(() => {
            res.redirect("/SAG/home");
          });
        } else {
          req.flash("errors", "Invalid username / password.");
          return req.session.save(() => {
            res.redirect("/");
          });
        }
      } else {
        req.flash("errors", "Admin doesn't exist.");
        return req.session.save(() => {
          res.redirect("/");
        });
      }
    } else {
      if (adminEmail.trim() === "" || adminPassword.trim() === "") {
        req.flash("errors", "Please enter all the fields.");
        return req.session.save(() => {
          res.redirect("/");
        });
      }

      let admin = await finAdmin.findOne({ adminEmail: adminEmail });
      console.log(admin);

      if (admin) {
        if (bcrypt.compareSync(adminPassword, admin.adminPassword)) {
          req.session.admin = {
            _id: admin._id,
            firstName: admin.adminFirstName,
            lastName: admin.adminLastName,
            email: admin.adminEmail,
            role: "Finance Admin",
          };
          return req.session.save(() => {
            res.redirect("/FIN/home");
          });
        } else {
          req.flash("errors", "Invalid username / password.");
          return req.session.save(() => {
            res.redirect("/");
          });
        }
      } else {
        req.flash("errors", "Admin doesn't exist.");
        return req.session.save(() => {
          res.redirect("/");
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};


exports.home = async (req, res) => {
  try {
    console.log("Admin Data");
    console.log(req.session.admin);

    const pendingCount = await Scholarship.countDocuments({ status: "pending" });
    const verifiedCount = await Scholarship.countDocuments({ status: "verified" });
    const rejectedCount = await Scholarship.countDocuments({ status: "rejected" });

    console.log(pendingCount);
    console.log(verifiedCount);
    console.log(rejectedCount);

    let pendingApplications = await Scholarship.aggregate([
      {
        $match: { status: "pending" }
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId", 
          foreignField: "_id", 
          as: "studentData"
        }
      },
      {
        $unwind: "$studentData"
      },
      {
        $sort: { createdAt: -1 } 
      },
      {
        $limit: 5
      }
    ]);

    let verifiedApplications = await Scholarship.aggregate([
      {
        $match: { status: "verified" }
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId", 
          foreignField: "_id", 
          as: "studentData"
        }
      },
      {
        $unwind: "$studentData"
      },
      {
        $sort: { createdAt: -1 } 
      },
      {
        $limit: 5
      }
    ]);

    let rejectedApplications = await Scholarship.aggregate([
      {
        $match: { status: "rejected" }
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId", 
          foreignField: "_id", 
          as: "studentData"
        }
      },
      {
        $unwind: "$studentData"
      },
      {
        $sort: { createdAt: -1 } 
      },
      {
        $limit: 5
      }
    ]);


    console.log(pendingApplications);
    console.log(verifiedApplications);
    

    
    res.render("SAG-Admin/home", { pendingCount, verifiedCount, rejectedCount, pendingApps: pendingApplications, verifiedApps: verifiedApplications, rejectedApps: rejectedApplications, moment });
  } catch (error) {
    console.log(error);
  }
};

// View All Applications Routes

exports.viewAllPendingApplications = async (req, res) =>{
  try {
    let pendingApplications = await Scholarship.aggregate([
      {
        $match: { status: "pending" }
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId", 
          foreignField: "_id", 
          as: "studentData"
        }
      },
      {
        $unwind: "$studentData"
      }
    ]);

    console.log(pendingApplications);

    // return res.status(200).json({message: pendingApplications})
    res.render("SAG-Admin/pending-applications", { applications: pendingApplications, moment });
  } catch (error) {
    console.log(error);
  }
}

exports.viewAllVerifiedApplications = async (req, res) =>{
  try {
    let verifiedApplications = await Scholarship.aggregate([
      {
        $match: { status: "verified" }
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId", 
          foreignField: "_id", 
          as: "studentData"
        }
      },
      {
        $unwind: "$studentData"
      }
    ]);

    console.log(verifiedApplications);
    console.log(verifiedApplications.length);
    

    res.render("SAG-Admin/verified-applications", { applications: verifiedApplications, moment });
  } catch (error) {
    console.log(error);
  }
}

exports.viewAllRejectedApplications = async (req, res) =>{
  try {
    let rejectedApplications = await Scholarship.aggregate([
      {
        $match: { status: "rejected" }
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId", 
          foreignField: "_id", 
          as: "studentData"
        }
      },
      {
        $unwind: "$studentData"
      }
    ]);

    console.log(rejectedApplications);

    res.render("SAG-Admin/rejected-applications", { applications: rejectedApplications, moment });
  } catch (error) {
    console.log(error);
  }
}

exports.viewSinglePendingAppById = async (req, res) =>{
  try {
    const { scholarshipId, studentId } = req.params;

    let pendingApp = await Scholarship.aggregate([
      {
        $match: { _id: new ObjectId(scholarshipId) }
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId", 
          foreignField: "_id", 
          as: "studentData"
        }
      },
      {
        $unwind: "$studentData"
      }
    ]);

    console.log("Pending App");
    console.log(pendingApp[0]);

    res.render("SAG-Admin/single-pending-application", { application: pendingApp[0], moment });
  } catch (error) {
    console.log(error);
  }
}

exports.sendFeedback = async (req, res) =>{
  try {
    const { scholarshipId } = req.params;
    const { feedback } = req.body;

    let scholarship = await Scholarship.findOneAndUpdate({_id: new ObjectId(scholarshipId)}, {
      $set: {
        "rejected": true,
        "feedback": feedback,
        "status": "rejected",
      }
    });

    return res.redirect("/SAG/home");
  } catch (error) {
    console.log(error);
  }
}

exports.verifyApplication = async (req, res) =>{
  try {
    const { scholarshipId, studentId } = req.params;

    const student = await studentModel.findOne({ _id: new ObjectId(studentId) });

    // Send mail to the candidate
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });
  
    transporter.verify();
  
    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: student.email,
      subject: "Verification Complete for PMSSS Scheme",
      html: `
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <h2 style="color: #4CAF50; text-align: center;">Your Verification for the PMSSS Scheme is Complete!</h2>
          <p>Dear Student,</p>
          <p>We are pleased to inform you that your verification for the Prime Minister's Special Scholarship Scheme (PMSSS) has been successfully completed.</p>
          <p>If you have any questions or need further assistance, feel free to reach out to our support team.</p>
          <p>Thank you for participating in this scheme. We wish you all the best in your academic pursuits!</p>
          <p>Best Regards,<br>PMSSS Support Team</p>
         </div>
      `,
    };

    let mail = await transporter.sendMail(mailOptions)


    let scholarship = await Scholarship.findOneAndUpdate({_id: new ObjectId(scholarshipId)}, {
      $set: {
        "status": "verified",
        "rejected": false,
        "feedback": "",
      }
    });

    req.flash("success", "Application verified successfully.");
    return res.redirect("/SAG/viewAllPendingApplications");
  } catch (error) {
    console.log(error);
  }
}

exports.logoutSAGAdmin = async (req, res)=>{
  try {
      req.session.destroy(()=>{
          res.redirect('/')
      })
  } catch (e) {
      console.log(e);
  }
}
