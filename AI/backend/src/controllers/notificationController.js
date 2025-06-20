const Task = require("../models/Task");

exports.checkPendingTasks = async () => {
  const now = new Date();
  const upcomingTasks = await Task.find({
    dueDate: { $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
    notificationSent: false,
  });

  return upcomingTasks;
};

exports.markNotificationSent = async (taskId) => {
  await Task.findByIdAndUpdate(taskId, { notificationSent: true });
};
