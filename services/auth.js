const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const hashPassword = (password) => bcrypt.hash(password, 12);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);
const setUser = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
const getUser = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { hashPassword, comparePassword, setUser, getUser };
