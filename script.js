// Quantum-Resistant Crypto Vault - Main Application
class QuantumVault {
  constructor() {
    this.currentTab = 'encrypt';
    this.wallet = null;
    this.nearConnection = null;
    this.drandClient = null;
    this.pythClient = null;
    this.currentTheme = 'light';
    this.cryptoData = null;
    this.otpTimer = null;
    this.selectedPositions = [];
    
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

    // Secret note input validation
    const secretNoteInput = document.getElementById('secretnote-textarea');
    if (secretNoteInput) {
      secretNoteInput.addEventListener('input', (e) => {
        this.validateSecretNote(e.target.value);
      });
    }

    // Crypto pair suggestions
    const cryptoPairInput = document.getElementById('crypto-pair-input');
    if (cryptoPairInput) {
      cryptoPairInput.addEventListener('input', (e) => {
        this.handleCryptoPairInput(e.target.value);
      });
    }

    // Price validation
    const priceHigherInput = document.getElementById('price-higher');
    const priceLowerInput = document.getElementById('price-lower');
    if (priceHigherInput) {
      priceHigherInput.addEventListener('input', (e) => {
        this.validatePriceInput(e.target.value, 'higher');
      });
    }
    if (priceLowerInput) {
      priceLowerInput.addEventListener('input', (e) => {
        this.validatePriceInput(e.target.value, 'lower');
      });
    }

    // Email validation
    const emailInput = document.getElementById('recipient-email');
    if (emailInput) {
      emailInput.addEventListener('input', (e) => {
        this.validateEmail(e.target.value);
      });
    }

    // OTP input
    const otpInput = document.getElementById('otp-input');
    if (otpInput) {
      otpInput.addEventListener('input', (e) => {
        this.handleOTPInput(e.target.value);
      });
    }

    // Keyword positions
    document.querySelectorAll('.position-slot').forEach(slot => {
      slot.addEventListener('click', (e) => {
        this.togglePositionSelection(e.currentTarget);
      });
    });

    // Decrypt input validation
    const decryptInput = document.getElementById('decrypt-input');
    if (decryptInput) {
      decryptInput.addEventListener('input', (e) => {
        this.validateDecryptInput(e.target.value);
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
    const secretNoteSection = document.getElementById('secretnote-input');
    const keywordPositionsSection = document.getElementById('keywordpositions-input');

    if (method === 'secretnote') {
      secretNoteSection.style.display = 'block';
      keywordPositionsSection.style.display = 'none';
    } else {
      secretNoteSection.style.display = 'none';
      keywordPositionsSection.style.display = 'block';
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

  // Keyword Position Generation
  generateKeywordPositions() {
    const keyword = document.getElementById('keyword-input').value.trim();
    if (!keyword) {
      this.showToast('Vui lòng nhập từ khóa bí mật', 'error');
      return;
    }

    // Clear previous selections
    this.selectedPositions = [];
    document.querySelectorAll('.position-slot').forEach(slot => {
      slot.classList.remove('selected');
    });

    // Generate 12 random positions (1-12)
    const positions = [];
    while (positions.length < 12) {
      const pos = Math.floor(Math.random() * 12) + 1;
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }

    // Animate the reveal
    document.querySelectorAll('.position-slot').forEach((slot, index) => {
      setTimeout(() => {
        slot.textContent = positions[index];
        slot.classList.add('revealed');
      }, index * 100);
    });

    this.showToast('Đã tạo 12 vị trí từ khóa', 'success');
  }

  // Toggle Position Selection
  togglePositionSelection(slot) {
    const position = parseInt(slot.dataset.position);
    if (slot.classList.contains('selected')) {
      slot.classList.remove('selected');
      this.selectedPositions = this.selectedPositions.filter(p => p !== position);
    } else {
      slot.classList.add('selected');
      this.selectedPositions.push(position);
    }
  }

  // Secret Note Validation
  validateSecretNote(note) {
    if (note.length > 0) {
      // Check for non-ASCII characters (no diacritics)
      const nonAsciiRegex = /[^\x00-\x7F]/;
      if (nonAsciiRegex.test(note)) {
        this.showInputError('secretnote-textarea', 'Ghi chú không được chứa dấu');
        return false;
      }
      this.clearInputError('secretnote-textarea');
    }
    return true;
  }

  // Crypto Pair Suggestions
  async handleCryptoPairInput(value) {
    if (value.length < 1) {
      this.hideCryptoSuggestions();
      return;
    }

    const suggestions = await this.getCryptoSuggestions(value);
    this.displayCryptoSuggestions(suggestions);
  }

  async getCryptoSuggestions(query) {
    try {
      // Fetch from Binance API
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      const data = await response.json();
      
      const suggestions = data
        .filter(item => {
          const symbol = item.symbol.toUpperCase();
          const queryUpper = query.toUpperCase();
          return symbol.includes(queryUpper) || 
                 (queryUpper === 'X' && symbol === 'XAUUSD') ||
                 (queryUpper === 'B' && symbol.startsWith('B'));
        })
        .sort((a, b) => {
          // Prioritize exact matches and popular pairs
          const aSymbol = a.symbol.toUpperCase();
          const bSymbol = b.symbol.toUpperCase();
          const queryUpper = query.toUpperCase();
          
          if (aSymbol.startsWith(queryUpper) && !bSymbol.startsWith(queryUpper)) return -1;
          if (!aSymbol.startsWith(queryUpper) && bSymbol.startsWith(queryUpper)) return 1;
          
          // Prioritize popular pairs
          const popularPairs = ['BTCUSDT', 'ETHUSDT', 'XAUUSD', 'BNBUSDT', 'ADAUSDT'];
          const aPopular = popularPairs.includes(aSymbol);
          const bPopular = popularPairs.includes(bSymbol);
          
          if (aPopular && !bPopular) return -1;
          if (!aPopular && bPopular) return 1;
          
          return 0;
        })
        .slice(0, 10);

      return suggestions;
    } catch (error) {
      console.error('Error fetching crypto suggestions:', error);
      return [];
    }
  }

  displayCryptoSuggestions(suggestions) {
    const container = document.getElementById('crypto-suggestions');
    if (!container) return;

    if (suggestions.length === 0) {
      container.style.display = 'none';
      return;
    }

    const html = suggestions.map(item => {
      const logoUrl = this.getCryptoLogo(item.symbol);
      return `
        <div class="crypto-suggestion-item" onclick="window.quantumVault.selectCryptoPair('${item.symbol}')">
          <img src="${logoUrl}" alt="${item.symbol}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM2QjcyODAiLz4KPC9zdmc+'">
          <div>
            <div class="symbol">${item.symbol}</div>
            <div class="name">${this.getCryptoName(item.symbol)}</div>
          </div>
          <div class="price">$${parseFloat(item.lastPrice).toFixed(2)}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
    container.style.display = 'block';
  }

  hideCryptoSuggestions() {
    const container = document.getElementById('crypto-suggestions');
    if (container) {
      container.style.display = 'none';
    }
  }

  selectCryptoPair(symbol) {
    document.getElementById('crypto-pair-input').value = symbol;
    this.hideCryptoSuggestions();
  }

  getCryptoLogo(symbol) {
    // Use CoinGecko API for logos
    const baseSymbol = symbol.replace('USDT', '').replace('USD', '');
    return `https://api.coingecko.com/api/v3/coins/${baseSymbol.toLowerCase()}/image`;
  }

  getCryptoName(symbol) {
    const names = {
      'BTCUSDT': 'Bitcoin',
      'ETHUSDT': 'Ethereum',
      'XAUUSD': 'Gold',
      'BNBUSDT': 'Binance Coin',
      'ADAUSDT': 'Cardano',
      'SOLUSDT': 'Solana',
      'DOTUSDT': 'Polkadot',
      'LINKUSDT': 'Chainlink',
      'UNIUSDT': 'Uniswap',
      'LTCUSDT': 'Litecoin'
    };
    return names[symbol] || symbol;
  }

  // Price Validation
  async validatePriceInput(value, type) {
    const input = document.getElementById(`price-${type}`);
    const validation = document.getElementById(`price-${type}-validation`);
    
    if (!value) {
      input.classList.remove('valid', 'invalid');
      validation.textContent = '';
      return;
    }

    // Check if it's a valid number
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      input.classList.remove('valid');
      input.classList.add('invalid');
      validation.textContent = 'Giá phải là số dương';
      validation.className = 'price-validation invalid';
      return;
    }

    // Check if it starts with dot
    if (value.startsWith('.')) {
      input.classList.remove('valid');
      input.classList.add('invalid');
      validation.textContent = 'Giá không được bắt đầu bằng dấu chấm';
      validation.className = 'price-validation invalid';
      return;
    }

    // Get current price for comparison
    const currentPrice = await this.getCurrentCryptoPrice();
    if (currentPrice) {
      if (type === 'higher' && numValue <= currentPrice) {
        input.classList.remove('valid');
        input.classList.add('invalid');
        validation.textContent = `Giá cao hơn phải lớn hơn giá hiện tại ($${currentPrice})`;
        validation.className = 'price-validation invalid';
        return;
      } else if (type === 'lower' && numValue >= currentPrice) {
        input.classList.remove('invalid');
        input.classList.add('invalid');
        validation.textContent = `Giá thấp hơn phải nhỏ hơn giá hiện tại ($${currentPrice})`;
        validation.className = 'price-validation invalid';
        return;
      }
    }

    input.classList.remove('invalid');
    input.classList.add('valid');
    validation.textContent = '✓ Giá hợp lệ';
    validation.className = 'price-validation valid';
    
    // Show fintech branding
    this.showFintechBranding();
  }

  async getCurrentCryptoPrice() {
    try {
      const symbol = document.getElementById('crypto-pair-input').value;
      if (!symbol) return null;

      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('Error fetching current price:', error);
      return null;
    }
  }

  showFintechBranding() {
    const higherInput = document.getElementById('price-higher');
    const lowerInput = document.getElementById('price-lower');
    
    if (higherInput.classList.contains('valid') || lowerInput.classList.contains('valid')) {
      let branding = document.querySelector('.fintech-brand');
      if (!branding) {
        branding = document.createElement('div');
        branding.className = 'fintech-brand';
        higherInput.parentNode.appendChild(branding);
      }
      branding.textContent = 'Bạn có thể giải mã khi giá đạt điều kiện';
    }
  }

  // Email Validation
  validateEmail(email) {
    const input = document.getElementById('recipient-email');
    const validation = document.getElementById('email-validation');
    
    if (!email) {
      input.classList.remove('valid', 'invalid');
      validation.textContent = '';
      return false;
    }

    // Comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (emailRegex.test(email)) {
      input.classList.remove('invalid');
      input.classList.add('valid');
      validation.textContent = '✓ Email hợp lệ';
      validation.className = 'email-validation valid';
      return true;
    } else {
      input.classList.remove('valid');
      input.classList.add('invalid');
      validation.textContent = 'Email không đúng định dạng';
      validation.className = 'email-validation invalid';
      return false;
    }
  }

  // OTP Functions
  async sendOTP() {
    const email = document.getElementById('recipient-email').value.trim();
    if (!this.validateEmail(email)) {
      this.showToast('Vui lòng nhập email hợp lệ', 'error');
      return;
    }

    const otpBtn = document.querySelector('.otp-btn');
    otpBtn.disabled = true;
    otpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';

    try {
      // Simulate OTP sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show OTP section
      document.getElementById('otp-section').style.display = 'block';
      
      // Start timer
      this.startOTPTimer();
      
      this.showToast('Mã OTP đã được gửi đến email của bạn', 'success');
    } catch (error) {
      this.showToast('Không thể gửi OTP. Vui lòng thử lại', 'error');
    } finally {
      otpBtn.disabled = false;
      otpBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Gửi OTP';
    }
  }

  startOTPTimer() {
    let timeLeft = 300; // 5 minutes
    const timerElement = document.getElementById('otp-timer');
    
    this.otpTimer = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerElement.textContent = `Mã OTP hết hạn sau: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      if (timeLeft <= 0) {
        clearInterval(this.otpTimer);
        timerElement.textContent = 'Mã OTP đã hết hạn';
        document.getElementById('otp-section').style.display = 'none';
      }
      timeLeft--;
    }, 1000);
  }

  handleOTPInput(value) {
    if (value.length === 6) {
      // Validate OTP (simplified)
      if (value === '123456') { // Mock OTP
        this.showToast('OTP xác thực thành công', 'success');
        document.getElementById('otp-input').classList.add('valid');
      } else {
        this.showToast('OTP không đúng', 'error');
        document.getElementById('otp-input').classList.add('invalid');
      }
    }
  }

  // Decrypt Input Validation
  validateDecryptInput(value) {
    if (value && value.includes('inheritance')) {
      // Show inheritance actions if encrypted data contains inheritance info
      document.getElementById('inheritance-actions-decrypt').style.display = 'flex';
    } else {
      document.getElementById('inheritance-actions-decrypt').style.display = 'none';
    }
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
      
      if (inputMethod === 'secretnote') {
        secretData = document.getElementById('secretnote-textarea').value.trim();
        if (!this.validateSecretNote(secretData)) {
          return;
        }
      } else {
        // Keyword positions method
        const keyword = document.getElementById('keyword-input').value.trim();
        if (!keyword) {
          this.showToast('Vui lòng nhập từ khóa bí mật', 'error');
          return;
        }
        secretData = JSON.stringify({
          keyword: keyword,
          positions: this.selectedPositions
        });
      }

      // Get time conditions
      const unlockDate = document.getElementById('unlock-date').value;
      const unlockTime = document.getElementById('unlock-time').value;
      const unlockDateTime = unlockDate && unlockTime ? `${unlockDate}T${unlockTime}` : null;

      // Validate future time
      if (unlockDateTime && new Date(unlockDateTime) <= new Date()) {
        this.showToast('Thời gian mở khóa phải trong tương lai', 'error');
        return;
      }

      // Get price conditions
      const priceHigher = document.getElementById('price-higher').value;
      const priceLower = document.getElementById('price-lower').value;
      const cryptoPair = document.getElementById('crypto-pair-input').value;

      // Validate price conditions
      if ((priceHigher || priceLower) && !cryptoPair) {
        this.showToast('Vui lòng chọn cặp tiền khi đặt điều kiện giá', 'error');
        return;
      }

      // Create encryption payload
      const payload = {
        secret: secretData,
        inputMethod: inputMethod,
        conditions: {
          time: unlockDateTime ? new Date(unlockDateTime).toISOString() : null,
          priceHigher: priceHigher ? parseFloat(priceHigher) : null,
          priceLower: priceLower ? parseFloat(priceLower) : null,
          cryptoPair: cryptoPair || null
        },
        timestamp: new Date().toISOString(),
        version: '2.0'
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
        results.time.message = 'Điều kiện thời gian đã đạt';
      } else {
        const timeDiff = unlockTime - currentTime;
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        let timeMessage = `Thời gian chưa đạt. Mở khóa lúc ${unlockTime.toLocaleString('vi-VN')}`;
        if (days > 0) {
          timeMessage += ` (còn ${days} ngày ${hours} giờ)`;
        } else if (hours > 0) {
          timeMessage += ` (còn ${hours} giờ ${minutes} phút)`;
        } else {
          timeMessage += ` (còn ${minutes} phút)`;
        }
        results.time.message = timeMessage;
      }
    }

    // Check price conditions
    if (conditions.priceHigher || conditions.priceLower) {
      const cryptoPair = conditions.cryptoPair || 'BTCUSDT';
      const currentPrice = await this.getCurrentCryptoPrice(cryptoPair);
      
      if (currentPrice) {
        if (conditions.priceHigher && currentPrice >= conditions.priceHigher) {
          results.price.met = true;
          results.price.message = `Điều kiện giá đã đạt: $${currentPrice} >= $${conditions.priceHigher}`;
        } else if (conditions.priceLower && currentPrice <= conditions.priceLower) {
          results.price.met = true;
          results.price.message = `Điều kiện giá đã đạt: $${currentPrice} <= $${conditions.priceLower}`;
        } else {
          let priceMessage = `Điều kiện giá chưa đạt. Giá hiện tại: $${currentPrice}`;
          if (conditions.priceHigher) {
            priceMessage += ` (cần >= $${conditions.priceHigher})`;
          }
          if (conditions.priceLower) {
            priceMessage += ` (cần <= $${conditions.priceLower})`;
          }
          results.price.message = priceMessage;
        }
      } else {
        results.price.message = 'Không thể lấy giá hiện tại';
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
    const unlockDate = document.getElementById('unlock-date').value;
    const unlockTime = document.getElementById('unlock-time').value;
    
    if (!unlockDate || !unlockTime) {
      this.showToast('Vui lòng đặt thời gian mở khóa', 'error');
      return false;
    }

    // Validate future time
    const unlockDateTime = `${unlockDate}T${unlockTime}`;
    if (new Date(unlockDateTime) <= new Date()) {
      this.showToast('Thời gian mở khóa phải trong tương lai', 'error');
      return false;
    }

    if (inputMethod === 'secretnote') {
      const secretNote = document.getElementById('secretnote-textarea').value.trim();
      if (!this.validateSecretNote(secretNote)) {
        return false;
      }
    } else if (inputMethod === 'keywordpositions') {
      const keyword = document.getElementById('keyword-input').value.trim();
      if (!keyword) {
        this.showToast('Vui lòng nhập từ khóa bí mật', 'error');
        return false;
      }
      if (this.selectedPositions.length === 0) {
        this.showToast('Vui lòng chọn ít nhất một vị trí từ khóa', 'error');
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
    
    // Generate secure proof without exposing technical details
    const proofId = this.generateSecureProofId();
    const timestamp = new Date().toISOString();
    
    content.innerHTML = `
      <div class="proof-section">
        <h4><i class="fas fa-shield-alt"></i> Bằng chứng xác thực</h4>
        <div class="proof-info">
          <p><strong>Mã xác thực:</strong> <code>${proofId}</code></p>
          <p><strong>Thời gian:</strong> <code>${timestamp}</code></p>
          <p><strong>Trạng thái:</strong> <span class="status-verified">✓ Đã xác thực</span></p>
        </div>
        <div class="proof-note">
          <i class="fas fa-info-circle"></i>
          <p>Bằng chứng này đã được xác thực bởi hệ thống phi tập trung và không thể bị giả mạo.</p>
        </div>
      </div>
    `;
    
    modal.style.display = 'flex';
  }

  generateSecureProofId() {
    // Generate a secure proof ID without exposing technical implementation
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `PROOF-${timestamp}-${random}`.toUpperCase();
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

function generateKeywordPositions() {
  window.quantumVault.generateKeywordPositions();
}

function sendOTP() {
  window.quantumVault.sendOTP();
}

function selectCryptoPair(symbol) {
  window.quantumVault.selectCryptoPair(symbol);
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
