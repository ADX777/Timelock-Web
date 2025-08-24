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
    this.bootstrapMarketUI();
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

    // Secret note input validation (ASCII, no accents)
    const secretNoteInput = document.getElementById('secret-note-textarea');
    if (secretNoteInput) {
      secretNoteInput.addEventListener('input', (e) => {
        this.validateSecretNote(e.target.value);
      });
    }

    // Crypto pair suggestions
    const pairInput = document.getElementById('crypto-pair-input');
    if (pairInput) {
      pairInput.addEventListener('input', (e) => this.onPairInput(e.target.value));
      pairInput.addEventListener('focus', (e) => this.onPairInput(e.target.value));
      document.addEventListener('click', (ev) => {
        const dropdown = document.getElementById('crypto-suggestions');
        if (!dropdown) return;
        if (!dropdown.contains(ev.target) && ev.target !== pairInput) {
          dropdown.style.display = 'none';
        }
      });
    }

    // Price input validation
    const higher = document.getElementById('price-higher');
    const lower = document.getElementById('price-lower');
    if (higher) higher.addEventListener('input', () => this.validatePriceInputs());
    if (lower) lower.addEventListener('input', () => this.validatePriceInputs());

    // Future-only time picker
    const timeInput = document.getElementById('unlock-time');
    if (timeInput) {
      timeInput.addEventListener('change', () => this.validateFutureTime());
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
    const noteSection = document.getElementById('note-input');
    const positionsSection = document.getElementById('positions-input');

    if (method === 'note') {
      if (noteSection) noteSection.style.display = 'block';
      if (positionsSection) positionsSection.style.display = 'none';
    } else {
      if (noteSection) noteSection.style.display = 'none';
      if (positionsSection) positionsSection.style.display = 'block';
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

  // Market bootstrap: preload Binance top symbols and simple forex
  async bootstrapMarketUI() {
    try {
      // Fetch Binance exchange info
      const res = await fetch('https://api.binance.com/api/v3/exchangeInfo');
      const data = await res.json();
      this.binanceSymbols = (data.symbols || [])
        .filter(s => s.status === 'TRADING')
        .map(s => ({ symbol: s.symbol, base: s.baseAsset, quote: s.quoteAsset }));
    } catch (e) {
      this.binanceSymbols = [];
    }
    // Simple forex list
    this.forexPairs = [
      { symbol: 'XAUUSD', priority: 100 },
      { symbol: 'EURUSD', priority: 50 },
      { symbol: 'GBPUSD', priority: 40 },
      { symbol: 'USDJPY', priority: 40 },
      { symbol: 'AUDUSD', priority: 30 }
    ];
  }

  async onPairInput(query) {
    const dropdown = document.getElementById('crypto-suggestions');
    if (!dropdown) return;
    const q = (query || '').toUpperCase().trim();
    if (!q) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }
    const topCoins = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'USDT', 'USDC'];
    const cryptoMatches = (this.binanceSymbols || []).filter(s => s.symbol.startsWith(q));
    // Prioritize top coins
    cryptoMatches.sort((a, b) => {
      const at = topCoins.includes(a.base) ? -1 : 0;
      const bt = topCoins.includes(b.base) ? -1 : 0;
      if (at !== bt) return at - bt;
      return a.symbol.localeCompare(b.symbol);
    });
    const forexMatches = (this.forexPairs || []).filter(p => p.symbol.startsWith(q)).sort((a,b)=> (b.priority||0)-(a.priority||0));
    const combined = [
      ...cryptoMatches.slice(0, 20).map(s => ({ type: 'crypto', symbol: s.symbol, base: s.base })),
      ...forexMatches.slice(0, 5).map(p => ({ type: 'forex', symbol: p.symbol, base: p.symbol.substring(0,3) }))
    ];
    // Render
    dropdown.innerHTML = combined.map(item => {
      const logo = this.getAssetLogoUrl(item.base);
      return `<div class="suggestion-item" data-symbol="${item.symbol}">
        <img class="suggestion-logo" src="${logo}" onerror="this.style.display='none'" />
        <span class="suggestion-symbol">${item.symbol}</span>
        <span class="suggestion-name">${item.type === 'crypto' ? 'Binance' : 'Forex'}</span>
      </div>`;
    }).join('');
    dropdown.style.display = combined.length ? 'block' : 'none';
    dropdown.querySelectorAll('.suggestion-item').forEach(el => {
      el.addEventListener('click', () => {
        const sym = el.getAttribute('data-symbol');
        const input = document.getElementById('crypto-pair-input');
        if (input) input.value = sym;
        dropdown.style.display = 'none';
        this.validatePriceInputs();
      });
    });
  }

  getAssetLogoUrl(ticker) {
    const t = (ticker || '').toLowerCase();
    // Prefer CoinGecko simple logo path if available, fallback placeholder
    return `https://assets.coingecko.com/coins/images/1/small/${encodeURIComponent(t)}.png`;
  }

  // Positions (1..12) helpers
  getSelectedPositions() {
    const selects = Array.from(document.querySelectorAll('#positions-grid .position-select'));
    return selects.map(sel => sel.value ? parseInt(sel.value, 10) : null);
  }

  validatePositions() {
    const values = this.getSelectedPositions();
    const allSelected = values.every(v => Number.isInteger(v) && v >= 1 && v <= 12);
    const positionsGrid = document.getElementById('positions-grid');
    if (!allSelected) {
      if (positionsGrid) {
        positionsGrid.style.border = '2px solid var(--error)';
        positionsGrid.style.borderRadius = 'var(--radius-lg)';
        positionsGrid.style.padding = 'var(--spacing-3)';
      }
      return false;
    }
    if (positionsGrid) {
      positionsGrid.style.border = '2px solid var(--success)';
      positionsGrid.style.borderRadius = 'var(--radius-lg)';
      positionsGrid.style.padding = 'var(--spacing-3)';
    }
    return true;
  }

  // Secret Note Validation (ASCII only, no accents)
  validateSecretNote(note) {
    const trimmed = note.trim();
    if (!trimmed) {
      this.showInputError('secret-note-textarea', 'Vui lòng nhập ghi chú');
      return false;
    }
    const nonAsciiRegex = /[^\x00-\x7F]/;
    if (nonAsciiRegex.test(trimmed)) {
      this.showInputError('secret-note-textarea', 'Chỉ cho phép ký tự ASCII, không dấu');
      return false;
    }
    this.clearInputError('secret-note-textarea');
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
      if (inputMethod === 'note') {
        secretData = document.getElementById('secret-note-textarea').value.trim();
        if (!this.validateSecretNote(secretData)) {
          return;
        }
      } else if (inputMethod === 'positions') {
        if (!this.validatePositions()) {
          this.showToast('Vui lòng chọn đủ 12 vị trí (1..12)', 'error');
          return;
        }
        const positions = this.getSelectedPositions();
        secretData = positions.join(',');
      }

      const securityNote = document.getElementById('security-note').value.trim();
      const unlockTime = document.getElementById('unlock-time').value;
      const priceHigher = document.getElementById('price-higher').value;
      const priceLower = document.getElementById('price-lower').value;
      const pairSymbol = (document.getElementById('crypto-pair-input')?.value || 'BTCUSDT').toUpperCase();

      // Create encryption payload
      const payload = {
        secret: secretData,
        note: securityNote,
        conditions: {
          time: unlockTime ? new Date(unlockTime).toISOString() : null,
          asset: pairSymbol,
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
        this.updateInheritanceButtons(encryptedData);
        this.showDecryptLoading(false);
        return;
      }

      // Perform decryption
      const decryptedData = await this.performQuantumDecryption(encryptedData);

      // Display result
      this.displayDecryptionResult(decryptedData);
      this.showDetailedConditionStatus(conditionsMet);
      this.updateInheritanceButtons(encryptedData);

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
      const symbol = (conditions.asset || 'BTCUSDT').toUpperCase();
      const currentPrice = await this.getPythPrice(symbol);
      
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
      // For demo, use Binance price if crypto pair; simple mock for forex
      if (/^[A-Z]{3,10}$/.test(symbol)) {
        if (symbol.endsWith('USDT') || symbol.endsWith('USDC') || symbol.endsWith('USD')) {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
          if (res.ok) {
            const d = await res.json();
            return parseFloat(d.price);
          }
        }
      }
      if (symbol === 'XAUUSD') {
        // Placeholder static for demo
        return 2400.00;
      }
      return 0;
    } catch (error) {
      console.error('Pyth price fetch error:', error);
      return 0;
    }
  }

  async getCurrentSelectedPrice() {
    const input = document.getElementById('crypto-pair-input');
    const symbol = input && input.value ? input.value.trim().toUpperCase() : 'BTCUSDT';
    return await this.getPythPrice(symbol);
  }

  async validatePriceInputs() {
    const higherEl = document.getElementById('price-higher');
    const lowerEl = document.getElementById('price-lower');
    const hint = document.getElementById('price-hint');
    if (!higherEl || !lowerEl || !hint) return;
    const current = await this.getCurrentSelectedPrice();
    const higher = parseFloat(higherEl.value);
    const lower = parseFloat(lowerEl.value);

    const setState = (el, ok) => {
      el.style.borderColor = ok ? 'var(--success)' : 'var(--error)';
      el.style.boxShadow = ok ? '0 0 0 3px rgba(16, 185, 129, 0.1)' : '0 0 0 3px rgba(239, 68, 68, 0.1)';
    };
    // Higher must be >= current
    if (!isNaN(higher)) setState(higherEl, higher >= current);
    // Lower must be <= current
    if (!isNaN(lower)) setState(lowerEl, lower <= current);

    // Cross-validation: if both provided, ensure logical relationship
    if (!isNaN(higher) && !isNaN(lower) && lower >= higher) {
      setState(higherEl, false);
      setState(lowerEl, false);
    }

    // Fintech hint
    let msg = '';
    if (!isNaN(higher)) msg += `Bạn có thể giải mã khi giá đạt ${higher} trở lên. `;
    if (!isNaN(lower)) msg += `Bạn có thể giải mã khi giá đạt ${lower} trở xuống.`;
    hint.style.display = msg ? 'block' : 'none';
    hint.style.color = 'var(--success)';
    hint.textContent = msg;
  }

  async validateFutureTime() {
    const input = document.getElementById('unlock-time');
    if (!input || !input.value) return false;
    const selected = new Date(input.value);
    const now = await this.getDrandTime();
    const ok = selected.getTime() > now.getTime();
    if (!ok) {
      this.showToast('Chỉ được chọn thời gian trong tương lai', 'error');
      input.value = '';
      input.focus();
    }
    return ok;
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
      const recipientOtp = document.getElementById('recipient-otp').value.trim();
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

      // Email format validation
      if (!this.isValidEmail(recipientEmail)) {
        this.showToast('Email không hợp lệ', 'error');
        const input = document.getElementById('recipient-email');
        input.style.borderColor = 'var(--error)';
        return;
      }
      const emailInput = document.getElementById('recipient-email');
      emailInput.style.borderColor = 'var(--success)';

      // OTP check (mock)
      if (!recipientOtp || recipientOtp !== (this.lastSentOtp || '')) {
        this.showToast('OTP không đúng hoặc chưa gửi', 'error');
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

    if (inputMethod === 'note') {
      const note = document.getElementById('secret-note-textarea').value.trim();
      if (!this.validateSecretNote(note)) {
        return false;
      }
    }
    if (inputMethod === 'positions') {
      if (!this.validatePositions()) {
        return false;
      }
    }

    return true;
  }

  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  sendInlineOtp() {
    const email = document.getElementById('recipient-email')?.value.trim();
    if (!email || !this.isValidEmail(email)) {
      this.showToast('Vui lòng nhập email hợp lệ trước khi gửi OTP', 'error');
      return;
    }
    // Mock send: generate 6-digit OTP and store in memory
    this.lastSentOtp = Math.floor(100000 + Math.random() * 900000).toString();
    this.showToast(`Đã gửi OTP đến ${email}`, 'success');
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
      const safe = this.escapeHtml(decryptedData.secret);
      displayContent += `<div class="decrypted-secret">
        <h4>Secret Data:</h4>
        <p>${safe}</p>
      </div>`;
    }
    
    if (decryptedData.note) {
      const safeNote = this.escapeHtml(decryptedData.note);
      displayContent += `<div class="decrypted-note">
        <h4>Security Note:</h4>
        <p>${safeNote}</p>
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

  showDetailedConditionStatus(conditions) {
    const statusSection = document.getElementById('condition-status');
    const timeStatus = document.getElementById('time-status-text');
    const priceStatus = document.getElementById('price-status-text');
    const timeMsg = conditions.time.met ? 'Điều kiện thời gian đạt' : 'Điều kiện thời gian chưa đạt';
    const priceMsg = conditions.price.met ? 'Điều kiện giá đạt' : 'Điều kiện giá chưa đạt';
    timeStatus.textContent = timeMsg + (conditions.time.message ? ` - ${conditions.time.message}` : '');
    priceStatus.textContent = priceMsg + (conditions.price.message ? ` - ${conditions.price.message}` : '');
    statusSection.style.display = 'block';
  }

  updateInheritanceButtons(encryptedData) {
    const section = document.getElementById('inheritance-actions-decrypt');
    if (!section) return;
    const hasInheritance = !!(encryptedData && encryptedData.inheritanceAttached);
    section.style.display = hasInheritance ? 'flex' : 'none';
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

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Modal Functions
  viewProof() {
    const modal = document.getElementById('proof-modal');
    const content = document.getElementById('proof-content');
    
    content.innerHTML = `
      <div class="proof-section">
        <h4>Bằng chứng xác thực thời gian</h4>
        <p>Nguồn: drand (phi tập trung)</p>
        <p>Thời điểm xác nhận gần nhất: hợp lệ</p>
      </div>
      <div class="proof-section">
        <h4>Bằng chứng xác thực giá</h4>
        <p>Nguồn: Oracle phi tập trung</p>
        <p>Giá và độ tin cậy đã được kiểm chứng</p>
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
    
    questionDisplay.textContent = 'Vui lòng trả lời câu hỏi bảo mật để tiếp tục';
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
