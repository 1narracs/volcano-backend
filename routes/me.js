const express = require("express");
const router = express.Router();

router.get("/", function (req, res) {
  res.json({ name: "Samuel Carran", student_number: "n9469818" });
});

module.exports = router;
