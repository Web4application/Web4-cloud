import React, { useEffect } from "react";
import { requestNotificationPermission, sendNotification } from "../services/notificationService";
import { getTasks } from "../services/taskService";

const NotificationManager: React.FC = () => {
  useEffect(() => {
    requestNotificationPermission();
    const checkTasks = async () => {
      try {
        const tasks = await getTasks({});
        const now = new Date();

        tasks.forEach((task) => {
          const dueDate = new Date(task.dueDate);
          const timeDifference = dueDate.getTime() - now.getTime();
          const hoursRemaining = timeDifference / (1000 * 60 * 60);

          if (hoursRemaining <= 24 && !task.notificationSent) {
            sendNotification("Task Due Soon", `Task "${task.title}" is due within 24 hours.`);
          }
        });
      } catch (error) {
        console.error("Error checking tasks for notifications:", error);
      }
    };

    const interval = setInterval(checkTasks, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return null;
};

export default NotificationManager;
