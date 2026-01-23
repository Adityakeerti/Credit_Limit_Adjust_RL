package com.lendingbackend.autolend.entity;

public enum TransactionType {
    PURCHASE,           // Spending credits
    REFUND,             // Returning credits
    CREDIT_INCREASE,    // Credit limit increase
    CREDIT_DECREASE,    // Credit limit decrease
    PAYMENT,            // Paying off utilized credits
    SETTLEMENT,         // Settlement of locked credits
    REVERSAL            // Reversing a previous transaction
}
