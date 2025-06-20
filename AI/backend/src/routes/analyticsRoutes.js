const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

router.get("/task-forecasts", analyticsController.getTaskForecasts);

module.exports = router;
