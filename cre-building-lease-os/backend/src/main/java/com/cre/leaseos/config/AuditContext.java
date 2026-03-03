package com.cre.leaseos.config;

public class AuditContext {
  private static final ThreadLocal<String> CURRENT_USER = new ThreadLocal<>();

  private AuditContext() {}

  public static void setUser(String userId) {
    CURRENT_USER.set((userId == null || userId.isBlank()) ? "system" : userId.trim());
  }

  public static String getCurrentUser() {
    String current = CURRENT_USER.get();
    return (current == null || current.isBlank()) ? "system" : current;
  }

  public static void clear() {
    CURRENT_USER.remove();
  }
}
