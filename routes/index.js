const express = require('express');
const router = express.Router();
const studentController = require('../controllers/authController');

router.get('/', (req, res) => {
  res.send('Hello');
});

// Student registration route
router.post('/studentReg', studentController.registerStudent);

// Student login route
router.post('/studentLog', studentController.isVerified, studentController.loginStudent);

// Email verification route
router.get("/verify/:userId/:uniqueString", studentController.verifyStudent);

// Render verification page , for this a view page has to be created
router.get("/verify", studentController.renderVerificationPage);

module.exports = router;
