export const notifyUser = (message: string) => {
  new Notification("Web4AI Assistant", { body: message });
};

export const requestNotificationPermission = async () => {
  if (Notification.permission !== "granted") {
    await Notification.requestPermission();
  }
};

export const requestNotificationPermission = async () => {
  if (Notification.permission !== "granted") {
    await Notification.requestPermission();
  }
};

export const sendNotification = (title: string, message: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, { body: message });
  }
};
