package com.cravedash.payment.repository;

import com.cravedash.payment.model.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByTransactionReference(String transactionReference);
    List<PaymentTransaction> findByOrderId(Long orderId);
    List<PaymentTransaction> findByUserId(Long userId);
}
