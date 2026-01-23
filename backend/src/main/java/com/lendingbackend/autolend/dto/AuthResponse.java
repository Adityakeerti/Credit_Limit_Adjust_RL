package com.lendingbackend.autolend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String tokenType;
    private UUID userId;
    private String email;
    private String role;
    private Double riskScore;
    private long expiresIn;
}
