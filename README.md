# Lisk to M-Pesa Bridge MVP

A simple MVP demonstrating the transfer of funds from Lisk blockchain to M-Pesa using Swypt APIs.

## Prerequisites

- Node.js (v14 or higher)
- A Lisk wallet with testnet tokens
- Swypt API credentials
- M-Pesa account

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   LISK_NODE_URL=https://testnet.lisk.com
   LISK_PASSPHRASE=your_passphrase_here
   LISK_RECIPIENT_ADDRESS=your_lisk_address_here
   SWYPT_API_KEY=your_swypt_api_key_here
   SWYPT_API_URL=https://api.swypt.io/v1
   ```

## Running the Application

1. Start the server:
   ```bash
   npm start
   ```
2. Open your browser and navigate to `http://localhost:3000`
3. Use the web interface to:
   - Enter the amount of Lisk tokens to transfer
   - Enter the M-Pesa phone number
   - Click "Transfer" to initiate the transaction

## Features

- Simple web interface for initiating transfers
- Lisk blockchain integration
- M-Pesa integration via Swypt APIs
- Real-time transaction status updates

## Security Notes

- Never commit your `.env` file
- Keep your Lisk passphrase secure
- Use testnet for development and testing
- Implement proper error handling and validation in production

## Disclaimer

This is an MVP for demonstration purposes. Additional security measures, error handling, and validation should be implemented before using in production. 