const express = require("express");
const router = express.Router();
const studentController = require("./controllers/authController");
const firebaseController = require("./controllers/firebaseController");
const uploadController = require("./controllers/uploadController");
const upload = require("./middlewares/multer");

router.get("/", (req, res) => {
  res.send("Hello");
});

// Student registration route
router.post("/studentReg", studentController.registerStudent);

// Student login route
router.post(
  "/studentLog",
  studentController.isVerified,
  studentController.loginStudent
);

router.get('/logout', studentController.logout);

// Email verification route
router.get("/verify/:userId/:uniqueString", studentController.verifyStudent);

// Render verification page , for this a view page has to be created
router.get("/verify", studentController.renderVerificationPage);

router.get("/profile", studentController.ensureAuthenticated, (req, res) => {
  // Send user data as JSON
  res.status(200).json({ user: req.user });
});

//update user details : 1st draft
router.post("/update", studentController.ensureAuthenticated, studentController.update);

// Firebase routes

// Sending Notification to Single Device using FCM Token
router.post(
  "/sendNotificationToSingleDevice",
  firebaseController.sendNotificationToSingleDevice
);

// Sending Notification to Topic
router.post(
  "/sendNotificationToTopic/:topic",
  firebaseController.sendNotificationToTopic
);

// Sending Batch Notification to multiple FCM's
router.post(
  "/sendBatchNotificationUsingMultipleFCM",
  firebaseController.sendBatchNotificationUsingMultipleFCM
);

// Sending Notification to Multiple Topics
router.post(
  "/sendNotificationsToMultipleTopics",
  firebaseController.sendNotificationsToMultipleTopics
);

// Sending Notification with a custom image (Single device, multiple devices, topic, multiple topics --> applicable)
router.post(
  "/sendCustomImageNotification/:topic",
  firebaseController.sendCustomImageNotification
);

// Upload Routes
// Add Single file to Cloudinary
router.post(
  "/uploadSingleFile",
  // AuthHelper.verifyToken,
  upload.single("image"),
  uploadController.uploadSingleFile
);

// Add Multiple files to cloudinary - {Array of Attachments}
router.post(
  "/uploadMultipleFiles",
  // AuthHelper.verifyToken,
  upload.array("attachments"),
  uploadController.uploadMultipleFiles
);

// Add files according to fields to cloudinary
// [
//   { name: 'avatar', maxCount: 1 },
//   { name: 'gallery', maxCount: 8 }
// ]
router.post(
  "/uploadFiles",
  // AuthHelper.verifyToken,
  upload.fields([{ name: "userImage" }, { name: "coverPhoto" }]),
  uploadController.uploadFiles
);

// Delete Single file from cloudinary
router.post(
  "/deleteSingleFile",
  // AuthHelper.verifyToken,
  uploadController.deleteSingleFile
);

// Delete Multiple files from cloudinary - {Array of Public Ids}
router.post(
  "/deleteMultipleFiles",
  // AuthHelper.verifyToken,
  uploadController.deleteMultipleFiles
);

// Atharva's Routes - {Flutter App}

// Student registration route
router.post("/register", studentController.register);
router.post("/isUserVerified", studentController.isUserVerified);
router.post("/login", studentController.login);

module.exports = router;
