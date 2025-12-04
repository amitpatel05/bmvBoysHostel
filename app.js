if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const authRoute = require("./Routes/AuthRoute");
const bcrypt = require("bcryptjs");
const ejsMate = require("ejs-mate");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/boilerplate");

app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

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

app.get("/home", (req, res) => {
  res.render("../views/pages/home.ejs");
});

app.get("/admission", (req, res) => {
  res.render("../views/pages/admission.ejs");
});

app.get("/facilities", (req, res) => {
  res.render("../views/pages/facilities.ejs");
});

app.get("/alumini", (req, res) => {
  res.render("../views/pages/alumini.ejs");
});

app.get("/sportsGallery", (req, res) => {
  res.render("../views/pages/sportsGallery.ejs");
});

app.get("/festivalsGallery", (req, res) => {
  res.render("../views/pages/festivalsGallery.ejs");
});

app.get("/fees", (req, res) => {
  res.render("../views/pages/fees.ejs");
});

app.get("/committee", (req, res) => {
  res.render("../views/pages/committee.ejs");
});

app.get("/rules", (req, res) => {
  res.render("../views/pages/rules.ejs");
});

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

app.get("/login", (req, res) => {
  res.render("../views/users/login.ejs");
});

app.get("/account", (req, res) => {
  res.render("../views/users/account.ejs");
});

app.get("/about", (req, res) => {
  res.render("../views/pages/about.ejs");
});

app.get("/feedback", (req, res) => {
  res.render("../views/users/feedback.ejs");
});

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
