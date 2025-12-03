const mongoose = require("mongoose");
const { type } = require("os");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const studentSchema = new Schema({
  username: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    require: true,
    unique: true,
  },

  contact: {
    type: Number,
  },

  image: {
    url: String,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

studentSchema.pre("save", async function () {
  this.password = await bcrypt.hash(this.password, 12);
});

studentSchema.post("findOneAndDelete", async () => {});

const student = mongoose.model("student", studentSchema);
module.exports = student;
