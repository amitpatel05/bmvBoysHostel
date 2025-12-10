if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const expressLayouts = require("express-ejs-layouts");
const multer = require("multer");
const { storage } = require("./cloudinary");
const upload = multer({ storage });

const User = require("./models/user");
const Profile = require("./models/profile");
const Image = require("./models/image");

const app = express();

// ------------------ VIEW SETUP ------------------ //
const ejsMate = require("ejs-mate");
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/boilerplate");

app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public")));

// ------------------ DB CONNECTION ------------------ //
const dbUrl = process.env.ATLASDB_URL;

const store = new MongoDBStore({
  uri: dbUrl,
  collection: "sessions",
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

app.use(
  session({
    secret: "mysupersecret",
    resave: false,
    saveUninitialized: false,
    // store: store,
    cookie: {
      expires: Date.now() + 1000 * 60 * 60 * 24 * 3,
      maxAge: 1000 * 60 * 60 * 24 * 3,
      httpOnly: true,
    },
  })
);

mongoose
  .connect(dbUrl)
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log("DB ERROR:", err));

// ------------------ GLOBAL USER ------------------ //
app.use((req, res, next) => {
  res.locals.currUser = req.session?.user || null;
  next();
});

// ------------------ ROUTES ------------------ //

// Root
app.get("/", (req, res) => {
  res.redirect("/home");
});

// Landing Page
app.get("/home", (req, res) => {
  res.render("pages/index.ejs", {
    user: req.session.user || null,
  });
});

// SignUp Route
app.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

// Signup Logic
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .render("users/signup", { error: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).render("users/signup", {
        error: "Username or Email already exists",
      });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = new User({
      username,
      email,
      password: hashed,
    });
    await user.save();

    console.log("SAVED USER:", { username });
    req.session.user = { id: user._id, username: user.username };

    res.redirect("/login");
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).render("users/signup", { error: "Signup failed" });
  }
});

// Login Route
app.get("/login", (req, res) => {
  res.render("users/login");
});

// Login Logic
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("LOGIN:", username);

    if (!username || !password)
      return res
        .status(400)
        .render("users/login", { error: "All fields are required" });

    const user = await User.findOne({ username: username.trim() });
    if (!user)
      return res.status(400).render("users/login", { error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).render("users/login", { error: "Wrong password" });

    if (!user.password) {
      console.log("NO PASSWORD IN DB!");
      return res.status(400).render("users/login", {
        error: "Account issue. Please signup again.",
      });
    }
    req.session.user = { id: user._id, username: user.username };

    res.redirect("/profile");
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).render("users/login", { error: "Login failed" });
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
      return res.redirect("/home");
    }
    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.redirect("/login");
  });
});

// Profile Route
app.get("/profile", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const profile = await Profile.findOne({ userId: req.session.user.id });

  res.render("users/profile", {
    user: req.session.user,
    profile,
  });
});

// Profile Update
app.post("/profile", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    const userId = req.session.user.id;

    const updatedUser = await Profile.findOneAndUpdate(
      { userId },
      {
        ...req.body,
        userId,
      },
      { upsert: true, new: true }
    );

    req.session.user = {
      id: userId,
      username: req.session.user.username,
      fullName: updatedUser.fullName,
    };

    console.log("Profile fully updated:", updatedUser.fullName);
    res.redirect("/home");
  } catch (err) {
    console.error("Profile update failed:", err);
    res.redirect("/profile");
  }
});

// Cloudinary Image Upload
app.get("/eventsGallery", async (req, res) => {
  const allImages = await Image.find().sort({ _id: -1 });
  res.render("pages/eventsGallery", {
    allImages,
    currUser: req.session.user,
  });
});

app.post("/eventsImage", upload.single("eventsImage"), async (req, res) => {
  try {
    await Image.create({
      eventsImage: { url: req.file.path },
    });

    res.redirect("/eventsGallery");
  } catch (err) {
    res.send("Image upload failed");
  }
});

// Admission Route
app.get("/admission", (req, res) => {
  res.render("users/admission.ejs");
});

// Feedback Route
app.get("/feedback", (req, res) => {
  res.render("users/feedback.ejs");
});

// Feedback Page
app.get("/feedbackPage", (req, res) => {
  res.render("users/feedbackPage.ejs");
});

// Map Route
app.get("/location", async (req, res) => {
  const allImages = await Image.find({});
  res.render("pages/location.ejs", { allImages });
});

// Facilities Route
app.get("/facilities", (req, res) => {
  res.render("../views/pages/facilities.ejs");
});

// Alumni Route
app.get("/alumni", (req, res) => {
  res.render("../views/pages/alumni.ejs");
});

// Fee Route
app.get("/fee", (req, res) => {
  res.render("../views/pages/fee.ejs");
});

// Commitee Route
app.get("/committee", (req, res) => {
  res.render("../views/pages/committee.ejs");
});

// Rules Route
app.get("/rules", (req, res) => {
  res.render("../views/pages/rules.ejs");
});

// About Route
app.get("/about", (req, res) => {
  res.render("../views/pages/about.ejs");
});

// Help Center Route
app.get("/helpCenter", (req, res) => {
  res.render("../views/pages/help.ejs");
});

// Privacy & Terms Route
app.get("/privacy&terms", (req, res) => {
  res.render("../views/pages/privacyterms.ejs");
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong");
});

// ------------------ SERVER ------------------ //
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
