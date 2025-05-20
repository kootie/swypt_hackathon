require('dotenv').config();
const express = require('express');
const { cryptography, apiClient } = require('@liskhq/lisk-client');
const axios = require('axios');
const { Transaction, User, initDatabase } = require('./models');
const { sequelize } = require('./models');

const app = express();
app.use(express.json());
app.use('/node_modules', express.static('node_modules'));

let client; // Will hold the Lisk WS client

// Configure Lisk client with correct network settings
const liskConfig = {
    network: {
        name: 'Lisk',
        chainID: '1135',
        rpcEndpoint: 'https://rpc.api.lisk.com'
    }
};

// Function to send Lisk tokens
async function sendLiskTokens(recipientAddress, amount) {
    try {
        const transaction = {
            moduleID: 2,
            assetID: 0,
            fee: BigInt(1000000),
            asset: {
                amount: BigInt(amount),
                recipientAddress: cryptography.getAddressFromLisk32Address(recipientAddress),
                data: 'Transfer to M-Pesa'
            }
        };

        // Create and sign transaction
        const response = await axios.post(`${liskConfig.network.rpcEndpoint}/api/v3/transactions`, {
            transaction: transaction
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error sending Lisk tokens:', error);
        throw error;
    }
}

// Function to send to M-Pesa via Swypt
async function sendToMpesa(amount, phoneNumber) {
    try {
        const response = await axios.post(
            `${process.env.SWYPT_API_URL}/mpesa/transfer`,
            {
                amount,
                phoneNumber,
                currency: 'KES'
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.SWYPT_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error sending to M-Pesa:', error);
        throw error;
    }
}

// Function to send stable coins
async function sendStableCoinTokens(tokenType, recipientAddress, amount) {
    try {
        // Configure token contracts based on type
        const tokenConfigs = {
            'USDT': {
                contractAddress: process.env.USDT_CONTRACT_ADDRESS,
                decimals: 6
            },
            'USDC': {
                contractAddress: process.env.USDC_CONTRACT_ADDRESS,
                decimals: 6
            },
            'CELO': {
                contractAddress: process.env.CELO_CONTRACT_ADDRESS,
                decimals: 18
            }
        };

        const config = tokenConfigs[tokenType];
        if (!config) {
            throw new Error(`Unsupported token type: ${tokenType}`);
        }

        // Create token transfer transaction
        const transaction = {
            to: config.contractAddress,
            data: {
                method: 'transfer',
                params: {
                    to: recipientAddress,
                    value: BigInt(amount * Math.pow(10, config.decimals))
                }
            }
        };

        // Send transaction to the appropriate network
        const response = await axios.post(
            `${process.env.TOKEN_NETWORK_URL}/api/v1/transactions`,
            {
                transaction: transaction
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.TOKEN_NETWORK_API_KEY}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error(`Error sending ${tokenType}:`, error);
        throw error;
    }
}

// API endpoint to register a user
app.post('/register', async (req, res) => {
    try {
        const { liskAddress, mpesaPhoneNumber } = req.body;

        // Validate required fields
        if (!liskAddress || !mpesaPhoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Both Lisk address and M-Pesa phone number are required'
            });
        }

        // Validate Lisk address format (basic validation)
        if (!liskAddress.match(/^lsk[a-zA-Z0-9]{38}$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Lisk address format'
            });
        }

        // Validate M-Pesa phone number format (Kenya format)
        if (!mpesaPhoneNumber.match(/^254[0-9]{9}$/)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid M-Pesa phone number format. Must start with 254 followed by 9 digits'
            });
        }

        // Check for existing user with same Lisk address or M-Pesa number
        const existingUser = await User.findOne({
            where: {
                [sequelize.Op.or]: [
                    { liskAddress },
                    { mpesaPhoneNumber }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'A user with this Lisk address or M-Pesa number already exists'
            });
        }

        // Create new user
        const user = await User.create({ liskAddress, mpesaPhoneNumber });
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
        const { liskAmount, mpesaPhoneNumber, paymentType } = req.body;

        // Create transaction record
        const transaction = await Transaction.create({
            liskAmount,
            mpesaPhoneNumber,
            paymentType,
            status: 'pending'
        });

        try {
            // First send tokens based on payment type
            let tokenResult;
            switch(paymentType) {
                case 'LSK':
                    tokenResult = await sendLiskTokens(process.env.LISK_RECIPIENT_ADDRESS, liskAmount);
                    break;
                case 'USDT':
                case 'USDC':
                case 'CELO':
                    // Implement other token transfers here
                    tokenResult = await sendStableCoinTokens(paymentType, process.env.RECIPIENT_ADDRESS, liskAmount);
                    break;
                default:
                    throw new Error('Invalid payment type');
            }
            
            // Then send to M-Pesa
            const mpesaResult = await sendToMpesa(liskAmount, mpesaPhoneNumber);

            // Update transaction record
            await transaction.update({
                liskTransactionId: tokenResult.id,
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

// Simple frontend
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Lisk to M-Pesa Transfer</title>
                <!-- Load React first -->
                <script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js" crossorigin></script>
                <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js" crossorigin></script>
                <!-- Load Swypt Checkout SDK -->
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
                        max-width: 1200px;
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

                    input {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ddd;
                        border-radius: var(--border-radius);
                        font-size: 16px;
                        transition: border-color 0.3s;
                    }

                    input:focus {
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
                    }

                    button:hover {
                        opacity: 0.9;
                    }

                    .conversion-info {
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
                    select {
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #ddd;
                        border-radius: var(--border-radius);
                        font-size: 16px;
                        transition: border-color 0.3s;
                        background-color: white;
                        cursor: pointer;
                    }

                    select:focus {
                        border-color: var(--primary-color);
                        outline: none;
                    }

                    .payment-option {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px;
                    }

                    .payment-option img {
                        width: 24px;
                        height: 24px;
                        object-fit: contain;
                    }
                </style>
            </head>
            <body>
                <h1>Lisk to M-Pesa Transfer</h1>
                
                <div class="container">
                    <div class="card">
                        <h2>Register Your Account</h2>
                        <form id="registerForm">
                            <div class="form-group">
                                <label for="liskAddress">Lisk Address:</label>
                                <input type="text" id="liskAddress" required placeholder="Enter your Lisk address">
                            </div>
                            <div class="form-group">
                                <label for="mpesaPhone">M-Pesa Phone Number:</label>
                                <input type="tel" id="mpesaPhone" required placeholder="Enter your M-Pesa number">
                            </div>
                            <button type="submit">Register Account</button>
                        </form>
                    </div>

                    <div class="card">
                        <h2>Make a Transfer</h2>
                        <form id="transferForm">
                            <div class="form-group">
                                <label for="paymentType">Payment Method:</label>
                                <select id="paymentType" required>
                                    <option value="LSK">Lisk (LSK)</option>
                                    <option value="USDT">Tether (USDT)</option>
                                    <option value="USDC">USD Coin (USDC)</option>
                                    <option value="CELO">Celo (CELO)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="liskAmount">Amount:</label>
                                <input type="number" id="liskAmount" required min="0.00000001" step="0.00000001" placeholder="Enter amount">
                                <div class="conversion-info">
                                    <p>Estimated KES: <span id="kesAmount">0.00</span> KES</p>
                                    <p><small>Exchange rate: 1 LSK ≈ 100 KES</small></p>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="mpesaPhone">M-Pesa Phone Number:</label>
                                <input type="tel" id="mpesaPhone" required placeholder="Enter recipient's M-Pesa number">
                            </div>
                            <button type="button" onclick="handlePayment()">Proceed to Payment</button>
                        </form>
                    </div>
                </div>

                <div id="result"></div>

                <div class="card">
                    <h2>Transaction History</h2>
                    <div id="transactionList" class="transaction-list"></div>
                </div>

                <div id="depositModal"></div>

                <script>
                    // Initialize Swypt Checkout
                    let DepositModal;
                    let isSwyptLoaded = false;
                    let initializationAttempts = 0;
                    const MAX_ATTEMPTS = 3;

                    // Function to show loading state
                    function showLoading(element, message) {
                        element.innerHTML = '<div class="status-pending"><span class="loading-spinner"></span>' + message + '</div>';
                    }

                    // Function to initialize Swypt
                    function initializeSwypt() {
                        console.log('Initializing Swypt...');
                        console.log('React available:', !!window.React);
                        console.log('ReactDOM available:', !!window.ReactDOM);
                        console.log('SwyptCheckout available:', !!window.SwyptCheckout);
                        
                        try {
                            if (!window.React) {
                                throw new Error('React not loaded');
                            }
                            if (!window.ReactDOM) {
                                throw new Error('ReactDOM not loaded');
                            }
                            if (!window.SwyptCheckout) {
                                throw new Error('SwyptCheckout not loaded');
                            }

                            // Get the DepositModal component directly from the global SwyptCheckout object
                            const { DepositModal: Modal } = window.SwyptCheckout;
                            if (!Modal) {
                                throw new Error('DepositModal component not found in SwyptCheckout');
                            }

                            DepositModal = Modal;
                            isSwyptLoaded = true;
                            console.log('Swypt Checkout initialized successfully');

                            // Enable the payment button
                            const paymentButton = document.getElementById('openDepositModal');
                            if (paymentButton) {
                                paymentButton.disabled = false;
                                paymentButton.style.opacity = '1';
                            }
                        } catch (error) {
                            console.error('Failed to initialize Swypt:', error);
                            isSwyptLoaded = false;
                            throw error;
                        }
                    }

                    // Function to retry initialization
                    function retryInitialization() {
                        if (initializationAttempts >= MAX_ATTEMPTS) {
                            console.error('Max initialization attempts reached');
                            return;
                        }

                        initializationAttempts++;
                        console.log('Retry attempt', initializationAttempts);
                        
                        try {
                            initializeSwypt();
                        } catch (error) {
                            console.error('Initialization attempt failed:', error);
                            setTimeout(retryInitialization, 1000);
                        }
                    }

                    // Wait for all scripts to load
                    window.addEventListener('load', function() {
                        console.log('Window loaded, initializing Swypt...');
                        retryInitialization();
                    });

                    // Lisk to KES conversion
                    const LSK_TO_KES_RATE = 100;
                    document.getElementById('liskAmount').addEventListener('input', function(e) {
                        const liskAmount = parseFloat(e.target.value) || 0;
                        const kesAmount = liskAmount * LSK_TO_KES_RATE;
                        document.getElementById('kesAmount').textContent = kesAmount.toFixed(2);
                    });

                    // Register form handler
                    document.getElementById('registerForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const resultDiv = document.getElementById('result');
                        showLoading(resultDiv, 'Registering...');

                        try {
                            console.log('Submitting registration form...');
                            const response = await fetch('/register', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    liskAddress: document.getElementById('liskAddress').value,
                                    mpesaPhoneNumber: document.getElementById('mpesaPhone').value
                                })
                            });
                            const data = await response.json();
                            console.log('Registration response:', data);
                            
                            resultDiv.innerHTML = data.success 
                                ? '<div class="success">Registration successful!</div>'
                                : '<div class="error">Registration failed: ' + data.error + '</div>';
                        } catch (error) {
                            console.error('Registration error:', error);
                            resultDiv.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
                        }
                    });

                    // Payment button handler
                    function handlePayment() {
                        console.log('Payment button clicked');
                        console.log('Swypt loaded:', isSwyptLoaded);
                        console.log('DepositModal available:', !!DepositModal);
                        
                        const resultDiv = document.getElementById('result');
                        
                        if (!isSwyptLoaded || !DepositModal) {
                            showLoading(resultDiv, 'Loading payment system...');
                            try {
                                initializeSwypt();
                                if (!isSwyptLoaded) {
                                    throw new Error('Failed to initialize payment system');
                                }
                            } catch (error) {
                                console.error('Payment system initialization error:', error);
                                resultDiv.innerHTML = '<div class="error">Error loading payment system: ' + error.message + '</div>';
                                return;
                            }
                        }
                        
                        // Get form values
                        const amount = document.getElementById('liskAmount').value;
                        const mpesaPhone = document.getElementById('mpesaPhone').value;
                        const paymentType = document.getElementById('paymentType').value;
                        
                        if (!amount || !mpesaPhone || !paymentType) {
                            resultDiv.innerHTML = '<div class="error">Please fill in all required fields</div>';
                            return;
                        }

                        try {
                            // Prevent body scrolling
                            document.body.style.overflow = 'hidden';

                            // Create modal container with overlay
                            const modalContainer = document.createElement('div');
                            modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center';
                            
                            // Create backdrop
                            const backdrop = document.createElement('div');
                            backdrop.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm';
                            backdrop.id = 'modalBackdrop';
                            modalContainer.appendChild(backdrop);
                            
                            // Create content container
                            const contentContainer = document.createElement('div');
                            contentContainer.className = 'relative z-50';
                            contentContainer.id = 'modalContent';
                            modalContainer.appendChild(contentContainer);
                            
                            document.body.appendChild(modalContainer);

                            // Add click handler for backdrop
                            document.getElementById('modalBackdrop').addEventListener('click', () => {
                                handleCloseModal();
                            });

                            console.log('Rendering DepositModal...');
                            // Render modal
                            ReactDOM.render(
                                React.createElement(DepositModal, {
                                    isOpen: true,
                                    onClose: handleCloseModal,
                                    headerBackgroundColor: "linear-gradient(to right, #044639, #FF4040)",
                                    businessName: "Lisk to M-Pesa Bridge",
                                    merchantName: "Lisk Bridge",
                                    merchantAddress: "lsk24cd35u4jdq8szo3pnsqe5dsxwrnazyqqqg5eu",
                                    amount: parseFloat(amount),
                                    onSuccess: async (result) => {
                                        console.log('Payment successful:', result);
                                        try {
                                            const response = await fetch('/transfer', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    liskAmount: amount,
                                                    mpesaPhoneNumber: mpesaPhone,
                                                    paymentType: paymentType
                                                })
                                            });
                                            const data = await response.json();
                                            console.log('Transfer response:', data);
                                            
                                            resultDiv.innerHTML = data.success 
                                                ? '<div class="success">Transfer successful! Check your M-Pesa for confirmation.</div>'
                                                : '<div class="error">Transfer failed: ' + data.error + '</div>';
                                            
                                            loadTransactions();
                                            handleCloseModal();
                                        } catch (error) {
                                            console.error('Transfer error:', error);
                                            resultDiv.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
                                        }
                                    }
                                }),
                                document.getElementById('modalContent')
                            );
                        } catch (error) {
                            console.error('Error opening modal:', error);
                            resultDiv.innerHTML = '<div class="error">Error opening payment modal: ' + error.message + '</div>';
                        }
                    }

                    function handleCloseModal() {
                        // Restore body scrolling
                        document.body.style.overflow = 'auto';
                        
                        // Clean up modal
                        const modalContainer = document.querySelector('.fixed.inset-0.z-50');
                        if (modalContainer) {
                            ReactDOM.unmountComponentAtNode(document.getElementById('modalContent'));
                            modalContainer.remove();
                        }
                    }

                    // Add click handler to payment button
                    document.getElementById('openDepositModal').addEventListener('click', handlePayment);

                    // Load transactions
                    async function loadTransactions() {
                        try {
                            const response = await fetch('/transactions');
                            const data = await response.json();
                            const transactionList = document.getElementById('transactionList');
                            
                            if (data.success) {
                                transactionList.innerHTML = data.transactions.map(function(tx) {
                                    return '<div class="transaction-item">' +
                                        '<p><strong>Payment Type:</strong> ' + tx.paymentType + '</p>' +
                                        '<p><strong>Amount:</strong> ' + tx.liskAmount + ' ' + tx.paymentType + ' (≈ ' + (parseFloat(tx.liskAmount) * LSK_TO_KES_RATE).toFixed(2) + ' KES)</p>' +
                                        '<p><strong>Phone:</strong> ' + tx.mpesaPhoneNumber + '</p>' +
                                        '<p><strong>Status:</strong> <span class="status-badge status-' + tx.status + '">' + tx.status + '</span></p>' +
                                        '<p><strong>Time:</strong> ' + new Date(tx.createdAt).toLocaleString() + '</p>' +
                                    '</div>';
                                }).join('');
                            }
                        } catch (error) {
                            console.error('Error loading transactions:', error);
                        }
                    }

                    // Load transactions on page load
                    loadTransactions();
                </script>
            </body>
        </html>
    `);
});

// Start the server after connecting to Lisk node and initializing database
(async () => {
    try {
        // Initialize database
        await initDatabase();
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Connected to Lisk network: ${liskConfig.network.name}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
})(); 