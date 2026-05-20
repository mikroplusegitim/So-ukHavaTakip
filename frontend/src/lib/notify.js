// Browser notification helper for critical alerts.
// Uses the service worker (registered in index.js) for richer notifications
// with vibration & requireInteraction; falls back to Notification API.

let permissionState = typeof Notification !== "undefined" ? Notification.permission : "denied";

export const getPermission = () => permissionState;

export const requestPermission = async () => {
  if (typeof Notification === "undefined") return "denied";
  if (permissionState === "granted") return "granted";
  try {
    const result = await Notification.requestPermission();
    permissionState = result;
    return result;
  } catch {
    return "denied";
  }
};

export const notify = async ({ title, body, tag = "alert" }) => {
  if (typeof Notification === "undefined" || permissionState !== "granted") return;
  // Prefer service worker registration for vibration / requireInteraction
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.active) {
        reg.active.postMessage({ type: "notify", title, body, tag, icon: "/favicon.svg" });
        return;
      }
    }
  } catch {}
  // Fallback: plain Notification
  try {
    new Notification(title, { body, tag, icon: "/favicon.svg" });
  } catch {}
};
