const Scholarship = require("../models/scholarship");
const Student = require("../models/student");
const moment = require("moment");
const { ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");

exports.home = async (req, res) => {
  try {
    console.log(req.session.admin);

    const verifiedCount = await Scholarship.countDocuments({
      status: "verified",
    });
    const approvedCount = await Scholarship.countDocuments({
      status: "approved",
    });

    let verifiedApplications = await Scholarship.aggregate([
      {
        $match: { status: "verified" },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $unwind: "$studentData",
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    let approvedApplications = await Scholarship.aggregate([
      {
        $match: { status: "approved" },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $unwind: "$studentData",
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    console.log(verifiedCount);
    console.log(approvedCount);

    res.render("FIN-Admin/home", {
      verifiedCount,
      approvedCount,
      moment,
      verifiedApps: verifiedApplications,
      approvedApps: approvedApplications,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.viewSingleVerifiedAppById = async (req, res) => {
  try {
    const { scholarshipId, studentId } = req.params;


    let verifiedApplications = await Scholarship.aggregate([
      {
        $match: { _id: new ObjectId(scholarshipId) },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "studentData",
        },
      },
      {
        $unwind: "$studentData",
      },
    ]);

    console.log(verifiedApplications);

    res.render("FIN-Admin/single-verified-application.ejs", {
      application: verifiedApplications[0],
      moment,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.approveAppById = async (req, res) => {
  try {
    // Set the status to approved and send the mail
    const { scholarshipId, studentId } = req.params;
    console.log(scholarshipId,studentId);
    

    const scholarship = await Scholarship.findOneAndUpdate(
      { _id: new ObjectId(scholarshipId) },
      {
        $set: {
          status: "approved",
          rejected: "false",
          feedback: "",
        },
      }
    );

    // Send the mail to the respective candidate email
    const student = await Student.findOne({ _id: new ObjectId(studentId) });

    console.log(student);
    

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
      subject: "Congratulations! Your PMSSS Application Has Been Approved and Funds Disbursed",
      html: `
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #4CAF50; text-align: center;">Congratulations! Your PMSSS Application is Approved!</h2>
            <p>Dear Student,</p>
            <p>We are excited to inform you that your application for the Prime Minister's Special Scholarship Scheme (PMSSS) has been successfully approved!</p>
            <p>Additionally, the funds have been disbursed to your account. Please check your bank statement for confirmation.</p>
            <p>If you have any questions or need further assistance, feel free to reach out to our support team.</p>
            <p>Thank you for participating in this scheme. We wish you continued success in your academic journey!</p>
            <p>Best Regards,<br>PMSSS Support Team</p>
        </div>
        `,
    };

    let mail = await transporter.sendMail(mailOptions);

    req.flash("success", "Application for PMSS has been approved");
    return res.redirect("/FIN/viewAllVerifiedApplications");
  } catch (error) {
    console.log(error);
  }
};


exports.viewAllVerifiedApplications = async (req, res) =>{
    try {
        let verifiedApplications = await Scholarship.aggregate([
            {
              $match: { status: "verified" },
            },
            {
              $lookup: {
                from: "students",
                localField: "studentId",
                foreignField: "_id",
                as: "studentData",
              },
            },
            {
              $unwind: "$studentData",
            },
          ]);

        res.render("FIN-Admin/verified-applications", { applications: verifiedApplications, moment });
    } catch (error) {
        console.log(error);
    }
}

exports.viewAllApprovedApplications = async (req, res) =>{
    try {
        let approvedApplications = await Scholarship.aggregate([
            {
              $match: { status: "approved" },
            },
            {
              $lookup: {
                from: "students",
                localField: "studentId",
                foreignField: "_id",
                as: "studentData",
              },
            },
            {
              $unwind: "$studentData",
            },
          ]);

        res.render("FIN-Admin/approved-applications", { applications: approvedApplications, moment });
    } catch (error) {
        console.log(error);
    }
}