package com.bankplus.disbursement_service.dto;

import java.time.LocalDate;

public class CalculateScheduleRequest {
    public LocalDate fromDate;
    public LocalDate toDate;
    public Double currentComplete;
} 