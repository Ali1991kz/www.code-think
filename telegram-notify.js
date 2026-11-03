
/*
 * CODE THINK — Telegram notification client
 * No Telegram bot token or API secret is stored here.
 * Server-side verification is required.
 */
(function () {
  "use strict";

  const ENDPOINT =
    "https://code-think-notify.ali-araltay99.workers.dev/notify";

  const ALLOWED_EVENTS = new Set([
    "student_login",
    "task_started",
    "task_completed",
    "teacher_graded"
  ]);

  async function notify(eventType, firebaseIdToken, details = {}) {
    if (!ALLOWED_EVENTS.has(eventType)) {
      throw new Error("Unsupported notification event");
    }

    if (!firebaseIdToken) {
      throw new Error("Firebase authentication required");
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + firebaseIdToken
      },
      body: JSON.stringify({
        type: eventType,
        attemptId: String(details.attemptId || ""),
        eventId: String(details.eventId || "")
      })
    });

    if (!response.ok) {
      throw new Error("Notification request failed");
    }

    return true;
  }

  window.CODE_THINK_NOTIFY = Object.freeze({
    notify
  });
})();
