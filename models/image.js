const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const imageSchema = new Schema({
  eventsImage: {
    url: String,
  },
  profileImage: {
    url: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Image = mongoose.models.Image || mongoose.model("Image", imageSchema);

module.exports = Image;
