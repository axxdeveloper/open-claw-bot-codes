---
layout: post
title: Nginx Practice in Windows - 4 server names
date: 2013-10-27 12:37:00 +0800
tags: [nginx]
---

<h2>
Description</h2>
<pre>    server {
        listen       127.0.0.1:8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
</pre>
<div>
在這個 server 設定中, server_name 是拿來比對 request header "HOST" 然後決定交由哪個 server 提供服務.<br />
這個 server_name 除了能服務完全相同的 HOST 以外還支援 * (wildcard) 跟 regular expression</div>
<h2>
Reference</h2>
<div>
<a href="http://nginx.org/en/docs/http/server_names.html">Server names</a></div>
<h2>
Practice</h2>
<div>
<h3>
如果與 HOST 完全一樣, 就取 HOST 完全一樣的 server.</h3>
</div>
<div>
<ol>
<li>setup nginx.conf (這裡 ~開頭就表示要用 regular expression)<br /><pre>    server {
        listen       127.0.0.1:8080 default;
        server_name  *.server1;
        location /test {
            return 200 '*.server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  www.*;
        location /test {
            return 200 'www.*';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  ~.*server1.*;
        location /test {
            return 200 '~.*server1.*';
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request
<pre>GET /test HTTP/1.1
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
Date: Wed, 23 Oct 2013 22:36:16 GMT
Content-Type: application/octet-stream
Content-Length: 7
Connection: close

server1
</pre>
</li>
</ol>
<h3>
一個 server_name 不能指定兩個 *</h3>
</div>
<div>
<ol>
<li>setup nginx.conf
<pre>    server {
        listen       127.0.0.1:8080;
        server_name  *.server1.*;
        location /test {
            return 200 '*.server1';
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>got error message
<pre>nginx: [emerg] invalid server name or wildcard "*.server1.*" on 127.0.0.1:8080
</pre>
</li>
</ol>
<h3>
當 * 開頭跟 * 結尾的兩個 server_name 都 mapping 到一個 request 時, 用 * 開頭的 server 服務</h3>
</div>
<div>
<ol>
<li>setup nginx.conf
<pre>    server {
        listen       127.0.0.1:8080;
        server_name  *.server1;
        location /test {
            return 200 '*.server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  www.*;
        location /test {
            return 200 'server1.*';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
    server {
        listen       127.0.0.1:8080 default;
        server_name  ~.*server1.*;
        location /test {
            return 200 '~.*server1.*';
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<br />
<pre>GET /test HTTP/1.1
Host: <span style="color: red;">www.server1</span>
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
Date: Wed, 23 Oct 2013 22:58:48 GMT
Content-Type: application/octet-stream
Content-Length: 9
Connection: close

<span style="color: red;">*.server1</span>
</pre>
</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request (這個 request 的 Host 比較長, 但 nginx 仍可以判斷)<br /><pre>GET /test HTTP/1.1
Host: <span style="color: red;">www.abc.qqq.hahaha.server1</span>
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Wed, 23 Oct 2013 22:58:48 GMT
Content-Type: application/octet-stream
Content-Length: 9
Connection: close

<span style="color: red;">*.server1</span></pre>
</li>
</ol>
<h3>
如果 mapping 到的 * 開頭的 server 不止一個, 就取 mapping 到最長的 server</h3>
</div>
<div>
<ol>
<li>setup nginx.conf
<pre><span style="background-color: yellow;">    server {
        listen       127.0.0.1:8080;
        server_name  <span style="color: red;">*.server1</span>;
        location /test {
            return 200 '*.server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  <span style="color: red;">*.hahaha.server1</span>;
        location /test {
            return 200 '*.hahaha.server1';
        }
    } </span>
    server {
        listen       127.0.0.1:8080;
        server_name  www.*;
        location /test {
            return 200 'www.*';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
    server {
        listen       127.0.0.1:8080 default;
        server_name  ~.*server1.*;
        location /test {
            return 200 '~.*server1.*';
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<br /><pre>GET /test HTTP/1.1
Host: <span style="color: red;">www.abc.qqq.hahaha.server1</span>
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4

</pre>
</li>
<li>get response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Wed, 23 Oct 2013 23:07:06 GMT
Content-Type: application/octet-stream
Content-Length: 16
Connection: close

<span style="color: red;">*.hahaha.server1</span></pre>
</li>
</ol>
<h3>
如果對應不到 * 開頭的 server_name, 就找 mapping 到最長的以 * 結尾的 server_name</h3>
</div>
<div>
<ol>
<li>setup nginx.conf<pre>    server {
        listen       127.0.0.1:8080;
        server_name  *.server1;
        location /test {
            return 200 '*.server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  *.hahaha.server1;
        location /test {
            return 200 '*.hahaha.server1';
        }
    } 
<span style="background-color: yellow;">    server {
        listen       127.0.0.1:8080;
        server_name  <span style="color: red;">www.*</span>;
        location /test {
            return 200 'www.*';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  <span style="color: red;">www.abc.qqq.*</span>;
        location /test {
            return 200 'www.abc.qqq.*';
        }
    } </span>
    server {
        listen       127.0.0.1:8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
    server {
        listen       127.0.0.1:8080 default;
        server_name  ~.*server1.*;
        location /test {
            return 200 '~.*server1.*';
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<br /><pre>GET /test HTTP/1.1
Host: <span style="color: red;">www.abc.qqq.hahaha.server1.net</span>
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4

</pre>
</li>
<li>get response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Wed, 23 Oct 2013 23:13:59 GMT
Content-Type: application/octet-stream
Content-Length: 13
Connection: close

<span style="color: red;">www.abc.qqq.*</span></pre>
</li>
</ol>
</div>
<h3>
"*" 只能出現在 server_name 的開頭或結尾, 不能放中間</h3>
<div>
<ol>
<li>setup nginx.conf<pre>    server {
        listen       127.0.0.1:8080;
        server_name  *.server1.*;
        location /test {
            return 200 '*.server1.*';
        }
    } 
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>got error message<pre>nginx: [emerg] invalid server name or wildcard "*.server1.*" on 127.0.0.1:8080</pre>
</li>
</ol>
</div>
<h3>
如果 * 也都對應不到 server_name, 就用 regular expression (~ 開頭) 找第一個對應到的 server_name</h3>
<div>
<ol>
<li>setup nginx.conf
<pre>    server {
        listen       127.0.0.1:8080;
        server_name  *.server1;
        location /test {
            return 200 '*.server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  *.hahaha.server1;
        location /test {
            return 200 '*.hahaha.server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  www.*;
        location /test {
            return 200 'www.*';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  www.abc.qqq.*;
        location /test {
            return 200 'www.abc.qqq.*';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
<span style="background-color: yellow;">    server {
        listen       127.0.0.1:8080;
        server_name  ~.*server1.*;
        location /test {
            return 200 '~.*server1.*';
        }
    } 
    server {
        listen       127.0.0.1:8080 default;
        server_name  ~.*abc\.qqq\.hahaha\.server1.*;
        location /test {
            return 200 '~.*abc\.qqq\.hahaha\.server1.*';
        }
    } </span>
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<br /><pre>GET /test HTTP/1.1
Host: xyz.abc.qqq.hahaha.server1.net
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4

</pre>
</li>
<li>get response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Wed, 23 Oct 2013 23:37:15 GMT
Content-Type: application/octet-stream
Content-Length: 13
Connection: close

~.*server1.*</pre>
</li>
<li>setup nginx.conf<pre>    server {
        listen       127.0.0.1:8080;
        server_name  *.server1;
        location /test {
            return 200 '*.server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  *.hahaha.server1;
        location /test {
            return 200 '*.hahaha.server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  www.*;
        location /test {
            return 200 'www.*';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  www.abc.qqq.*;
        location /test {
            return 200 'www.abc.qqq.*';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } <span style="background-color: yellow;">
    server {
        listen       127.0.0.1:8080 default;
        server_name  ~.*abc\.qqq\.hahaha\.server1.*;
        location /test {
            return 200 '~.*abc\.qqq\.hahaha\.server1.*';
        }
    } 
</span></pre>
<pre><pre><span style="background-color: yellow;">    server {
        listen       127.0.0.1:8080;
        server_name  ~.*server1.*;
        location /test {
            return 200 '~.*server1.*';
        }
    } </span></pre>
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<br /><pre>GET /test HTTP/1.1
Host: xyz.abc.qqq.hahaha.server1.net
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4

</pre>
</li>
<li>get response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Wed, 23 Oct 2013 23:39:05 GMT
Content-Type: application/octet-stream
Content-Length: 31
Connection: close

~.*abc\.qqq\.hahaha\.server1.*</pre>
</li>
</ol>
<h3>
如果 server_name 的 regular expression 包含 "{" 跟 "}", 就必須用 "" 把 regular expression 包起來, 否則 nginx 會報錯</h3>
</div>
<div>
<ol>
<li>setup nginx.conf<pre>    server {
        listen       127.0.0.1:8080 default;
        server_name  ~.*abc\.q{3}\.hahaha\.server1.*;
        location /test {
            return 200 '~.*abc\.q{3}\.hahaha\.server1.*';
        }
    }</pre>
<span style="font-family: monospace;"><span style="white-space: pre;">&nbsp;</span></span></li>
<li>run "nginx -s reload"</li>
<li>get error message
<pre>nginx: [emerg] directive "server_name" is not terminated by ";" in C:\Users\isaac\Downloads\nginx-1.4.3\nginx-1.4.3/conf/nginx.conf:72
</pre>
</li>
<li>setup nginx.conf<pre>    server {
        listen       127.0.0.1:8080;
        server_name  *.server1;
        location /test {
            return 200 '*.server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  *.hahaha.server1;
        location /test {
            return 200 '*.hahaha.server1';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  www.*;
        location /test {
            return 200 'www.*';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  www.abc.qqq.*;
        location /test {
            return 200 'www.abc.qqq.*';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  server1;
        location /test {
            return 200 'server1';
        }
    } 
    server {
        listen       127.0.0.1:8080 default;
        server_name  "~.*abc\.q{3}\.hahaha\.server1.*";
        location /test {
            return 200 '~.*abc\.q{3}\.hahaha\.server1.*';
        }
    } 
    server {
        listen       127.0.0.1:8080;
        server_name  ~.*server1.*;
        location /test {
            return 200 '~.*server1.*';
        }
    }</pre>
<span style="font-family: monospace;"><span style="white-space: pre;">&nbsp;</span></span></li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<br /><pre>GET /test HTTP/1.1
Host: xyz.abc.qqq.hahaha.server1.net
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4

</pre>
</li>
<li>get response<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Wed, 23 Oct 2013 23:51:10 GMT
Content-Type: application/octet-stream
Content-Length: 31
Connection: close

~.*abc\.q{3}\.hahaha\.server1.*</pre>
</li>
</ol>
</div>
<div>
<h3>
在 server_name 可用 regular expression 替 mapping 到的值命名成變數以便在之後使用</h3>
</div>
<div>
<ol>
<li>setup nginx.conf
<pre>    server {
        listen       127.0.0.1:8080;
        server_name  ~(?P<servicename>.*)\.server1.*;
        location /test {
            return 200 'you request ${serviceName} service, service_name pattern ~(?P<servicename>.*)\.server1.* is Python compatible syntax, supported since PCRE-4.0';
        }
    } 
    server {
        listen       127.0.0.1:8081;
        server_name  ~(?<servicename>.*)\.server1.*;
        location /test {
            return 200 'you request ${serviceName} service, service_name pattern ~(?<servicename>.*)\.server1.* is Perl 5.10 compatible syntax, supported since PCRE-7.0';
        }
    } 
</servicename></servicename></servicename></servicename></pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request
<pre>GET /test HTTP/1.1
Host: tw.mail.server1.net
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
Date: Sun, 27 Oct 2013 05:14:53 GMT
Content-Type: application/octet-stream
Content-Length: 135
Connection: close

you request tw.mail service, service_name pattern ~(?P<servicename>.*)\.server1.* is Python compatible syntax, supported since PCRE-4.0
</servicename></pre>
</li>
<li>run "telnet 127.0.0.1 8081"</li>
<li>send request
<pre>GET /test HTTP/1.1
Host: tw.mail.server1.net
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
Date: Sun, 27 Oct 2013 05:16:06 GMT
Content-Type: application/octet-stream
Content-Length: 137
Connection: close

you request tw.mail service, service_name pattern ~(?<servicename>.*)\.server1.* is Perl 5.10 compatible syntax, supported since PCRE-7.0
</servicename>
</pre>
</li>
</ol>
</div>
<div>
<div>
<h3>
在 server_name 透過 regular expression 將 mapping 到的值可在之後用數字編號當變數使用</h3>
</div>
<div>
<ol>
<li>setup nginx.conf<pre><servicename><servicename><servicename><servicename>    server {
        listen       127.0.0.1:8080;
        server_name  ~(.*)\.(.*);
        location /test {
            return 200 'you request service "$1" in domain "$2"';
        }
    } 
</servicename></servicename></servicename></servicename></pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET /test HTTP/1.1
Host: mail.server1
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre><servicename>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Sun, 27 Oct 2013 05:22:37 GMT
Content-Type: application/octet-stream
Content-Length: 46
Connection: close

you request service "mail" in domain "server1"
</servicename></pre>
</li>
</ol>
<h3>
如果沒指定 server_name, nginx 就會用 hostname 作為 server_name</h3>
</div>
</div>
<div>
<ol>
<li>setup nginx.conf<pre><servicename>    server {
        listen       127.0.0.1:8080;
        location /test {
            return 200 'you request ${hostname}';
        }
    }  
</servicename></pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET /test HTTP/1.1
Host: 127.0.0.1
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre><servicename>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Sun, 27 Oct 2013 05:41:41 GMT
Content-Type: application/octet-stream
Content-Length: 20
Connection: close

you request isaac-pc</servicename></pre>
</li>
</ol>
<div>
<h2>
</h2>
</div>
</div>
<div>
<h3>
設定一個"全部"的 server_name</h3>
</div>
<div>
<ol>
<li>setup nginx.conf
<pre>    server {
        listen       8080;
        server_name  _;
        location / {
            return 200 'you request ${http_Host}';
        }
    }
</pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET / HTTP/1.1
Host: abc:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre><servicename>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Wed, 30 Oct 2013 23:39:30 GMT
Content-Type: application/octet-stream
Content-Length: 20
Connection: close

you request abc:8080</servicename></pre>
</li>
<li>setup nginx.conf<pre>    server {
        listen       8080;
        server_name  --;
        location / {
            return 200 'you request ${http_Host}';
        }
    }  </pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET / HTTP/1.1
Host: abc:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre><servicename>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Wed, 30 Oct 2013 23:39:30 GMT
Content-Type: application/octet-stream
Content-Length: 20
Connection: close

you request abc:8080</servicename></pre>
</li>
<li>setup nginx.conf</li>
<li><pre>    server {
        listen       8080;
        server_name  !@#;
        location / {
            return 200 'you request ${http_Host}';
        }
    }  </pre>
</li>
<li>run "nginx -s reload"</li>
<li>run "telnet 127.0.0.1 8080"</li>
<li>send request<pre>GET / HTTP/1.1
Host: abc:8080
Connection: close
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>get response<pre><servicename>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Wed, 30 Oct 2013 23:39:30 GMT
Content-Type: application/octet-stream
Content-Length: 20
Connection: close

you request abc:8080</servicename></pre>
</li>
</ol>
</div>
