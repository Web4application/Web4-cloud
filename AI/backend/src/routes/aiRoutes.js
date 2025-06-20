const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

router.post("/analyze-task", aiController.analyzeTask);

module.exports = router;
