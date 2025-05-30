class LinkedInEasyApply {
  constructor() {
    this.userConfig = {
      phone: '',
      resume: '',
      answers: {},
      location: '',
      delay: 3000,
      maxApps: 30
    };
    this.initialize();
  }

  async loadConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'phoneNumber',
        'resumePath',
        'defaultAnswers',
        'location',
        'applyDelay',
        'maxApplications'
      ], (config) => {
        this.userConfig = {
          phone: config.phoneNumber || '',
          resume: config.resumePath || '',
          answers: config.defaultAnswers || {},
          location: config.location || '',
          delay: config.applyDelay || 3000,
          maxApps: config.maxApplications || 30
        };
        resolve();
      });
    });
  }

  initialize() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "startApplying") {
        this.applyToJobs().then(() => {
          sendResponse({ status: "completed" });
        }).catch((error) => {
          sendResponse({ status: "failed", error: error.message });
        });
        return true;
      }
    });
  }

  async humanDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  isElementClickable(element) {
    if (!element) return false;
    try {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        style.pointerEvents !== 'none' &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
        !element.disabled
      );
    } catch (error) {
      return false;
    }
  }

  async waitForClickableElement(selectorOrElement, timeout = 20000) {
    const startTime = Date.now();
    let element = typeof selectorOrElement === 'string' 
      ? document.querySelector(selectorOrElement)
      : selectorOrElement;

    while (Date.now() - startTime < timeout) {
      if (element && this.isElementClickable(element)) {
        return element;
      }
      
      if (typeof selectorOrElement === 'string') {
        element = document.querySelector(selectorOrElement);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return null;
  }

  async enhancedClick(elementOrSelector) {
    try {
      const element = await this.waitForClickableElement(elementOrSelector);
      if (!element) return false;

      // Scroll element into the center of viewport
      const viewportHeight = window.innerHeight;
      const elementRect = element.getBoundingClientRect();
      const scrollPosition = window.scrollY || window.pageYOffset;
      const elementTop = elementRect.top + scrollPosition;
      
      window.scrollTo({
        top: elementTop - (viewportHeight / 3),
        behavior: 'smooth'
      });

      await this.humanDelay(800, 1200);

      // Verify element is still clickable after scrolling
      if (!this.isElementClickable(element)) return false;

      // Simulate human-like interaction
      element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      await this.humanDelay(100, 300);
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      await this.humanDelay(100, 300);
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await this.humanDelay(100, 300);
      element.click();
      
      await this.humanDelay(800, 1500);
      return true;
    } catch (error) {
      return false;
    }
  }

  async simulateInput(selector, value) {
    try {
      const input = await this.waitForClickableElement(selector, 10000);
      if (!input) return false;

      input.focus();
      await this.humanDelay(200, 500);
      input.value = '';
      await this.humanDelay(100, 300);
      
      // Simulate typing
      for (const char of value) {
        input.value += char;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await this.humanDelay(50, 150);
      }
      
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await this.humanDelay(300, 800);
      return true;
    } catch (error) {
      return false;
    }
  }

  async simulatePhoneInput() {
    if (!this.userConfig.phone) return false;

    const phoneFieldVariations = [
      "input[aria-label*='Phone']",
      "input[aria-label*='Mobile phone number']",
      "input[aria-label*='Phone Number']",
      "input[aria-label*='Mobile Phone']",
      "input[data-test*='phone']",
      "input[data-test*='phone-number']",
      "input#phone-number",
      "input[id*='phoneInput']",
      "input[placeholder*='Phone']",
      "input[placeholder*='Mobile']",
      "input[placeholder*='phone number']",
      "input[type='tel']"
    ];

    for (const selector of phoneFieldVariations) {
      if (await this.simulateInput(selector, this.userConfig.phone)) {
        return true;
      }
    }
    return false;
  }

  async simulateLocationInput() {
    if (!this.userConfig.location) return false;

    const locationFieldVariations = [
      "input[aria-label*='Location']",
      "input[aria-label*='City']",
      "input[aria-label*='Location (city)']",
      "input[placeholder*='Location']",
      "input[placeholder*='City']",
      "input[data-test*='location']",
      "input[id*='location']"
    ];

    for (const selector of locationFieldVariations) {
      if (await this.simulateInput(selector, this.userConfig.location)) {
        // Handle location dropdown if it appears
        const dropdownItem = await this.waitForClickableElement(".autocomplete-result", 2000);
        if (dropdownItem) {
          await this.enhancedClick(dropdownItem);
        }
        return true;
      }
    }
    return false;
  }

  async handleApplicationForm() {
    await this.simulatePhoneInput();
    await this.simulateLocationInput();
    
    const generalFields = [
      { selector: "input[aria-label*='First Name']", value: this.userConfig.answers['First Name'] || '' },
      { selector: "input[aria-label*='Last Name']", value: this.userConfig.answers['Last Name'] || '' },
      { selector: "input[aria-label*='Email']", value: this.userConfig.answers['Email'] || '' }
    ];
    
    for (const field of generalFields) {
      if (field.value) {
        await this.simulateInput(field.selector, field.value);
      }
    }
  }

  async findSubmitButton() {
    const possibleButtons = Array.from(document.querySelectorAll("button, input[type='button']"));
    
    for (const button of possibleButtons) {
      if (!this.isElementClickable(button)) continue;
      
      const label = button.getAttribute('aria-label') || '';
      const text = button.textContent || '';
      const value = button.value || '';
      
      if (/submit application|review application|continue|next/i.test(label.toLowerCase()) ||
          /submit application|review application|continue|next/i.test(text.toLowerCase()) ||
          /submit|continue|next/i.test(value.toLowerCase())) {
        return button;
      }
    }
    return null;
  }

  async findCloseButton() {
    const possibleButtons = Array.from(document.querySelectorAll("button, input[type='button']"));
    
    for (const button of possibleButtons) {
      if (!this.isElementClickable(button)) continue;
      
      const label = button.getAttribute('aria-label') || '';
      const text = button.textContent || '';
      const value = button.value || '';
      
      if (/dismiss|close|cancel|exit/i.test(label.toLowerCase()) ||
          /dismiss|close|cancel|exit/i.test(text.toLowerCase()) ||
          /close|cancel/i.test(value.toLowerCase())) {
        return button;
      }
    }
    return null;
  }

  async findEasyApplyButtons() {
    const possibleButtons = Array.from(document.querySelectorAll("button, span"));
    
    return possibleButtons.filter(element => {
      const text = (element.textContent || '').trim().toLowerCase();
      return (
        /easy apply|apply now|quick apply/i.test(text) &&
        this.isElementClickable(element)
      );
    });
  }

  async applyToJob(button) {
    try {
      const jobTitle = button.closest(".jobs-search-results__list-item")?.querySelector(".job-card-list__title")?.innerText || 
                      button.closest(".job-card-container")?.querySelector("a")?.textContent?.trim() || 
                      "Unknown Position";
      
      chrome.runtime.sendMessage({
        action: "updateStatus",
        currentJob: jobTitle
      });

      // Enhanced click with multiple attempts
      let clickSuccess = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (await this.enhancedClick(button)) {
          clickSuccess = true;
          break;
        }
        await this.humanDelay(1000, 2000);
      }

      if (!clickSuccess) {
        throw new Error("Failed to click Easy Apply button after 3 attempts");
      }

      // Wait for form to appear
      await this.humanDelay(3000, 5000);

      // Fill out the form
      await this.handleApplicationForm();

      // Submit application
      const submitButton = await this.findSubmitButton();
      if (submitButton) {
        await this.enhancedClick(submitButton);
        chrome.runtime.sendMessage({
          action: "jobApplied",
          jobTitle
        });
        await this.humanDelay(2000, 3000);
      }

      // Close modal
      const closeButton = await this.findCloseButton();
      if (closeButton) {
        await this.enhancedClick(closeButton);
      }

      await this.humanDelay(1000, 2000);
      return true;
    } catch (error) {
      // Try to close modal if still open
      const closeButton = await this.findCloseButton();
      if (closeButton) {
        await this.enhancedClick(closeButton);
      }
      return false;
    }
  }

  async applyToJobs() {
    try {
      await this.loadConfig();
      
      const buttons = await this.findEasyApplyButtons();
      if (buttons.length === 0) {
        chrome.runtime.sendMessage({
          action: "updateStatus",
          message: "No Easy Apply buttons found"
        });
        return;
      }

      chrome.runtime.sendMessage({
        action: "setApplicationStatus",
        isApplying: true
      });

      let appliedCount = 0;
      for (let i = 0; i < Math.min(buttons.length, this.userConfig.maxApps); i++) {
        if (await this.applyToJob(buttons[i])) {
          appliedCount++;
        }
        await this.humanDelay(4000, 7000);
      }

      chrome.runtime.sendMessage({
        action: "setApplicationStatus",
        isApplying: false,
        message: `Applied to ${appliedCount} jobs`
      });

    } catch (error) {
      chrome.runtime.sendMessage({
        action: "setApplicationStatus",
        isApplying: false,
        error: error.message
      });
    }
  }
}

if (window.location.hostname.includes('linkedin.com') && 
    window.location.pathname.includes('/jobs')) {
  new LinkedInEasyApply();
}