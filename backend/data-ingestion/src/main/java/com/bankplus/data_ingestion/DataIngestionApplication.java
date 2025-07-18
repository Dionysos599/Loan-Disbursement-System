package com.bankplus.data_ingestion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class DataIngestionApplication {

    public static void main(String[] args) {
        SpringApplication.run(DataIngestionApplication.class, args);
    }
} 