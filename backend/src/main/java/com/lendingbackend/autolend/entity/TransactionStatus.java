package com.lendingbackend.autolend.entity;

public enum TransactionStatus {
    PENDING,        // Transaction initiated
    AUTHORIZED,     // Credits locked/reserved
    SETTLED,        // Transaction completed
    FAILED,         // Transaction failed
    REVERSED        // Transaction reversed
}
