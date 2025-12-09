const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: String,
    dateOfBirth: Date,
    phone: String,
    emergencyContact: String,
    bloodGroup: String,
    address: String,
    course: String,
    year: String,
    profilePhoto: String,
  },
  { timestamps: true }
);

const Profile =
  mongoose.models.Profile || mongoose.model("Profile", profileSchema);

module.exports = Profile;
