document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusDiv = document.getElementById('status');
  const jobsList = document.getElementById('appliedJobs');
  const configLink = document.getElementById('optionsLink');

  // Load current status
  updateStatus("Ready to start");

  // Start button handler
  startBtn.addEventListener('click', async function() {
    startBtn.disabled = true;
    updateStatus("Starting...");
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('linkedin.com/jobs')) {
        updateStatus("Please open LinkedIn Jobs page first", true);
        startBtn.disabled = false;
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, { action: "startApplying" });
      
      if (response?.status === "completed") {
        updateStatus("Applications completed!");
      } else {
        updateStatus(response?.error || "Unknown error occurred", true);
      }
    } catch (error) {
      console.error("Error:", error);
      updateStatus("Failed to start. Refresh page and try again.", true);
    } finally {
      startBtn.disabled = false;
    }
  });

  // Stop button handler
  stopBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ 
      action: "setApplicationStatus", 
      isApplying: false 
    });
    updateStatus("Stopped by user");
  });

  // Config link handler
  configLink.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });

  // Status update listener
  chrome.runtime.onMessage.addListener(function(request) {
    if (request.action === "updateStatus") {
      updateStatus(request.message || request.currentJob, request.error);
    }
    if (request.appliedJob) {
      const li = document.createElement('li');
      li.textContent = `${request.appliedJob.title} - ${request.appliedJob.time}`;
      jobsList.appendChild(li);
    }
  });

  function updateStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = isError ? "error" : "status";
  }
});