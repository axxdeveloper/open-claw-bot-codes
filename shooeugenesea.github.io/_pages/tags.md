---
layout: default
title: 標籤
permalink: /tags/
---

<div id="main" role="main">
  <div class="archive">

      <h2 class="archive__subtitle">總經</h2>
      {% assign macro_tags = "" | split: "" %}
      {% for tag in site.tags %}
        {% assign tag_name = tag[0] %}
        {% assign tag_posts = tag[1] %}
        {% assign has_macro = false %}
        {% for post in tag_posts %}
          {% if post.categories contains "macro" %}
            {% assign has_macro = true %}
            {% break %}
          {% endif %}
        {% endfor %}
        {% if has_macro %}
          {% assign macro_tags = macro_tags | push: tag_name %}
        {% endif %}
      {% endfor %}

      {% assign macro_tags_sorted = macro_tags | sort_natural %}
      <div class="tags-list" style="margin-bottom: 1.5rem;">
        {% for tag_name in macro_tags_sorted %}
          <a href="#macro-{{ tag_name | slugify }}" class="tag-chip">{{ tag_name }}
            {% assign count = 0 %}
            {% for post in site.tags[tag_name] %}
              {% if post.categories contains "macro" %}{% assign count = count | plus: 1 %}{% endif %}
            {% endfor %}
            <span class="tag-count">{{ count }}</span>
          </a>
        {% endfor %}
      </div>

      {% for tag_name in macro_tags_sorted %}
        <h3 id="macro-{{ tag_name | slugify }}" class="tag-heading">{{ tag_name }}</h3>
        <ul class="tag-posts">
          {% for post in site.tags[tag_name] %}
            {% if post.categories contains "macro" %}
              <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a> <span class="tag-date">{{ post.date | date: "%Y-%m-%d" }}</span></li>
            {% endif %}
          {% endfor %}
        </ul>
      {% endfor %}

      <h2 class="archive__subtitle" style="margin-top: 3rem;">技術</h2>
      {% assign tech_tags = "" | split: "" %}
      {% for tag in site.tags %}
        {% assign tag_name = tag[0] %}
        {% assign tag_posts = tag[1] %}
        {% assign has_tech = false %}
        {% for post in tag_posts %}
          {% unless post.categories contains "macro" %}
            {% assign has_tech = true %}
            {% break %}
          {% endunless %}
        {% endfor %}
        {% if has_tech %}
          {% assign tech_tags = tech_tags | push: tag_name %}
        {% endif %}
      {% endfor %}

      {% assign tech_tags_sorted = tech_tags | sort_natural %}
      <div class="tags-list" style="margin-bottom: 1.5rem;">
        {% for tag_name in tech_tags_sorted %}
          <a href="#tech-{{ tag_name | slugify }}" class="tag-chip">{{ tag_name }}
            {% assign count = 0 %}
            {% for post in site.tags[tag_name] %}
              {% unless post.categories contains "macro" %}{% assign count = count | plus: 1 %}{% endunless %}
            {% endfor %}
            <span class="tag-count">{{ count }}</span>
          </a>
        {% endfor %}
      </div>

      {% for tag_name in tech_tags_sorted %}
        <h3 id="tech-{{ tag_name | slugify }}" class="tag-heading">{{ tag_name }}</h3>
        <ul class="tag-posts">
          {% for post in site.tags[tag_name] %}
            {% unless post.categories contains "macro" %}
              <li><a href="{{ post.url | relative_url }}">{{ post.title }}</a> <span class="tag-date">{{ post.date | date: "%Y-%m-%d" }}</span></li>
            {% endunless %}
          {% endfor %}
        </ul>
      {% endfor %}

  </div>
</div>
