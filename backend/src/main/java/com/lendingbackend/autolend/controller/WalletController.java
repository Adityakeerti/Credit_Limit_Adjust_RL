package com.lendingbackend.autolend.controller;

import com.lendingbackend.autolend.entity.Wallet;
import com.lendingbackend.autolend.service.WalletService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/{userId}")
    public Wallet getWallet(@PathVariable UUID userId) {
        return walletService.getWallet(userId);
    }

    @PostMapping("/{userId}/lock")
    public void lock(
            @PathVariable UUID userId,
            @RequestParam BigDecimal amount) {
        walletService.lockCredits(userId, amount);
    }
}
