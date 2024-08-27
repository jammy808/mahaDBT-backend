const admin = require("firebase-admin");

exports.sendNotificationToSingleDevice = async (req, res) => {
  const token = req.body.fcmToken;

  const message = {
    notification: {
      title: req.body.title,
      body: req.body.desc,
    },
    data: {
      url: req.body.url,
    },
    token: token,
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent message:", response);
      res.status(200).json({ message: "ok" });
    })
    .catch((error) => {
      console.log("Error sending message:");
      res.status(500).json({ message: "Error sending push notification" });
    });
};

exports.sendNotificationToTopic = async (req, res) => {
  const topic = req.params.topic;

  const message = {
    notification: {
      title: req.body.title,
      body: req.body.desc,
    },
    data: {
      url: req.body.url,
    },
    topic: topic,
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("Successfully sent message:", response);
      return res.status(200).json({ message: "ok" });
    })
    .catch((error) => {
      console.log("Error sending message:");
      return res
        .status(500)
        .json({ message: "Error sending push notification" });
    });
};

exports.sendBatchNotificationUsingMultipleFCM = async (req, res) => {
  try {
    const tokens = req.body.fcmTokens;

    const message = {
      notification: {
        title: req.body.title,
        body: req.body.desc,
      },
      tokens: tokens,
      data: {
        url: req.body.url,
      },
    };

    admin
      .messaging()
      .sendEachForMulticast(message)
      .then((response) => {
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(tokens[idx]);
            }
          });
          console.log("List of tokens that caused failures: " + failedTokens);
          return res
            .status(200)
            .send("List of tokens that caused failures: " + failedTokens);
        } else {
          return res.status(200).json({ message: "ok" });
        }
      });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error sending push notification" });
  }
};

exports.sendNotificationsToMultipleTopics = async (req, res) => {
  const topics = req.body.topics;

  if (!Array.isArray(topics) || topics.length === 0) {
    return res
      .status(400)
      .send({ error: "Topics should be a non-empty array" });
  }

  // Generate the condition statement from the topics array
  const condition = topics.map((topic) => `'${topic}' in topics`).join(" || ");
  console.log(condition);

  const message = {
    notification: {
      title: req.body.title,
      body: req.body.desc,
    },
    data: {
      url: req.body.url,
    },
    condition: condition,
  };

  // Send a message to devices subscribed to the combination of topics specified by the provided condition
  admin
    .messaging()
    .send(message)
    .then((response) => {
      // Response is a message ID string
      console.log("Successfully sent message:", response);
      return res
        .status(200)
        .send({ message: "Notification sent successfully", response });
    })
    .catch((error) => {
      console.log("Error sending message:", error);
      return res
        .status(500)
        .send({ error: "Error sending notification", details: error });
    });
};

exports.sendCustomImageNotification = async (req, res) => {
  const topic = req.params.topic;

  const message = {
    notification: {
      title: req.body.title,
      body: req.body.desc,
    },
    // Here, you can also add custom image, icon as well as background color for the icon
    android: {
      notification: {
        imageUrl: req.body.image,
        icon: "ic_launcher`",
        color: "#7e55c3",
      },
    },
    data: {
      url: req.body.url,
    },
    topic: topic,
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      return res.status(200).json({ message: "ok" });
    })
    .catch((error) => {
      return res
        .status(500)
        .send({ error: "Error sending notification", details: error });
    });
};
