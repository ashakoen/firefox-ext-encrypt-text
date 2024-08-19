document.addEventListener('DOMContentLoaded', () => {
  generateEncryptionKey();
  clearNonKeyData();
  initializeUI();
  attachEventListeners();
  adjustPopupHeight();
  updateSavedKeysList();

  window.addEventListener('resize', adjustContainerHeight);
  checkIfPopup();
  checkIfPoppedOut();
});

let lastAction = 'encrypt';
let encryptionKey;

function generateEncryptionKey() {
  const extensionId = browser.runtime.id;
  if (!extensionId) {
    console.error("Extension ID not available");
    return;
  }
  encryptionKey = CryptoJS.SHA256(extensionId).toString();
  console.log("Encryption key generated");
}

function updateMode(action) {
  console.log("updateMode called with action:", action);
  lastAction = action;
  const inputTextArea = document.getElementById('inputText');
  const outputTextArea = document.getElementById('outputText');
  
  if (action === 'encrypt') {
    inputTextArea.placeholder = "Enter text to encrypt...";
    outputTextArea.placeholder = "Encrypted text will appear here...";
  } else {
    inputTextArea.placeholder = "Decrypted text will appear here...";
    outputTextArea.placeholder = "Enter encrypted text to decrypt...";
  }

  updateLockIcon();
}

function initializeUI() {
  document.getElementById('inputText').value = '';
  document.getElementById('outputText').value = '';
  document.getElementById('encryptionKey').value = '';
  document.getElementById('clearButton').disabled = true;
  updateMode('encrypt'); // Set initial mode
  updateCopyButtons();
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
  console.log("Attaching event listeners");
  document.getElementById('encryptButton').addEventListener('click', encryptMessage);
  document.getElementById('decryptButton').addEventListener('click', decryptMessage);
  document.getElementById('copyInputButton').addEventListener('click', () => copyText('inputText'));
  document.getElementById('copyOutputButton').addEventListener('click', () => copyText('outputText'));
  document.getElementById('popOutButton').addEventListener('click', popOutWindow);
  document.getElementById('clearButton').addEventListener('click', clearFields);

  document.getElementById('inputText').addEventListener('input', updateCopyButtons);
  document.getElementById('outputText').addEventListener('input', updateCopyButtons);
  document.getElementById('encryptionKey').addEventListener('input', handleKeyInput);

  document.getElementById('keyManagementButton').addEventListener('click', showKeyManagementModal);
  document.getElementById('closeModal').addEventListener('click', hideKeyManagementModal);
  document.getElementById('saveForSession').addEventListener('click', saveKeyForSession);
  document.getElementById('loadKey').addEventListener('click', loadSelectedKey);
  document.getElementById('keyValue').addEventListener('input', updateModalLockIcon);
  document.getElementById('clearAllKeysButton').addEventListener('click', clearAllKeys);
}

function checkPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  if (password.match(/[a-z]+/)) strength += 1;
  if (password.match(/[A-Z]+/)) strength += 1;
  if (password.match(/[0-9]+/)) strength += 1;
  if (password.match(/[$@#&!]+/)) strength += 1;

  return strength;
}

function updateLockIcon() {
  const lockIcon = document.getElementById('lockIcon');
  const password = document.getElementById('encryptionKey').value;

  if (lastAction === 'encrypt') {
    // Show strength indicator for encryption
    const strength = checkPasswordStrength(password);
    if (password.length === 0) {
      lockIcon.style.color = '#ced4da';
      lockIcon.title = 'Enter encryption key';
    } else if (strength <= 2) {
      lockIcon.style.color = '#dc3545';
      lockIcon.title = 'Weak encryption key';
    } else if (strength <= 4) {
      lockIcon.style.color = '#ffc107';
      lockIcon.title = 'Medium strength encryption key';
    } else {
      lockIcon.style.color = '#28a745';
      lockIcon.title = 'Strong encryption key';
    }
  } else {
    // Keep lock grey for decryption
    lockIcon.style.color = '#ced4da';
    lockIcon.title = 'Enter decryption key';
  }
}

function handleKeyInput() {
  const key = document.getElementById('encryptionKey').value.trim();
  const encryptButton = document.getElementById('encryptButton');
  const decryptButton = document.getElementById('decryptButton');
  const isKeyValid = key.length >= 8;

  encryptButton.disabled = !isKeyValid;
  decryptButton.disabled = !isKeyValid;

  updateLockIcon();
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

function generateSalt() {
  return CryptoJS.lib.WordArray.random(128/8); // 128 bits
}

function generateIV() {
  return CryptoJS.lib.WordArray.random(128/8); // 128 bits for AES
}

function deriveKey(password, salt) {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256/32, // 256 bits
    iterations: 10000
  });
}

function encryptMessage() {
  const message = document.getElementById('inputText').value;
  const password = document.getElementById('encryptionKey').value;
  if (message && password) {
    try {
      const salt = generateSalt();
      const iv = generateIV();
      const key = deriveKey(password, salt);
      
      const encrypted = CryptoJS.AES.encrypt(message, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      // Combine the salt, iv, and ciphertext for storage
      const result = salt.toString() + iv.toString() + encrypted.toString();
      
      document.getElementById('outputText').value = result;
      document.getElementById('inputText').value = ''; // Clear input
      updateCopyButtons();
      showMessage('info', 'Message encrypted successfully!');
      updateMode('encrypt');
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
  const password = document.getElementById('encryptionKey').value;
  
  if (encryptedMessage && password) {
    try {
      const salt = CryptoJS.enc.Hex.parse(encryptedMessage.substr(0, 32));
      const iv = CryptoJS.enc.Hex.parse(encryptedMessage.substr(32, 32));
      const encrypted = encryptedMessage.substring(64);
      
      const key = deriveKey(password, salt);
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const decryptedMessage = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedMessage) throw new Error('Invalid decryption');
      document.getElementById('inputText').value = decryptedMessage;
      document.getElementById('outputText').value = ''; // Clear output
      updateCopyButtons();
      showMessage('info', 'Message decrypted successfully!');
      updateMode('decrypt');
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
    browser.storage.local.set({ isPoppedOut: true }).catch((error) => {
      console.error('Error setting isPoppedOut:', error);
    });
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

const KEY_PREFIX = 'encryptionKey_';

function encryptKey(key) {
  if (!encryptionKey) {
    console.error("Encryption key not available");
    return null;
  }
  return CryptoJS.AES.encrypt(key, encryptionKey).toString();
}

function decryptKey(encryptedKey) {
  if (!encryptionKey) {
    console.error("Encryption key not available");
    return null;
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Error decrypting key:", error);
    return null;
  }
}

function storeKeyForSession(name, key) {
  const encryptedKey = encryptKey(key);
  if (!encryptedKey) {
    return Promise.reject("Failed to encrypt key");
  }
  return browser.storage.local.set({ [KEY_PREFIX + name]: encryptedKey });
}

function getSessionKey(name) {
  return browser.storage.local.get(KEY_PREFIX + name).then(result => {
    const encryptedKey = result[KEY_PREFIX + name];
    if (!encryptedKey) {
      console.log("No encrypted key found for:", name);
      return null;
    }
    return decryptKey(encryptedKey);
  });
}

function getAllSessionKeys() {
  return browser.storage.local.get().then(result => {
    return Object.keys(result)
      .filter(key => key.startsWith(KEY_PREFIX))
      .map(key => key.slice(KEY_PREFIX.length));
  });
}

function showKeyManagementModal() {
  document.getElementById('keyManagementModal').style.display = 'block';
  updateSavedKeysList();
  showMessage('info', 'Stored keys are only accessible in this session. They will not be available after closing the browser.');
}

function hideKeyManagementModal() {
  document.getElementById('keyManagementModal').style.display = 'none';
}

function updateSavedKeysList() {
  getAllSessionKeys().then(keys => {
    const select = document.getElementById('savedKeys');
    select.innerHTML = '';
    keys.forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = key;
      select.appendChild(option);
    });
    // If no keys are available, disable the load button
    document.getElementById('loadKey').disabled = keys.length === 0;
  }).catch(error => {
    console.error("Failed to update saved keys list:", error);
    showMessage('error', 'Failed to load saved keys');
  });
}

function saveKeyForSession() {
  const name = document.getElementById('keyName').value.trim();
  const key = document.getElementById('keyValue').value;
  
  if (!name) {
    showMessage('error', 'Please enter a key name');
    return;
  }
  
  if (key.length < 8) {
    showMessage('error', 'Key must be at least 8 characters long');
    return;
  }
  
  // Use the derived key for storing
  const salt = generateSalt();
  const derivedKey = deriveKey(key, salt);
  const storedValue = salt.toString() + derivedKey.toString();
  
  storeKeyForSession(name, storedValue).then(() => {
    showMessage('info', 'Key saved for session');
    updateSavedKeysList();
    document.getElementById('keyName').value = '';
    document.getElementById('keyValue').value = '';
  }).catch(error => {
    console.error("Failed to save key:", error);
    showMessage('error', 'Failed to save key');
  });
}

function loadSelectedKey() {
  const name = document.getElementById('savedKeys').value;
  if (name) {
    getSessionKey(name).then(storedValue => {
      if (storedValue) {
        const salt = CryptoJS.enc.Hex.parse(storedValue.substr(0, 32));
        const derivedKey = storedValue.substring(32);
        // We can't recover the original password, so we'll use the derived key directly
        document.getElementById('encryptionKey').value = derivedKey;
        hideKeyManagementModal();
        handleKeyInput(); // Update UI based on the loaded key
        showMessage('info', 'Key loaded successfully');
      } else {
        console.error(`Failed to decrypt key: ${name}`);
        showMessage('error', 'Selected key not found or unable to decrypt');
      }
    }).catch(error => {
      console.error("Failed to load key:", error);
      showMessage('error', 'Failed to load key');
    });
  }
}

function updateModalLockIcon() {
  const lockIcon = document.getElementById('modalLockIcon');
  const password = document.getElementById('keyValue').value;
  const strength = checkPasswordStrength(password);

  if (password.length === 0) {
    lockIcon.style.color = '#ced4da';
    lockIcon.title = 'Enter encryption key';
  } else if (strength <= 2) {
    lockIcon.style.color = '#dc3545';
    lockIcon.title = 'Weak encryption key';
  } else if (strength <= 4) {
    lockIcon.style.color = '#ffc107';
    lockIcon.title = 'Medium strength encryption key';
  } else {
    lockIcon.style.color = '#28a745';
    lockIcon.title = 'Strong encryption key';
  }
}

function clearAllKeys() {
  return browser.storage.local.clear().then(() => {
    console.log("All keys cleared from storage");
    updateSavedKeysList(); // Refresh the keys list in the UI
    showMessage('info', 'All stored keys have been cleared');
  }).catch(error => {
    console.error("Failed to clear keys:", error);
    showMessage('error', 'Failed to clear stored keys');
  });
}

function clearNonKeyData() {
  return browser.storage.local.get().then(result => {
    const keysToRemove = Object.keys(result).filter(key => !key.startsWith(KEY_PREFIX));
    return browser.storage.local.remove(keysToRemove);
  }).then(() => {
    console.log("Non-key data cleared from storage");
  }).catch(error => {
    console.error("Failed to clear non-key data:", error);
  });
}