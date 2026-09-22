package com.cravedash.payment.controller;

import com.cravedash.payment.dto.PaymentProcessRequest;
import com.cravedash.payment.dto.PaymentProcessResponse;
import com.cravedash.payment.model.PaymentTransaction;
import com.cravedash.payment.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/process")
    public ResponseEntity<PaymentProcessResponse> processPayment(@RequestBody PaymentProcessRequest request) {
        PaymentProcessResponse response = paymentService.processPayment(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<PaymentTransaction>> getByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getTransactionsByOrderId(orderId));
    }

    @GetMapping("/transaction/{ref}")
    public ResponseEntity<?> getByReference(@PathVariable String ref) {
        return paymentService.getTransactionByReference(ref)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "payment-service"));
    }
}
