package com.cre.leaseos.common;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ApiResponse<T> {
  private boolean ok;
  private T data;
  private ApiError error;

  public static <T> ApiResponse<T> ok(T data) {
    return new ApiResponse<>(true, data, null);
  }

  public static ApiResponse<Void> error(String code, String message, Object details) {
    return new ApiResponse<>(false, null, new ApiError(code, message, details));
  }
}
