# 🔐 Quantum-Resistant Crypto Vault

A sophisticated Fintech-grade web application for encryption, decryption, and inheritance with quantum-resistant cryptography and blockchain integration.

## 🌟 Features

### 🔒 Quantum-Resistant Encryption
- **Hybrid Cryptography**: Combines classical (AES-256-GCM, ECDH) and post-quantum (Kyber, Dilithium) algorithms
- **Client-Side Processing**: All encryption/decryption happens locally in the browser
- **Zero Data Collection**: No sensitive data is stored on servers
- **Advanced Security**: Implements industry-standard cryptographic protocols

### ⏰ Time-Based Unlocking
- **Decentralized Time**: Uses drand network for verifiable, decentralized time
- **Flexible Conditions**: Set unlock time with local timezone support
- **Verifiable Proofs**: Cryptographic proofs for time verification

### 💰 Price-Based Unlocking
- **Decentralized Price Feeds**: Integrates with Pyth Network for reliable price data
- **Multiple Conditions**: Support for "higher than" and "lower than" price triggers
- **Real-Time Monitoring**: Live price updates with confidence intervals

### 👥 Inheritance System
- **Secure Sharing**: Share encrypted data with trusted recipients
- **Email Integration**: Automated email notifications when conditions are met
- **Security Questions**: Additional authentication layer with Argon2id hashing
- **Timelock Protection**: 24-hour cancellation window with recovery options

### 🎨 Modern Fintech UI
- **Professional Design**: Inspired by leading Fintech applications (Revolut, Wise, Coinbase)
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes with persistent preferences
- **Smooth Animations**: Polished user experience with micro-interactions

## 🛠 Technology Stack

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with CSS Grid, Flexbox, and custom properties
- **JavaScript ES6+**: Class-based architecture with async/await
- **Web Crypto API**: Native browser cryptography support

### Cryptography
- **AES-256-GCM**: Symmetric encryption with authenticated encryption
- **ECDH (X25519)**: Elliptic curve key exchange
- **Kyber**: Post-quantum key encapsulation mechanism
- **Dilithium/Falcon**: Post-quantum digital signatures
- **Argon2id**: Memory-hard password hashing for security questions

### Blockchain & Oracles
- **NEAR Protocol**: Fast, scalable blockchain for data storage
- **Drand Network**: Decentralized randomness beacon for time verification
- **Pyth Network**: Decentralized price feeds with high accuracy

### Libraries & Dependencies
- **Font Awesome**: Professional iconography
- **Inter Font**: Modern, readable typography
- **Web3.js**: Blockchain interaction
- **CryptoJS**: Additional cryptographic utilities

## 🚀 Getting Started

### Prerequisites
- Modern web browser with Web Crypto API support
- NEAR Wallet (for blockchain interactions)
- Internet connection for oracle data

### Installation
1. Clone the repository:
```bash
git clone https://github.com/your-username/quantum-vault.git
cd quantum-vault
```

2. Open `index.html` in your web browser or serve with a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

3. Navigate to `http://localhost:8000` in your browser

## 📖 Usage Guide

### 🔐 Encryption Tab

#### Input Methods
1. **Seed Phrase**: Enter 12 or 24 word seed phrases (ASCII only)
2. **Random Numbers**: Generate cryptographically secure 12-digit numbers

#### Security Features
- **Security Note**: Optional note displayed when data is unlocked
- **Input Validation**: Real-time validation with helpful error messages
- **Character Filtering**: Automatic removal of non-ASCII characters

#### Unlock Conditions
- **Time Condition** (Required): Set future unlock time using drand network
- **Price Conditions** (Optional): Set price triggers using Pyth Network
- **OR Logic**: Data unlocks when ANY condition is met

### 👥 Inheritance Tab

#### Setup Process
1. **Paste Encrypted Data**: Input previously encrypted data
2. **Recipient Details**: Enter recipient email and optional message
3. **Security Question**: Create question/answer pair for authentication
4. **Inheritance Conditions**: Set time/price conditions for inheritance activation

#### Features
- **Email Notifications**: Automated emails when conditions are met
- **Security Verification**: Recipients must answer security questions
- **Timelock Protection**: 24-hour cancellation window
- **Status Monitoring**: Track inheritance status and proofs

