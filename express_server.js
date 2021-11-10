const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; //default port 8080

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function generateRandomString() {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i <= 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

//SHOW ALL URLS
app.get("/urls", (req, res) => {
  const currentUserID = req.cookies["user_id"];
  const currentUser = users[currentUserID];
  const templateVars = {
    urls: urlDatabase,
    user: currentUser,
  };
  res.render("urls_index", templateVars);
});

//POST METHOD CALL FROM DELETE BUTTON
app.post("/urls/:shortURL/delete", (req, res) => {
  //delete url
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];

  //redirct to url_index (/urls)
  res.redirect("/urls");
});

//CREATE NEW URL PAGE
app.get("/urls/new", (req, res) => {
  const currentUserID = req.cookies["user_id"];
  const currentUser = users[currentUserID];
  const templateVars = { user: currentUser };
  res.render("urls_new", templateVars);
});

//POST METHOD CALL TO ADD NEW URL
app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(`/urls/${newShortURL}`);
});

//POST METHOD TO EDIT LONG URL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;

  //Make the edit to urlDatabase
  urlDatabase[shortURL] = newLongURL;
  res.redirect("/urls");
});

//RENDER SINGLE URL SHOW PAGE
app.get("/urls/:shortURL", (req, res) => {
  const currentUserID = req.cookies["user_id"];
  const currentUser = users[currentUserID];
  const templateVars = {
    user: currentUser,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

//USE REDIRECT TO LONG URL AFTER RENDERING URL SHOW PAGE
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//POST METHOD TO HANDLE USERNAME SUBMISSION
app.post("/login", (req, res) => {
  // console.log(req.body);
  res.cookie("username", req.body.username);
  // console.log("cookie", req.cookies);
  res.redirect("/urls");
});

//POST METHOD TO HANDLE LOGOUT (CLEAR COOKIE)
app.post("/logout", (req, res) => {
  //clear cookies
  res.clearCookie("username");
  //redriect to /urls
  res.redirect("/urls");
});

//GET REQUEST TO RENDER REGISTER PAGE
app.get("/register", (req, res) => {
  const currentUserID = req.cookies["user_id"];
  const currentUser = users[currentUserID];
  const templateVars = {
    user: currentUser,
  };
  res.render("register", templateVars);
});

function checkEmailwithinUsers(users, submittedEmail) {
  for (let user in users) {
    if (users[user].email === submittedEmail) {
      return true;
    }
  }
  return false;
}

//POST REQUEST TO HANDLE REGISTER SUBMISSION
app.post("/register", (req, res) => {
  //check if email and password are empty strings
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Error 400: Empty Email or Password");
  }

  //check if email already within database
  if (checkEmailwithinUsers(users, req.body.email)) {
    return res.status(400).send("Error 400: Email already Exists");
  }

  //check user object for existing email
  console.log(checkEmailwithinUsers(users, req.body.email));

  //generate new userID and create new object in users
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password,
  };

  //create new cookie
  res.cookie("user_id", userID);
  // console.log(users);
  res.redirect("/urls");
});

//GET METHOD TO RENDER LOGIN PAGE
app.get("/login", (req, res) => {
  const currentUserID = req.cookies["user_id"];
  const currentUser = users[currentUserID];
  const templateVars = {
    user: currentUser,
  };
  res.render("login", templateVars);
});

//LISTENING APP
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
