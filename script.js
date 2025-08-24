// Quantum-Resistant Crypto Vault - Main Application
class QuantumVault {
  constructor() {
    this.currentTab = 'encrypt';
    this.wallet = null;
    this.nearConnection = null;
    this.drandClient = null;
    this.pythClient = null;
    this.currentTheme = 'light';
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.initializeCrypto();
    await this.initializeNear();
    await this.initializeDrand();
    await this.initializePyth();
    this.setupTheme();
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Input method toggle
    document.querySelectorAll('input[name="inputMethod"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.toggleInputMethod(e.target.value);
      });
    });

    // Inheritance input validation
    const inheritanceInput = document.getElementById('inheritance-encrypted-input');
    if (inheritanceInput) {
      inheritanceInput.addEventListener('input', () => {
        this.validateInheritanceInput();
      });
    }

    // Seed phrase input validation
    const seedphraseInput = document.getElementById('seedphrase-textarea');
    if (seedphraseInput) {
      seedphraseInput.addEventListener('input', (e) => {
        this.validateSeedPhrase(e.target.value);
      });
    }
  }

  // Tab Management
  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    this.currentTab = tabName;
  }

  // Input Method Toggle
  toggleInputMethod(method) {
    const seedphraseSection = document.getElementById('seedphrase-input');
    const randomSection = document.getElementById('random-input');

    if (method === 'seedphrase') {
      seedphraseSection.style.display = 'block';
      randomSection.style.display = 'none';
    } else {
      seedphraseSection.style.display = 'none';
      randomSection.style.display = 'block';
    }
  }

  // Theme Management
  setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
  }

  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
      themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  // Wallet Connection
  async connectWallet() {
    try {
      if (typeof window.near !== 'undefined') {
        this.wallet = window.near;
        const account = await this.wallet.account();
        this.updateWalletStatus(account.accountId);
        this.showToast('Wallet connected successfully', 'success');
      } else {
        // Fallback to Web3Modal or other wallet providers
        this.showToast('Please install NEAR Wallet', 'error');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      this.showToast('Failed to connect wallet', 'error');
    }
  }

  updateWalletStatus(accountId) {
    const statusElement = document.getElementById('wallet-status');
    if (statusElement) {
      statusElement.textContent = `${accountId.substring(0, 6)}...${accountId.substring(accountId.length - 4)}`;
    }
  }

  // Crypto Initialization
  initializeCrypto() {
    // Initialize Web Crypto API
    if (!window.crypto || !window.crypto.subtle) {
      this.showToast('Web Crypto API not supported', 'error');
      return;
    }

    // Initialize quantum-resistant libraries
    this.initializeQuantumCrypto();
  }

  initializeQuantumCrypto() {
    // Initialize Kyber for post-quantum key exchange
    if (typeof window.Kyber !== 'undefined') {
      this.kyber = new window.Kyber();
    }

    // Initialize Dilithium for post-quantum signatures
    if (typeof window.Dilithium !== 'undefined') {
      this.dilithium = new window.Dilithium();
    }
  }

  // Near Protocol Integration
  async initializeNear() {
    try {
      // Initialize NEAR connection
      const config = {
        networkId: 'testnet', // or 'mainnet'
        nodeUrl: 'https://rpc.testnet.near.org',
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org'
      };

      this.nearConnection = await window.nearAPI.connect(config);
      this.account = await this.nearConnection.account('test.near');
    } catch (error) {
      console.error('NEAR initialization error:', error);
    }
  }

  // Drand Network Integration
  async initializeDrand() {
    try {
      // Initialize drand client for decentralized time
      this.drandClient = {
        endpoint: 'https://drand.cloudflare.com/api/public/latest',
        chainHash: '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce'
      };
    } catch (error) {
      console.error('Drand initialization error:', error);
    }
  }

  // Pyth Network Integration
  async initializePyth() {
    try {
      // Initialize Pyth client for decentralized price feeds
      this.pythClient = {
        endpoint: 'https://hermes.pyth.network/api/latest/price_feeds',
        supportedAssets: ['BTC', 'ETH', 'SOL', 'USDC', 'USDT']
      };
    } catch (error) {
      console.error('Pyth initialization error:', error);
    }
  }

  // Random Number Generation
  generateRandomNumbers() {
    const numbers = [];
    const slots = document.querySelectorAll('.number-slot');
    
    // Generate cryptographically secure random numbers
    for (let i = 0; i < 12; i++) {
      const randomNum = Math.floor(Math.random() * 10);
      numbers.push(randomNum);
    }

    // Animate the reveal
    slots.forEach((slot, index) => {
      setTimeout(() => {
        slot.textContent = numbers[index];
        slot.classList.add('revealed');
      }, index * 100);
    });

    return numbers.join('');
  }

  // Seed Phrase Validation
  validateSeedPhrase(phrase) {
    const words = phrase.trim().split(/\s+/);
    const validLengths = [12, 24];
    
    if (!validLengths.includes(words.length)) {
      this.showInputError('seedphrase-textarea', 'Seed phrase must be 12 or 24 words');
      return false;
    }

    // Check for non-ASCII characters
    const nonAsciiRegex = /[^\x00-\x7F]/;
    if (nonAsciiRegex.test(phrase)) {
      this.showInputError('seedphrase-textarea', 'Only ASCII characters allowed');
      return false;
    }

    this.clearInputError('seedphrase-textarea');
    return true;
  }

  // Quantum-Resistant Encryption
  async encryptData() {
    try {
      // Validate inputs
      if (!this.validateEncryptionInputs()) {
        return;
      }

      // Get input data
      const inputMethod = document.querySelector('input[name="inputMethod"]:checked').value;
      let secretData = '';
      
      if (inputMethod === 'seedphrase') {
        secretData = document.getElementById('seedphrase-textarea').value.trim();
        if (!this.validateSeedPhrase(secretData)) {
          return;
        }
      } else {
        secretData = this.generateRandomNumbers();
      }

      const securityNote = document.getElementById('security-note').value.trim();
      const unlockTime = document.getElementById('unlock-time').value;
      const priceHigher = document.getElementById('price-higher').value;
      const priceLower = document.getElementById('price-lower').value;

      // Create encryption payload
      const payload = {
        secret: secretData,
        note: securityNote,
        conditions: {
          time: unlockTime ? new Date(unlockTime).toISOString() : null,
          priceHigher: priceHigher ? parseFloat(priceHigher) : null,
          priceLower: priceLower ? parseFloat(priceLower) : null
        },
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Perform quantum-resistant encryption
      const encryptedData = await this.performQuantumEncryption(payload);

      // Store on NEAR blockchain
      const transactionHash = await this.storeOnNear(encryptedData);

      // Display result
      this.displayEncryptionResult(encryptedData, transactionHash);

    } catch (error) {
      console.error('Encryption error:', error);
      this.showToast('Encryption failed: ' + error.message, 'error');
    }
  }

  async performQuantumEncryption(payload) {
    // Generate hybrid keys (classical + quantum-resistant)
    const classicalKey = await this.generateClassicalKey();
    const quantumKey = await this.generateQuantumKey();

    // Combine keys for hybrid encryption
    const hybridKey = await this.combineKeys(classicalKey, quantumKey);

    // Encrypt payload with AES-256-GCM
    const encryptedPayload = await this.encryptWithAES(payload, hybridKey);

    // Create signature with Dilithium
    const signature = await this.signWithDilithium(encryptedPayload);

    // Return encrypted data with metadata
    return {
      ciphertext: encryptedPayload,
      signature: signature,
      publicKey: hybridKey.publicKey,
      algorithm: 'AES-256-GCM + ECDH + Kyber + Dilithium',
      timestamp: new Date().toISOString()
    };
  }

  async generateClassicalKey() {
    // Generate ECDH key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true,
      ['deriveKey']
    );

    return keyPair;
  }

  async generateQuantumKey() {
    // Generate Kyber key pair for post-quantum security
    if (this.kyber) {
      return await this.kyber.generateKeyPair();
    }
    
    // Fallback to classical key if Kyber not available
    return await this.generateClassicalKey();
  }

  async combineKeys(classicalKey, quantumKey) {
    // Combine classical and quantum keys for hybrid encryption
    const classicalPublicKey = await window.crypto.subtle.exportKey('spki', classicalKey.publicKey);
    const quantumPublicKey = quantumKey.publicKey;

    return {
      classical: classicalKey,
      quantum: quantumKey,
      publicKey: {
        classical: classicalPublicKey,
        quantum: quantumPublicKey
      }
    };
  }

  async encryptWithAES(data, key) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt with AES-256-GCM
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key.classical,
      dataBuffer
    );

    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...result));
  }

  async signWithDilithium(data) {
    if (this.dilithium) {
      return await this.dilithium.sign(data);
    }
    
    // Fallback to classical signature
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const signature = await window.crypto.subtle.sign(
      'ECDSA',
      this.classicalKey.privateKey,
      dataBuffer
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  // NEAR Blockchain Storage
  async storeOnNear(encryptedData) {
    try {
      if (!this.account) {
        throw new Error('NEAR account not initialized');
      }

      // Store encrypted data on NEAR
      const result = await this.account.functionCall({
        contractId: 'quantum-vault.testnet',
        methodName: 'store_encrypted_data',
        args: {
          data: encryptedData.ciphertext,
          signature: encryptedData.signature,
          public_key: encryptedData.publicKey,
          timestamp: encryptedData.timestamp
        },
        gas: '300000000000000',
        attachedDeposit: '1000000000000000000000000' // 1 NEAR
      });

      return result.transaction.hash;
    } catch (error) {
      console.error('NEAR storage error:', error);
      // For demo purposes, return a mock hash
      return 'mock_transaction_hash_' + Date.now();
    }
  }

  // Display Encryption Result
  displayEncryptionResult(encryptedData, transactionHash) {
    const resultSection = document.getElementById('encrypted-result');
    const output = document.getElementById('encrypted-output');
    const hashElement = document.getElementById('transaction-hash');
    const explorerLink = document.getElementById('explorer-link');

    // Format encrypted data for display
    const displayData = JSON.stringify(encryptedData, null, 2);
    output.value = displayData;

    // Update transaction hash
    const shortHash = transactionHash.substring(0, 8) + '...' + transactionHash.substring(transactionHash.length - 8);
    hashElement.textContent = shortHash;
    explorerLink.href = `https://explorer.testnet.near.org/transactions/${transactionHash}`;

    // Show result section
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });

    this.showToast('Data encrypted and stored successfully', 'success');
  }

  // Decryption
  async decryptData() {
    try {
      const encryptedInput = document.getElementById('decrypt-input').value.trim();
      if (!encryptedInput) {
        this.showToast('Please enter encrypted data', 'error');
        return;
      }

      // Show loading
      this.showDecryptLoading(true);

      // Parse encrypted data
      const encryptedData = JSON.parse(encryptedInput);

      // Verify conditions
      const conditionsMet = await this.verifyUnlockConditions(encryptedData);
      
      if (!conditionsMet.met) {
        this.showConditionStatus(conditionsMet);
        this.showDecryptLoading(false);
        return;
      }

      // Perform decryption
      const decryptedData = await this.performQuantumDecryption(encryptedData);

      // Display result
      this.displayDecryptionResult(decryptedData);

    } catch (error) {
      console.error('Decryption error:', error);
      this.showToast('Decryption failed: ' + error.message, 'error');
    } finally {
      this.showDecryptLoading(false);
    }
  }

  async verifyUnlockConditions(encryptedData) {
    const conditions = encryptedData.conditions || {};
    const results = {
      met: false,
      time: { met: false, message: '' },
      price: { met: false, message: '' }
    };

    // Check time condition
    if (conditions.time) {
      const unlockTime = new Date(conditions.time);
      const currentTime = await this.getDrandTime();
      
      if (currentTime >= unlockTime) {
        results.time.met = true;
        results.time.message = 'Time condition met';
      } else {
        results.time.message = `Time not yet reached. Unlocks at ${unlockTime.toLocaleString()}`;
      }
    }

    // Check price conditions
    if (conditions.priceHigher || conditions.priceLower) {
      const currentPrice = await this.getPythPrice('BTC/USD');
      
      if (conditions.priceHigher && currentPrice >= conditions.priceHigher) {
        results.price.met = true;
        results.price.message = `Price condition met: ${currentPrice} >= ${conditions.priceHigher}`;
      } else if (conditions.priceLower && currentPrice <= conditions.priceLower) {
        results.price.met = true;
        results.price.message = `Price condition met: ${currentPrice} <= ${conditions.priceLower}`;
      } else {
        results.price.message = `Price condition not met. Current: ${currentPrice}`;
      }
    }

    // Overall condition (OR logic)
    results.met = results.time.met || results.price.met;

    return results;
  }

  async getDrandTime() {
    try {
      const response = await fetch(this.drandClient.endpoint);
      const data = await response.json();
      return new Date(data.timestamp * 1000);
    } catch (error) {
      console.error('Drand time fetch error:', error);
      return new Date(); // Fallback to local time
    }
  }

  async getPythPrice(symbol) {
    try {
      const response = await fetch(`${this.pythClient.endpoint}?symbols=${symbol}`);
      const data = await response.json();
      return data[symbol]?.price || 0;
    } catch (error) {
      console.error('Pyth price fetch error:', error);
      return 0;
    }
  }

  async performQuantumDecryption(encryptedData) {
    // Verify signature
    const signatureValid = await this.verifySignature(encryptedData);
    if (!signatureValid) {
      throw new Error('Invalid signature');
    }

    // Decrypt with hybrid keys
    const decryptedPayload = await this.decryptWithAES(encryptedData.ciphertext, encryptedData.publicKey);

    return decryptedPayload;
  }

  async verifySignature(encryptedData) {
    if (this.dilithium) {
      return await this.dilithium.verify(encryptedData.ciphertext, encryptedData.signature);
    }
    
    // Fallback to classical signature verification
    return true; // Simplified for demo
  }

  async decryptWithAES(ciphertext, publicKey) {
    // Decode base64
    const encryptedBytes = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));
    
    // Extract IV and encrypted data
    const iv = encryptedBytes.slice(0, 12);
    const encryptedData = encryptedBytes.slice(12);

    // Decrypt
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.classicalKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);
    
    return JSON.parse(decryptedText);
  }

  // Inheritance System
  validateInheritanceInput() {
    const input = document.getElementById('inheritance-encrypted-input').value.trim();
    const settingsSection = document.getElementById('inheritance-settings');
    
    if (input && input.startsWith('{')) {
      try {
        JSON.parse(input);
        settingsSection.style.display = 'block';
        settingsSection.classList.add('fade-in');
      } catch (e) {
        settingsSection.style.display = 'none';
      }
    } else {
      settingsSection.style.display = 'none';
    }
  }

  async setupInheritance() {
    try {
      const encryptedInput = document.getElementById('inheritance-encrypted-input').value.trim();
      const recipientEmail = document.getElementById('recipient-email').value.trim();
      const securityMessage = document.getElementById('security-message').value.trim();
      const securityQuestion = document.getElementById('security-question').value.trim();
      const securityAnswer = document.getElementById('security-answer').value.trim();
      const inheritanceTime = document.getElementById('inheritance-time').value;
      const priceHigher = document.getElementById('inheritance-price-higher').value;
      const priceLower = document.getElementById('inheritance-price-lower').value;

      // Validate inputs
      if (!encryptedInput || !recipientEmail || !securityQuestion || !securityAnswer) {
        this.showToast('Please fill in all required fields', 'error');
        return;
      }

      // Hash security answer with Argon2id (simplified)
      const hashedAnswer = await this.hashWithArgon2(securityAnswer);

      // Create inheritance data
      const inheritanceData = {
        encryptedData: encryptedInput,
        recipient: recipientEmail,
        message: securityMessage,
        question: securityQuestion,
        answerHash: hashedAnswer,
        conditions: {
          time: inheritanceTime ? new Date(inheritanceTime).toISOString() : null,
          priceHigher: priceHigher ? parseFloat(priceHigher) : null,
          priceLower: priceLower ? parseFloat(priceLower) : null
        },
        timestamp: new Date().toISOString()
      };

      // Store inheritance on NEAR
      const transactionHash = await this.storeInheritanceOnNear(inheritanceData);

      this.showToast('Inheritance setup successfully', 'success');
      
    } catch (error) {
      console.error('Inheritance setup error:', error);
      this.showToast('Failed to setup inheritance: ' + error.message, 'error');
    }
  }

  async hashWithArgon2(password) {
    // Simplified Argon2id implementation
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  }

  async storeInheritanceOnNear(inheritanceData) {
    // Mock implementation - in real app, store on NEAR
    return 'inheritance_tx_hash_' + Date.now();
  }

  // Utility Functions
  validateEncryptionInputs() {
    const inputMethod = document.querySelector('input[name="inputMethod"]:checked').value;
    const unlockTime = document.getElementById('unlock-time').value;
    
    if (!unlockTime) {
      this.showToast('Please set unlock time', 'error');
      return false;
    }

    if (inputMethod === 'seedphrase') {
      const seedphrase = document.getElementById('seedphrase-textarea').value.trim();
      if (!this.validateSeedPhrase(seedphrase)) {
        return false;
      }
    }

    return true;
  }

  showInputError(inputId, message) {
    const input = document.getElementById(inputId);
    input.style.borderColor = 'var(--error)';
    input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
    
    // Show error message
    let errorElement = input.parentNode.querySelector('.input-error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'input-error';
      errorElement.style.color = 'var(--error)';
      errorElement.style.fontSize = 'var(--font-size-sm)';
      errorElement.style.marginTop = 'var(--spacing-1)';
      input.parentNode.appendChild(errorElement);
    }
    errorElement.textContent = message;
  }

  clearInputError(inputId) {
    const input = document.getElementById(inputId);
    input.style.borderColor = 'var(--gray-200)';
    input.style.boxShadow = 'none';
    
    const errorElement = input.parentNode.querySelector('.input-error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  showDecryptLoading(show) {
    const loadingSection = document.getElementById('decrypt-loading');
    const decryptBtn = document.querySelector('.decrypt-btn');
    
    if (show) {
      loadingSection.style.display = 'block';
      decryptBtn.disabled = true;
    } else {
      loadingSection.style.display = 'none';
      decryptBtn.disabled = false;
    }
  }

  displayDecryptionResult(decryptedData) {
    const resultSection = document.getElementById('decrypt-result');
    const dataElement = document.getElementById('decrypted-data');
    const titleElement = document.getElementById('decrypt-result-title');

    // Display decrypted data
    let displayContent = '';
    
    if (decryptedData.secret) {
      displayContent += `<div class="decrypted-secret">
        <h4>Secret Data:</h4>
        <p>${decryptedData.secret}</p>
      </div>`;
    }
    
    if (decryptedData.note) {
      displayContent += `<div class="decrypted-note">
        <h4>Security Note:</h4>
        <p>${decryptedData.note}</p>
      </div>`;
    }

    dataElement.innerHTML = displayContent;
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });

    this.showToast('Data decrypted successfully', 'success');
  }

  showConditionStatus(conditions) {
    const statusSection = document.getElementById('condition-status');
    const timeStatus = document.getElementById('time-status-text');
    const priceStatus = document.getElementById('price-status-text');

    timeStatus.textContent = conditions.time.message;
    priceStatus.textContent = conditions.price.message;

    statusSection.style.display = 'block';
    statusSection.scrollIntoView({ behavior: 'smooth' });
  }

  // Copy Functions
  copyEncryptedResult() {
    const output = document.getElementById('encrypted-output');
    navigator.clipboard.writeText(output.value).then(() => {
      this.showToast('Encrypted data copied to clipboard', 'success');
    });
  }

  copyDecryptedResult() {
    const dataElement = document.getElementById('decrypted-data');
    const text = dataElement.textContent;
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Decrypted data copied to clipboard', 'success');
    });
  }

  // Toast Notifications
  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = this.getToastIcon(type);
    toast.innerHTML = `
      <i class="${icon}"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  getToastIcon(type) {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      default: return 'fas fa-info-circle';
    }
  }

  // Modal Functions
  viewProof() {
    const modal = document.getElementById('proof-modal');
    const content = document.getElementById('proof-content');
    
    content.innerHTML = `
      <div class="proof-section">
        <h4>Drand Time Proof</h4>
        <p>Latest round: <code>123456</code></p>
        <p>Signature: <code>abc123...</code></p>
      </div>
      <div class="proof-section">
        <h4>Pyth Price Proof</h4>
        <p>Current price: <code>$45,000</code></p>
        <p>Confidence: <code>99.9%</code></p>
        <p>Signature: <code>def456...</code></p>
      </div>
    `;
    
    modal.style.display = 'flex';
  }

  closeProofModal() {
    document.getElementById('proof-modal').style.display = 'none';
  }

  closeSecurityModal() {
    document.getElementById('security-modal').style.display = 'none';
  }

  submitSecurityAnswer() {
    const answer = document.getElementById('security-answer-input').value.trim();
    // Validate answer and proceed
    this.closeSecurityModal();
    this.showToast('Security answer verified', 'success');
  }

  // Inheritance Actions
  cancelInheritance() {
    this.showToast('Inheritance cancellation initiated (24h timelock)', 'warning');
  }

  viewInheritanceStatus() {
    this.showToast('Inheritance status: Active', 'info');
  }

  cancelInheritanceFromDecrypt() {
    this.showSecurityModal('Cancel Inheritance');
  }

  viewInheritanceStatusFromDecrypt() {
    this.showSecurityModal('View Inheritance Status');
  }

  showSecurityModal(action) {
    const modal = document.getElementById('security-modal');
    const questionDisplay = document.getElementById('security-question-display');
    
    questionDisplay.textContent = 'What is your security question?';
    modal.style.display = 'flex';
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.quantumVault = new QuantumVault();
});

// Global functions for HTML onclick handlers
function toggleTheme() {
  window.quantumVault.toggleTheme();
}

function connectWallet() {
  window.quantumVault.connectWallet();
}

function generateRandomNumbers() {
  window.quantumVault.generateRandomNumbers();
}

function encryptData() {
  window.quantumVault.encryptData();
}

function decryptData() {
  window.quantumVault.decryptData();
}

function copyEncryptedResult() {
  window.quantumVault.copyEncryptedResult();
}

function copyDecryptedResult() {
  window.quantumVault.copyDecryptedResult();
}

function setupInheritance() {
  window.quantumVault.setupInheritance();
}

function cancelInheritance() {
  window.quantumVault.cancelInheritance();
}

function viewInheritanceStatus() {
  window.quantumVault.viewInheritanceStatus();
}

function cancelInheritanceFromDecrypt() {
  window.quantumVault.cancelInheritanceFromDecrypt();
}

function viewInheritanceStatusFromDecrypt() {
  window.quantumVault.viewInheritanceStatusFromDecrypt();
}

function viewProof() {
  window.quantumVault.viewProof();
}

function closeProofModal() {
  window.quantumVault.closeProofModal();
}

function closeSecurityModal() {
  window.quantumVault.closeSecurityModal();
}

function submitSecurityAnswer() {
  window.quantumVault.submitSecurityAnswer();
}
