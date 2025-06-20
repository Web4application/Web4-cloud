const cron = require("node-cron");
const analyticsController = require("../controllers/analyticsController");

// Run every hour
cron.schedule("0 * * * *", analyticsController.calculateCompletionProbability);
