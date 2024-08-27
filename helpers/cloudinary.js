 
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadSingleFileOnCloudinary = async (localFilePath) => {
//   if (!localFilePath) {
//     new JsonResponse(req, res).jsonSuccess(null, new Messages().FILE_NOT_FOUND);
//     return;
//   }

  const result = await cloudinary.uploader.upload(localFilePath, {
    resource_type: "auto",
  });
  fs.unlinkSync(localFilePath);

  console.log("Result" + result.url);

  return result;
};

const uploadMultipleFilesOnCloudinary = async (attachments) => {
  const urls = await Promise.all(
    attachments.map(async (attachment) => {
      const result = await cloudinary.uploader.upload(attachment.path, {
        resource_type: "auto",
      });
      return result.url;
    })
  );

  attachments.map((attachment) => {
    fs.unlinkSync(attachment.path);
  });

  console.log("Result" + urls);

  return urls;
};

const deleteSingleFileFromCloudinary = async (publicId) => {
//   if (!publicId) {
//     new JsonResponse(req, res).jsonSuccess(null, new Messages().FILE_NOT_FOUND);
//     return;
//   }

  const result = await cloudinary.uploader.destroy(publicId);
  console.log("Result" + result);

  return result;
};

const deleteMultipleFilesFromCloudinary = async (publicIds) => {
//   if (!publicIds) {
//     new JsonResponse(req, res).jsonSuccess(null, new Messages().FILE_NOT_FOUND);
//     return;
//   }

  const result = await cloudinary.api.delete_resources(publicIds);
  console.log("Result" + result);

  return result;
};

module.exports = {
  uploadSingleFileOnCloudinary,
  uploadMultipleFilesOnCloudinary,
  deleteSingleFileFromCloudinary,
  deleteMultipleFilesFromCloudinary,
};
  