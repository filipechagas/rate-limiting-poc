# Simple Rate Limiting Implementation

This proof of concept presents a very simple, but effective, implementation of API rate limiting using the fixed window counter strategy and Redis.

Greatly inspired in https://blog.atulr.com/rate-limiter/

## How to test

- `docker-compose up`

### Authenticated requests

1. `curl http://localhost:3000/gettoken`
2. Save the token value
3. `curl -X POST -H "Authorization: Bearer TOKENVALUE" http://localhost:3000/api`
4. You should get a successful `HTTP 200` response.
5. Try and execute it 10 more times.
6. You should start getting `HTTP 429 Too Many Requests` after the 9th attempt.

### Unauthenticated requests

1. `curl -X POST http://localhost:3000/api`
2. You should get a successful `HTTP 200` response
3. Try and execute it 5 more times.
4. You should start getting `HTTP 429 Too Many Requests` after the 4th attempt.

## Brief explanation

The core of this implementation lies in the [rate-limiter.js](rate-limiter.js)

```javascript
client
  .multi()
  .set(userKey, 0, { EX: 60, NX: true })
  .incr(userKey)
  .get(userKey)
  .exec()
  .then(([_, reqCount]) => {
    if (reqCount > rateLimit) {
      res
        .status(429) // Too many requests
        .send(`Quota of ${rateLimit} per ${60}sec exceeded\n`);
    } else {
      next();
    }
  });
```

- `multi` - Starts a transaction block
  - This is necessary to avoid race conditions during setting and incrementing the requests count.
- `set` - Sets the cache key
  - User's IP address for unauthenticated requests and user's email (from JWT token) for authenticated.
  - `EX: 60` - Expire time in seconds.
  - `NX: true` - Only set the key if does not already exist.
- `incr` - Increments a number stored in the key
- `exec` - [Atomic](<https://en.wikipedia.org/wiki/Atomicity_(database_systems)>) execution of all queued commands.
