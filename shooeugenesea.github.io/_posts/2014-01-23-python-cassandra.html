---
layout: post
title: python http download cassandra
date: 2014-01-23 00:15:00 +0800
tags: [python]
---

<h3>
Reference</h3>
<div>
http://www.apache.org/dyn/closer.cgi?path=/cassandra/2.0.4/apache-cassandra-2.0.4-bin.tar.gz</div>
<div>
http://docs.python.org/3/library/urllib.request.html#module-urllib.request</div>
<h3>
Description</h3>
<div>
用 urllib 下載 cassandra 到本地</div>
<h3>
Codes</h3>
<div>
<h4>
簡單的方式</h4>
</div>
<div>
<pre>import urllib.request

with urllib.request.urlopen('http://ftp.tc.edu.tw/pub/Apache/cassandra/2.0.4/apache-cassandra-2.0.4-bin.tar.gz') as f:
    with open('d:/apache-cassandra-2.0.4-bin.tar.gz','wb') as target:
        target.write(f.read())
</pre>
<br />
<h4>
如果想要看進度可以這樣</h4>
</div>
<pre>import urllib.request

with urllib.request.urlopen('http://ftp.tc.edu.tw/pub/Apache/cassandra/2.0.4/apache-cassandra-2.0.4-bin.tar.gz') as f:
    with open('d:/apache-cassandra-2.0.4-bin.tar.gz','wb') as target:
        filesize = f.getheader('Content-Length')
        wrotesize = 0
        while True:
            if wrotesize == int(filesize):
                break
            wrotesize += target.write(f.read(1024))
            print('download...',wrotesize,'of',filesize)
            
</pre>
<h4>
想從公司內的 Maven download 還需要認證
</h4>
<pre>import urllib.request

pwdmgr = urllib.request.HTTPPasswordMgrWithDefaultRealm()
pwdmgr.add_password(None,'http://mvn.company.site','myid','mypw')
auth_handler = urllib.request.HTTPBasicAuthHandler(pwdmgr)
opener = urllib.request.build_opener(auth_handler)
urllib.request.install_opener(opener)
with urllib.request.urlopen('http://mvn.company.site/downloadfile.zip') as f:
    with open('d:/downloadfile.zip','wb') as target:
        target.write(f.read())
</pre>
<pre>
</pre>
<h4>
後記</h4>
<div>
還不太清楚&nbsp;HTTPBasicAuthHandler 的 realm 要怎麼指定正確,&nbsp;</div>
<div>
使用 Maven response 的 realm 也不行.<br />只好先用 HTTPPasswordMgrWithDefaultRealm 了...</div>
