const express = require("express");
const router = express.Router();

router.get("/", function (req, res) {
  let countries = [];
  req.db
    .from("data")
    .distinct("country")
    .orderBy("country", "asc")
    .then((rows) => {
      rows.map((row) => {
        countries.push(row.country);
      });
    })
    .then(() => {
      res.status(200).json(countries);
    })
    .catch(() => {
      res.status(400).json({
        error: true,
        message:
          "Invalid query parameters. Query parameters are not permitted.",
      });
    });
});

module.exports = router;
