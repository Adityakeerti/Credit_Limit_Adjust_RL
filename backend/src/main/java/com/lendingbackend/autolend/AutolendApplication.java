package com.lendingbackend.autolend;

import com.lendingbackend.autolend.entity.User;
import com.lendingbackend.autolend.entity.Wallet;
import com.lendingbackend.autolend.repository.UserRepository;
import com.lendingbackend.autolend.repository.WalletRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@SpringBootApplication
public class AutolendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AutolendApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedData(
            UserRepository userRepo,
            WalletRepository walletRepo,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed Admin User
            if (userRepo.findByEmail("admin@arthacore.ai").isEmpty()) {
                User admin = User.builder()
                        .userId(UUID.randomUUID())
                        .name("Admin User")
                        .email("admin@arthacore.ai")
                        .password(passwordEncoder.encode("admin123"))
                        .riskScore(0.0)
                        .status("ACTIVE")
                        .role("ADMIN")
                        .createdAt(Instant.now())
                        .build();
                userRepo.save(admin);
                System.out.println("=== SEEDED ADMIN USER ===");
                System.out.println("Email: admin@arthacore.ai");
                System.out.println("Password: admin123");
                System.out.println("User ID: " + admin.getUserId());
            }

            // Seed Demo User
            if (userRepo.findByEmail("demo@arthacore.ai").isEmpty()) {
                User demo = User.builder()
                        .userId(UUID.randomUUID())
                        .name("Demo User")
                        .email("demo@arthacore.ai")
                        .password(passwordEncoder.encode("demo123"))
                        .riskScore(0.25)
                        .status("ACTIVE")
                        .role("USER")
                        .createdAt(Instant.now())
                        .build();
                userRepo.save(demo);

                Wallet wallet = Wallet.builder()
                        .walletId(UUID.randomUUID())
                        .userId(demo.getUserId())
                        .availableCredits(new BigDecimal("10000.00"))
                        .lockedCredits(BigDecimal.ZERO)
                        .currency("VEX")
                        .updatedAt(Instant.now())
                        .build();
                walletRepo.save(wallet);

                System.out.println("=== SEEDED DEMO USER ===");
                System.out.println("Email: demo@arthacore.ai");
                System.out.println("Password: demo123");
                System.out.println("User ID: " + demo.getUserId());
                System.out.println("Wallet ID: " + wallet.getWalletId());
            } else {
                userRepo.findByEmail("demo@arthacore.ai").ifPresent(u -> {
                    System.out.println("=== EXISTING DEMO USER ===");
                    System.out.println("User ID: " + u.getUserId());
                    walletRepo.findByUserId(u.getUserId()).ifPresent(w ->
                            System.out.println("Wallet ID: " + w.getWalletId())
                    );
                });
            }
        };
    }
}