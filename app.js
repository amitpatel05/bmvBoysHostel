if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
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

store.on("error", (err) => console.log("SESSION STORE ERROR:", err));

app.use(
  session({
    secret: "mysupersecret",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
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
  res.locals.currUser = req.session.user || null;
  next();
});

// ------------------ ROUTES ------------------ //

// Landing Page
app.get("/", (req, res) => {
  res.render("pages/index", { user: req.session.user });
});

// Signup Page
app.get("/signup", (req, res) => {
  res.render("users/signup");
});

// Signup Logic
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (exists) {
      return res.render("users/signup", {
        error: "Username or Email already exists",
      });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email,
      password: hashed,
    });

    req.session.user = { id: user._id, username: user.username };

    res.redirect("/login");
  } catch (err) {
    res.render("users/signup", { error: "Signup failed" });
  }
});

// Login Page
app.get("/login", (req, res) => {
  res.render("users/login");
});

// Login Logic
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.render("users/login", { error: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.render("users/login", { error: "Wrong password" });

    req.session.user = { id: user._id, username: user.username };

    res.redirect("/profile");
  } catch (err) {
    res.render("users/login", { error: "Login failed" });
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// Profile Page
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

    const updated = await Profile.findOneAndUpdate(
      { userId },
      {
        ...req.body,
        userId,
      },
      { upsert: true, new: true }
    );

    res.redirect("/home");
  } catch (err) {
    res.redirect("/profile");
  }
});

// Home Page
app.get("/home", (req, res) => {
  res.render("pages/index", { user: req.session.user });
});

// Cloudinary Image Upload
app.get("/eventsGallery", async (req, res) => {
  const allImages = await Image.find().sort({ _id: -1 });
  res.render("pages/eventsGallery", { allImages });
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
  res.render("../views/users/admission.ejs");
});

// Feedback Route
app.get("/feedback", (req, res) => {
  res.render("../views/users/feedback.ejs");
});

// Map Route
app.get("/location", async (req, res) => {
  const allImages = await Image.find({});
  res.render("../views/pages/location.ejs", { allImages });
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/*

if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const fs = require("fs");
const path = require("path");
// const methodOverride = require("method-override");
const mongoose = require("mongoose");
const app = express();
const cookieParser = require("cookie-parser");
const Image = require("./models/image");
const bcrypt = require("bcryptjs");
// const ejsMate = require("ejs-mate");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
const User = require("./models/user");
const Profile = require("./models/profile");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/boilerplate");

app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));
// app.use(methodOverride("_method"));
app.use(express.json());
app.use(cookieParser());
// app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MONGODB CONNECTION
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
    saveUninitialized: true,
    const: store,
    cookie: {
      expires: Date.now() + 1000 * 60 * 60 * 24 * 3,
      maxAge: 1000 * 60 * 60 * 24 * 3,
      httpOnly: true,
    },
  })
);

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.use((req, res, next) => {
  res.locals.currUser = req.session?.user || null;
  next();
});

// Boilerplate
app.get("/", (req, res) => {
  res.render("layouts/boilerplate");
});

// Home Route
app.get("/home", (req, res) => {
  res.render("../views/pages/index.ejs", {
    user: req.session?.user || null,
  });
});

app.post("/home", (req, res) => {
  console.log("POST /home received:", req.body);
  res.redirect("/home");
});

// Cloudinary Image Upload
app.get("/eventsGallery", async (req, res) => {
  const allImages = await Image.find().sort({ _id: -1 });
  res.render("pages/eventsGallery", { allImages });
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

// SignUp Route
app.get("/signup", (req, res) => {
  res.render("../views/users/signup.ejs");
});

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .render("../views/users/signup", { error: "All fields required" });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res.status(400).render("../views/users/signup", {
        error: "Username or email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });
    await user.save();

    console.log("SAVED USER:", { username });

    req.session.user = { id: user._id, username };
    res.redirect("/login");
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).render("../views/users/signup", { error: "Signup failed" });
  }
});

// Login Route
app.get("/login", (req, res) => {
  res.render("../views/users/login.ejs");
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("LOGIN:", username);

    if (!username || !password) {
      return res
        .status(400)
        .render("../views/users/login", { error: "Fields required" });
    }

    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      return res
        .status(400)
        .render("../views/users/login", { error: "User not found" });
    }

    if (!user.password) {
      console.log("NO PASSWORD IN DB!");
      return res.status(400).render("../views/users/login", {
        error: "Account issue. Please signup again.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res
        .status(400)
        .render("../views/users/login", { error: "Wrong password" });
    }

    req.session.user = { id: user._id, username: user.username };
    res.redirect("/profile");
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).render("../views/users/login", { error: "Server error" });
  }
});

// Logout Route
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});
// app.post("/logout", (req, res) => {
//   req.session.destroy((err) => {
//     if (err) {
//       return res.redirect("/home");
//     }
//     res.clearCookie("connect.sid");
//     res.redirect("/login");
//   });
// });

// Admission Route
app.get("/admission", (req, res) => {
  res.render("../views/users/admission.ejs");
});

// Profile Route
app.get("/profile", (req, res) => {
  if (!req.session?.user) {
    return res.redirect("/login");
  }
  res.render("../views/users/profile.ejs", {
    user: req.session.user,
  });
});

app.post("/profile", async (req, res) => {
  if (!req.session?.user) {
    return res.redirect("/login");
  }

  try {
    const userId = req.session.user.id;
    const updateData = {
      fullName: req.body.fullName,
      dateOfBirth: req.body.dateOfBirth,
      email: req.body.email,
      phone: req.body.phone,
      emergencyContact: req.body.emergencyContact,
      bloodGroup: req.body.bloodGroup,
      address: req.body.address,
      course: req.body.course,
      year: req.body.year,
    };

    const updatedUser = await Profile.findOneAndUpdate({ userId }, updateData);

    req.session.user = {
      id: updatedUser._id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
    };

    console.log("Profile fully updated:", updatedUser.fullName);
    res.redirect("/home");
  } catch (err) {
    console.error("Profile update failed:", err);
    res.redirect("/profile");
  }
});

// Feedback Route
app.get("/feedback", (req, res) => {
  res.render("../views/users/feedback.ejs");
});

// Feedback Route
app.get("/feedbackPage", (req, res) => {
  res.render("../views/users/feedbackPage.ejs");
});

// Events Gallery Route
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.get("/eventsGallery", async (req, res) => {
  const allImages = await Image.find().sort({ _id: -1 });
  res.render("../views/pages/eventsGallery", {
    allImages,
    currUser: req.session.user,
  });
});

app.post("/eventsImage", upload.single("eventsImage"), async (req, res) => {
  try {
    const newStudent = new Image({
      eventsImage: { url: "/uploads/" + req.file.filename },
    });

    await newStudent.save();
    res.redirect("/eventsGallery");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error uploading image");
  }
});

// Map Route
app.get("/location", async (req, res) => {
  const allImages = await Image.find({});
  res.render("../views/pages/location.ejs", { allImages });
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

*/
