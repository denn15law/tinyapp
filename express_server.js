const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080; //default port 8080

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userRandomID",
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

function generateRandomString() {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i <= 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function urlsForUser(id) {
  let output = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      output[url] = urlDatabase[url];
    }
  }
  return output;
}

//SHOW ALL URLS
app.get("/urls", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  // console.log(currentUser);
  const templateVars = {
    urls: urlDatabase,
    user: currentUser,
  };
  // console.log(urlsForUser(currentUser.id));
  res.render("urls_index", templateVars);
});

//POST METHOD CALL FROM DELETE BUTTON
app.post("/urls/:shortURL/delete", (req, res) => {
  //check if current user is signed in
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.status(400).send("ERROR 400: INVALID USER PERMISSIONS");
  }
  //delete url
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];

  //redirct to url_index (/urls)
  res.redirect("/urls");
});

//GET METHOD TO RENDER CREATE NEW URL PAGE
app.get("/urls/new", (req, res) => {
  const currentUserID = req.cookies["user_id"];
  const currentUser = users[currentUserID];
  const templateVars = { user: currentUser };
  res.render("urls_new", templateVars);
});

//POST METHOD CALL TO ADD NEW URL
app.post("/urls", (req, res) => {
  //check if currently logged in to create new
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    res.status(403).send("ERROR 403: NOT LOGGED IN");
  }

  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"],
  };
  res.redirect(`/urls/${newShortURL}`);
});

//POST METHOD TO EDIT LONG URL
app.post("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  if (!currentUser) {
    return res.status(400).send("ERROR 400: INVALID USER PERMISSIONS");
  }

  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;

  //Make the edit to urlDatabase
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect("/urls");
});

//RENDER SINGLE URL SHOW PAGE
app.get("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
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

function lookupUser(users, email) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
}

//POST METHOD TO HANDLE LOGIN SUBMISSION
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!checkEmailWithinUsers(users, email)) {
    return res.status(403).send("ERROR 403: EMAIL NOT FOUND");
  } else {
    if (!checkEmailPassWithinUsers(users, email, password)) {
      return res.status(403).send("ERROR 403: WRONG PASSWORD");
    } else {
      const currentUser = lookupUser(users, email);
      res.cookie("user_id", currentUser.id);
    }
  }
  res.redirect("/urls");
});

//POST METHOD TO HANDLE LOGOUT (CLEAR COOKIE)
app.post("/logout", (req, res) => {
  //clear cookies
  res.clearCookie("user_id");
  //redriect to /urls
  res.redirect("/urls");
});

//GET REQUEST TO RENDER REGISTER PAGE
app.get("/register", (req, res) => {
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser,
  };
  res.render("register", templateVars);
});

function checkEmailPassWithinUsers(users, submittedEmail, submittedPassword) {
  for (let user in users) {
    if (
      users[user].email === submittedEmail &&
      users[user].password === submittedPassword
    ) {
      return true;
    }
  }
  return false;
}

function checkEmailWithinUsers(users, submittedEmail) {
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
  if (checkEmailWithinUsers(users, req.body.email)) {
    return res.status(400).send("Error 400: Email already Exists");
  }

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
  const currentUser = users[req.cookies["user_id"]];
  const templateVars = {
    user: currentUser,
  };
  res.render("login", templateVars);
});

//LISTENING APP
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
