const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
} = require("./helpers");

const app = express();
const PORT = 8080; //default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1", "key2"],
  })
);

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID",
  },
  f3hc75: {
    longURL: "http://youtube.com",
    userID: "user2RandomID",
  },
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

app.get("/", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (currentUser) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

//SHOW ALL URLS
app.get("/urls", (req, res) => {
  const currentUser = users[req.session.user_id];
  let urls = {};
  if (currentUser) {
    urls = urlsForUser(currentUser.id, urlDatabase);
  }
  const templateVars = {
    urls: urls,
    user: currentUser,
  };
  res.render("urls_index", templateVars);
});

//GET METHOD TO RENDER CREATE NEW URL PAGE
app.get("/urls/new", (req, res) => {
  const currentUser = users[req.session.user_id];
  const templateVars = { user: currentUser };
  res.render("urls_new", templateVars);
});

//RENDER SINGLE URL SHOW PAGE
app.get("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.session.user_id];
  const templateVars = {
    user: currentUser,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userID: urlDatabase[req.params.shortURL].userID,
  };
  res.render("urls_show", templateVars);
});

//REDIRECT TO LONG URL FROM URL SHOW PAGE
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("ERROR 404: PAGE NOT FOUND");
  }
});

//POST METHOD CALL TO ADD NEW URL
app.post("/urls", (req, res) => {
  //check if currently logged in to create new
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    res.status(403).send("ERROR 403: NOT LOGGED IN");
  }

  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
  };
  res.redirect(`/urls/${newShortURL}`);
});

//POST METHOD TO EDIT LONG URL
app.post("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.status(400).send("ERROR 400: INVALID USER PERMISSIONS");
  }

  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;

  //Make the edit to urlDatabase
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect("/urls");
});

//POST METHOD CALL FROM DELETE BUTTON
app.post("/urls/:shortURL/delete", (req, res) => {
  //check if current user is signed in
  const currentUser = users[req.session.user_id];
  if (!currentUser) {
    return res.status(400).send("ERROR 400: INVALID USER PERMISSIONS");
  }
  //delete url
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  //redirct to url_index (/urls)
  res.redirect("/urls");
});

//GET METHOD TO RENDER LOGIN PAGE
app.get("/login", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (currentUser) {
    res.redirect("/urls");
  }
  const templateVars = {
    user: currentUser,
  };
  res.render("login", templateVars);
});

//GET REQUEST TO RENDER REGISTER PAGE
app.get("/register", (req, res) => {
  const currentUser = users[req.session.user_id];
  if (currentUser) {
    res.redirect("/urls");
  }
  const templateVars = {
    user: currentUser,
  };
  res.render("register", templateVars);
});

//POST METHOD TO HANDLE LOGIN SUBMISSION
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const currentUser = getUserByEmail(email, users);

  //check is user exists and compare to password
  if (currentUser) {
    if (bcrypt.compareSync(password, currentUser.password)) {
      //create cookie and redirect
      req.session.user_id = currentUser.id;
      res.redirect("/urls");
    } else {
      //error checking wrong password
      res.status(403).send("ERROR 403: WRONG PASSWORD");
    }
  } else {
    //error checking not existing email
    res.status(403).send("ERROR 403: EMAIL NOT FOUND");
  }
});

//POST REQUEST TO HANDLE REGISTER SUBMISSION
app.post("/register", (req, res) => {
  //check if email and password are empty strings
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Error 400: Empty Email or Password");
  }

  //check if email already within database
  if (getUserByEmail(req.body.email, users)) {
    return res.status(400).send("Error 400: Email already Exists");
  }

  //generate new userID and create new object in users
  const userID = generateRandomString();
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: hashedPassword,
  };

  //create new cookie and redirects to /urls
  req.session.user_id = userID;
  res.redirect("/urls");
});

//POST METHOD TO HANDLE LOGOUT (CLEAR COOKIE)
app.post("/logout", (req, res) => {
  //clear cookies
  res.clearCookie("session");
  res.clearCookie("session.sig");

  //redriect to /urls
  res.redirect("/urls");
});

//LISTENING APP
app.listen(PORT, () => {
  console.log(`TinyApp Server listening on port ${PORT}`);
});
