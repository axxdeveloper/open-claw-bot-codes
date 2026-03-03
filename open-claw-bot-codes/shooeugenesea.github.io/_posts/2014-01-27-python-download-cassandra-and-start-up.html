---
layout: post
title: python download Cassandra and start up in Windows
date: 2014-01-27 15:08:00 +0800
tags: [python]
---

<h2>
Description</h2>
<div>
This program will kill existing Cassandra before deploy new one.</div>
<h2>
Codes</h2>
<div>
<pre>
import os
import shutil
import sys
import math
import urllib.request
import subprocess
import shlex
import signal
import time
import re
from datetime import date

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
    print()

def find_pid_by_listen_port(port):
    if sys.platform == 'win32':
        output = subprocess.check_output('netstat -a -n -o', universal_newlines=True)
        match = re.search('.*:{0} +.* +.+ +[0-9]+'.format(port),output)
        if match:
            return shlex.split(match.group(0))[-1]
        else:
            return None
    else:
        raise Exception('not support platform ' + sys.platform)
    
    
download_url = 'http://ftp.tc.edu.tw/pub/Apache/cassandra/2.0.4/apache-cassandra-2.0.4-bin.tar.gz'
download_file = 'd:/apache-cassandra-2.0.4-bin.tar.gz'
unzip_folder = 'd:/deploy/work/{0}/apache-cassandra-2.0.4-bin'.format(date.today().isoformat())
execute_folder = unzip_folder + '/apache-cassandra-2.0.4'
execute_path = execute_folder + '/bin/cassandra.bat'
executable = 'start cmd /c ' + execute_path
executable_argv = shlex.split(executable)
pid = find_pid_by_listen_port(9160)
if pid:
    print('kill process id',pid)
    os.kill(int(pid),signal.SIGTERM)
if os.path.exists('d:/deploy'):
    print('Delete d:/deploy')
    shutil.rmtree('d:/deploy')
http_download(download_url, download_file)
os.makedirs(unzip_folder)
print('unzip {0} to {1}'.format(download_file, unzip_folder))
shutil.unpack_archive(download_file, unzip_folder)
print('Execute',execute_path)
subprocess.Popen(executable_argv,shell=True)
    
</pre>
</div>
