package com.bankplus.loan_forecast.model;

import com.opencsv.bean.CsvBindByName;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CsvLoanData {
    
    @CsvBindByName(column = "Loan Number")
    private String loanNumber;
    
    @CsvBindByName(column = "Customer Name")
    private String customerName;
    
    @CsvBindByName(column = "Loan Amount")
    private String loanAmount;
    
    @CsvBindByName(column = "Maturity Date")
    private String maturityDate;
    
    @CsvBindByName(column = "Extended Date")
    private String extendedDate;
    
    @CsvBindByName(column = "Outstanding Balance")
    private String outstandingBalance;
    
    @CsvBindByName(column = "Undisbursed Amount")
    private String undisbursedAmount;
    
    @CsvBindByName(column = "% of Loan Drawn")
    private String percentOfLoanDrawn;
    
    @CsvBindByName(column = "% of Completion")
    private String percentOfCompletion;
} 