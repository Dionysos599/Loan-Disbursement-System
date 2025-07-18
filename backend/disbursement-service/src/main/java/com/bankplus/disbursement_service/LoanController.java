package com.bankplus.disbursement_service;

import com.bankplus.disbursement_service.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/loans")
public class LoanController {
    @Autowired
    private LoanService loanService;
    @Autowired
    private LoanRepository loanRepository;
    @Autowired
    private LoanProgressRepository loanProgressRepository;
    @Autowired
    private LoanScheduleRepository loanScheduleRepository;

    @GetMapping("/{loanId}")
    public LoanDetailResponse getLoanDetails(@PathVariable String loanId) {
        return loanService.getLoanDetails(loanId);
    }

    @PostMapping("/{loanId}/calculate-schedule")
    public List<LoanDetailResponse.ScheduleItem> calculateSchedule(@PathVariable String loanId, @RequestBody CalculateScheduleRequest request) {
        var loan = loanRepository.findById(loanId).orElseThrow();
        var progress = loanProgressRepository.findAll().stream()
                .filter(lp -> lp.getLoan().getLoanId().equals(loanId))
                .max((a, b) -> a.getAsOfDate().compareTo(b.getAsOfDate())).orElse(null);
        return loanService.calculateSchedule(loan, progress, request.fromDate, request.toDate, request.currentComplete);
    }

    @PutMapping("/{loanId}/progress")
    public void updateProgress(@PathVariable String loanId, @RequestBody UpdateProgressRequest request) {
        loanService.updateProgress(loanId, request);
    }

    @PutMapping("/{loanId}/extend")
    public void extendMaturity(@PathVariable String loanId, @RequestBody ExtendMaturityRequest request) {
        loanService.extendMaturity(loanId, request);
    }
} 