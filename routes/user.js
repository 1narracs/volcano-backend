const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const moment = require("moment");
const serrors = require("../modules/statuserror.js");
const auth = require("../modules/authorize.js");
const verifydate = require("../modules/verifydateformat.js");

router.post("/register", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const queryUsers = req.db
    .from("users")
    .select("*")
    .where("email", "=", email);

  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required",
    });
    return;
  }

  queryUsers
    .then((users) => {
      if (users.length > 0) {
        throw new serrors.statusError("User already exists", 409);
      }
      const saltRounds = 10;
      const hash = bcrypt.hashSync(password, saltRounds);
      return req.db.from("users").insert({ email, hash });
    })
    .then(() => {
      res.status(201).json({
        message: "User created",
      });
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

router.post("/login", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const queryUsers = req.db
    .from("users")
    .select("*")
    .where("email", "=", email);

  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required",
    });
    return;
  }

  queryUsers
    .then((users) => {
      if (users.length == 0) {
        // if user is not found
        throw new serrors.statusError("Incorrect email or password", 401);
      }

      const user = users[0];
      return bcrypt.compare(password, user.hash);
    })
    .then((match) => {
      if (!match) {
        // if password is incorrect
        throw new serrors.statusError("Incorrect email or password", 401);
      }
      // Create and return a JWT token
      const secretKey = process.env.SECRET_KEY;
      const expires_in = 60 * 60 * 24; // 1 Day
      const exp = Date.now() + expires_in * 1000;
      const token = jwt.sign({ email, exp }, secretKey);
      res.json({ token_type: "Bearer", token, expires_in });
    })
    .catch((err) => {
      try {
        res.status(err.code).json({
          error: true,
          message: err.message,
        });
        return;
      } catch {
        res
          .status(400)
          .json({ error: true, message: err.message, unknown: true });
        return;
      }
    });
});

router.get("/:email/profile", auth.authorize, function (req, res) {
  const email = req.params.email;
  if (req.tokenEmail) {
    console.log("Token email: ", req.tokenEmail);
  }

  req.db
    .from("users")
    .select("email", "firstname", "lastname", "dob", "address")
    .where("email", "=", email)
    .then((user) => {
      if (user.length == 0) {
        throw new serrors.statusError("User not found", 404);
      }
      if (
        !req.authenticated ||
        req.authenticated == undefined ||
        req.tokenEmail != email
      ) {
        res.status(200).json({
          email: user[0].email,
          firstName: user[0].firstname,
          lastName: user[0].lastname,
        });
      } else if (req.authenticated && req.tokenEmail == email) {
        if (user[0].dob === null) {
          res.status(200).json({
            email: user[0].email,
            firstName: user[0].firstname,
            lastName: user[0].lastname,
            dob: user[0].dob,
            address: user[0].address,
          });
        } else {
          res.status(200).json({
            email: user[0].email,
            firstName: user[0].firstname,
            lastName: user[0].lastname,
            dob: moment(user[0].dob).format("YYYY-MM-DD"),
            address: user[0].address,
          });
        }
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

router.put("/:email/profile", auth.authorize, function (req, res) {
  const email = req.params.email;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const dob = req.body.dob;
  const address = req.body.address;

  // Check if request body is complete
  if (!firstName || !lastName || !dob || !address) {
    res.status(400).json({
      error: true,
      message:
        "Request body incomplete: firstName, lastName, dob and address are required.",
    });
    return;
  }

  // Check if firstName, lastName, and dob are strings
  if (
    !(typeof firstName === "string") ||
    firstName instanceof String ||
    !(typeof lastName === "string") ||
    lastName instanceof String ||
    !(typeof address === "string") ||
    address instanceof String
  ) {
    res.status(400).json({
      error: true,
      message:
        "Request body invalid: firstName, lastName and address must be strings only.",
    });
    return;
  }

  // Check if dob is correct format
  if (!verifydate.verifyDateString(dob)) {
    res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
    });
    return;
  }

  // Check if dob is in the past
  if (!moment(dob, "YYYY-MM-DD").isBefore(Date.now())) {
    res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a date in the past.",
    });
    return;
  }

  // Check if the user is authenticated
  if (!req.authenticated) {
    res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
    return;
  }

  // Check if the token email matches
  if (req.tokenEmail != email) {
    res.status(403).json({
      error: true,
      message: "Forbidden",
    });
    return;
  }

  req
    .db("users")
    .where("email", "=", email)
    .update({
      email: email,
      firstname: firstName,
      lastname: lastName,
      dob: dob,
      address: address,
    })
    .then(() =>
      res.status(200).json({
        email: email,
        firstName: firstName,
        lastName: lastName,
        dob: moment(dob).format("YYYY-MM-DD"),
        address: address,
      })
    )
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
