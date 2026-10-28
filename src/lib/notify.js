export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window && window.isSecureContext

export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export async function requestNotifications() {
  return notificationsSupported() ? Notification.requestPermission() : 'unsupported'
}

export async function showNotification(title, options) {
  if (notificationPermission() !== 'granted') return
  try {
    // Mobile Chrome only allows notifications through a service worker.
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) return await reg.showNotification(title, options)
    new Notification(title, options)
  } catch {}
}
