const jwt = require("jsonwebtoken");

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
      return;
    }
  } else {
    next();
    return;
  }

  // Verify JWT and check expiration date
  try {
    const decoded = jwt.verify(token, secretKey, { complete: true });
    console.log(decoded.payload.email);

    if (decoded.exp < Date.now()) {
      throw new serrors.statusError("JWT token has expired", 401);
    }

    req.tokenEmail = decoded.payload.email;
    req.authenticated = true;

    // Permit user to advance to route
    next();
  } catch (err) {
    try {
      res.status(err.code).json({
        error: true,
        message: err.message,
      });
      return;
    } catch {
      res.status(401).json({ error: true, message: "Invalid JWT token" });
      return;
    }
  }
};

exports.authorize = authorize;
