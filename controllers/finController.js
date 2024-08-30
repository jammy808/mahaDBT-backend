const Scholarship = require("../models/scholarship");
const moment = require("moment");
const { ObjectId } = require("mongodb");

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
    

    res.render("FIN-Admin/single-verified-application.ejs", { application: verifiedApplications[0] });
  } catch (error) {
    console.log(error);
  }
};
