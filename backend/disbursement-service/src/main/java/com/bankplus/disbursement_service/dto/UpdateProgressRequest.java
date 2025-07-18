package com.bankplus.disbursement_service.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class UpdateProgressRequest {
    public BigDecimal percentComplete;
    public BigDecimal outstandingBalance;
    public LocalDate asOfDate;
} 