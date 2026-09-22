package com.cravedash.auth.config;

import com.cravedash.auth.model.Role;
import com.cravedash.auth.model.User;
import com.cravedash.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Always upsert demo accounts so password changes in code take effect
        upsertUser("om@cravedash.com",     "cravedash123", "Om Prakhar",      "+91-9876543210", Role.CONSUMER);
        upsertUser("mradul@cravedash.com", "cravedash123", "Mradul Dixit",    "+91-9876543211", Role.RESTAURANT_OWNER);
        upsertUser("abhinav@cravedash.com","cravedash123", "Abhinav Singh",   "+91-9876543212", Role.DELIVERY_PARTNER);
        upsertUser("admin@cravedash.com",  "admin123",     "CraveDash Admin", "+91-9876543213", Role.ADMIN);
    }

    private void upsertUser(String email, String rawPassword, String fullName, String phone, Role role) {
        userRepository.findByEmail(email).ifPresentOrElse(
            existing -> {
                // Update password and name every time to keep in sync with code
                existing.setPassword(passwordEncoder.encode(rawPassword));
                existing.setFullName(fullName);
                existing.setPhoneNumber(phone);
                existing.setRole(role);
                userRepository.save(existing);
            },
            () -> {
                com.cravedash.auth.model.User user = new com.cravedash.auth.model.User();
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode(rawPassword));
                user.setFullName(fullName);
                user.setPhoneNumber(phone);
                user.setRole(role);
                userRepository.save(user);
            }
        );
    }
}
