# 🔐 Quantum-Resistant Crypto Vault - Enhanced Version

A professional-grade, quantum-resistant cryptocurrency inheritance and time-lock application with advanced security features and modern UI/UX.

## ✨ New Features Implemented

### 1. **Enhanced Input Methods**
- **Secret Note Input**: Replace seed phrase with customizable secret notes (no diacritics allowed)
- **Keyword Positions**: 12 random positions (1-12) for keyword-based security instead of random numbers
- **Flexible Input**: Users can choose between secret notes or keyword positions

### 2. **Crypto Price Suggestions with Binance API**
- **Real-time Suggestions**: Live crypto pair suggestions as you type
- **Smart Prioritization**: 
  - Type 'B' → Prioritizes BTC, BNB, and other B-prefix coins
  - Type 'X' → Prioritizes XAUUSD (Gold) at the top
  - Popular coins always appear first
- **Logo Integration**: Crypto logos from CoinGecko API
- **Price Display**: Real-time prices from Binance API

### 3. **Enhanced Time Picker**
- **Separate Date & Time**: Easy-to-use date and time pickers
- **Future Validation**: Only allows selection of future dates/times
- **User-friendly Interface**: Simple and intuitive time selection

### 4. **Inheritance Management in Decrypt Tab**
- **Smart Detection**: Automatically shows inheritance buttons when encrypted data contains inheritance info
- **Security Questions**: Required authentication for inheritance actions
- **Two Actions Available**:
  - Cancel Inheritance
  - View Inheritance Status

### 5. **Advanced Price Validation**
- **Real-time Validation**: Validates prices against current market rates
- **Smart Rules**:
  - Higher price must be > current price
  - Lower price must be < current price
  - No leading decimal points
  - Only numbers and decimals allowed
- **Visual Feedback**: Green borders for valid, red for invalid
- **Fintech Branding**: Shows "Bạn có thể giải mã khi giá đạt điều kiện" when valid

### 6. **Email Validation with OTP**
- **Comprehensive Email Validation**: Supports all email formats
- **Real-time Validation**: Instant feedback with green/red borders
- **Integrated OTP System**: Send OTP directly from email input
- **5-minute Timer**: OTP expires after 5 minutes
- **Spam Prevention**: Validates email before sending OTP

### 7. **Enhanced Security Features**
- **Secure Proof Modal**: No technical details exposed to prevent hacking
- **Professional Reporting**: Clear success/failure messages with detailed condition status
- **Audit-Ready**: Passes Centrix security audit requirements
- **North Korea Hacker Protection**: Advanced security measures

### 8. **Professional UI/UX**
- **Mobile Responsive**: Works perfectly on mobile, PC, and iOS
- **Dark Theme**: Professional black and gold color scheme
- **Smooth Animations**: Enhanced user experience with animations
- **Professional Design**: Fintech-grade interface

### 9. **Enhanced Error Handling**
- **Detailed Messages**: Clear Vietnamese error messages
- **Condition Status**: Shows detailed status of time and price conditions
- **Professional Reporting**: Reports success/failure with specific reasons

### 10. **Blockchain Integration**
- **NEAR Protocol**: Encrypted data stored on NEAR blockchain
- **Transaction Links**: Professional explorer links for verification
- **Audit Trail**: Complete transaction history

## 🚀 Technology Stack

### Frontend
- **HTML5**: Semantic markup with accessibility
- **CSS3**: Modern styling with CSS Grid, Flexbox, and custom properties
- **JavaScript ES6+**: Modern JavaScript with async/await
- **Font Awesome**: Professional icons
- **Inter Font**: Modern typography

### Security
- **AES-256-GCM**: Military-grade encryption
- **ECDH**: Elliptic curve key exchange
- **Kyber**: Post-quantum cryptography
- **Dilithium**: Post-quantum signatures
- **Web Crypto API**: Browser-native security

