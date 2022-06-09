const express = require("express");
const router = express.Router();
const serrors = require("../modules/statuserror.js");

router.get("/", function (req, res) {
  let volcanoes = [];
  const populatedWithin = req.query.populatedWithin;
  const country = req.query.country;
  const validPopulatedWithin = ["5km", "10km", "30km", "100km"];
  const queryLength = Object.keys(req.query).length;

  if (country == undefined) {
    res.status(400).json({
      error: true,
      message: "Country is a required query parameter.",
    });
    return;
  }

  if (
    queryLength > 2 ||
    (queryLength == 2 && !req.query.hasOwnProperty("populatedWithin"))
  ) {
    res.status(400).json({
      error: true,
      message:
        "Invalid query parameters. Only country and populatedWithin are permitted.",
    });
    return;
  }

  req.db
    .from("data")
    .select("id", "name", "country", "region", "subregion")
    .modify(function (queryBuilder) {
      if (populatedWithin != undefined) {
        if (validPopulatedWithin.includes(populatedWithin)) {
          queryBuilder
            .where("country", "=", country)
            .andWhere(`population_${populatedWithin}`, ">", "0");
        } else {
          throw new serrors.statusError(
            "Invalid value for populatedWithin. Only: 5km,10km,30km,100km are permitted.",
            400
          );
        }
      } else {
        queryBuilder.where("country", "=", country);
      }
    })
    .then((rows) => {
      rows.map((row) => {
        volcanoes.push(row);
      });
    })
    .then(() => {
      res.status(200).json(volcanoes);
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
