package com.bankplus.forecasting_service.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastData {
    private String loanNumber;
    private LocalDate date;
    private BigDecimal cumulativeAmount;
    private BigDecimal monthlyAmount;
    private BigDecimal percentComplete;
    private String forecastType; // "actual", "forecast", "scenario"
    private String scenarioName; // For different forecast scenarios
    private BigDecimal confidenceLevel; // 0-1 confidence in the forecast
} 