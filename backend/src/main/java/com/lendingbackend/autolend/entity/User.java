package com.lendingbackend.autolend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    private String name;
    private String email;
    private String password;

    @Column(name = "risk_score")
    private Double riskScore;

    private String status;
    
    @Column(length = 20)
    private String role; // USER, ADMIN

    private Instant createdAt;
}
