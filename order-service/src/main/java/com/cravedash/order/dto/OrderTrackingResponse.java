package com.cravedash.order.dto;

import com.cravedash.order.model.OrderStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class OrderTrackingResponse {
    private Long orderId;
    private String orderNumber;
    private OrderStatus status;
    private String restaurantName;
    private Integer estimatedDeliveryMinutes;
    private String deliveryPartnerName;
    private String deliveryPartnerPhone;
    private String deliveryAddress;
    private List<TrackingStep> steps = new ArrayList<>();
    private LocalDateTime updatedAt;

    public OrderTrackingResponse() {}

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getRestaurantName() {
        return restaurantName;
    }

    public void setRestaurantName(String restaurantName) {
        this.restaurantName = restaurantName;
    }

    public Integer getEstimatedDeliveryMinutes() {
        return estimatedDeliveryMinutes;
    }

    public void setEstimatedDeliveryMinutes(Integer estimatedDeliveryMinutes) {
        this.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
    }

    public String getDeliveryPartnerName() {
        return deliveryPartnerName;
    }

    public void setDeliveryPartnerName(String deliveryPartnerName) {
        this.deliveryPartnerName = deliveryPartnerName;
    }

    public String getDeliveryPartnerPhone() {
        return deliveryPartnerPhone;
    }

    public void setDeliveryPartnerPhone(String deliveryPartnerPhone) {
        this.deliveryPartnerPhone = deliveryPartnerPhone;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public List<TrackingStep> getSteps() {
        return steps;
    }

    public void setSteps(List<TrackingStep> steps) {
        this.steps = steps;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static class TrackingStep {
        private String stepCode;
        private String title;
        private String description;
        private boolean completed;
        private boolean current;

        public TrackingStep() {}

        public TrackingStep(String stepCode, String title, String description, boolean completed, boolean current) {
            this.stepCode = stepCode;
            this.title = title;
            this.description = description;
            this.completed = completed;
            this.current = current;
        }

        public String getStepCode() {
            return stepCode;
        }

        public void setStepCode(String stepCode) {
            this.stepCode = stepCode;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public boolean isCompleted() {
            return completed;
        }

        public void setCompleted(boolean completed) {
            this.completed = completed;
        }

        public boolean isCurrent() {
            return current;
        }

        public void setCurrent(boolean current) {
            this.current = current;
        }
    }
}
