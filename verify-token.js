"use strict";

const jwt = require("jsonwebtoken");
const jwtSecret = process.env.SECRET;

//Verify Token
const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];

    jwt.verify(bearerToken, jwtSecret, (err, authData) => {
      if (err) res.sendStatus(403);
      else {
        req.token = authData.email;
        next();
      }
    });
  } else {
    next();
  }
};

module.exports = { verifyToken };
