const sagAdmin = require("../../models/SAGAdmin");
const bcrypt = require("bcrypt");

exports.loginSAGAdmin = async (req, res) => {
  try {
    const { adminEmail, adminPassword } = req.body;

    console.log(req.body);

    if(adminEmail.trim() == "" || adminPassword.trim() == ""){
      console.log("Jello");
      
      req.flash("errors", "Please enter all the fields.");
      req.session.save(function () {
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
        req.session.save(function () {
          res.redirect("/SAG/home");
        });
      } else {
        req.flash("errors", "Invalid username / password.");
        req.session.save(function () {
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

    res.render("SAG-Admin/home");
  } catch (error) {
    console.log(error);
  }
};

exports.viewAllPendingApplications = async (req, res) =>{
  try {
    // Fetch the pending applications
    
    res.render("SAG-Admin/viewAllPendingApplications");
  } catch (error) {
    console.log(error);
  }
}