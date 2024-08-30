const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
var createError = require("http-errors");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const expressSession = require("express-session");
const passport = require("passport");
var admin = require("firebase-admin");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");

var indexRouter = require("./router");
var studentRouter = require("./models/student");

process.env.GOOGLE_APPLICATION_CREDENTIALS;
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "flutter-template-noti",
});

//app.use(cors({ origin: "*" }));
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // Allow credentials (cookies) to be sent
  })
);
app.use(express.json());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "giteesh-gay",
    store: MongoStore.create({mongoUrl: process.env.MONGODB_URI, collectionName: "sessions"}),
    cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(studentRouter.serializeUser());
passport.deserializeUser(studentRouter.deserializeUser());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));


// Flash
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.errors = req.flash('errors');
  res.locals.admin = req.session.admin
  next();
});


// app.get("/", (req, res) => {
//   res.send("Hello API");
// });


app.use("/", indexRouter);

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(8000, () => console.log("Connected"));
  })
  .catch((error) => console.log(error));

module.exports = app;
