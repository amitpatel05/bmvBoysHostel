if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const Student = require("./models/studentModel");
const authRoute = require("./Routes/AuthRoute");
const bcrypt = require("bcryptjs");
const ejsMate = require("ejs-mate");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
// const upload = multer({ storage });
const upload = multer({ dest: "uploads/" });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/boilerplate");

app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
app.use("/uploads", express.static("uploads"));

const dbUrl = process.env.ATLASDB_URL;

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

app.get("/", (req, res) => {
  res.render("../views/layouts/boilerplate.ejs");
});

// Home Route
app.get("/home", (req, res) => {
  res.render("../views/pages/home.ejs");
});

// Admission Route
app.get("/admission", (req, res) => {
  res.render("../views/pages/admission.ejs");
});

// Facilities Route
app.get("/facilities", (req, res) => {
  res.render("../views/pages/facilities.ejs");
});

// Alumini Route
app.get("/alumini", (req, res) => {
  res.render("../views/pages/alumini.ejs");
});

// GALLERY

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

// Festivals Gallery Route
app.get("/festivalsGallery", async (req, res) => {
  const allStudents = await Student.find({});
  res.render("pages/festivalsGallery", { allStudents });
});

app.post(
  "/festivalsImage",
  upload.single("student[festivalsImage]"),
  async (req, res) => {
    try {
      const imagePath = req.file.path;

      const newStudent = new Student({
        festivalsImage: { url: req.file.path },
        createdAt: new Date(),
      });
      await newStudent.save();

      res.redirect("/festivalsGallery");
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to upload festivalsImage");
    }
  }
);

// Sports Gallery Route
app.get("/sportsGallery", async (req, res) => {
  const allStudents = await Student.find({});
  res.render("pages/sportsGallery", { allStudents });
});

app.post(
  "/sportsImage",
  upload.single("student[sportsImage]"),
  async (req, res) => {
    try {
      const imagePath = req.file.path;

      const newStudent = new Student({
        sportsImage: { url: req.file.path },
        createdAt: new Date(),
      });
      await newStudent.save();

      res.redirect("/sportsGallery");
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to upload sportsImage");
    }
  }
);

// Fee Route
app.get("/fees", (req, res) => {
  res.render("../views/pages/fees.ejs");
});

// Commitee Route
app.get("/committee", (req, res) => {
  res.render("../views/pages/committee.ejs");
});

// Rules Route
app.get("/rules", (req, res) => {
  res.render("../views/pages/rules.ejs");
});

// SignUp Route
app.get("/signup", (req, res) => {
  res.render("../views/users/signup.ejs");
});

app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send("All fields are required");
  }

  console.log("New user:", { username, email, password });

  res.redirect("/home");
});

// Login Route
app.get("/login", (req, res) => {
  res.render("../views/users/login.ejs");
});

// Account Route
app.get("/account", (req, res) => {
  res.render("../views/users/account.ejs");
});

// About Route
app.get("/about", (req, res) => {
  res.render("../views/pages/about.ejs");
});

// Feedback Route
app.get("/feedback", (req, res) => {
  res.render("../views/users/feedback.ejs");
});

// Privacy & Terms Route
app.get("/privacy&terms", (req, res) => {
  res.render("../views/pages/privacyterms.ejs");
});

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
    store: store,
    cookie: {
      expires: Date.now() + 1000 * 60 * 60 * 24 * 3,
      maxAge: 1000 * 60 * 60 * 24 * 3,
      httpOnly: true,
    },
  })
);

app.use(
  cors({
    origin: ["http://localhost:4000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use("/", authRoute);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
