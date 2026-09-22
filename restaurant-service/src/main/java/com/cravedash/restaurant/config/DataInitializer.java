package com.cravedash.restaurant.config;

import com.cravedash.restaurant.model.MenuItem;
import com.cravedash.restaurant.model.Restaurant;
import com.cravedash.restaurant.repository.MenuItemRepository;
import com.cravedash.restaurant.repository.RestaurantRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    public DataInitializer(RestaurantRepository restaurantRepository, MenuItemRepository menuItemRepository) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @Override
    public void run(String... args) {
        if (restaurantRepository.count() == 0) {
            // 1. Gourmet Smash Burgers
            Restaurant r1 = restaurantRepository.save(new Restaurant(
                    null,
                    "Gourmet Smash & Grills",
                    "American",
                    4.8,
                    25,
                    "742 Evergreen Blvd, Central Square",
                    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
                    true
            ));

            menuItemRepository.saveAll(List.of(
                    new MenuItem(null, r1.getId(), "Truffle Smash Burger", "Double dry-aged Angus patty with black truffle aioli, aged cheddar & brioche bun", new BigDecimal("14.99"), "Burgers", true, "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400", 15),
                    new MenuItem(null, r1.getId(), "Crispy Bacon Smokehouse", "Smoked bacon, barbecue glaze, crispy onion strings and monterey jack", new BigDecimal("13.49"), "Burgers", true, "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400", 15),
                    new MenuItem(null, r1.getId(), "Parmesan Rosemary Fries", "Hand-cut Idaho potatoes tossed in coarse sea salt, rosemary and aged parmesan", new BigDecimal("5.99"), "Sides", true, "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400", 8),
                    new MenuItem(null, r1.getId(), "Salted Caramel Shake", "Hand-spun bourbon vanilla gelato with house-made salted caramel crunch", new BigDecimal("6.49"), "Beverages", true, "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400", 5)
            ));

            // 2. Royal Biryani & Kebabs
            Restaurant r2 = restaurantRepository.save(new Restaurant(
                    null,
                    "Royal Nizami Biryani & Kebabs",
                    "Indian",
                    4.9,
                    30,
                    "108 Heritage Row, Old Market",
                    "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600",
                    true
            ));

            menuItemRepository.saveAll(List.of(
                    new MenuItem(null, r2.getId(), "Hyderabadi Dum Biryani", "Fragrant slow-cooked aged basmati rice layered with spiced tender chicken and saffron", new BigDecimal("16.99"), "Main Course", true, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400", 25),
                    new MenuItem(null, r2.getId(), "Galouti Kebab Melt", "Melt-in-mouth smoked lamb patties infused with 24 royal secret spices", new BigDecimal("12.99"), "Starters", true, "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400", 18),
                    new MenuItem(null, r2.getId(), "Paneer Butter Masala", "Cottage cheese simmered in velvety tomato gravy enriched with fresh butter and cream", new BigDecimal("13.99"), "Main Course", true, "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400", 20),
                    new MenuItem(null, r2.getId(), "Garlic Butter Naan", "Clay oven roasted leavened flatbread brushed with roasted garlic and coriander", new BigDecimal("3.49"), "Breads", true, "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400", 6)
            ));

            // 3. Tokyo Ramen & Sushi Lab
            Restaurant r3 = restaurantRepository.save(new Restaurant(
                    null,
                    "Tokyo Ramen & Sushi Lab",
                    "Japanese",
                    4.7,
                    35,
                    "45 Cyber Hub, Tech District",
                    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600",
                    true
            ));

            menuItemRepository.saveAll(List.of(
                    new MenuItem(null, r3.getId(), "Tonkotsu Rich Broth Ramen", "18-hour simmered pork bone broth with chashu, ajitsuke tamago egg, nori & wavy noodles", new BigDecimal("15.50"), "Ramen", true, "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400", 20),
                    new MenuItem(null, r3.getId(), "Dragon Sushi Roll (8 pcs)", "Tempura shrimp, spicy tuna, fresh avocado with tobiko and sweet unagi drizzle", new BigDecimal("14.00"), "Sushi", true, "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400", 15),
                    new MenuItem(null, r3.getId(), "Pork Gyoza Dumplings", "Crispy pan-seared dumplings with ginger scallion dipping sauce", new BigDecimal("7.50"), "Appetizers", true, "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400", 10),
                    new MenuItem(null, r3.getId(), "Matcha Green Tea Crepe", "Layered Japanese ceremonial matcha mille crepe with sweet red bean", new BigDecimal("6.99"), "Desserts", true, "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400", 5)
            ));

            // 4. Bella Italia Trattoria
            Restaurant r4 = restaurantRepository.save(new Restaurant(
                    null,
                    "Bella Italia Artisan Trattoria",
                    "Italian",
                    4.85,
                    28,
                    "12 Harbor Walk, Marina Promenade",
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
                    true
            ));

            menuItemRepository.saveAll(List.of(
                    new MenuItem(null, r4.getId(), "Woodfired Burrata Margherita", "San Marzano D.O.P. tomato sauce, fresh creamy burrata, fragrant sweet basil", new BigDecimal("16.00"), "Pizza", true, "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400", 18),
                    new MenuItem(null, r4.getId(), "Tagliatelle Bolognese", "Handmade egg pasta ribbons with slow-braised beef ragu and Parmigiano-Reggiano", new BigDecimal("17.50"), "Pasta", true, "https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=400", 16),
                    new MenuItem(null, r4.getId(), "Classic Espresso Tiramisu", "Savoiardi ladyfingers soaked in espresso liqueur layered with mascarpone cream", new BigDecimal("7.99"), "Dessert", true, "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400", 5)
            ));
        }
    }
}
