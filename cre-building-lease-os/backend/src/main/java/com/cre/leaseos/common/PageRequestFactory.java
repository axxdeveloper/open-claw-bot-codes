package com.cre.leaseos.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public class PageRequestFactory {
  private PageRequestFactory() {}

  public static Pageable build(Integer page, Integer size, String sort, String defaultField) {
    int p = page == null || page < 0 ? 0 : page;
    int candidateSize = size == null ? 20 : size;
    int s = Math.max(1, Math.min(candidateSize, 100));

    String raw = (sort == null || sort.isBlank()) ? defaultField + ",desc" : sort;
    String[] parts = raw.split(",");
    String field = parts[0].trim();
    Sort.Direction direction =
        (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim()))
            ? Sort.Direction.ASC
            : Sort.Direction.DESC;

    return PageRequest.of(p, s, Sort.by(direction, field));
  }
}
