# Three-Chain Setup Guide: Base, Lisk & Celo

## Overview
This application is configured for the initial launch with three blockchain networks:
- **Base** (Ethereum L2)
- **Lisk** 
- **Celo**

## Network Details

### 1. Base Network (Ethereum L2)
- **Network URL**: `https://mainnet.base.org`
- **USDT Contract**: `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb`
- **USDC Contract**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Description**: Coinbase's Layer 2 solution built on Ethereum

### 2. Lisk Network
- **Network URL**: `https://lisk.com/api`
- **USDT Contract**: `0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa`
- **USDC Contract**: `0x07865c6e87b9f70255377e024ace6630c1eaa37f`
- **Description**: Lisk blockchain network

### 3. Celo Network
- **Network URL**: `https://forno.celo.org`
- **USDT Contract**: `0x88eeC49252c8cbc039DCdB394c0c2BA2f1637EA0`
- **USDC Contract**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- **Description**: Mobile-first blockchain network

## Required Configuration

### Environment Variables (.env file)

```env
# Swypt API Configuration
SWYPT_API_KEY=c99b840a303c3fe23f8496c480f922e8
SWYPT_API_SECRET=59361aaf105f3e36834a8d02644de06f9808382922e20494e60324feedd29536
SWYPT_API_URL=https://pool.swypt.io/api

# Base Network Configuration
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

# Swypt Recipient Addresses (Get these from Swypt)
SWYPT_BASE_RECIPIENT_ADDRESS=swypt_base_recipient_address_here
SWYPT_LISK_RECIPIENT_ADDRESS=swypt_lisk_recipient_address_here
SWYPT_CELO_RECIPIENT_ADDRESS=swypt_celo_recipient_address_here

# Project Configuration
PROJECT_NAME=stablecoin-mpesa-bridge
```

## What You Need to Replace

### 1. Wallet Private Keys (For Offramp Operations)
- `BASE_WALLET_PRIVATE_KEY`: Your Base network wallet private key
- `LISK_WALLET_PRIVATE_KEY`: Your Lisk network wallet private key  
- `CELO_WALLET_PRIVATE_KEY`: Your Celo network wallet private key

### 2. Recipient Addresses (For Offramp Operations)
- `BASE_RECIPIENT_ADDRESS`: Your Base network wallet address
- `LISK_RECIPIENT_ADDRESS`: Your Lisk network wallet address
- `CELO_RECIPIENT_ADDRESS`: Your Celo network wallet address

### 3. Swypt Recipient Addresses (Get from Swypt)
- `SWYPT_BASE_RECIPIENT_ADDRESS`: Swypt's Base network address
- `SWYPT_LISK_RECIPIENT_ADDRESS`: Swypt's Lisk network address
- `SWYPT_CELO_RECIPIENT_ADDRESS`: Swypt's Celo network address

## Features Available

### Onramp (M-Pesa to Crypto)
- Convert M-Pesa money to USDT/USDC on any of the three networks
- STK push integration for seamless M-Pesa payments
- Real-time status tracking

### Offramp (Crypto to M-Pesa)
- Convert USDT/USDC from any of the three networks to M-Pesa
- Network-specific wallet integration
- Automatic recipient address selection

### Quote System
- Get real-time exchange rates and fees
- Support for all three networks and tokens
- Pre-transfer cost estimation

## Testing Strategy

### 1. Testnet Testing (Recommended First)
- Test with small amounts on testnets before mainnet
- Verify all three networks work correctly
- Test both onramp and offramp flows

### 2. Mainnet Testing
- Start with very small amounts (e.g., 100 KES)
- Test one network at a time
- Monitor transaction status carefully

## Network-Specific Considerations

### Base Network
- Ethereum L2 with lower gas fees
- Fast transaction confirmation
- Good for high-volume transfers

### Lisk Network
- Lisk-specific features
- May have different transaction times
- Check Lisk documentation for specifics

### Celo Network
- Mobile-first design
- May have mobile-specific optimizations
- Check Celo documentation for specifics

## Support

For technical support:
- Swypt API: swypt.io@gmail.com
- Base Network: https://docs.base.org/
- Lisk Network: https://lisk.com/documentation
- Celo Network: https://docs.celo.org/

## Security Notes

- Never commit private keys to version control
- Use environment variables for all sensitive data
- Test thoroughly before production use
- Monitor transactions carefully
- Implement proper error handling 