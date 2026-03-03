---
layout: post
title: Nginx Practice in Windows - 2
date: 2013-10-19 14:17:00 +0800
tags: [nginx]
---

<h2>
Reference</h2>
<div>
<a href="http://blog.sina.com.cn/s/blog_6d579ff40100wk2j.html">Nginx 变量漫谈（二）</a><br />
<a href="http://nginx.org/en/docs/http/ngx_http_core_module.html#variables">Nginx Embedded Variables</a></div>
<h2>
Practice</h2>
<h3>
變數的有效範圍是 request, 所以就算不同 request 也可以使用變數</h3>
<div>
<ol>
<li>config nginx.conf<br />
<pre>    server {
        listen       8080;
        server_name  localhost;
        location / {
            root   html;
            index  index.html index.htm;
        }
        location /test {
            set $foo "hello";
            rewrite ^ /test2;
        }
        location /test2 {
            return 200 "${foo} world";
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>request "http://127.0.0.1:8080/test"
</li>
<li>get response:&nbsp;hello world</li>
</ol>
<div>
<h3>
使用 Nginx 內建變數</h3>
</div>
</div>
<div>
<ol>
<li>config nginx.conf
<pre>    server {
        listen       8080;
        server_name  localhost;
        location / {
            root   html;
            index  index.html index.htm;
        }
        location /test {
            return 200 "Your address:${remote_addr}:${remote_port}. nginx version:${nginx_version}. nginx pid:${pid}";
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>request "http://127.0.0.1:8080/test"</li>
<li>get response:&nbsp;Your address:127.0.0.1:53102. nginx version:1.4.3. nginx pid:8132</li>
<li>run&nbsp;tasklist /fi "imagename eq nginx.exe"<br />
<pre>C:\nginx-1.4.3&gt;tasklist /fi "imagename eq nginx.exe"

映像名稱                       PID 工作階段名稱      工作階段 #    RAM使用量
========================= ======== ================ =========== ============
nginx.exe                     4044 Console                    1      6,044 K
nginx.exe                     8132 Console                    1      6,400 K
</pre>
</li>
</ol>
<h3>
取得 request parameter value: ${arg_XXX}</h3>
</div>
<div>
<ol>
<li><span style="background-color: white; font-style: inherit; line-height: 13px;">Note: nginx 取 parameter 不分大小寫</span></li>
<li>config nginx.conf
<pre>    server {
        listen       8080;
        server_name  localhost;
        location / {
            root   html;
            index  index.html index.htm;
        }
        location /test {
     return 200 "The parameter abc value: ${arg_abc}";
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>request "http://127.0.0.1:8080/test?abc=qq"</li>
<li>get response:&nbsp;<span style="background-color: white; color: #222222; font-style: inherit; line-height: 13px;">The&nbsp;parameter&nbsp;abc&nbsp;value:&nbsp;qq</span></li>
<li>request "http://127.0.0.1:8080/test?Abc=qq"</li>
<li>get response:&nbsp;<span style="background-color: white; color: #222222; font-style: inherit; line-height: 13px;">The&nbsp;parameter&nbsp;abc&nbsp;value:&nbsp;qq&nbsp;</span></li>
</ol>
<h3>
取得 header value: ${http_XXX}</h3>
</div>
<div>
<ol>
<li>config nginx.conf
<pre>    server {
        listen       8080;
        server_name  localhost;
        location / {
            root   html;
            index  index.html index.htm;
        }
        location /test {
            return 200 "The header 'abc' value: ${http_abc}";
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request
<pre>GET /test HTTP/1.1
Host: 127.0.0.1:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
ABC: 123
</pre>
</li>
<li>get response
<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Sat, 19 Oct 2013 14:03:40 GMT
Content-Type: application/octet-stream
Content-Length: 27
Connection: close

The header 'abc' value: 123
</pre>
</li>
</ol>
<h3>
取得 cookie value: ${cookie_XXX}</h3>
</div>
<div>
<ol>
<li>config nginx.conf
<pre>    server {
        listen       8080;
        server_name  localhost;
        location / {
            root   html;
            index  index.html index.htm;
        }
        location /test {
            return 200 "The cookie 'abc' value: ${cookie_abc}";
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request
<pre>GET /test HTTP/1.1
Host: 127.0.0.1:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
Cookie: ABC=123
</pre>
</li>
<li>get response
<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Sat, 19 Oct 2013 14:09:30 GMT
Content-Type: application/octet-stream
Content-Length: 27
Connection: close

The cookie 'abc' value: 123
</pre>
</li>
</ol>
</div>
<div>
<br /></div>
