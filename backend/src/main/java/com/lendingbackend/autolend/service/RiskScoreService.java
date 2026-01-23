package com.lendingbackend.autolend.service;

import com.lendingbackend.autolend.entity.User;
import com.lendingbackend.autolend.entity.Transaction;
import com.lendingbackend.autolend.entity.CurrencyWallet;
import com.lendingbackend.autolend.repository.UserRepository;
import com.lendingbackend.autolend.repository.TransactionRepository;
import com.lendingbackend.autolend.repository.CurrencyWalletRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class RiskScoreService {

    private static final Logger log = LoggerFactory.getLogger(RiskScoreService.class);

    private static final String RISK_SCORE_KEY_PREFIX = "risk_score:";
    private static final String CREDIT_LIMIT_KEY_PREFIX = "credit_limit:";
    private static final long CACHE_TTL_MINUTES = 15;

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final CurrencyWalletRepository walletRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public RiskScoreService(UserRepository userRepository,
                            TransactionRepository transactionRepository,
                            CurrencyWalletRepository walletRepository,
                            RedisTemplate<String, Object> redisTemplate) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Get risk score for a user - tries Redis first, falls back to DB calculation
     */
    public Double getRiskScore(UUID userId) {
        String cacheKey = RISK_SCORE_KEY_PREFIX + userId.toString();

        try {
            // Try Redis cache first
            Object cachedScore = redisTemplate.opsForValue().get(cacheKey);
            if (cachedScore != null) {
                log.debug("REDIS_HIT risk_score userId={}", userId);
                return ((Number) cachedScore).doubleValue();
            }
            log.debug("REDIS_MISS risk_score userId={}", userId);
        } catch (Exception e) {
            log.warn("Redis unavailable for risk score lookup, falling back to DB: {}", e.getMessage());
        }

        // Fallback: Calculate from DB
        Double riskScore = calculateRiskScoreFromDB(userId);

        // Try to cache the result
        try {
            redisTemplate.opsForValue().set(cacheKey, riskScore, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            log.debug("REDIS_SET risk_score userId={} value={}", userId, riskScore);
        } catch (Exception e) {
            log.warn("Failed to cache risk score to Redis: {}", e.getMessage());
        }

        return riskScore;
    }

    /**
     * Get credit limit for a user - tries Redis first, falls back to DB calculation
     */
    public BigDecimal getCreditLimit(UUID userId) {
        String cacheKey = CREDIT_LIMIT_KEY_PREFIX + userId.toString();

        try {
            // Try Redis cache first
            Object cachedLimit = redisTemplate.opsForValue().get(cacheKey);
            if (cachedLimit != null) {
                log.debug("REDIS_HIT credit_limit userId={}", userId);
                if (cachedLimit instanceof Number) {
                    return BigDecimal.valueOf(((Number) cachedLimit).doubleValue());
                }
                return new BigDecimal(cachedLimit.toString());
            }
            log.debug("REDIS_MISS credit_limit userId={}", userId);
        } catch (Exception e) {
            log.warn("Redis unavailable for credit limit lookup, falling back to DB: {}", e.getMessage());
        }

        // Fallback: Calculate from DB
        BigDecimal creditLimit = calculateCreditLimitFromDB(userId);

        // Try to cache the result
        try {
            redisTemplate.opsForValue().set(cacheKey, creditLimit.doubleValue(), 10, TimeUnit.MINUTES);
            log.debug("REDIS_SET credit_limit userId={} value={}", userId, creditLimit);
        } catch (Exception e) {
            log.warn("Failed to cache credit limit to Redis: {}", e.getMessage());
        }

        return creditLimit;
    }

    /**
     * Calculate risk score from database
     * Factors: transaction count, transaction volume, account age, wallet balance
     */
    private Double calculateRiskScoreFromDB(UUID userId) {
        log.info("Calculating risk score from DB for userId={}", userId);

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return 0.5; // Default risk score for unknown user
        }

        User user = userOpt.get();
        double score = 0.5; // Base score

        // Factor 1: Check if user has existing risk score
        if (user.getRiskScore() != null) {
            score = user.getRiskScore();
        }

        // Factor 2: Transaction history (more transactions = lower risk)
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (transactions.size() > 10) {
            score = Math.max(0.2, score - 0.1); // Reduce risk for active users
        } else if (transactions.isEmpty()) {
            score = Math.min(0.8, score + 0.1); // Increase risk for new users
        }

        // Factor 3: Wallet balance (higher balance = lower risk)
        Optional<CurrencyWallet> wallet = walletRepository.findByUserIdAndCurrencyCode(userId, "VEX");
        if (wallet.isPresent()) {
            BigDecimal balance = wallet.get().getBalance();
            if (balance.compareTo(BigDecimal.valueOf(10000)) > 0) {
                score = Math.max(0.1, score - 0.15);
            } else if (balance.compareTo(BigDecimal.valueOf(1000)) > 0) {
                score = Math.max(0.2, score - 0.1);
            }
        }

        // Factor 4: Account age (older = lower risk)
        if (user.getCreatedAt() != null) {
            long daysSinceCreation = ChronoUnit.DAYS.between(user.getCreatedAt(), Instant.now());
            if (daysSinceCreation > 90) {
                score = Math.max(0.1, score - 0.1);
            } else if (daysSinceCreation > 30) {
                score = Math.max(0.2, score - 0.05);
            }
        }

        // Clamp score between 0 and 1
        score = Math.max(0.0, Math.min(1.0, score));

        // Update user's risk score in DB
        user.setRiskScore(score);
        userRepository.save(user);

        return score;
    }

    /**
     * Calculate credit limit based on risk score and wallet balance
     */
    private BigDecimal calculateCreditLimitFromDB(UUID userId) {
        log.info("Calculating credit limit from DB for userId={}", userId);

        Double riskScore = getRiskScore(userId);

        // Base credit limit
        BigDecimal baseLimit = BigDecimal.valueOf(1000);

        // Adjust based on risk score (lower risk = higher limit)
        double riskMultiplier = 1.0 + (1.0 - riskScore) * 2; // 1x to 3x based on risk

        // Check wallet balance
        Optional<CurrencyWallet> wallet = walletRepository.findByUserIdAndCurrencyCode(userId, "VEX");
        if (wallet.isPresent()) {
            BigDecimal balance = wallet.get().getBalance();
            // Credit limit can be up to 50% of wallet balance for low risk users
            BigDecimal balanceBasedLimit = balance.multiply(BigDecimal.valueOf(0.5));
            baseLimit = baseLimit.max(balanceBasedLimit);
        }

        return baseLimit.multiply(BigDecimal.valueOf(riskMultiplier))
                        .setScale(2, BigDecimal.ROUND_HALF_UP);
    }

    /**
     * Invalidate cached risk score (call after significant user activity)
     */
    public void invalidateRiskScore(UUID userId) {
        String cacheKey = RISK_SCORE_KEY_PREFIX + userId.toString();
        try {
            redisTemplate.delete(cacheKey);
            log.debug("REDIS_DELETE risk_score userId={}", userId);
        } catch (Exception e) {
            log.warn("Failed to invalidate risk score cache: {}", e.getMessage());
        }
    }

    /**
     * Invalidate cached credit limit
     */
    public void invalidateCreditLimit(UUID userId) {
        String cacheKey = CREDIT_LIMIT_KEY_PREFIX + userId.toString();
        try {
            redisTemplate.delete(cacheKey);
            log.debug("REDIS_DELETE credit_limit userId={}", userId);
        } catch (Exception e) {
            log.warn("Failed to invalidate credit limit cache: {}", e.getMessage());
        }
    }

    /**
     * Recalculate and refresh risk score in cache
     */
    public Double refreshRiskScore(UUID userId) {
        invalidateRiskScore(userId);
        return getRiskScore(userId);
    }

    /**
     * Recalculate and refresh credit limit in cache
     */
    public BigDecimal refreshCreditLimit(UUID userId) {
        invalidateCreditLimit(userId);
        return getCreditLimit(userId);
    }
}
