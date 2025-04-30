const express = require("express");
const router = express.Router();
const homeController = require("../controllers/homeController");

router.get("/tags", homeController.getTags);

module.exports = router;