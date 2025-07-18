package com.bankplus.data_ingestion.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanForecastData {
    private String loanNumber;
    private String customerName;
    private BigDecimal loanAmount;
    private LocalDate maturityDate;
    private LocalDate extendedDate;
    private String propertyType;
    private String jobAddress;
    private String city;
    private BigDecimal ltcRatio;
    private BigDecimal ltvRatio;
    private BigDecimal landDraw;
    private BigDecimal interestRate;
    private BigDecimal outstandingBalance;
    private BigDecimal undisbursedAmount;
    private BigDecimal percentOfLoanDrawn;
    private BigDecimal percentOfCompletion;
    private Map<String, BigDecimal> forecastData;
    private BigDecimal totalForecastedAmount;
    private int forecastMonths;
} 