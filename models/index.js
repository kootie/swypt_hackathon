const { Sequelize, DataTypes } = require('sequelize');

// Initialize SQLite database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false // Set to true for debugging
});

// Define Transaction model
const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderID: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    tokenAmount: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mpesaPhoneNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tokenType: {
        type: DataTypes.ENUM('USDT', 'USDC', 'CELO'),
        defaultValue: 'USDT'
    },
    transferType: {
        type: DataTypes.ENUM('onramp', 'offramp'),
        allowNull: true
    },
    walletAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    network: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tokenTransactionId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mpesaTransactionId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'stk_initiated', 'tokens_sent', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    error: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

// Define User model (for storing wallet addresses)
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    walletAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    mpesaPhoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

// Initialize database
async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // Sync all models
        await sequelize.sync();
        console.log('Database models synchronized.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

module.exports = {
    sequelize,
    Transaction,
    User,
    initDatabase
}; 