### APIs
- **Binance API**: Real-time crypto prices and suggestions
- **CoinGecko API**: Crypto logos and metadata
- **Drand Network**: Decentralized time verification
- **Pyth Network**: Decentralized price feeds
- **NEAR Protocol**: Blockchain storage

## 📱 Responsive Design

### Mobile (< 768px)
- Stacked layout for better mobile experience
- Touch-friendly buttons and inputs
- Optimized grid layouts (3x4 for keyword positions)
- Full-width modals

### Tablet (768px - 1024px)
- Balanced layout between mobile and desktop
- Responsive grids and spacing

### Desktop (> 1024px)
- Full-featured layout with side-by-side elements
- Enhanced hover effects and animations
- Professional spacing and typography

## 🔒 Security Features

### Quantum Resistance
- **Hybrid Encryption**: Combines classical and quantum-resistant algorithms
- **Kyber Integration**: Post-quantum key exchange
- **Dilithium Signatures**: Post-quantum digital signatures

### Audit Compliance
- **Centrix Audit Ready**: Meets enterprise security standards
- **Penetration Testing**: Resistant to advanced attacks
- **Code Review**: Professional-grade code quality

### Data Protection
- **Client-side Encryption**: All encryption happens in browser
- **Zero-knowledge**: No data sent to servers unencrypted
- **Secure Storage**: Encrypted data on blockchain

## 🎨 Design System

### Color Palette
- **Primary**: Professional blue gradient
- **Accent**: Gold highlights for premium feel
- **Success**: Green for validations
- **Error**: Red for warnings
- **Dark Theme**: Black and gold for premium look

### Typography
- **Font**: Inter (Google Fonts)
- **Hierarchy**: Clear heading and body text sizes
- **Accessibility**: High contrast ratios

### Animations
- **Smooth Transitions**: 150ms-350ms easing
- **Loading States**: Professional spinners
- **Hover Effects**: Subtle feedback
- **Pulse Animations**: For important actions

## 📋 Usage Instructions

### 1. Encryption
1. Choose input method (Secret Note or Keyword Positions)
2. Enter your secret data
3. Set unlock time (date and time)
4. Optionally set price conditions with crypto suggestions
5. Click "Mã hóa dữ liệu"

### 2. Inheritance Setup
1. Paste encrypted data
2. Enter recipient email (validated)
3. Send OTP for verification
4. Set security question and answer
5. Configure inheritance conditions
6. Save inheritance settings

### 3. Decryption
1. Paste encrypted data
2. System automatically checks conditions
3. Shows detailed status of time and price conditions
4. Inheritance actions appear if applicable
5. Click "Giải mã" when conditions are met

## 🔧 Installation

1. Clone the repository
2. Open `index.html` in a modern browser
3. Or serve with a local server:
   ```bash
   python3 -m http.server 8000
   ```
4. Access at `http://localhost:8000`

## 🌟 Key Improvements

### User Experience
- **Intuitive Interface**: Easy to use for non-technical users
- **Real-time Feedback**: Immediate validation and suggestions
- **Professional Design**: Fintech-grade appearance
- **Mobile First**: Works perfectly on all devices

### Security
- **Advanced Encryption**: Quantum-resistant algorithms
- **Audit Compliance**: Enterprise-grade security
- **Zero Trust**: Client-side processing
- **Blockchain Storage**: Immutable audit trail

### Performance
- **Fast Loading**: Optimized assets and code
- **Responsive**: Smooth animations and transitions
- **Efficient APIs**: Minimal external dependencies
- **Caching**: Smart data caching for better performance

## 🔮 Future Enhancements

- **Multi-language Support**: Internationalization
- **Advanced Analytics**: Usage statistics and insights
- **API Integration**: More blockchain networks
- **Mobile App**: Native iOS/Android applications
- **Enterprise Features**: Team management and permissions

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and code of conduct.

## 📞 Support

For support and questions, please contact our development team.

---

**Built with ❤️ for the crypto community**