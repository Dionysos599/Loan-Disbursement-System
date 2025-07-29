package com.bankplus.loan_forecast.service.algorithm;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Interface for loan forecast algorithms
 * This allows for easy switching between different algorithm implementations
 */
public interface ForecastAlgorithmInterface {
    
    /**
     * Calculate forecast outstanding balance using the implemented algorithm
     * 
     * @param outstandingBalance Current outstanding balance
     * @param undisbursedAmount Amount not yet disbursed
     * @param percentOfCompletion Current completion percentage (0.0 to 1.0)
     * @param projectStartDate Project start date
     * @param forecastDate Date for which to calculate forecast
     * @param extendedDate Extended project completion date
     * @return Calculated forecast outstanding balance
     */
    BigDecimal calculateForecastOutstandingBalance(
            BigDecimal outstandingBalance, 
            BigDecimal undisbursedAmount, 
            double percentOfCompletion,
            LocalDate projectStartDate, 
            LocalDate forecastDate, 
            LocalDate extendedDate);
    
    /**
     * Get the name/identifier of this algorithm
     * @return Algorithm name
     */
    String getAlgorithmName();
    
    /**
     * Get algorithm description
     * @return Algorithm description
     */
    String getAlgorithmDescription();
} 