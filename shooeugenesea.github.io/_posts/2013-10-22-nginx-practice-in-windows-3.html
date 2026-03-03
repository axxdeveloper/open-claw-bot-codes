---
layout: post
title: Nginx Practice in Windows - 3
date: 2013-10-22 02:09:00 +0800
tags: [nginx]
---

<h2>
Reference</h2>
<div>
<a href="http://nginx.org/en/docs/http/request_processing.html">How nginx processes a request</a></div>
<h2>
Description</h2>
<div>
<pre>    server {
        listen       8080;
        server_name  example.com;
        location /test {
           return 200 'example.com';
        }
    }
</pre>
<div>
nginx 這個 server 區塊的設定中, server_name 是用來判斷 request 的 Host header 是打算導給哪個 server. 比方說這個例子就是如果 header 指定了 example.com 會導向這個 server.</div>
</div>
<h2>
Practice</h2>
<h3>
如果有找到與 request header 的 Host 相對應的 server, 就會導過去</h3>
<div>
<ol>
<li>setup nginx.conf<pre>    server {
        listen       8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
    server {
        listen       8080;
        server_name  server2;
        location /test {
            return 200 'server2';
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET /test HTTP/1.1
Host: server2:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response
<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Mon, 21 Oct 2013 23:04:24 GMT
Content-Type: application/octet-stream
Content-Length: 7
Connection: close

server2
</pre>
</li>
</ol>
</div>
<h3>
沒有指定誰是預設 server 而且透過 request header 的 Host 又找不到相對應的 server_name, 就會回傳第一個.</h3>
<div>
<ol>
<li>setup nginx.conf
<pre>    server {
        listen       8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
    server {
        listen       8080;
        server_name  server2;
        location /test {
            return 200 'server2';
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
</pre>
</li>
<li>get response
<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Mon, 21 Oct 2013 22:55:05 GMT
Content-Type: application/octet-stream
Content-Length: 7
Connection: close

server1
</pre>
</li>
</ol>
<h3>
有指定 default_server, 當 request header Host 找不到相對應的 server_name 時, 就會導向 default server. (<span style="color: #990000;">文件上說0.8.21之後使用 default_server, 之前使用 default. 不過我在 nginx-1.4.3 for Windows 要使用 default 才可以. 是 Linux 版的才可改 default_server?</span>)</h3>
</div>
<div>
<ol>
<li>setup nginx.conf
<pre>    server {
        listen       8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
    server {
        listen       8080 default;
        server_name  server2;
        location /test {
            return 200 'server2';
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET /test HTTP/1.1
Host: 127.0.0.1:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response
<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Mon, 21 Oct 2013 22:59:23 GMT
Content-Type: application/octet-stream
Content-Length: 7
Connection: close

server2
</pre>
</li>
</ol>
</div>
<pre></pre>
<div>
<h3>
如果指定的 server 包含不同 ip, 那每個 ip 就會有自己的 default server.</h3>
</div>
<div>
<ol>
<li>setup nginx.conf<pre>    server {
        listen       127.0.0.1:8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  server2;
        location /test {
            return 200 'server2';
        }
    } 
 server {
        listen       127.0.0.2:8081;
        server_name  server3;
        location /test {
            return 200 'server3';
        }
    } 
    server {
        listen       127.0.0.2:8081;
        server_name  server4;
        location /test {
            return 200 'server4';
        }
    }
</pre>
<span style="font-family: monospace;"><span style="white-space: pre;">&nbsp;</span></span></li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET /test HTTP/1.1
Host: localhost
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4&nbsp;</pre>
</li>
<li>get responseget response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Mon, 21 Oct 2013 23:20:33 GMT
Content-Type: application/octet-stream
Content-Length: 7
Connection: close

server1</pre>
</li>
<li>run "telnet 127.0.0.2 8081"</li>
<li>send request<pre>GET /test HTTP/1.1
Host: localhost
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4&nbsp;</pre>
</li>
<li>get responseget response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Mon, 21 Oct 2013 23:21:52 GMT
Content-Type: application/octet-stream
Content-Length: 7
Connection: close

server3</pre>
</li>
<li>setup nginx.conf<pre>    server {
        listen       127.0.0.1:8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
    server {
        listen       127.0.0.1:8080 default;
        server_name  server2;
        location /test {
            return 200 'server2';
        }
    } 
 server {
        listen       127.0.0.2:8081;
        server_name  server3;
        location /test {
            return 200 'server3';
        }
    } 
    server {
        listen       127.0.0.2:8081 default;
        server_name  server4;
        location /test {
            return 200 'server4';
        }
    } 
</pre>
<span style="font-family: monospace;"><span style="white-space: pre;">&nbsp;</span></span></li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET /test HTTP/1.1
Host: localhost
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4&nbsp;</pre>
</li>
<li>get responseget response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Mon, 21 Oct 2013 23:20:33 GMT
Content-Type: application/octet-stream
Content-Length: 7
Connection: close

server2</pre>
</li>
<li>run "telnet 127.0.0.2 8081"</li>
<li>send request<pre>GET /test HTTP/1.1
Host: localhost
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4&nbsp;</pre>
</li>
<li>get responseget response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Mon, 21 Oct 2013 23:21:52 GMT
Content-Type: application/octet-stream
Content-Length: 7
Connection: close

server4</pre>
<div>
<br /></div>
</li>
</ol>
<div>
<br /></div>
</div>
