# Simple Message Encryptor

Simple Message Encryptor is a Firefox extension that allows users to encrypt and decrypt text using CryptoJS. This extension provides a user-friendly interface to securely handle text encryption and decryption, along with key management features.

## Features

- Encrypt text using a user-provided key with enhanced security measures.
- Decrypt text using the same key.
- Copy encrypted and decrypted text to the clipboard.
- Improved key management system for storing and retrieving encryption keys.
- Session-based key storage with enhanced security using PBKDF2.
- Clear all input fields and stored keys with a single button.
- Responsive design for a seamless user experience.

## Important Update Notice

Version 2.0 introduces a significant update to the encryption method, improving security but introducing a breaking change:

- The encryption now uses PBKDF2 for key derivation, random salt for each encryption, and a random initialization vector (IV).
- Due to these changes, text encrypted with previous versions of the extension cannot be decrypted with version 2.0 or later.
- Stored keys from previous versions are not compatible with the new version.

Please ensure you decrypt any important messages with the old version before updating.

## Installation

1. Clone the repository or download the source code.
2. Open Firefox and navigate to `about:debugging`.
3. Click on "This Firefox" in the sidebar.
4. Click on "Load Temporary Add-on".
5. Select the `manifest.json` file from the downloaded source code.

## Usage

1. Open the Simple Message Encryptor extension from the Firefox toolbar.
2. Enter the text you want to encrypt in the "Enter text to encrypt..." textarea.
3. Enter an encryption key (minimum 8 characters) in the "Enter encryption key..." input field.
4. Click the "Encrypt" button to encrypt the text.
5. The encrypted text will appear in the "Encrypted text will appear here..." textarea.
6. To decrypt the text, enter the encrypted text and the same encryption key, then click the "Decrypt" button.
7. Use the "Copy Decrypted Text" and "Copy Encrypted Text" buttons to copy the respective text to the clipboard.
8. Use the "Clear" button to clear all input fields.

### Key Management

1. Click the "Key Management" button to open the key management modal.
2. To save a key for the session:
   - Enter a name for the key in the "Key Name" field.
   - Enter the key value in the "Key Value" field.
   - Click "Save for Session" to store the key.
3. To load a saved key:
   - Select the key name from the dropdown list.
   - Click "Load Key" to populate the encryption key field with the saved key.
4. Use "Clear All Keys" to remove all stored keys from the session.

Note: Saved keys are now stored as derived keys and cannot be viewed in their original form.

## File Structure

- `popup.html`: The main HTML file for the extension's popup interface.
- `js/popup.js`: The JavaScript file containing the logic for encryption, decryption, key management, and UI interactions.
- `js/crypto-js.min.js`: The CryptoJS library used for encryption and decryption.
- `css/all.min.css`: The Font Awesome CSS file for icons.
- `css/styles.css`: The custom CSS file for styling the extension's popup interface.
- `manifest.json`: The manifest file for the Firefox extension.

## Dependencies

- [CryptoJS](https://cryptojs.gitbook.io/docs/): A JavaScript library for encryption and decryption.
- [Font Awesome](https://fontawesome.com/): A popular icon set and toolkit.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Mozilla Developer Network (MDN)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions) for the comprehensive documentation on building Firefox extensions.
- [CryptoJS](https://cryptojs.gitbook.io/docs/) for providing the encryption and decryption library.
- [Font Awesome](https://fontawesome.com/) for the icons used in the extension.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## Contact

For any questions or suggestions, please contact [ashakoen@gmail.com](mailto:ashakoen@gmail.com).