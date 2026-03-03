---
layout: post
title: Nginx Practice in Windows - 5 static content
date: 2013-10-28 15:51:00 +0800
tags: [nginx]
---

<h2>
Description</h2>
<div>
使用 nginx 主要目的之一就是要存放靜態檔如 html 或圖片<br />
<h2>
Reference</h2>
</div>
<div>
<a href="http://nginx.org/en/docs/beginners_guide.html#static">Serving Static Content</a></div>
<h2>
Practice</h2>
<h3>
設定讓 "GET /" 的 request 首頁導向 testhtml/data/www/index.html</h3>
<div>
<ol>
<li>prepare folders<pre>D:\nginx-1.4.3\nginx.exe
D:\nginx-1.4.3\conf\nginx.conf
D:\nginx-1.4.3\testhtml\data\www\index.html
D:\nginx-1.4.3\testhtml\data\images
</pre>
</li>
<li>edit index.html
<pre>Hello!, This is testhtml\data\www\index.html</pre>
</li>
<li>setup nginx.conf
<pre>    server {
        listen       8080;
        server_name  127.0.0.1;
        location / {
            root   testhtml/data/www;
            index  index.html;
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request
<pre>GET / HTTP/1.1
Host: server1:8080
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
Date: Sun, 27 Oct 2013 23:22:23 GMT
Content-Type: text/html
Content-Length: 44
Last-Modified: Sun, 27 Oct 2013 23:22:19 GMT
Connection: close
ETag: "526da02b-2c"
Accept-Ranges: bytes

Hello!, This is testhtml\data\www\index.html
</pre>
</li>
</ol>
<h3>
設定去取 "/" 以外的檔案
</h3>
</div>
<div>
<ol>
<li>prepare files
<pre>D:\nginx-1.4.3\testhtml\data\www\www.html
D:\nginx-1.4.3\testhtml\data\data.html
D:\nginx-1.4.3\conf\nginx.conf
</pre>
</li>
<li>edit data.html
<pre>Hello!, This is data.html&nbsp;</pre>
</li>
<li>edit www.html<pre>Hello!, This is www.html
</pre>
</li>
<li>setup nginx.conf
<pre>    server {
        listen       8080;
        server_name  127.0.0.1;
        location / {
            root   testhtml/data/www;
            index  www.html;
        }
        location /data/ {
            root   testhtml;
            index  data.html;
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET / HTTP/1.1
Host: server1:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Mon, 28 Oct 2013 15:33:05 GMT
Content-Type: text/html
Content-Length: 24
Last-Modified: Sun, 27 Oct 2013 23:32:37 GMT
Connection: close
ETag: "526da295-18"
Accept-Ranges: bytes

Hello!, This is www.html</pre>
</li>
<li>send request (這個 request 是去要 /data/ 的 resource, 其實也可以對上 "/" 的 location, 不過 nginx 會選擇 prefix 對應最長的 location)<pre>GET /data/ HTTP/1.1
Host: server1:8080
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
Date: Mon, 28 Oct 2013 15:49:13 GMT
Content-Type: text/html
Content-Length: 25
Last-Modified: Sun, 27 Oct 2013 23:32:15 GMT
Connection: close
ETag: "526da27f-19"
Accept-Ranges: bytes

Hello!, This is data.html
</pre>
</li>
<li>send request (這個 request 是去找 "/" 的 index.html)<pre>GET /data/www/www.html HTTP/1.1
Host: server1:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Mon, 28 Oct 2013 15:50:23 GMT
Content-Type: text/html
Content-Length: 24
Last-Modified: Sun, 27 Oct 2013 23:32:37 GMT
Connection: close
ETag: "526da295-18"
Accept-Ranges: bytes

Hello!, This is www.html</pre>
</li>
</ol>
<div>
<h3>
如果多個 location 使用同樣的 root, 只要在 server 區塊中設定 root 即可</h3>
</div>
</div>
<div>
<ol>
<li>prepare files<pre>D:\nginx-1.4.3\testhtml\testhtml.html
D:\nginx-1.4.3\testhtml\data\data.html
D:\nginx-1.4.3\conf\nginx.conf
</pre>
</li>
<li>edit data.html<pre>Hello!, This is data.html&nbsp;</pre>
</li>
<li>edit testhtml.html<pre>Hello!, This is testhtml.html
</pre>
</li>
<li>setup nginx.conf<pre>    server {
        listen       8080;
        server_name  127.0.0.1;
        root   testhtml;
        location / {
            index  testhtml.html;
        }
        location /data/ {
            index  data.html;
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET / HTTP/1.1
Host: server1:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Mon, 28 Oct 2013 23:51:46 GMT
Content-Type: text/html
Content-Length: 29
Last-Modified: Mon, 28 Oct 2013 23:45:17 GMT
Connection: close
ETag: "526ef70d-1d"
Accept-Ranges: bytes

Hello!, This is testhtml.html</pre>
</li>
<li>send request<pre>GET /data/ HTTP/1.1
Host: server1:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Mon, 28 Oct 2013 23:52:29 GMT
Content-Type: text/html
Content-Length: 25
Last-Modified: Sun, 27 Oct 2013 23:32:15 GMT
Connection: close
ETag: "526da27f-19"
Accept-Ranges: bytes

Hello!, This is data.html</pre>
</li>
</ol>
<div>
<br /></div>
</div>
