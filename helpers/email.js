const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const studentVerify = require("../models/studentVerify");

exports.sendFlutterVerificationEmail = async ({ _id, email }, token) => {
  try {
    const uniqueString = uuidv4() + _id;

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });

    await transporter.verify();

    const content = `
      <div class="container">
        <div class="header">
          <h1>Your verification code is: ${token}</h1>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Email Verification",
      html: content,
    };

    const saltRounds = 10;
    const hashedUniqueString = await bcrypt.hash(uniqueString, saltRounds);

    const newVerification = new studentVerify({
      userId: _id,
      uniqueString: hashedUniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 21600000, // 6 hours expiration
    });

    await newVerification.save();

    try {
      await transporter.sendMail(mailOptions);
      console.log("Verification email sent");
      return "ok";
    } catch (emailError) {
      console.log("Error sending email:", emailError);
      return "Email send failed";
    }
  } catch (error) {
    console.log("Internal error:", error);
    return "fail";
  }
};
