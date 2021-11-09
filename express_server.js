const express = require("express");
const app = express();
const PORT = 8080; //default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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

//HOME PAGE
app.get("/", (req, res) => {
  res.send("Home Page");
});

//SHOW ALL URLS
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
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
  res.render("urls_new");
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
  const templateVars = {
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

//LISTENING APP
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
