package com.lendingbackend.autolend.repository;

import com.lendingbackend.autolend.entity.CurrencyWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CurrencyWalletRepository extends JpaRepository<CurrencyWallet, UUID> {
    List<CurrencyWallet> findByUserId(UUID userId);
    Optional<CurrencyWallet> findByUserIdAndCurrencyId(UUID userId, UUID currencyId);
    Optional<CurrencyWallet> findByUserIdAndCurrencyCode(UUID userId, String currencyCode);
}
