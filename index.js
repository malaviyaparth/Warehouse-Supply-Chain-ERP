const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Hello from Node.js API",
  });
});

app.get("/users", (req, res) => {
  const users = [
    { id: 1, name: "Parth" },
    { id: 2, name: "Jeel" },
  ];

  res.json(users);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});