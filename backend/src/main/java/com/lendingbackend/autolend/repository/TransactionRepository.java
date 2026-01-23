package com.lendingbackend.autolend.repository;

import com.lendingbackend.autolend.entity.Transaction;
import com.lendingbackend.autolend.entity.TransactionStatus;
import com.lendingbackend.autolend.entity.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Page<Transaction> findByUserId(UUID userId, Pageable pageable);

    List<Transaction> findByWalletIdAndStatus(UUID walletId, TransactionStatus status);

    Page<Transaction> findByStatus(TransactionStatus status, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND t.createdAt BETWEEN :start AND :end")
    List<Transaction> findByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("start") Instant start,
            @Param("end") Instant end
    );

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.status = :status")
    long countByStatus(@Param("status") TransactionStatus status);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.txnType = :type AND t.status = :status")
    java.math.BigDecimal sumAmountByTypeAndStatus(
            @Param("type") TransactionType type,
            @Param("status") TransactionStatus status
    );

    List<Transaction> findAllByOrderByCreatedAtDesc();
}
