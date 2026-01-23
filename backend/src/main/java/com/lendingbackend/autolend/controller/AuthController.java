package com.lendingbackend.autolend.controller;

import com.lendingbackend.autolend.dto.AuthResponse;
import com.lendingbackend.autolend.dto.LoginRequest;
import com.lendingbackend.autolend.entity.User;
import com.lendingbackend.autolend.entity.Wallet;
import com.lendingbackend.autolend.repository.UserRepository;
import com.lendingbackend.autolend.repository.WalletRepository;
import com.lendingbackend.autolend.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final WalletRepository walletRepo;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public AuthController(UserRepository userRepo,
                          WalletRepository walletRepo,
                          JwtTokenProvider tokenProvider,
                          PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.walletRepo = walletRepo;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Login endpoint - returns JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        String token = tokenProvider.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getRole() != null ? user.getRole() : "USER"
        );

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(user.getRole())
                .riskScore(user.getRiskScore())
                .expiresIn(jwtExpiration / 1000) // Convert to seconds
                .build());
    }

    /**
     * Register a new user.
     */
    /**
     * Register a new user.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String name = request.get("name");
        String requestedRole = request.getOrDefault("role", "USER");

        if (userRepo.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));
        }

        // Validate role (only USER or ADMIN allowed)
        String role = "USER";
        if ("ADMIN".equalsIgnoreCase(requestedRole)) {
            role = "ADMIN";
        }

        User user = User.builder()
                .userId(UUID.randomUUID())
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .riskScore(0.5) // Default risk score
                .status("ACTIVE")
                .role(role)
                .createdAt(Instant.now())
                .build();
        userRepo.save(user);

        // Create wallet for user
        Wallet wallet = Wallet.builder()
                .walletId(UUID.randomUUID())
                .userId(user.getUserId())
                .availableCredits(new BigDecimal("5000.00")) // Initial credit limit
                .lockedCredits(BigDecimal.ZERO)
                .currency("VEX")
                .updatedAt(Instant.now())
                .build();
        walletRepo.save(wallet);

        String token = tokenProvider.generateToken(user.getUserId(), email, role);

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .email(email)
                .role(role)
                .riskScore(user.getRiskScore())
                .expiresIn(jwtExpiration / 1000)
                .build());
    }

    /**
     * Validate token endpoint.
     */
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("valid", false));
        }

        String token = authHeader.substring(7);
        if (tokenProvider.isTokenValid(token)) {
            UUID userId = tokenProvider.getUserIdFromToken(token);
            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "userId", userId.toString(),
                    "email", tokenProvider.getEmailFromToken(token)
            ));
        }

        return ResponseEntity.status(401).body(Map.of("valid", false));
    }
}
