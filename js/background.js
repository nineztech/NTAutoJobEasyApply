// Background service worker for state management
let isApplying = false;
let appliedJobs = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "getApplicationStatus":
      sendResponse({ isApplying, appliedJobs });
      break;
    case "setApplicationStatus":
      isApplying = request.isApplying;
      if (request.appliedJob) {
        appliedJobs.push(request.appliedJob);
      }
      sendResponse({ success: true });
      break;
    case "resetApplicationStatus":
      isApplying = false;
      appliedJobs = [];
      sendResponse({ success: true });
      break;
    default:
      sendResponse({ success: false, error: "Unknown action" });
  }
  return true;
});