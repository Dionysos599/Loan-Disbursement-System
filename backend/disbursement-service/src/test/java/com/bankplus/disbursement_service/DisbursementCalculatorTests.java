package com.bankplus.disbursement_service;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class DisbursementCalculatorTests {
    @Test
    void testSCurveSchedule_basic() {
        DisbursementCalculator calc = new DisbursementCalculator();
        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate maturity = LocalDate.of(2024, 12, 31);
        BigDecimal loanAmount = new BigDecimal("1000000.00");
        double percentComplete = 0.0;
        BigDecimal outstanding = BigDecimal.ZERO;
        LocalDate from = start;
        LocalDate to = LocalDate.of(2025, 1, 1);
        List<DisbursementCalculator.DisbursementScheduleItem> schedule = calc.calculateSchedule(
                start, maturity, null, loanAmount, percentComplete, outstanding, from, to);
        assertFalse(schedule.isEmpty());
        assertEquals(new BigDecimal("2472.62"), schedule.get(0).cumulativeAmount);
        assertTrue(schedule.get(schedule.size()-1).cumulativeAmount.compareTo(loanAmount) <= 0);
    }

    @Test
    void testSCurveSchedule_afterCutoff() {
        DisbursementCalculator calc = new DisbursementCalculator();
        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate maturity = LocalDate.of(2024, 12, 31);
        BigDecimal loanAmount = new BigDecimal("1000000.00");
        double percentComplete = 1.0;
        BigDecimal outstanding = loanAmount;
        LocalDate from = LocalDate.of(2026, 7, 1); // after cutoff
        LocalDate to = LocalDate.of(2026, 8, 1);
        List<DisbursementCalculator.DisbursementScheduleItem> schedule = calc.calculateSchedule(
                start, maturity, null, loanAmount, percentComplete, outstanding, from, to);
        assertEquals(BigDecimal.ZERO, schedule.get(0).monthlyAmount);
    }
} 