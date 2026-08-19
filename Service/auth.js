
const jwt = require("jsonwebtoken")

const secret = "jeel@123";

function setUser(user){

  return jwt.sign(user ,secret);
}


function getUser(id){

  return jwt.verify(token , secret);
}

module.exports = {
  setUser,
  getUser,
};