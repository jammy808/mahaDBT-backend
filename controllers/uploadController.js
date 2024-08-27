
const {
  uploadSingleFileOnCloudinary,
  uploadMultipleFilesOnCloudinary,
  deleteSingleFileFromCloudinary,
  deleteMultipleFilesFromCloudinary,
} = require("../helpers/cloudinary");

// Upload Files

exports.uploadSingleFile = async function (req, res) {
  console.log("Request File");

  // If you are sending only one file only use req.file
  console.log(req.file);

  // Get the Local Path from the server which will be stored by multer defined in the middleware
  const image = req.file?.path;

  console.log("LocalPath: ", image);

  if(image == null) {
    return res.status(200).json({message: "file not found"});
  }

  // Use the local Path to upload the file to Cloudinary
  const result = await uploadSingleFileOnCloudinary(image);

  console.log("Result" + result);

  // Make sure if the file has been uploaded to Cloudinary, store the cloudinary URL in the database
  if (result == null) {
    return res.status(200).json({message: "fail"});
  }

  console.log("Cloudinary Result: ", result);

  return res.status(200).json({message: "ok"});
};

exports.uploadMultipleFiles = async function (req, res) {
  // Get the Local Path from the server which will be stored by multer defined in the middleware
  const attachments = req.files;

  // If there are no attachments
  if (attachments.length == 0) {
    return res.status(200).json({message: "file not found"});
  }

  // Use the local Path to upload the file to Cloudinary
  const result = await uploadMultipleFilesOnCloudinary(attachments);

  // Make sure if the file has been uploaded to Cloudinary, store the cloudinary URL in the database
  if (result == null) {
    return res.status(200).json({message: "fail"});
  }

  console.log("Cloudinary Result: ", result);

  return res.status(200).json({message: "ok"});
};

exports.uploadFiles = async function (req, res) {
  // Get the Local Path from the server which will be stored by multer defined in the middleware
  const userImagePath = req.files?.userImage[0].path;
  const coverPhotoPath = req.files?.coverPhoto[0].path;

  // If there are no images
  if (userImagePath == null || coverPhotoPath == null) {
    return res.status(200).json({message: "file not found"});
  }

  // Use the local Path to upload the file to Cloudinary
  const userImageURL = await uploadSingleFileOnCloudinary(userImagePath);
  const coverPhotoURL = await uploadSingleFileOnCloudinary(coverPhotoPath);

  // Make sure if the file has been uploaded to Cloudinary, store the cloudinary URL in the database
  if (!userImageURL || !coverPhotoURL) {
    return res.status(200).json({message: "fail"});
  }

  console.log("Cloudinary Result: ", userImageURL, coverPhotoURL);

  return res.status(200).json({message: "ok"});
};

// Delete Files

exports.deleteSingleFile = async function (req, res) {
  const publicId = req.body.publicId;

  // Delete the file from Cloudinary
  const result = await deleteSingleFileFromCloudinary(publicId);

  // Make sure if the file has been deleted from Cloudinary
  if (!result) {
    return res.status(200).json({message: "fail"});
  }

  return res.status(200).json({message: "ok"});
};

exports.deleteMultipleFiles = async function (req, res) {
  const publicIds = req.body.publicIds;

  // Delete the file from Cloudinary
  const result = await deleteMultipleFilesFromCloudinary(publicIds);

  // Make sure if the file has been deleted from Cloudinary
  if (!result) {
    return res.status(200).json({message: "fail"});
  }

  return res.status(200).json({message: "ok"});
};

    