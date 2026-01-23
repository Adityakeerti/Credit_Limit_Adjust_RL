package com.lendingbackend.autolend.service;

import com.lendingbackend.autolend.entity.Wallet;
import com.lendingbackend.autolend.repository.WalletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@Transactional
public class WalletService {

    private static final Logger log = LoggerFactory.getLogger(WalletService.class);
    private final WalletRepository walletRepo;

    public WalletService(WalletRepository walletRepo) {
        this.walletRepo = walletRepo;
    }

    @Cacheable(value = "wallets", key = "#userId")
    public Wallet getWallet(UUID userId) {
        log.debug("Cache MISS - fetching wallet from DB for userId={}", userId);
        return walletRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
    }

    public void lockCredits(UUID userId, BigDecimal amount) {
        Wallet w = getWallet(userId);

        if (w.getAvailableCredits().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient credit");
        }

        w.setAvailableCredits(w.getAvailableCredits().subtract(amount));
        w.setLockedCredits(w.getLockedCredits().add(amount));

        walletRepo.save(w);
        
        // Emit an event (log-based fake event bus)
        log.info("CREDIT_LOCKED user={} amount={}", userId, amount);
    }

    public void releaseCredits(UUID userId, BigDecimal amount) {
        Wallet w = getWallet(userId);

        w.setLockedCredits(w.getLockedCredits().subtract(amount));
        w.setAvailableCredits(w.getAvailableCredits().add(amount));

        walletRepo.save(w);
    }
}
