package com.lendingbackend.autolend.entity;

public enum LedgerAccountType {
    AVAILABLE_CREDITS,   // Usable credit balance
    LOCKED_CREDITS,      // Reserved/held credits
    UTILIZED_CREDITS,    // Credits actually spent/billed
    EXTERNAL             // External account (merchant, bank, etc.)
}
