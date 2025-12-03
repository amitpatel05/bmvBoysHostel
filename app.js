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

app.get("/signup", (req, res) => {
  res.render("../views/users/signup.ejs");
});

app.get("/login", (req, res) => {
  res.render("../views/users/login.ejs");
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
