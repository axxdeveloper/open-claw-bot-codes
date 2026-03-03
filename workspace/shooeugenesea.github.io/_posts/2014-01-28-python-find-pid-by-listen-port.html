---
layout: post
title: python find pid by listen port
date: 2014-01-28 00:04:00 +0800
tags: [python]
---

<h2>
Codes</h2>
<div>
<pre>
import sys
import subprocess
import shlex
import re

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
    
pid = find_pid_by_listen_port(9160)
print(pid)
</pre>
</div>
