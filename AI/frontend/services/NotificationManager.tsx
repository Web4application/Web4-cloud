import React, { useEffect } from "react";
import { requestNotificationPermission } from "../services/notificationService";

const NotificationManager: React.FC = () => {
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return null;
};

export default NotificationManager;
