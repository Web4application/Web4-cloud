const cron = require("node-cron");
const notificationController = require("../controllers/notificationController");

const checkForNotifications = async () => {
  try {
    const tasks = await notificationController.checkPendingTasks();

    if (tasks.length > 0) {
      tasks.forEach(async (task) => {
        console.log(`Upcoming Task: ${task.title} is due soon.`);
        await notificationController.markNotificationSent(task._id);
      });
    }
  } catch (error) {
    console.error("Notification error:", error);
  }
};

// Check every hour
cron.schedule("0 * * * *", checkForNotifications);
