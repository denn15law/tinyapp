function getUserByEmail(email, users) {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
}

function generateRandomString() {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i <= 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function urlsForUser(id, urlDatabase) {
  let output = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      output[url] = urlDatabase[url];
    }
  }
  return output;
}

module.exports = { getUserByEmail, generateRandomString, urlsForUser };
