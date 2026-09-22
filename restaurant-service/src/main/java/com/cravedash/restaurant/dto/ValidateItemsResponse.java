package com.cravedash.restaurant.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ValidateItemsResponse {
    private boolean valid;
    private String restaurantName;
    private BigDecimal calculatedTotal;
    private List<ValidatedItemInfo> items = new ArrayList<>();
    private List<String> errorMessages = new ArrayList<>();

    public ValidateItemsResponse() {}

    public ValidateItemsResponse(boolean valid, String restaurantName, BigDecimal calculatedTotal, List<ValidatedItemInfo> items, List<String> errorMessages) {
        this.valid = valid;
        this.restaurantName = restaurantName;
        this.calculatedTotal = calculatedTotal;
        this.items = items;
        this.errorMessages = errorMessages;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getRestaurantName() {
        return restaurantName;
    }

    public void setRestaurantName(String restaurantName) {
        this.restaurantName = restaurantName;
    }

    public BigDecimal getCalculatedTotal() {
        return calculatedTotal;
    }

    public void setCalculatedTotal(BigDecimal calculatedTotal) {
        this.calculatedTotal = calculatedTotal;
    }

    public List<ValidatedItemInfo> getItems() {
        return items;
    }

    public void setItems(List<ValidatedItemInfo> items) {
        this.items = items;
    }

    public List<String> getErrorMessages() {
        return errorMessages;
    }

    public void setErrorMessages(List<String> errorMessages) {
        this.errorMessages = errorMessages;
    }

    public static class ValidatedItemInfo {
        private Long menuItemId;
        private String name;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal subtotal;

        public ValidatedItemInfo() {}

        public ValidatedItemInfo(Long menuItemId, String name, BigDecimal unitPrice, Integer quantity, BigDecimal subtotal) {
            this.menuItemId = menuItemId;
            this.name = name;
            this.unitPrice = unitPrice;
            this.quantity = quantity;
            this.subtotal = subtotal;
        }

        public Long getMenuItemId() {
            return menuItemId;
        }

        public void setMenuItemId(Long menuItemId) {
            this.menuItemId = menuItemId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public BigDecimal getUnitPrice() {
            return unitPrice;
        }

        public void setUnitPrice(BigDecimal unitPrice) {
            this.unitPrice = unitPrice;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getSubtotal() {
            return subtotal;
        }

        public void setSubtotal(BigDecimal subtotal) {
            this.subtotal = subtotal;
        }
    }
}
