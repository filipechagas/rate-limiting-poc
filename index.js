"use strict";

const express = require("express");
const jwt = require("jsonwebtoken");
const cluster = require("cluster");
const totalCPUs = require("os").cpus().length;
const { rateLimiter } = require("./rate-limiter");
const { verifyToken } = require("./verify-token");

if (cluster.isMaster) {
  console.log(`Number of CPUs is ${totalCPUs}`);
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    console.log("Let's fork another worker!");
    cluster.fork();
  });
} else {
  const app = express();
  const port = 3000;
  const jwtSecret = process.env.SECRET;

  app.get("/", (_req, res) => {
    res.send("Get request on root path");
  });

  app.get("/gettoken", (_req, res) => {
    const token = jwt.sign({ email: "user@email.com" }, jwtSecret);
    res.status(200).send({ token });
  });

  app.use(verifyToken, rateLimiter);

  app.post("/api", (_req, res) => {
    res.status(200).send({ status: "OK", pid: process.pid });
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port} - ${process.pid}`);
  });
}
