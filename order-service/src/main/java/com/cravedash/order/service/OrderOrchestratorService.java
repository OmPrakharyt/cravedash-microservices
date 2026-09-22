package com.cravedash.order.service;

import com.cravedash.order.client.PaymentClient;
import com.cravedash.order.client.RestaurantClient;
import com.cravedash.order.dto.*;
import com.cravedash.order.model.Order;
import com.cravedash.order.model.OrderItem;
import com.cravedash.order.model.OrderStatus;
import com.cravedash.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderOrchestratorService {

    private final OrderRepository orderRepository;
    private final RestaurantClient restaurantClient;
    private final PaymentClient paymentClient;

    public OrderOrchestratorService(OrderRepository orderRepository,
                                    RestaurantClient restaurantClient,
                                    PaymentClient paymentClient) {
        this.orderRepository = orderRepository;
        this.restaurantClient = restaurantClient;
        this.paymentClient = paymentClient;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot place order with empty cart");
        }

        // 1. Inter-service call: Restaurant Service item & inventory validation
        ValidateItemsRequest validateReq = new ValidateItemsRequest();
        validateReq.setRestaurantId(request.getRestaurantId());
        validateReq.setItems(request.getItems().stream()
                .map(item -> new ValidateItemsRequest.OrderItemDto(item.getMenuItemId(), item.getQuantity()))
                .collect(Collectors.toList()));

        ValidateItemsResponse validateResp;
        try {
            validateResp = restaurantClient.validateOrderItems(validateReq);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to communicate with Restaurant Service: " + e.getMessage());
        }

        if (validateResp == null || !validateResp.isValid()) {
            String errors = (validateResp != null && validateResp.getErrorMessages() != null)
                    ? String.join(", ", validateResp.getErrorMessages())
                    : "Menu item validation failed.";
            throw new IllegalArgumentException("Order validation failed: " + errors);
        }

        // 2. Initialize Order in PENDING state
        String orderNumber = "CRV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setUserId(request.getUserId());
        order.setCustomerName(request.getCustomerName());
        order.setCustomerEmail(request.getCustomerEmail());
        order.setRestaurantId(request.getRestaurantId());
        order.setRestaurantName(validateResp.getRestaurantName());
        order.setTotalAmount(validateResp.getCalculatedTotal());
        order.setStatus(OrderStatus.PENDING);
        order.setDeliveryAddress(request.getDeliveryAddress());

        for (ValidateItemsResponse.ValidatedItemInfo info : validateResp.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setMenuItemId(info.getMenuItemId());
            orderItem.setItemName(info.getName());
            orderItem.setUnitPrice(info.getUnitPrice());
            orderItem.setQuantity(info.getQuantity());
            orderItem.setSubtotal(info.getSubtotal());
            order.addItem(orderItem);
        }

        Order pendingOrder = orderRepository.save(order);

        // 3. Inter-service call: Payment Service transaction authorization
        PaymentProcessRequest payReq = new PaymentProcessRequest(
                pendingOrder.getId(),
                request.getUserId(),
                pendingOrder.getTotalAmount(),
                request.getPaymentMethod(),
                "TXN-" + orderNumber
        );

        PaymentProcessResponse payResp;
        try {
            payResp = paymentClient.processPayment(payReq);
        } catch (Exception e) {
            pendingOrder.setStatus(OrderStatus.CANCELLED);
            pendingOrder.setFailureReason("Payment Service unreachable: " + e.getMessage());
            orderRepository.save(pendingOrder);
            throw new IllegalStateException("Payment processing failed: " + e.getMessage());
        }

        // 4. Update order state based on payment result
        if (payResp != null && payResp.isSuccess()) {
            pendingOrder.setStatus(OrderStatus.CONFIRMED);
            pendingOrder.setPaymentTransactionRef(payResp.getTransactionReference());
        } else {
            pendingOrder.setStatus(OrderStatus.CANCELLED);
            pendingOrder.setFailureReason(payResp != null ? payResp.getMessage() : "Payment rejected");
        }

        Order savedOrder = orderRepository.save(pendingOrder);
        return mapToOrderResponse(savedOrder);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        order.setStatus(newStatus);
        return mapToOrderResponse(orderRepository.save(order));
    }

    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        return mapToOrderResponse(order);
    }

    public List<OrderResponse> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getOrdersByRestaurantId(Long restaurantId) {
        return orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId).stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    public OrderTrackingResponse getOrderTracking(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        OrderTrackingResponse tracking = new OrderTrackingResponse();
        tracking.setOrderId(order.getId());
        tracking.setOrderNumber(order.getOrderNumber());
        tracking.setStatus(order.getStatus());
        tracking.setRestaurantName(order.getRestaurantName());
        tracking.setDeliveryAddress(order.getDeliveryAddress());
        tracking.setDeliveryPartnerName("Abhinav Singh (Delivery Fleet)");
        tracking.setDeliveryPartnerPhone("+91-9876543212");
        tracking.setUpdatedAt(order.getUpdatedAt());

        // Dynamic step progression
        List<OrderTrackingResponse.TrackingStep> steps = new ArrayList<>();
        OrderStatus st = order.getStatus();

        boolean isConfirmed = st == OrderStatus.CONFIRMED || st == OrderStatus.PREPARING || st == OrderStatus.OUT_FOR_DELIVERY || st == OrderStatus.DELIVERED;
        boolean isPreparing = st == OrderStatus.PREPARING || st == OrderStatus.OUT_FOR_DELIVERY || st == OrderStatus.DELIVERED;
        boolean isOut = st == OrderStatus.OUT_FOR_DELIVERY || st == OrderStatus.DELIVERED;
        boolean isDelivered = st == OrderStatus.DELIVERED;

        steps.add(new OrderTrackingResponse.TrackingStep("CONFIRMED", "Order Confirmed", "Restaurant received order & payment authorized", isConfirmed, st == OrderStatus.CONFIRMED));
        steps.add(new OrderTrackingResponse.TrackingStep("PREPARING", "Kitchen Preparing", "Chef is crafting your fresh meal", isPreparing, st == OrderStatus.PREPARING));
        steps.add(new OrderTrackingResponse.TrackingStep("OUT_FOR_DELIVERY", "Out for Delivery", "Rider Abhinav is en route to your address", isOut, st == OrderStatus.OUT_FOR_DELIVERY));
        steps.add(new OrderTrackingResponse.TrackingStep("DELIVERED", "Delivered", "Enjoy your hot gourmet meal!", isDelivered, st == OrderStatus.DELIVERED));

        int etaMinutes;
        switch (st) {
            case PENDING -> etaMinutes = 35;
            case CONFIRMED -> etaMinutes = 30;
            case PREPARING -> etaMinutes = 20;
            case OUT_FOR_DELIVERY -> etaMinutes = 10;
            case DELIVERED -> etaMinutes = 0;
            default -> etaMinutes = -1;
        }

        tracking.setEstimatedDeliveryMinutes(etaMinutes);
        tracking.setSteps(steps);
        return tracking;
    }

    public OrderResponse mapToOrderResponse(Order order) {
        OrderResponse resp = new OrderResponse();
        resp.setId(order.getId());
        resp.setOrderNumber(order.getOrderNumber());
        resp.setUserId(order.getUserId());
        resp.setCustomerName(order.getCustomerName());
        resp.setCustomerEmail(order.getCustomerEmail());
        resp.setRestaurantId(order.getRestaurantId());
        resp.setRestaurantName(order.getRestaurantName());
        resp.setTotalAmount(order.getTotalAmount());
        resp.setStatus(order.getStatus());
        resp.setDeliveryAddress(order.getDeliveryAddress());
        resp.setPaymentTransactionRef(order.getPaymentTransactionRef());
        resp.setFailureReason(order.getFailureReason());
        resp.setCreatedAt(order.getCreatedAt());

        if (order.getItems() != null) {
            resp.setItems(order.getItems().stream()
                    .map(item -> new OrderResponse.OrderItemDetail(
                            item.getMenuItemId(),
                            item.getItemName(),
                            item.getUnitPrice(),
                            item.getQuantity(),
                            item.getSubtotal()
                    ))
                    .collect(Collectors.toList()));
        }

        return resp;
    }
}
