require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const axios = require('axios');
const { Transaction, User, initDatabase } = require('./models');
const { sequelize } = require('./models');

const app = express();
app.use(express.json());
app.use('/node_modules', express.static('node_modules'));

// Configure token contracts for the three initial launch chains
const tokenConfigs = {
    'USDT': {
        'base': {
            contractAddress: process.env.BASE_USDT_CONTRACT_ADDRESS || '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
            networkUrl: process.env.BASE_NETWORK_URL || 'https://mainnet.base.org',
            decimals: 6
        },
        'lisk': {
            contractAddress: process.env.LISK_USDT_CONTRACT_ADDRESS || '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
            networkUrl: process.env.LISK_NETWORK_URL || 'https://lisk.com/api',
            decimals: 6
        },
        'celo': {
            contractAddress: process.env.CELO_USDT_CONTRACT_ADDRESS || '0x88eeC49252c8cbc039DCdB394c0c2BA2f1637EA0',
            networkUrl: process.env.CELO_NETWORK_URL || 'https://forno.celo.org',
            decimals: 6
        }
    },
    'USDC': {
        'base': {
            contractAddress: process.env.BASE_USDC_CONTRACT_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            networkUrl: process.env.BASE_NETWORK_URL || 'https://mainnet.base.org',
            decimals: 6
        },
        'lisk': {
            contractAddress: process.env.LISK_USDC_CONTRACT_ADDRESS || '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
            networkUrl: process.env.LISK_NETWORK_URL || 'https://lisk.com/api',
            decimals: 6
        },
        'celo': {
            contractAddress: process.env.CELO_USDC_CONTRACT_ADDRESS || '0x765DE816845861e75A25fCA122bb6898B8B1282a',
            networkUrl: process.env.CELO_NETWORK_URL || 'https://forno.celo.org',
            decimals: 6
        }
    }
};

// Swypt API configuration
const SWYPT_API_BASE = process.env.SWYPT_API_URL || 'https://pool.swypt.io/api';
const SWYPT_API_KEY = process.env.SWYPT_API_KEY;
const SWYPT_API_SECRET = process.env.SWYPT_API_SECRET;

// Function to get wallet private key for specific network
function getWalletPrivateKey(network) {
    switch (network) {
        case 'base':
            return process.env.BASE_WALLET_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY;
        case 'lisk':
            return process.env.LISK_WALLET_PRIVATE_KEY;
        case 'celo':
            return process.env.CELO_WALLET_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY;
        default:
            return process.env.WALLET_PRIVATE_KEY;
    }
}

// Function to get Swypt recipient address for specific network
function getSwyptRecipientAddress(network) {
    switch (network) {
        case 'base':
            return process.env.SWYPT_BASE_RECIPIENT_ADDRESS || process.env.RECIPIENT_ADDRESS;
        case 'lisk':
            return process.env.SWYPT_LISK_RECIPIENT_ADDRESS;
        case 'celo':
            return process.env.SWYPT_CELO_RECIPIENT_ADDRESS || process.env.RECIPIENT_ADDRESS;
        default:
            return process.env.RECIPIENT_ADDRESS;
    }
}

