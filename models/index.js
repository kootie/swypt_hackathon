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
    liskAmount: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mpesaPhoneNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    paymentType: {
        type: DataTypes.ENUM('LSK', 'USDT', 'USDC', 'CELO'),
        defaultValue: 'LSK'
    },
    liskTransactionId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mpesaTransactionId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    error: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

// Define User model (for storing Lisk addresses)
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    liskAddress: {
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