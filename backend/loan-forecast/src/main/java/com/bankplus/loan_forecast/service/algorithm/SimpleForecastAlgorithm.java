package com.bankplus.loan_forecast.service.algorithm;

import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Simple forecast algorithm for personal/development use
 * Uses basic sigmoid S-curve model
 */
@Component("simpleAlgorithm")
public class SimpleForecastAlgorithm implements ForecastAlgorithmInterface {
    
    @Override
    public BigDecimal calculateForecastOutstandingBalance(
            BigDecimal outstandingBalance, 
            BigDecimal undisbursedAmount, 
            double percentOfCompletion,
            LocalDate projectStartDate, 
            LocalDate forecastDate, 
            LocalDate extendedDate) {
        
        long daysBetweenStartAndForecast = ChronoUnit.DAYS.between(projectStartDate, forecastDate);
        long daysBetweenStartAndExtended = ChronoUnit.DAYS.between(projectStartDate, extendedDate);
        
        double timeProgress = daysBetweenStartAndExtended > 0 ? 
            (double) daysBetweenStartAndForecast / daysBetweenStartAndExtended : 0;
        
        double totalProgress = percentOfCompletion + timeProgress * (1 - percentOfCompletion);
        
        // Ensure total progress is within [0, 1]
        if (totalProgress < 0) totalProgress = 0;
        if (totalProgress > 1) totalProgress = 1;
        
        // Simple sigmoid S-curve model
        double sCurveValue = 1.0 / (1.0 + Math.exp(-12.0 * (totalProgress - 0.5)));
        
        BigDecimal additionalDisbursement = undisbursedAmount.multiply(BigDecimal.valueOf(sCurveValue));
        return outstandingBalance.add(additionalDisbursement);
    }
    
    @Override
    public String getAlgorithmName() {
        return "simple";
    }
    
    @Override
    public String getAlgorithmDescription() {
        return "Simple sigmoid S-curve model for personal/development use";
    }
} 