### 🔓 Decryption Tab

#### Unlock Process
1. **Paste Encrypted Data**: Input the encrypted data string
2. **Condition Verification**: System checks time and price conditions
3. **Decryption**: Client-side decryption with quantum-resistant algorithms
4. **Result Display**: Show decrypted data with copy functionality

#### Status Information
- **Condition Status**: Real-time updates on unlock conditions
- **Countdown Timer**: Time remaining until unlock
- **Price Information**: Current prices and thresholds
- **Proof Verification**: Cryptographic proofs for transparency

## 🔧 Configuration

### NEAR Protocol Setup
```javascript
const config = {
  networkId: 'testnet', // or 'mainnet'
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://explorer.testnet.near.org'
};
```

### Drand Network Configuration
```javascript
const drandConfig = {
  endpoint: 'https://drand.cloudflare.com/api/public/latest',
  chainHash: '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce'
};
```

### Pyth Network Setup
```javascript
const pythConfig = {
  endpoint: 'https://hermes.pyth.network/api/latest/price_feeds',
  supportedAssets: ['BTC', 'ETH', 'SOL', 'USDC', 'USDT']
};
```

## 🔒 Security Features

### Quantum Resistance
- **Hybrid Encryption**: Combines classical and post-quantum algorithms
- **Future-Proof**: Resistant to quantum computer attacks
- **Standards Compliance**: Implements NIST PQC standards

### Privacy Protection
- **Zero-Knowledge**: No plaintext data leaves the client
- **Client-Side Processing**: All cryptographic operations in browser
- **No Server Storage**: Encrypted data only stored on blockchain

### Authentication
- **Multi-Factor**: Wallet connection + security questions
- **Argon2id Hashing**: Memory-hard password hashing
- **Signature Verification**: Cryptographic proof of authenticity

## 🎨 UI/UX Features

### Design System
- **Color Palette**: Professional Fintech blue theme
- **Typography**: Inter font family for readability
- **Spacing**: Consistent spacing system with CSS custom properties
- **Shadows**: Subtle depth with layered shadow system

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Breakpoints**: Responsive layouts for all screen sizes
- **Touch-Friendly**: Optimized for touch interactions

### Accessibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Semantic HTML structure
- **High Contrast**: Support for high contrast modes
- **Focus Indicators**: Clear focus states for all interactive elements

## 🧪 Testing

### Browser Compatibility
- **Chrome**: 90+ (Full support)
- **Firefox**: 88+ (Full support)
- **Safari**: 14+ (Full support)
- **Edge**: 90+ (Full support)

### Feature Detection
```javascript
// Check Web Crypto API support
if (!window.crypto || !window.crypto.subtle) {
  console.error('Web Crypto API not supported');
}

// Check NEAR Wallet availability
if (typeof window.near === 'undefined') {
  console.warn('NEAR Wallet not available');
}
```

## 🚀 Deployment

### Static Hosting
The application can be deployed to any static hosting service:

- **Netlify**: Drag and drop deployment
- **Vercel**: Git-based deployment
- **GitHub Pages**: Free hosting for public repositories
- **AWS S3**: Scalable static hosting

### Environment Variables
```bash
# NEAR Network Configuration
NEAR_NETWORK_ID=testnet
NEAR_NODE_URL=https://rpc.testnet.near.org

# Pyth Network Configuration
PYTH_ENDPOINT=https://hermes.pyth.network/api/latest/price_feeds

# Drand Network Configuration
DRAND_ENDPOINT=https://drand.cloudflare.com/api/public/latest
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- **JavaScript**: ES6+ with async/await
- **CSS**: BEM methodology with custom properties
- **HTML**: Semantic markup with accessibility attributes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NIST**: Post-quantum cryptography standards
- **NEAR Protocol**: Blockchain infrastructure
- **Drand Network**: Decentralized randomness
- **Pyth Network**: Decentralized price feeds
- **Font Awesome**: Icon library
- **Inter Font**: Typography

## 📞 Support

For support and questions:
- **Issues**: Create an issue on GitHub
- **Documentation**: Check the inline code comments
- **Community**: Join our Discord server

---

**⚠️ Security Notice**: This application is for educational and demonstration purposes. For production use, please conduct thorough security audits and consider additional security measures.