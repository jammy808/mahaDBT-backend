
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = new Date().getTime().toString();
    console.log(req + " " + file);

    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });


const docStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/documents/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = new Date().getTime().toString();
    console.log(req + " " + file);

    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const doc = multer({ storage: docStorage });

module.exports = {upload, doc};
  