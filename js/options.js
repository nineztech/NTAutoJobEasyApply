document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('configForm');
  const statusDiv = document.getElementById('status');
  const answersContainer = document.getElementById('answersContainer');

  // Load saved config
  chrome.storage.sync.get([
    'phoneNumber',
    'resumePath',
    'applyDelay',
    'maxApplications',
    'defaultAnswers'
  ], function(config) {
    form.phoneNumber.value = config.phoneNumber || '';
    form.resumePath.value = config.resumePath || '';
    form.applyDelay.value = config.applyDelay || 3000;
    form.maxApplications.value = config.maxApplications || 30;

    // Load answer fields
    const answers = config.defaultAnswers || {};
    for (const [question, answer] of Object.entries(answers)) {
      addAnswerField(question, answer);
    }
  });

  // Add answer field
  document.getElementById('addAnswer').addEventListener('click', function() {
    addAnswerField();
  });

  // Form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const answers = {};
    document.querySelectorAll('.answer-field').forEach(field => {
      const question = field.querySelector('.answer-question').value.trim();
      const answer = field.querySelector('.answer-value').value.trim();
      if (question && answer) {
        answers[question] = answer;
      }
    });

    chrome.storage.sync.set({
      phoneNumber: form.phoneNumber.value,
      resumePath: form.resumePath.value,
      applyDelay: parseInt(form.applyDelay.value),
      maxApplications: parseInt(form.maxApplications.value),
      defaultAnswers: answers
    }, function() {
      statusDiv.textContent = 'Configuration saved!';
      statusDiv.style.display = 'block';
      setTimeout(() => statusDiv.style.display = 'none', 3000);
    });
  });

  function addAnswerField(question = '', answer = '') {
    const div = document.createElement('div');
    div.className = 'answer-field';
    div.innerHTML = `
      <input type="text" class="answer-question" placeholder="Question/Field name" value="${question}">
      <input type="text" class="answer-value" placeholder="Your answer" value="${answer}">
      <button type="button" class="remove-answer">×</button>
    `;
    div.querySelector('.remove-answer').addEventListener('click', function() {
      div.remove();
    });
    answersContainer.appendChild(div);
  }
});