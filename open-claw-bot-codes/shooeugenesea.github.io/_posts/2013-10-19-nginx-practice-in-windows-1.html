---
layout: post
title: Nginx Practice in Windows - 1
date: 2013-10-19 11:14:00 +0800
tags: [nginx]
---

<h2>
Description</h2>
<div>
最近在練習 Nginx, 不過電腦的環境只有 Windows 也沒打算裝 VM,<br />
所以跟網路上文章的環境不太一樣, 在這紀錄怎麼在Windows上練習.</div>
<div>
不過最終應該還是要裝個 Linux 環境來練習比較好..</div>
<h2>
Reference</h2>
<div>
<a href="http://blog.sina.com.cn/s/blog_6d579ff40100wi7p.html">Nginx 变量漫谈（一）</a></div>
<h2>
Preparation</h2>
<div>
<ol>
<li>Download&nbsp;<a href="http://nginx.org/en/docs/windows.html">nginx for Windows</a></li>
<ol>
<li>下載後解壓縮</li>
<li>在 console mode 到解壓縮後的資料夾</li>
<li>開 nginx =&gt; start nginx</li>
<li>關 nginx =&gt; nginx -s stop</li>
<li>看 nginx process =&gt; tasklist /fi "imagename eq nginx.exe"</li>
<li>reload config =&gt; nginx -s reload</li>
</ol>
<li>Download&nbsp;<a href="https://chrome.google.com/webstore/detail/simple-rest-client/fhjcajmcbmldlhcimfajhfbgofnpcjmb">Simple REST Client for Chrome</a></li>
</ol>
<h2>
Practice</h2>
</div>
<h3>
用 set 定義變數</h3>
<div>
<ol>
<li>設定 nginx.conf, 加上 /test 這個 location, 用 set $foo 設定變數 response
</li>
<ol>
<li>如果要回傳的字串可以直接使用變數, 直接指定 $foo
<pre>    
    server {
        listen       8080;
        server_name  localhost;
        location / {
            root   html;
            index  index.html index.htm;
        }
        location /test {
            set $foo "hello world";
            return 200 "$foo";
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    } 
</pre>
</li>
<li>如果要回傳的字串需要在變數外再加東西,使 nginx 無法判斷變數, 就必須變成 ${foo}. <br />(注意不是每次都用 ${foo}, 而是 nginx 會無法判斷的時候才要 ${foo})<pre>    server {
        listen       8080;
        server_name  localhost;
        location / {
            root   html;
            index  index.html index.htm;
        }
        location /test {
            set $foo "hello";
            return 200 "${foo} world";
        }
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    } 
</pre>
</li>
</ol>
<li>run "nginx -s reload"</li>
<li>用 Simple REST Client 送出 GET 到 http://127.0.0.1:8080/test
<pre>GET /test HTTP/1.1
Host: 127.0.0.1:8080
Connection: keep-alive
User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36
Accept: */*
Accept-Encoding: gzip,deflate,sdch
Accept-Language: zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4
</pre>
</li>
<li>得到 response
<pre>HTTP/1.1 200 OK
Server: nginx/1.4.3
Date: Sat, 19 Oct 2013 11:12:59 GMT
Content-Type: application/octet-stream
Content-Length: 11
Connection: keep-alive

<span style="color: red;">hello world</span></pre>
</li>
</ol>
</div>
