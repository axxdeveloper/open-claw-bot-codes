package com.cre.leaseos.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {
  private final String code;
  private final HttpStatus status;
  private final Object details;

  public ApiException(String code, String message, HttpStatus status) {
    this(code, message, status, null);
  }

  public ApiException(String code, String message, HttpStatus status, Object details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
