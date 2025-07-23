package com.bankplus.loan_forecast.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.kafka.sender.KafkaSender;
import reactor.kafka.sender.SenderOptions;
import reactor.kafka.sender.SenderRecord;

import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class ReactiveUploadService {
    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.topics.file-upload-events}")
    private String fileUploadTopic;

    private KafkaSender<String, String> kafkaSender;

    @PostConstruct
    public void init() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        SenderOptions<String, String> senderOptions = SenderOptions.create(props);
        kafkaSender = KafkaSender.create(senderOptions);
    }

    public Mono<Void> sendFileUploadEvent(String batchId, String filePath, String startMonth) {
        String payload = String.format("{\"batchId\":\"%s\",\"filePath\":\"%s\",\"startMonth\":\"%s\"}",
                batchId, filePath, startMonth);
        SenderRecord<String, String, String> record = SenderRecord.create(fileUploadTopic, null, null, batchId, payload, batchId);
        return kafkaSender.send(Mono.just(record))
                .doOnNext(result -> log.info("Sent file upload event to Kafka: {}", payload))
                .doOnError(e -> log.error("Failed to send file upload event to Kafka: {}", e.getMessage()))
                .then();
    }
} 