package com.bankplus.disbursement_service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class DisbursementCalculator {
    private static final double CURVE_STEEPNESS = 12.0;

    public static class DisbursementScheduleItem {
        public LocalDate month;
        public BigDecimal cumulativeAmount;
        public BigDecimal monthlyAmount;
        public DisbursementScheduleItem(LocalDate month, BigDecimal cumulativeAmount, BigDecimal monthlyAmount) {
            this.month = month;
            this.cumulativeAmount = cumulativeAmount;
            this.monthlyAmount = monthlyAmount;
        }
    }

    public List<DisbursementScheduleItem> calculateSchedule(
            LocalDate startDate,
            LocalDate maturityDate,
            LocalDate extendedDate,
            BigDecimal loanAmount,
            double currentCompletion,
            BigDecimal outstandingBalance,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        List<DisbursementScheduleItem> schedule = new ArrayList<>();
        LocalDate endDate = (extendedDate != null) ? extendedDate : maturityDate;
        LocalDate cutoffDate = endDate.plusDays(181);
        BigDecimal undisbursed = loanAmount.subtract(outstandingBalance);
        LocalDate iter = fromDate.withDayOfMonth(1);
        BigDecimal prevCumulative = BigDecimal.ZERO;
        while (!iter.isAfter(toDate)) {
            if (iter.isAfter(cutoffDate)) {
                schedule.add(new DisbursementScheduleItem(iter, prevCumulative, BigDecimal.ZERO));
                iter = iter.plusMonths(1);
                continue;
            }
            double timeProgress = 0.0;
            if (!endDate.equals(startDate)) {
                timeProgress = (double) (iter.toEpochDay() - startDate.toEpochDay()) /
                        (double) (endDate.toEpochDay() - startDate.toEpochDay());
                timeProgress = Math.max(0.0, Math.min(1.0, timeProgress));
            }
            double x = currentCompletion + timeProgress * (1.0 - currentCompletion);
            double sCurve = calculateSCurveValue(x);
            BigDecimal cumulative = outstandingBalance.add(undisbursed.multiply(BigDecimal.valueOf(sCurve)));
            cumulative = cumulative.setScale(2, RoundingMode.HALF_UP);
            BigDecimal monthly = cumulative.subtract(prevCumulative).max(BigDecimal.ZERO);
            schedule.add(new DisbursementScheduleItem(iter, cumulative, monthly));
            prevCumulative = cumulative;
            iter = iter.plusMonths(1);
        }
        return schedule;
    }

    private double calculateSCurveValue(double x) {
        return 1.0 / (1.0 + Math.exp(-CURVE_STEEPNESS * (x - 0.5)));
    }
} 