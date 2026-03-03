---
layout: post
title: python download text percent progress
date: 2014-01-26 14:41:00 +0800
tags: [python]
---

<h2>
Description</h2>
<div>
想學一下 Maven download 時候的 text percent progress</div>
<h2>
Codes</h2>
<div>
<pre>import sys
import math
import urllib.request

def http_download(download_url, download_file):
    with urllib.request.urlopen(download_url) as f:
        with open(download_file,'wb') as target:
            filesize = int(f.getheader('Content-Length'))
            wrotesize = 0
            while True:
                if wrotesize == int(filesize):
                    break
                wrotesize += target.write(f.read(1024))
                download_percent = math.ceil((wrotesize/filesize)*100)
                print('\rDownload {0} to {1} ... {2}%'.format(download_url,download_file,download_percent),end='')

if len(sys.argv) &lt; 3:
    print('Usage: {0} download_url download_file'.format(sys.argv[0]))
else:    
    download_url = sys.argv[1]
    download_file = sys.argv[2]
    http_download(download_url, download_file)
</pre>
</div>
<h2>
使用方式</h2>
<div>
<div>
<span style="background-color: black; color: white;">c:\workspace_python&gt;python test.py http://ftp.tc.edu.tw/pub/Apache/cassandra/2.0.4/apache-cassandra-2.0.4-bin.tar.gz d:/apache-cassandra-2.0.4-bin.tar.gz</span></div>
</div>
