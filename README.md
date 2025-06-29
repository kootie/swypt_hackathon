# Base, Lisk & Celo to M-Pesa Bridge

A comprehensive bridge application for transferring funds between Base, Lisk, and Celo network wallets and M-Pesa using Swypt APIs. This application supports both onramp (M-Pesa to Crypto) and offramp (Crypto to M-Pesa) operations.

## Features

- **Onramp (M-Pesa to Crypto)**: Convert M-Pesa money to USDT/USDC on Base, Lisk, or Celo networks
- **Offramp (Crypto to M-Pesa)**: Convert USDT/USDC from Base, Lisk, or Celo networks to M-Pesa money
- **Real-time Quotes**: Get live exchange rates and fees before making transfers
- **Transaction Tracking**: Monitor transaction status and history
- **Multi-chain Support**: Base (Ethereum L2), Lisk, and Celo networks
- **STK Push Integration**: Direct M-Pesa integration via Swypt APIs

## Prerequisites

- Node.js (v14 or higher)
- Swypt API credentials (API key and secret)
- Base, Lisk, or Celo network wallets with USDT/USDC for offramp operations
- M-Pesa account for onramp operations

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd swypt_hackathon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   # Swypt API Configuration (Required - Get from Swypt)
   SWYPT_API_KEY=c99b840a303c3fe23f8496c480f922e8
   SWYPT_API_SECRET=59361aaf105f3e36834a8d02644de06f9808382922e20494e60324feedd29536
   SWYPT_API_URL=https://pool.swypt.io/api
   
   # Base Network Configuration (Ethereum L2)
   BASE_NETWORK_URL=https://mainnet.base.org
   BASE_USDT_CONTRACT_ADDRESS=0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb
   BASE_USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
   
   # Lisk Network Configuration
   LISK_NETWORK_URL=https://lisk.com/api
   LISK_USDT_CONTRACT_ADDRESS=0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa
   LISK_USDC_CONTRACT_ADDRESS=0x07865c6e87b9f70255377e024ace6630c1eaa37f
   
   # Celo Network Configuration
   CELO_NETWORK_URL=https://forno.celo.org
   CELO_USDT_CONTRACT_ADDRESS=0x88eeC49252c8cbc039DCdB394c0c2BA2f1637EA0
   CELO_USDC_CONTRACT_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
   
   # Wallet Configuration (Required for offramp operations)
   BASE_WALLET_PRIVATE_KEY=your_base_wallet_private_key_here
   BASE_RECIPIENT_ADDRESS=your_base_recipient_address_here
   LISK_WALLET_PRIVATE_KEY=your_lisk_wallet_private_key_here
   LISK_RECIPIENT_ADDRESS=your_lisk_recipient_address_here
   CELO_WALLET_PRIVATE_KEY=your_celo_wallet_private_key_here
   CELO_RECIPIENT_ADDRESS=your_celo_recipient_address_here
   
   # Swypt Recipient Addresses (for offramp) - Get these from Swypt
   SWYPT_BASE_RECIPIENT_ADDRESS=swypt_base_recipient_address_here
   SWYPT_LISK_RECIPIENT_ADDRESS=swypt_lisk_recipient_address_here
   SWYPT_CELO_RECIPIENT_ADDRESS=swypt_celo_recipient_address_here
   
   # Project Configuration
   PROJECT_NAME=stablecoin-mpesa-bridge
   ```

4. **Get Swypt API Credentials**
   
   Contact Swypt support at `swypt.io@gmail.com` to get your API key and secret for early access to their APIs.

## Running the Application

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Access the application**
   
   Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Quote Endpoints
- `POST /api/quote` - Get transfer quote with rates and fees

### Onramp Endpoints (M-Pesa to Crypto)
- `POST /api/onramp` - Initiate M-Pesa to crypto transfer
- `GET /api/onramp/status/:orderID` - Check transfer status
- `POST /api/onramp/process` - Process crypto transfer after M-Pesa payment

### Offramp Endpoints (Crypto to M-Pesa)
- `POST /api/offramp` - Initiate crypto to M-Pesa transfer

### Legacy Endpoints
- `POST /register` - Register user account
- `GET /transactions` - Get transaction history

## Usage

### Getting a Quote
1. Select transfer type (onramp/offramp)
2. Enter amount and select currencies
3. Choose network (Base, Lisk, or Celo)
4. Click "Get Quote" to see rates and fees

### M-Pesa to Crypto (Onramp)
1. Enter amount in KES
2. Provide M-Pesa phone number (254XXXXXXXXX format)
3. Select crypto currency and network
4. Enter your wallet address
5. Click "Initiate Transfer"
6. Complete M-Pesa payment on your phone
7. Check status and process crypto transfer

### Crypto to M-Pesa (Offramp)
1. Enter crypto amount
2. Provide M-Pesa phone number
3. Select crypto currency and network
4. Enter your wallet address
5. Click "Initiate Transfer"
6. Approve token transfer from your wallet

## Supported Networks

- **Base**: Ethereum L2 network (Coinbase's Layer 2)
- **Lisk**: Lisk blockchain network
- **Celo**: Mobile-first blockchain network

## Supported Tokens

- **USDT**: Tether USD
- **USDC**: USD Coin

## Security Notes

- Never commit your `.env` file
- Keep your wallet private keys secure
- Use testnet for development and testing
- Implement proper error handling and validation in production
- Validate all user inputs before processing

## Error Handling

The application includes comprehensive error handling for:
- Invalid API credentials
- Network connectivity issues
- Insufficient funds
- Invalid wallet addresses
- Invalid phone number formats
- Transaction failures

## Development

### Database
The application uses SQLite for local development. The database file (`database.sqlite`) is created automatically.

### API Integration
The application integrates with Swypt APIs following their [official documentation](https://github.com/Swypt-io/swypt-api-documentation).

### Testing
Test the application with small amounts first. Use testnet networks for development.

## Support

For Swypt API access and support:
- Email: swypt.io@gmail.com
- Documentation: [Swypt API Documentation](https://github.com/Swypt-io/swypt-api-documentation)

## Disclaimer

This is a demonstration application for integrating with Swypt APIs. Additional security measures, error handling, and validation should be implemented before using in production. Always test thoroughly with small amounts before processing real transactions. 