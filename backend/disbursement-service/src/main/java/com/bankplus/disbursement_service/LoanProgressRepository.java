package com.bankplus.disbursement_service;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanProgressRepository extends JpaRepository<LoanProgress, Long> {
} 