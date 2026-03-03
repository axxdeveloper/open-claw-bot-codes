package com.cre.leaseos.common;

import java.util.LinkedHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiResponse<Void>> handleApi(ApiException e) {
    LinkedHashMap<String, Object> details = new LinkedHashMap<>();
    details.put("reasonCode", e.getCode());
    details.put("meta", e.getDetails());

    return ResponseEntity.status(e.getStatus())
        .body(ApiResponse.error(normalizeCode(e.getStatus()), e.getMessage(), details));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
    var details =
        e.getBindingResult().getFieldErrors().stream()
            .map(
                fe ->
                    java.util.Map.of(
                        "field", fe.getField(),
                        "message", fe.getDefaultMessage() == null ? "invalid" : fe.getDefaultMessage()))
            .toList();
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(ApiResponse.error("VALIDATION", "資料格式錯誤", details));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception e) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error("INTERNAL", "系統錯誤", null));
  }

  private String normalizeCode(HttpStatus status) {
    if (status == HttpStatus.NOT_FOUND) return "NOT_FOUND";
    if (status == HttpStatus.CONFLICT) return "CONFLICT";
    if (status == HttpStatus.BAD_REQUEST || status == HttpStatus.UNPROCESSABLE_ENTITY) {
      return "VALIDATION";
    }
    return "INTERNAL";
  }
}
