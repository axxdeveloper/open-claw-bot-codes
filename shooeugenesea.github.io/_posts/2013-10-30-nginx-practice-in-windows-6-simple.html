---
layout: post
title: Nginx Practice in Windows - 6 simple proxy server
date: 2013-10-30 23:35:00 +0800
tags: [nginx]
---

<h2>
Description</h2>
<div>
使用 nginx 的一個主因是要支援 web application 放在別台機器上, 將相關的 request 導過去.</div>
<h2>
Reference</h2>
<div>
<a href="http://nginx.org/en/docs/beginners_guide.html#proxy">Setting Up a Simple Proxy Server</a></div>
<h2>
Practice</h2>
<div>
<ol>
<li>prepare files
<pre>D:\nginx-1.4.3\nginx.exe
D:\nginx-1.4.3\conf\nginx.conf
D:\nginx-1.4.3\testhtml\testhtml.html
D:\nginx-1.4.3\internal\internal.html
D:\nginx-1.4.3\internal\service\service.html
D:\nginx-1.4.3\internal\service\serviceA\serviceA.html
</pre>
</li>
<li>setup nginx.conf <br />(<span style="color: red;">注意 proxy_pass 的 127.0.0.1 要對應到 port 12345 的 server_name 127.0.0.1, 在練習的時候發現如果設定成 proxy_pass http://localhost:12345 那 nginx 就很容易遇到錯誤: 68 upstream timed out (10060: A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond) while connecting to upstream, client: 127.0.0.1, server: 127.0.0.1, request: "GET /service/serviceA/serviceA7.html HTTP/1.1</span>)<pre>    server {
        listen       8080;
        server_name  127.0.0.1;
        root         testhtml;
        location / {
            index testhtml.html;
        }
        location /service/ {
            proxy_pass http://127.0.0.1:12345;
        }
    } 
    server {
        listen       12345;
        server_name  127.0.0.1;
        root         internal;
        location / {
            index  internal.html;
        }        
        location /service/ {
            index  service.html;
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET /service/ HTTP/1.1
Host: 127.0.0.1:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre><servicename>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Wed, 30 Oct 2013 23:25:39 GMT
Content-Type: text/html
Content-Length: 20
Connection: close
Last-Modified: Wed, 30 Oct 2013 23:25:34 GMT
ETag: "5271956e-14"
Accept-Ranges: bytes

This is service.html</servicename></pre>
</li>
<li>如果把 debug log 打開, 就是把 nginx.conf 上的"#error_log &nbsp;logs/error.log &nbsp;debug;" 注解拿掉, 就可以看到 error.log 裡面出現下面這些 log, 看似 nginx 在 proxy_pass 的時候改寫了 http request 然後重新發一次. (不過說起來 proxy 本來就是在作這種事情就是了)<br /><br /><pre>2013/10/31 07:25:39 [debug] 4348#6716: *139 http script copy: "Host: "
2013/10/31 07:25:39 [debug] 4348#6716: *139 http script var: "127.0.0.1:12345"
2013/10/31 07:25:39 [debug] 4348#6716: *139 http script copy: "
"
2013/10/31 07:25:39 [debug] 4348#6716: *139 http script copy: "Connection: close
"
2013/10/31 07:25:39 [debug] 4348#6716: *139 http script copy: ""
2013/10/31 07:25:39 [debug] 4348#6716: *139 http script copy: ""
2013/10/31 07:25:39 [debug] 4348#6716: *139 http proxy header: "User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36"
2013/10/31 07:25:39 [debug] 4348#6716: *139 http proxy header: "Accept: */*"
2013/10/31 07:25:39 [debug] 4348#6716: *139 http proxy header: "Accept-Encoding: gzip,deflate,sdch"
2013/10/31 07:25:39 [debug] 4348#6716: *139 http proxy header: "Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4"
2013/10/31 07:25:39 [debug] 4348#6716: *139 http proxy header:
"GET /service/ HTTP/1.0
Host: 127.0.0.1:12345
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4</pre>
<pre>"</pre>
</li>
<li>send request<pre>GET /service/serviceA/serviceA.html HTTP/1.1
Host: 127.0.0.1:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre><servicename>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Wed, 30 Oct 2013 23:33:12 GMT
Content-Type: text/html
Content-Length: 21
Connection: close
Last-Modified: Wed, 30 Oct 2013 23:33:08 GMT
ETag: "52719734-15"
Accept-Ranges: bytes

This is serviceA.html</servicename></pre>
<div>
<br /></div>
</li>
</ol>
</div>
