const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Throws custom errors with status codes
function StatusError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

const authorize = (req, res, next) => {
  const secretKey = process.env.SECRET_KEY;
  const authorization = req.headers.authorization;
  let token = null;

  if (authorization) {
    if (authorization.split(" ").length == 2) {
      token = authorization.split(" ")[1];
    } else {
      res
        .status(401)
        .json({ error: true, message: "Authorization header is malformed" });
    }
  } else {
    next();
    return;
  }

  // Verify JWT and check expiration date
  try {
    const decoded = jwt.verify(token, secretKey);

    if (decoded.exp < Date.now()) {
      res.status(401).json({ error: true, message: "JWT token has expired" });
    }

    req.authenticated = true;

    // Permit user to advance to route
    next();
  } catch (err) {
    res.status(401).json({ error: true, message: "Invalid JWT token" });
  }
};

router.get("/:id", authorize, function (req, res) {
  req.db
    .from("data")
    .select("*")
    .where("id", "=", req.params.id)
    .then((rows) => {
      if (!/^[0-9]+$/.test(req.params.id)) {
        throw new StatusError(
          "Invalid query parameters. Query parameters are not permitted.",
          400
        );
      }
      if (rows.length == 0) {
        throw new StatusError(
          `Volcano with ID: ${req.params.id} not found.`,
          404
        );
      }
      if (!req.authenticated || req.authenticated === undefined) {
        res.status(200).json({
          id: rows[0].id,
          name: rows[0].name,
          country: rows[0].country,
          region: rows[0].region,
          subregion: rows[0].subregion,
          last_eruption: rows[0].last_eruption,
          summit: rows[0].summit,
          elevation: rows[0].elevation,
          latitude: rows[0].latitude,
          longitude: rows[0].longitude,
        });
      } else if (req.authenticated) {
        res.status(200).json({
          id: rows[0].id,
          name: rows[0].name,
          country: rows[0].country,
          region: rows[0].region,
          subregion: rows[0].subregion,
          last_eruption: rows[0].last_eruption,
          summit: rows[0].summit,
          elevation: rows[0].elevation,
          latitude: rows[0].latitude,
          longitude: rows[0].longitude,
          population_5km: rows[0].population_5km,
          population_10km: rows[0].population_10km,
          population_30km: rows[0].population_30km,
          population_100km: rows[0].population_100km,
        });
      }
    })
    .catch((err) => {
      try {
        res.status(err.code).json({
          error: true,
          message: err.message,
        });
      } catch {
        res
          .status(400)
          .json({ error: true, message: err.message, unknown: true });
        return;
      }
    });
});

module.exports = router;
