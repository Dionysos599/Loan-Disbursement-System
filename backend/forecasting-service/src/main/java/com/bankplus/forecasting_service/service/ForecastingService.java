package com.bankplus.forecasting_service.service;

import com.bankplus.forecasting_service.model.ForecastData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class ForecastingService {

    public List<ForecastData> generateSCurveForecast(
            String loanNumber,
            BigDecimal totalLoanAmount,
            BigDecimal currentDrawnAmount,
            BigDecimal currentCompletion,
            LocalDate startDate,
            LocalDate maturityDate,
            LocalDate forecastStartDate,
            LocalDate forecastEndDate,
            double steepness,
            double midpoint) {
        
        log.info("Generating S-curve forecast for loan: {}", loanNumber);
        
        List<ForecastData> forecastData = new ArrayList<>();
        
        // Calculate the number of months in the forecast period
        long totalMonths = ChronoUnit.MONTHS.between(forecastStartDate, forecastEndDate);
        
        // Calculate remaining amount to be disbursed
        BigDecimal remainingAmount = totalLoanAmount.subtract(currentDrawnAmount);
        
        // Calculate remaining completion percentage
        BigDecimal remainingCompletion = BigDecimal.valueOf(100).subtract(currentCompletion);
        
        for (int month = 0; month <= totalMonths; month++) {
            LocalDate currentDate = forecastStartDate.plusMonths(month);
            
            // Calculate S-curve completion percentage for this month
            double normalizedMonth = (double) month / totalMonths;
            double sCurveValue = calculateSCurve(normalizedMonth, steepness, midpoint);
            
            // Convert to completion percentage
            BigDecimal monthCompletion = BigDecimal.valueOf(sCurveValue * 100);
            
            // Calculate cumulative completion
            BigDecimal cumulativeCompletion = currentCompletion.add(
                monthCompletion.multiply(remainingCompletion).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
            );
            
            // Calculate cumulative amount
            BigDecimal cumulativeAmount = totalLoanAmount.multiply(cumulativeCompletion)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            
            // Calculate monthly amount (difference from previous month)
            BigDecimal monthlyAmount = BigDecimal.ZERO;
            if (month > 0) {
                BigDecimal previousCumulative = forecastData.get(month - 1).getCumulativeAmount();
                monthlyAmount = cumulativeAmount.subtract(previousCumulative);
            } else {
                monthlyAmount = cumulativeAmount.subtract(currentDrawnAmount);
            }
            
            // Ensure monthly amount is not negative
            if (monthlyAmount.compareTo(BigDecimal.ZERO) < 0) {
                monthlyAmount = BigDecimal.ZERO;
            }
            
            ForecastData data = ForecastData.builder()
                    .loanNumber(loanNumber)
                    .date(currentDate)
                    .cumulativeAmount(cumulativeAmount)
                    .monthlyAmount(monthlyAmount)
                    .percentComplete(cumulativeCompletion)
                    .forecastType("forecast")
                    .scenarioName("S-Curve")
                    .confidenceLevel(BigDecimal.valueOf(0.85))
                    .build();
            
            forecastData.add(data);
        }
        
        log.info("Generated {} forecast data points for loan: {}", forecastData.size(), loanNumber);
        return forecastData;
    }
    
    private double calculateSCurve(double x, double steepness, double midpoint) {
        // S-curve formula: 1 / (1 + e^(-steepness * (x - midpoint)))
        double exponent = -steepness * (x - midpoint);
        return 1.0 / (1.0 + Math.exp(exponent));
    }
    
    public List<ForecastData> generateLinearForecast(
            String loanNumber,
            BigDecimal totalLoanAmount,
            BigDecimal currentDrawnAmount,
            LocalDate forecastStartDate,
            LocalDate forecastEndDate) {
        
        log.info("Generating linear forecast for loan: {}", loanNumber);
        
        List<ForecastData> forecastData = new ArrayList<>();
        
        long totalMonths = ChronoUnit.MONTHS.between(forecastStartDate, forecastEndDate);
        BigDecimal remainingAmount = totalLoanAmount.subtract(currentDrawnAmount);
        BigDecimal monthlyAmount = remainingAmount.divide(BigDecimal.valueOf(totalMonths), 2, RoundingMode.HALF_UP);
        
        BigDecimal cumulativeAmount = currentDrawnAmount;
        
        for (int month = 0; month <= totalMonths; month++) {
            LocalDate currentDate = forecastStartDate.plusMonths(month);
            
            if (month > 0) {
                cumulativeAmount = cumulativeAmount.add(monthlyAmount);
            }
            
            BigDecimal percentComplete = cumulativeAmount.multiply(BigDecimal.valueOf(100))
                .divide(totalLoanAmount, 2, RoundingMode.HALF_UP);
            
            ForecastData data = ForecastData.builder()
                    .loanNumber(loanNumber)
                    .date(currentDate)
                    .cumulativeAmount(cumulativeAmount)
                    .monthlyAmount(monthlyAmount)
                    .percentComplete(percentComplete)
                    .forecastType("forecast")
                    .scenarioName("Linear")
                    .confidenceLevel(BigDecimal.valueOf(0.70))
                    .build();
            
            forecastData.add(data);
        }
        
        return forecastData;
    }
    
    public List<ForecastData> generateMultipleScenarios(
            String loanNumber,
            BigDecimal totalLoanAmount,
            BigDecimal currentDrawnAmount,
            BigDecimal currentCompletion,
            LocalDate startDate,
            LocalDate maturityDate,
            LocalDate forecastStartDate,
            LocalDate forecastEndDate) {
        
        List<ForecastData> allScenarios = new ArrayList<>();
        
        // Scenario 1: Optimistic S-curve
        List<ForecastData> optimistic = generateSCurveForecast(
            loanNumber, totalLoanAmount, currentDrawnAmount, currentCompletion,
            startDate, maturityDate, forecastStartDate, forecastEndDate, 8.0, 0.3
        );
        optimistic.forEach(data -> {
            data.setScenarioName("Optimistic");
            data.setConfidenceLevel(BigDecimal.valueOf(0.75));
        });
        allScenarios.addAll(optimistic);
        
        // Scenario 2: Conservative S-curve
        List<ForecastData> conservative = generateSCurveForecast(
            loanNumber, totalLoanAmount, currentDrawnAmount, currentCompletion,
            startDate, maturityDate, forecastStartDate, forecastEndDate, 4.0, 0.5
        );
        conservative.forEach(data -> {
            data.setScenarioName("Conservative");
            data.setConfidenceLevel(BigDecimal.valueOf(0.90));
        });
        allScenarios.addAll(conservative);
        
        // Scenario 3: Linear
        List<ForecastData> linear = generateLinearForecast(
            loanNumber, totalLoanAmount, currentDrawnAmount, forecastStartDate, forecastEndDate
        );
        linear.forEach(data -> {
            data.setScenarioName("Linear");
            data.setConfidenceLevel(BigDecimal.valueOf(0.70));
        });
        allScenarios.addAll(linear);
        
        return allScenarios;
    }
    
    public String generateForecastId() {
        return "FCST_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
} 