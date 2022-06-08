"use strict";

const redis = require("redis");
const authenticatedRateLimit = 10;
const unauthenticatedRateLimit = 5;

const client = redis.createClient({ url: process.env.REDIS_URL });
client.on("error", (err) => console.log(`Error ${err}`));
client.connect();

const rateLimiter = (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  let token = ip;
  let rateLimit = unauthenticatedRateLimit;

  if (typeof req.token !== "undefined") {
    token = req.token;
    rateLimit = authenticatedRateLimit;
  }

  const userKey = `user_${token}`;

  client
    .multi()
    .set(userKey, 0, { EX: 60, NX: true })
    .incr(userKey)
    .exec()
    .then(([_, reqCount]) => {
      if (reqCount > rateLimit) {
        res
          .status(429) // Too many requests
          .send(`Quota of ${rateLimit} per ${60}sec exceeded\n`);
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
};

module.exports = { rateLimiter };
