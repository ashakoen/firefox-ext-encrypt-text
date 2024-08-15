document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
  attachEventListeners();
  adjustPopupHeight();

  window.addEventListener('resize', adjustContainerHeight);
  checkIfPopup();
  checkIfPoppedOut();
});

function initializeUI() {
  document.getElementById('inputText').value = '';
  document.getElementById('outputText').value = '';
  document.getElementById('encryptionKey').value = '';
  document.getElementById('clearButton').disabled = true;
}

function updateCopyButtons() {
  const inputText = document.getElementById('inputText').value.trim();
  const outputText = document.getElementById('outputText').value.trim();
  const encryptionKey = document.getElementById('encryptionKey').value.trim();

  document.getElementById('copyInputButton').disabled = !inputText;
  document.getElementById('copyOutputButton').disabled = !outputText;
  document.getElementById('clearButton').disabled = !(inputText || outputText || encryptionKey);
}

function attachEventListeners() {
  document.getElementById('encryptButton').addEventListener('click', encryptMessage);
  document.getElementById('decryptButton').addEventListener('click', decryptMessage);
  document.getElementById('copyInputButton').addEventListener('click', () => copyText('inputText'));
  document.getElementById('copyOutputButton').addEventListener('click', () => copyText('outputText'));
  document.getElementById('popOutButton').addEventListener('click', popOutWindow);
  document.getElementById('clearButton').addEventListener('click', clearFields);

  document.getElementById('inputText').addEventListener('input', updateCopyButtons);
  document.getElementById('outputText').addEventListener('input', updateCopyButtons);
  document.getElementById('encryptionKey').addEventListener('input', handleKeyInput);
}

function handleKeyInput() {
  const key = document.getElementById('encryptionKey').value.trim();
  const lockIcon = document.getElementById('lockIcon');
  const encryptButton = document.getElementById('encryptButton');
  const decryptButton = document.getElementById('decryptButton');
  const isKeyValid = key.length >= 8;

  encryptButton.disabled = !isKeyValid;
  decryptButton.disabled = !isKeyValid;
  lockIcon.style.color = isKeyValid ? 'green' : '#ced4da';

  updateCopyButtons();
}

function showMessage(type, text) {
  const messageDiv = document.getElementById('message');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  messageDiv.style.display = 'block';
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 3000);
}

function copyText(elementId) {
  const textArea = document.getElementById(elementId);
  textArea.select();
  document.execCommand('copy');
  showMessage('info', 'Copied to clipboard!');
}

function encryptMessage() {
  const message = document.getElementById('inputText').value;
  const key = document.getElementById('encryptionKey').value;
  if (message && key) {
    try {
      const encryptedMessage = CryptoJS.AES.encrypt(message, key).toString();
      document.getElementById('outputText').value = encryptedMessage;
      updateCopyButtons();
      showMessage('info', 'Message encrypted successfully!');
    } catch (e) {
      console.error(e);
      showMessage('error', 'Encryption failed. Please try again.');
    }
  } else {
    showMessage('error', 'Please enter a message and an encryption key.');
  }
}

function decryptMessage() {
  const encryptedMessage = document.getElementById('outputText').value;
  const key = document.getElementById('encryptionKey').value;
  if (encryptedMessage && key) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
      const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
      if (!decryptedMessage) throw new Error('Invalid decryption');
      document.getElementById('inputText').value = decryptedMessage;
      updateCopyButtons();
      showMessage('info', 'Message decrypted successfully!');
    } catch (e) {
      console.error(e);
      showMessage('error', 'Decryption failed. Please check your key and encrypted message.');
    }
  } else {
    showMessage('error', 'Please enter the encrypted message and the encryption key.');
  }
}

function popOutWindow() {
  const extensionURL = browser.runtime.getURL("popup.html");
  browser.windows.create({
    url: extensionURL,
    type: "popup",
    width: 420,
    height: 700
  }).then(() => {
    browser.storage.local.set({ isPoppedOut: true });
    window.close();
  }).catch((error) => {
    console.error('Error creating popup window:', error);
  });
}

function checkIfPoppedOut() {
  browser.storage.local.get('isPoppedOut').then((result) => {
    if (result.isPoppedOut) {
      disablePopOutButton();
    }
  }).catch((error) => {
    console.error('Error accessing storage:', error);
  });
}

function clearFields() {
  document.getElementById('inputText').value = '';
  document.getElementById('outputText').value = '';
  document.getElementById('encryptionKey').value = '';
  updateCopyButtons();
  showMessage('info', 'Fields cleared!');
  document.getElementById('encryptButton').disabled = true;
  document.getElementById('decryptButton').disabled = true;
  document.getElementById('lockIcon').style.color = '#ced4da';
}

function adjustPopupHeight() {
  if (window.innerHeight < 700) {
    window.resizeTo(window.innerWidth, 700);
  }
}

function adjustContainerHeight() {
  const container = document.querySelector('.container');
  container.style.height = `${window.innerHeight}px`;
}

function checkIfPopup() {
  if (typeof browser === 'undefined' || !browser.storage || !browser.storage.local) {
    console.error('browser.storage.local is undefined');
    return;
  }

  if (window.opener) {
    disablePopOutButton();
  } else {
    browser.windows.getCurrent().then(windowInfo => {
      if (windowInfo.type === 'popup') {
        disablePopOutButton();
      } else {
        browser.storage.local.get('isPoppedOut').then((result) => {
          if (result.isPoppedOut) {
            disablePopOutButton();
          }
        }).catch((error) => {
          console.error('Error accessing storage:', error);
        });
      }
    }).catch((error) => {
      console.error('Error getting current window:', error);
    });
  }

  window.addEventListener('beforeunload', () => {
    browser.storage.local.set({ isPoppedOut: false }).catch((error) => {
      console.error('Error setting storage:', error);
    });
  });
}

function disablePopOutButton() {
  const popOutButton = document.getElementById('popOutButton');
  if (popOutButton) {
    popOutButton.style.display = 'none';
  }
}
