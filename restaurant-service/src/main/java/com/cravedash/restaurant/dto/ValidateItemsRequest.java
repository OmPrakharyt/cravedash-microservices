package com.cravedash.restaurant.dto;

import java.util.List;

public class ValidateItemsRequest {
    private Long restaurantId;
    private List<OrderItemDto> items;

    public ValidateItemsRequest() {}

    public ValidateItemsRequest(Long restaurantId, List<OrderItemDto> items) {
        this.restaurantId = restaurantId;
        this.items = items;
    }

    public Long getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(Long restaurantId) {
        this.restaurantId = restaurantId;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }

    public static class OrderItemDto {
        private Long menuItemId;
        private Integer quantity;

        public OrderItemDto() {}

        public OrderItemDto(Long menuItemId, Integer quantity) {
            this.menuItemId = menuItemId;
            this.quantity = quantity;
        }

        public Long getMenuItemId() {
            return menuItemId;
        }

        public void setMenuItemId(Long menuItemId) {
            this.menuItemId = menuItemId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
}
