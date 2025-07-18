package com.bankplus.disbursement_service;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "loans")
public class Loan {
    @Id
    @Column(name = "loan_id", length = 50)
    private String loanId;

    @Column(name = "customer_name", nullable = false, length = 255)
    private String customerName;

    @Column(name = "loan_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal loanAmount;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "maturity_date", nullable = false)
    private LocalDate maturityDate;

    @Column(name = "extended_date")
    private LocalDate extendedDate;

    @Column(name = "property_type", length = 100)
    private String propertyType;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public String getLoanId() { return loanId; }
    public void setLoanId(String loanId) { this.loanId = loanId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public BigDecimal getLoanAmount() { return loanAmount; }
    public void setLoanAmount(BigDecimal loanAmount) { this.loanAmount = loanAmount; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getMaturityDate() { return maturityDate; }
    public void setMaturityDate(LocalDate maturityDate) { this.maturityDate = maturityDate; }
    public LocalDate getExtendedDate() { return extendedDate; }
    public void setExtendedDate(LocalDate extendedDate) { this.extendedDate = extendedDate; }
    public String getPropertyType() { return propertyType; }
    public void setPropertyType(String propertyType) { this.propertyType = propertyType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
} 