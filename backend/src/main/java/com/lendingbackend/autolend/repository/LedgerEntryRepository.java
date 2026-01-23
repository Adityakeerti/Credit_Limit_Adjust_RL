package com.lendingbackend.autolend.repository;

import com.lendingbackend.autolend.entity.LedgerEntry;
import com.lendingbackend.autolend.entity.LedgerAccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {

    List<LedgerEntry> findByTxnIdOrderByCreatedAt(UUID txnId);

    List<LedgerEntry> findByWalletIdOrderByCreatedAtDesc(UUID walletId);

    @Query("SELECT SUM(CASE WHEN e.entryType = 'CREDIT' THEN e.amount ELSE -e.amount END) " +
           "FROM LedgerEntry e WHERE e.walletId = :walletId AND e.accountType = :accountType")
    BigDecimal calculateBalance(
            @Param("walletId") UUID walletId,
            @Param("accountType") LedgerAccountType accountType
    );

    @Query("SELECT e FROM LedgerEntry e WHERE e.walletId = :walletId ORDER BY e.createdAt DESC LIMIT 1")
    LedgerEntry findLatestByWalletId(@Param("walletId") UUID walletId);
}