// Function to get quote from Swypt API
async function getSwyptQuote(type, amount, fiatCurrency, cryptoCurrency, network) {
    try {
        const response = await axios.post(`${SWYPT_API_BASE}/swypt-quotes`, {
            type: type, // 'onramp' or 'offramp'
            amount: amount.toString(),
            fiatCurrency: fiatCurrency,
            cryptoCurrency: cryptoCurrency,
            network: network
        }, {
            headers: {
                'x-api-key': SWYPT_API_KEY,
                'x-api-secret': SWYPT_API_SECRET,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error getting Swypt quote:', error.response?.data || error.message);
        throw error;
    }
}

// Function to initiate STK push for onramp (M-Pesa to Crypto)
async function initiateSTKPush(amount, phoneNumber, orderID) {
    try {
        const response = await axios.post(`${SWYPT_API_BASE}/swypt-stk-push`, {
            amount: amount.toString(),
            phoneNumber: phoneNumber,
            orderID: orderID
        }, {
            headers: {
                'x-api-key': SWYPT_API_KEY,
                'x-api-secret': SWYPT_API_SECRET,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error initiating STK push:', error.response?.data || error.message);
        throw error;
    }
}

// Function to check deposit status
async function checkDepositStatus(orderID) {
    try {
        const response = await axios.get(`${SWYPT_API_BASE}/swypt-deposit-status/${orderID}`, {
            headers: {
                'x-api-key': SWYPT_API_KEY,
                'x-api-secret': SWYPT_API_SECRET
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error checking deposit status:', error.response?.data || error.message);
        throw error;
    }
}

// Function to process crypto transfer to user (for onramp)
async function processCryptoTransfer(chain, address, orderID, project) {
    try {
        const response = await axios.post(`${SWYPT_API_BASE}/swypt-deposit`, {
            chain: chain,
            address: address,
            orderID: orderID,
            project: project
        }, {
            headers: {
                'x-api-key': SWYPT_API_KEY,
                'x-api-secret': SWYPT_API_SECRET,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error processing crypto transfer:', error.response?.data || error.message);
        throw error;
    }
}

// Function to send stablecoin tokens (for offramp - Crypto to M-Pesa)
async function sendStableCoinTokens(tokenType, recipientAddress, amount, network = 'base') {
    try {
        const tokenConfig = tokenConfigs[tokenType];
        if (!tokenConfig) {
            throw new Error(`Unsupported token type: ${tokenType}`);
        }

        const networkConfig = tokenConfig[network];
        if (!networkConfig) {
            throw new Error(`Unsupported network: ${network} for token: ${tokenType}`);
        }

        const provider = new ethers.providers.JsonRpcProvider(networkConfig.networkUrl);
        const wallet = new ethers.Wallet(getWalletPrivateKey(network), provider);
        
        const abi = [
            "function transfer(address to, uint256 amount) returns (bool)",
            "function balanceOf(address account) view returns (uint256)"
        ];
        
        const contract = new ethers.Contract(networkConfig.contractAddress, abi, wallet);

        const amountInWei = ethers.utils.parseUnits(amount.toString(), networkConfig.decimals);
        const tx = await contract.transfer(recipientAddress, amountInWei);
        const receipt = await tx.wait();

        return {
            id: receipt.transactionHash,
            status: receipt.status === 1 ? 'completed' : 'failed'
        };
    } catch (error) {
        console.error(`Error sending ${tokenType} on ${network}:`, error);
        throw error;
    }
}

// Generate unique order ID
function generateOrderID() {
    return 'D-' + Math.random().toString(36).substr(2, 6).toUpperCase() + '-' + Math.random().toString(36).substr(2, 2).toUpperCase();
}

// API endpoint to register a user
app.post('/register', async (req, res) => {
    try {
        const { walletAddress, mpesaPhoneNumber } = req.body;

        // Validate required fields
        if (!walletAddress || !mpesaPhoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Both wallet address and M-Pesa phone number are required'
            });
        }

        // Validate wallet address format
        if (!ethers.utils.isAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        // Validate M-Pesa phone number format (Kenya format)
        if (!mpesaPhoneNumber.match(/^254[0-9]{9}$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid M-Pesa phone number format. Must start with 254 followed by 9 digits'
            });
        }

        // Check for existing user with same wallet address or M-Pesa number
        const existingUser = await User.findOne({
            where: {
                [sequelize.Op.or]: [
                    { walletAddress },
                    { mpesaPhoneNumber }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'A user with this wallet address or M-Pesa number already exists'
            });
        }

        // Create new user
        const user = await User.create({ walletAddress, mpesaPhoneNumber });
        console.log('User registered successfully:', user.toJSON());
        
        res.json({ success: true, user });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint to get transaction history
app.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint to initiate transfer
app.post('/transfer', async (req, res) => {
    try {
        const { tokenAmount, mpesaPhoneNumber, tokenType } = req.body;

        // Create transaction record
        const transaction = await Transaction.create({
            tokenAmount,
            mpesaPhoneNumber,
            tokenType,
            status: 'pending'
        });

        try {
            // First send stablecoin tokens
            const tokenResult = await sendStableCoinTokens(
                tokenType,
                getSwyptRecipientAddress(tokenType.split('://')[0]),
                tokenAmount
            );
            
            // Then send to M-Pesa
            const mpesaResult = await sendToMpesa(tokenAmount, mpesaPhoneNumber);

            // Update transaction record
            await transaction.update({
                tokenTransactionId: tokenResult.id,
                mpesaTransactionId: mpesaResult.id,
                status: 'completed'
            });

            res.json({
                success: true,
                tokenTransaction: tokenResult,
                mpesaTransaction: mpesaResult
            });
        } catch (error) {
            // Update transaction record with error
            await transaction.update({
                status: 'failed',
                error: error.message
            });
            throw error;
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API endpoint to get quote for transfer
app.post('/api/quote', async (req, res) => {
    try {
        const { type, amount, fiatCurrency, cryptoCurrency, network } = req.body;
        
        // Validate required fields
        if (!type || !amount || !fiatCurrency || !cryptoCurrency || !network) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: type, amount, fiatCurrency, cryptoCurrency, network'
            });
        }

        // Validate type
        if (!['onramp', 'offramp'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Type must be either "onramp" or "offramp"'
            });
        }

        const quote = await getSwyptQuote(type, amount, fiatCurrency, cryptoCurrency, network);
        
        res.json({
            success: true,
            quote: quote.data
        });
    } catch (error) {
        console.error('Quote error:', error);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});

// API endpoint for onramp (M-Pesa to Crypto)
app.post('/api/onramp', async (req, res) => {
    try {
        const { amount, phoneNumber, cryptoCurrency, network, walletAddress } = req.body;
        
        // Validate required fields
        if (!amount || !phoneNumber || !cryptoCurrency || !network || !walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: amount, phoneNumber, cryptoCurrency, network, walletAddress'
            });
        }

        // Validate phone number format
        if (!phoneNumber.match(/^254[0-9]{9}$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid M-Pesa phone number format. Must start with 254 followed by 9 digits'
            });
        }

        // Validate wallet address
        if (!ethers.utils.isAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        // Generate order ID
        const orderID = generateOrderID();

        // Create transaction record
        const transaction = await Transaction.create({
            tokenAmount: amount,
            mpesaPhoneNumber: phoneNumber,
            tokenType: cryptoCurrency,
            status: 'pending',
            orderID: orderID,
            transferType: 'onramp',
            walletAddress: walletAddress,
            network: network
        });

        try {
            // Initiate STK push
            const stkResult = await initiateSTKPush(amount, phoneNumber, orderID);
            
            // Update transaction with STK result
            await transaction.update({
                mpesaTransactionId: stkResult.data?.mpesaReceipt || stkResult.id,
                status: 'stk_initiated'
            });

            res.json({
                success: true,
                orderID: orderID,
                transaction: transaction,
                stkResult: stkResult
            });
        } catch (error) {
            // Update transaction with error
            await transaction.update({
                status: 'failed',
                error: error.message
            });
            throw error;
        }
    } catch (error) {
        console.error('Onramp error:', error);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});

// API endpoint to check onramp status
app.get('/api/onramp/status/:orderID', async (req, res) => {
    try {
        const { orderID } = req.params;
        
        // Check deposit status
        const statusResult = await checkDepositStatus(orderID);
        
        // Get transaction from database
        const transaction = await Transaction.findOne({
            where: { orderID: orderID }
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            status: statusResult,
            transaction: transaction
        });
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});

// API endpoint to process crypto transfer after successful M-Pesa payment
app.post('/api/onramp/process', async (req, res) => {
    try {
        const { orderID, walletAddress, network, cryptoCurrency } = req.body;
        
        // Validate required fields
        if (!orderID || !walletAddress || !network) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: orderID, walletAddress, network'
            });
        }

        // Get transaction from database
        const transaction = await Transaction.findOne({
            where: { orderID: orderID }
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: 'Transaction not found'
            });
        }

        // Check if transaction is ready for processing
        if (transaction.status !== 'stk_initiated') {
            return res.status(400).json({
                success: false,
                error: 'Transaction is not ready for processing'
            });
        }

        try {
            // Process crypto transfer
            const cryptoResult = await processCryptoTransfer(
                network,
                walletAddress,
                orderID,
                process.env.PROJECT_NAME || 'stablecoin-mpesa-bridge'
            );
            
            // Update transaction
            await transaction.update({
                tokenTransactionId: cryptoResult.hash,
                status: 'completed'
            });

            res.json({
                success: true,
                cryptoResult: cryptoResult,
                transaction: transaction
            });
        } catch (error) {
            // Update transaction with error
            await transaction.update({
                status: 'failed',
                error: error.message
            });
            throw error;
        }
    } catch (error) {
        console.error('Process crypto error:', error);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});

// API endpoint for offramp (Crypto to M-Pesa)
app.post('/api/offramp', async (req, res) => {
    try {
        const { amount, phoneNumber, cryptoCurrency, network, walletAddress } = req.body;
        
        // Validate required fields
        if (!amount || !phoneNumber || !cryptoCurrency || !network || !walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: amount, phoneNumber, cryptoCurrency, network, walletAddress'
            });
        }

        // Validate phone number format
        if (!phoneNumber.match(/^254[0-9]{9}$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid M-Pesa phone number format. Must start with 254 followed by 9 digits'
            });
        }

        // Validate wallet address
        if (!ethers.utils.isAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }

        // Generate order ID
        const orderID = generateOrderID();

        // Create transaction record
        const transaction = await Transaction.create({
            tokenAmount: amount,
            mpesaPhoneNumber: phoneNumber,
            tokenType: cryptoCurrency,
            status: 'pending',
            orderID: orderID,
            transferType: 'offramp',
            walletAddress: walletAddress,
            network: network
        });

        try {
            // First send stablecoin tokens to Swypt's address
            const tokenResult = await sendStableCoinTokens(
                cryptoCurrency,
                getSwyptRecipientAddress(network),
                amount,
                network
            );
            
            // Update transaction with token result
            await transaction.update({
                tokenTransactionId: tokenResult.id,
                status: 'tokens_sent'
            });

            // TODO: Implement Swypt's offramp API call here
            // This would typically involve calling Swypt's offramp endpoint
            // For now, we'll simulate the M-Pesa transfer
            
            // Simulate M-Pesa transfer (replace with actual Swypt API call)
            const mpesaResult = {
                id: `MPESA-${Date.now()}`,
                status: 'completed',
                amount: amount,
                phoneNumber: phoneNumber
            };

            // Update transaction
            await transaction.update({
                mpesaTransactionId: mpesaResult.id,
                status: 'completed'
            });

            res.json({
                success: true,
                orderID: orderID,
                transaction: transaction,
                tokenResult: tokenResult,
                mpesaResult: mpesaResult
            });
        } catch (error) {
            // Update transaction with error
            await transaction.update({
                status: 'failed',
                error: error.message
            });
            throw error;
        }
    } catch (error) {
        console.error('Offramp error:', error);
        res.status(500).json({
            success: false,
            error: error.response?.data?.message || error.message
        });
    }
});

// Simple frontend
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Base Wallet to M-Pesa Bridge</title>
                <script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js" crossorigin></script>
                <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js" crossorigin></script>
                <script src="/node_modules/swypt-checkout/dist/swypt-checkout.umd.js"></script>
                <link rel="stylesheet" href="/node_modules/swypt-checkout/dist/styles.css">
                <style>
                    :root {
                        --primary-color: #044639;
                        --secondary-color: #FF4040;
                        --background-color: #f5f5f5;
                        --card-background: #ffffff;
                        --text-color: #333333;
                        --border-radius: 8px;
                        --spacing: 20px;
                    }

                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        max-width: 1400px;
                        margin: 0 auto;
                        padding: var(--spacing);
                        background-color: var(--background-color);
                        color: var(--text-color);
                    }

                    .container {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: var(--spacing);
                        margin-top: var(--spacing);
                    }

                    .full-width {
                        grid-column: 1 / -1;
                    }

                    .card {
                        background: var(--card-background);
                        padding: var(--spacing);
                        border-radius: var(--border-radius);
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }

                    h1 {
                        text-align: center;
                        color: var(--primary-color);
                        margin-bottom: 30px;
                    }

                    h2 {
                        color: var(--primary-color);
                        margin-bottom: 20px;
                        border-bottom: 2px solid var(--primary-color);
                        padding-bottom: 10px;
                    }

                    .form-group {
                        margin-bottom: 20px;
                    }

                    label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 600;
                        color: var(--primary-color);
                    }

                    input, select {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ddd;
                        border-radius: var(--border-radius);
                        font-size: 16px;
                        transition: border-color 0.3s;
                        background-color: white;
                    }

                    input:focus, select:focus {
                        border-color: var(--primary-color);
                        outline: none;
                    }

                    button {
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
                        color: white;
                        border: none;
                        border-radius: var(--border-radius);
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                        transition: opacity 0.3s;
                        margin-bottom: 10px;
                    }

                    button:hover {
                        opacity: 0.9;
                    }

                    button:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .quote-info {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: var(--border-radius);
                        margin-bottom: 20px;
                        border-left: 4px solid var(--primary-color);
                    }

                    .transaction-list {
                        margin-top: var(--spacing);
                    }

                    .transaction-item {
                        background: var(--card-background);
                        padding: 15px;
                        border-radius: var(--border-radius);
                        margin-bottom: 10px;
                        border-left: 4px solid var(--primary-color);
                    }

                    .transaction-item p {
                        margin: 5px 0;
                    }

                    .status-badge {
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                    }

                    .status-pending { background: #fff3cd; color: #856404; }
                    .status-stk_initiated { background: #cce5ff; color: #004085; }
                    .status-tokens_sent { background: #d1ecf1; color: #0c5460; }
                    .status-completed { background: #d4edda; color: #155724; }
                    .status-failed { background: #f8d7da; color: #721c24; }

                    #result {
                        margin-top: 20px;
                        padding: 15px;
                        border-radius: var(--border-radius);
                        text-align: center;
                    }

                    .success { background: #d4edda; color: #155724; }
                    .error { background: #f8d7da; color: #721c24; }
                    .info { background: #d1ecf1; color: #0c5460; }
                    
                    .loading-spinner {
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border: 3px solid rgba(255,255,255,.3);
                        border-radius: 50%;
                        border-top-color: #fff;
                        animation: spin 1s ease-in-out infinite;
                        margin-right: 10px;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    .tabs {
                        display: flex;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #ddd;
                    }

                    .tab {
                        padding: 12px 24px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                        color: #666;
                        border-bottom: 3px solid transparent;
                        margin-bottom: -2px;
                    }

                    .tab.active {
                        color: var(--primary-color);
                        border-bottom-color: var(--primary-color);
                    }

                    .tab-content {
                        display: none;
                    }

                    .tab-content.active {
                        display: block;
                    }
                </style>
            </head>
            <body>
                <h1>Base Wallet to M-Pesa Bridge</h1>
                
                <div class="container">
                    <div class="card full-width">
                        <div class="tabs">
                            <button class="tab active" onclick="showTab('quote')">Get Quote</button>
                            <button class="tab" onclick="showTab('onramp')">M-Pesa to Crypto (Onramp)</button>
                            <button class="tab" onclick="showTab('offramp')">Crypto to M-Pesa (Offramp)</button>
                            <button class="tab" onclick="showTab('transactions')">Transaction History</button>
                        </div>

                        <!-- Quote Tab -->
                        <div id="quote" class="tab-content active">
                            <h2>Get Transfer Quote</h2>
                            <form id="quoteForm">
                                <div class="form-group">
                                    <label for="quoteType">Transfer Type:</label>
                                    <select id="quoteType" required>
                                        <option value="">Select type</option>
                                        <option value="onramp">M-Pesa to Crypto (Onramp)</option>
                                        <option value="offramp">Crypto to M-Pesa (Offramp)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="quoteAmount">Amount:</label>
                                    <input type="number" id="quoteAmount" required placeholder="Enter amount">
                                </div>
                                <div class="form-group">
                                    <label for="quoteFiatCurrency">Fiat Currency:</label>
                                    <select id="quoteFiatCurrency" required>
                                        <option value="KES">KES (Kenyan Shilling)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="quoteCryptoCurrency">Crypto Currency:</label>
                                    <select id="quoteCryptoCurrency" required>
                                        <option value="USDT">USDT</option>
                                        <option value="USDC">USDC</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="quoteNetwork">Network:</label>
                                    <select id="quoteNetwork" required>
                                        <option value="base">Base</option>
                                        <option value="lisk">Lisk</option>
                                        <option value="celo">Celo</option>
                                    </select>
                                </div>
                                <button type="submit">Get Quote</button>
                            </form>
                            <div id="quoteResult"></div>
                        </div>

                        <!-- Onramp Tab -->
                        <div id="onramp" class="tab-content">
                            <h2>M-Pesa to Crypto Transfer (Onramp)</h2>
                            <form id="onrampForm">
                                <div class="form-group">
                                    <label for="onrampAmount">Amount (KES):</label>
                                    <input type="number" id="onrampAmount" required placeholder="Enter amount in KES">
                                </div>
                                <div class="form-group">
                                    <label for="onrampPhone">M-Pesa Phone Number:</label>
                                    <input type="text" id="onrampPhone" required placeholder="254XXXXXXXXX">
                                </div>
                                <div class="form-group">
                                    <label for="onrampCrypto">Crypto Currency:</label>
                                    <select id="onrampCrypto" required>
                                        <option value="USDT">USDT</option>
                                        <option value="USDC">USDC</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="onrampNetwork">Network:</label>
                                    <select id="onrampNetwork" required>
                                        <option value="base">Base</option>
                                        <option value="lisk">Lisk</option>
                                        <option value="celo">Celo</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="onrampWallet">Wallet Address:</label>
                                    <input type="text" id="onrampWallet" required placeholder="Enter your wallet address">
                                </div>
                                <button type="submit">Initiate Transfer</button>
                            </form>
                            <div id="onrampResult"></div>
                        </div>

                        <!-- Offramp Tab -->
                        <div id="offramp" class="tab-content">
                            <h2>Crypto to M-Pesa Transfer (Offramp)</h2>
                            <form id="offrampForm">
                                <div class="form-group">
                                    <label for="offrampAmount">Amount (Crypto):</label>
                                    <input type="number" id="offrampAmount" required placeholder="Enter crypto amount">
                                </div>
                                <div class="form-group">
                                    <label for="offrampPhone">M-Pesa Phone Number:</label>
                                    <input type="text" id="offrampPhone" required placeholder="254XXXXXXXXX">
                                </div>
                                <div class="form-group">
                                    <label for="offrampCrypto">Crypto Currency:</label>
                                    <select id="offrampCrypto" required>
                                        <option value="USDT">USDT</option>
                                        <option value="USDC">USDC</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="offrampNetwork">Network:</label>
                                    <select id="offrampNetwork" required>
                                        <option value="base">Base</option>
                                        <option value="lisk">Lisk</option>
                                        <option value="celo">Celo</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="offrampWallet">Wallet Address:</label>
                                    <input type="text" id="offrampWallet" required placeholder="Enter your wallet address">
                                </div>
                                <button type="submit">Initiate Transfer</button>
                            </form>
                            <div id="offrampResult"></div>
                        </div>

                        <!-- Transactions Tab -->
                        <div id="transactions" class="tab-content">
                            <h2>Transaction History</h2>
                            <button onclick="loadTransactions()">Refresh Transactions</button>
                            <div id="transactionsList"></div>
                        </div>
                    </div>
                </div>

                <script>
                    function showTab(tabName) {
                        // Hide all tab contents
                        document.querySelectorAll('.tab-content').forEach(content => {
                            content.classList.remove('active');
                        });
                        
                        // Remove active class from all tabs
                        document.querySelectorAll('.tab').forEach(tab => {
                            tab.classList.remove('active');
                        });
                        
                        // Show selected tab content
                        document.getElementById(tabName).classList.add('active');
                        
                        // Add active class to clicked tab
                        event.target.classList.add('active');
                    }

                    // Quote Form
                    document.getElementById('quoteForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const resultDiv = document.getElementById('quoteResult');
                        resultDiv.innerHTML = '<div class="info">Getting quote...</div>';
                        
                        try {
                            const response = await fetch('/api/quote', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    type: document.getElementById('quoteType').value,
                                    amount: document.getElementById('quoteAmount').value,
                                    fiatCurrency: document.getElementById('quoteFiatCurrency').value,
                                    cryptoCurrency: document.getElementById('quoteCryptoCurrency').value,
                                    network: document.getElementById('quoteNetwork').value
                                })
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                const quote = data.quote;
                                resultDiv.innerHTML = \`
                                    <div class="quote-info">
                                        <h3>Quote Details</h3>
                                        <p><strong>Input Amount:</strong> \${quote.inputAmount} \${quote.inputCurrency}</p>
                                        <p><strong>Output Amount:</strong> \${quote.outputAmount} \${quote.outputCurrency}</p>
                                        <p><strong>Exchange Rate:</strong> \${quote.exchangeRate}</p>
                                        <p><strong>Fee:</strong> \${quote.fee.amount} \${quote.fee.currency}</p>
                                        <p><strong>Limits:</strong> Min: \${quote.limits.min} Max: \${quote.limits.max} \${quote.limits.currency}</p>
                                    </div>
                                \`;
                            } else {
                                resultDiv.innerHTML = \`<div class="error">\${data.error}</div>\`;
                            }
                        } catch (error) {
                            resultDiv.innerHTML = \`<div class="error">Error: \${error.message}</div>\`;
                        }
                    });

                    // Onramp Form
                    document.getElementById('onrampForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const resultDiv = document.getElementById('onrampResult');
                        resultDiv.innerHTML = '<div class="info">Initiating transfer...</div>';
                        
                        try {
                            const response = await fetch('/api/onramp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    amount: document.getElementById('onrampAmount').value,
                                    phoneNumber: document.getElementById('onrampPhone').value,
                                    cryptoCurrency: document.getElementById('onrampCrypto').value,
                                    network: document.getElementById('onrampNetwork').value,
                                    walletAddress: document.getElementById('onrampWallet').value
                                })
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                resultDiv.innerHTML = \`
                                    <div class="success">
                                        <h3>Transfer Initiated Successfully!</h3>
                                        <p><strong>Order ID:</strong> \${data.orderID}</p>
                                        <p><strong>Status:</strong> STK Push initiated</p>
                                        <p>Please check your phone for the M-Pesa prompt and complete the payment.</p>
                                        <button onclick="checkOnrampStatus('\${data.orderID}')">Check Status</button>
                                    </div>
                                \`;
                            } else {
                                resultDiv.innerHTML = \`<div class="error">\${data.error}</div>\`;
                            }
                        } catch (error) {
                            resultDiv.innerHTML = \`<div class="error">Error: \${error.message}</div>\`;
                        }
                    });

                    // Offramp Form
                    document.getElementById('offrampForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const resultDiv = document.getElementById('offrampResult');
                        resultDiv.innerHTML = '<div class="info">Initiating transfer...</div>';
                        
                        try {
                            const response = await fetch('/api/offramp', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    amount: document.getElementById('offrampAmount').value,
                                    phoneNumber: document.getElementById('offrampPhone').value,
                                    cryptoCurrency: document.getElementById('offrampCrypto').value,
                                    network: document.getElementById('offrampNetwork').value,
                                    walletAddress: document.getElementById('offrampWallet').value
                                })
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                resultDiv.innerHTML = \`
                                    <div class="success">
                                        <h3>Transfer Initiated Successfully!</h3>
                                        <p><strong>Order ID:</strong> \${data.orderID}</p>
                                        <p><strong>Status:</strong> \${data.transaction.status}</p>
                                        <p><strong>Token Transaction:</strong> \${data.tokenResult.id}</p>
                                        <p>Your crypto has been sent and M-Pesa transfer is being processed.</p>
                                    </div>
                                \`;
                            } else {
                                resultDiv.innerHTML = \`<div class="error">\${data.error}</div>\`;
                            }
                        } catch (error) {
                            resultDiv.innerHTML = \`<div class="error">Error: \${error.message}</div>\`;
                        }
                    });

                    async function checkOnrampStatus(orderID) {
                        try {
                            const response = await fetch(\`/api/onramp/status/\${orderID}\`);
                            const data = await response.json();
                            
                            if (data.success) {
                                const status = data.status;
                                const transaction = data.transaction;
                                
                                let statusHtml = \`
                                    <div class="info">
                                        <h3>Transaction Status</h3>
                                        <p><strong>Order ID:</strong> \${orderID}</p>
                                        <p><strong>Status:</strong> \${status.status}</p>
                                        <p><strong>Amount:</strong> \${transaction.tokenAmount} \${transaction.tokenType}</p>
                                        <p><strong>Phone:</strong> \${transaction.mpesaPhoneNumber}</p>
                                \`;
                                
                                if (status.status === 'SUCCESS') {
                                    statusHtml += \`
                                        <p><strong>M-Pesa Receipt:</strong> \${status.details.mpesaReceipt}</p>
                                        <button onclick="processCryptoTransfer('\${orderID}', '\${transaction.walletAddress}', '\${transaction.network}', '\${transaction.tokenType}')">Process Crypto Transfer</button>
                                    \`;
                                }
                                
                                statusHtml += '</div>';
                                document.getElementById('onrampResult').innerHTML = statusHtml;
                            } else {
                                document.getElementById('onrampResult').innerHTML = \`<div class="error">\${data.error}</div>\`;
                            }
                        } catch (error) {
                            document.getElementById('onrampResult').innerHTML = \`<div class="error">Error: \${error.message}</div>\`;
                        }
                    }

                    async function processCryptoTransfer(orderID, walletAddress, network, cryptoCurrency) {
                        try {
                            const response = await fetch('/api/onramp/process', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    orderID: orderID,
                                    walletAddress: walletAddress,
                                    network: network,
                                    cryptoCurrency: cryptoCurrency
                                })
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                                document.getElementById('onrampResult').innerHTML = \`
                                    <div class="success">
                                        <h3>Crypto Transfer Completed!</h3>
                                        <p><strong>Transaction Hash:</strong> \${data.cryptoResult.hash}</p>
                                        <p><strong>Status:</strong> \${data.transaction.status}</p>
                                        <p>Your crypto has been sent to your wallet successfully!</p>
                                    </div>
                                \`;
                            } else {
                                document.getElementById('onrampResult').innerHTML = \`<div class="error">\${data.error}</div>\`;
                            }
                        } catch (error) {
                            document.getElementById('onrampResult').innerHTML = \`<div class="error">Error: \${error.message}</div>\`;
                        }
                    }

                    async function loadTransactions() {
                        try {
                            const response = await fetch('/transactions');
                            const data = await response.json();
                            
                            if (data.success) {
                                const transactionsList = document.getElementById('transactionsList');
                                if (data.transactions.length === 0) {
                                    transactionsList.innerHTML = '<div class="info">No transactions found.</div>';
                                    return;
                                }
                                
                                let html = '';
                                data.transactions.forEach(tx => {
                                    html += \`
                                        <div class="transaction-item">
                                            <p><strong>Order ID:</strong> \${tx.orderID || 'N/A'}</p>
                                            <p><strong>Type:</strong> \${tx.transferType || 'Legacy'}</p>
                                            <p><strong>Amount:</strong> \${tx.tokenAmount} \${tx.tokenType}</p>
                                            <p><strong>Phone:</strong> \${tx.mpesaPhoneNumber}</p>
                                            <p><strong>Status:</strong> <span class="status-badge status-\${tx.status}">\${tx.status}</span></p>
                                            <p><strong>Created:</strong> \${new Date(tx.createdAt).toLocaleString()}</p>
                                            \${tx.error ? \`<p><strong>Error:</strong> \${tx.error}</p>\` : ''}
                                        </div>
                                    \`;
                                });
                                transactionsList.innerHTML = html;
                            } else {
                                document.getElementById('transactionsList').innerHTML = \`<div class="error">\${data.error}</div>\`;
                            }
                        } catch (error) {
                            document.getElementById('transactionsList').innerHTML = \`<div class="error">Error: \${error.message}</div>\`;
                        }
                    }

                    // Load transactions on page load
                    loadTransactions();
                </script>
            </body>
        </html>
    `);
});

// Start the server after initializing database
(async () => {
    try {
        // Initialize database
        await initDatabase();
        
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
})(); 