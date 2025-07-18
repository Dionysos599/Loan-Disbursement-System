package com.bankplus.disbursement_service.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class LoanDetailResponse {
    public String loanId;
    public String customerName;
    public BigDecimal loanAmount;
    public LocalDate startDate;
    public LocalDate maturityDate;
    public LocalDate extendedDate;
    public Progress currentProgress;
    public List<ScheduleItem> schedule;

    public static class Progress {
        public BigDecimal percentComplete;
        public BigDecimal outstandingBalance;
        public LocalDate asOfDate;
    }
    public static class ScheduleItem {
        public LocalDate month;
        public BigDecimal cumulativeAmount;
        public BigDecimal monthlyAmount;
    }
} 