---
layout: post
title: Docker - container - restart policy
date: 2019-08-21 18:20:00 +0800
tags: [docker]
---

<br />
<div>
<div>
<b><span style="font-size: 18pt;">Policies</span></b>:&nbsp;</div>
<ul>
<li><div>
always</div>
</li>
<li><div>
unless-stopped</div>
</li>
<li><div>
on-failure</div>
</li>
</ul>
<div>
<br /></div>
<div>
<b><span style="font-size: 16pt;">Always</span></b></div>
<ol>
<li><div>
Always restart</div>
</li>
<li><div>
Unless use command to stop it</div>
</li>
<li><div>
Restart when docker restart, even it has been stopped by command</div>
</li>
</ol>
<div>
Ex. docker container run -it {name} --restart always</div>
<div>
Ex. After exit the shell, container will stop because the only one process was killed. But it will be restarted right away.</div>
<div>
<div>
# Run container</div>
<div>
Liaos-MBP:scg-control liaoisaac$ docker container run -it ubuntu /bin/bash</div>
<div>
<br /></div>
<div>
# There is only one process -&gt; /bin/bash</div>
<div>
root@1888da48ff01:/# ps aux</div>
<div>
USER&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PID %CPU %MEM&nbsp;&nbsp;&nbsp;&nbsp;VSZ&nbsp;&nbsp;&nbsp;RSS TTY&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STAT START&nbsp;&nbsp;&nbsp;TIME COMMAND</div>
<div>
root&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1&nbsp;&nbsp;1.3&nbsp;&nbsp;0.1&nbsp;&nbsp;18504&nbsp;&nbsp;3352 pts/0&nbsp;&nbsp;&nbsp;&nbsp;Ss&nbsp;&nbsp;&nbsp;05:03&nbsp;&nbsp;&nbsp;0:00 /bin/bash</div>
<div>
root&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;11&nbsp;&nbsp;0.0&nbsp;&nbsp;0.1&nbsp;&nbsp;34396&nbsp;&nbsp;2912 pts/0&nbsp;&nbsp;&nbsp;&nbsp;R+&nbsp;&nbsp;&nbsp;05:03&nbsp;&nbsp;&nbsp;0:00 ps aux</div>
<div>
root@1888da48ff01:/# exit</div>
<div>
exit</div>
<div>
<br /></div>
<div>
# Once exit, container will be stopped because there is only one process in container</div>
<div>
Liaos-MBP:scg-control liaoisaac$ docker container ls</div>
<div>
CONTAINER ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IMAGE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COMMAND&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CREATED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PORTS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NAMES</div>
<div>
Liaos-MBP:scg-control liaoisaac$</div>
<div>
<br /></div>
<div>
# Specify --restart always after “run"</div>
<div>
Liaos-MBP:scg-control liaoisaac$ docker container run --restart always -it ubuntu /bin/bash</div>
<div>
root@912e47da3142:/# ps aux</div>
<div>
USER&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PID %CPU %MEM&nbsp;&nbsp;&nbsp;&nbsp;VSZ&nbsp;&nbsp;&nbsp;RSS TTY&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STAT START&nbsp;&nbsp;&nbsp;TIME COMMAND</div>
<div>
root&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1&nbsp;&nbsp;0.5&nbsp;&nbsp;0.1&nbsp;&nbsp;18504&nbsp;&nbsp;3444 pts/0&nbsp;&nbsp;&nbsp;&nbsp;Ss&nbsp;&nbsp;&nbsp;05:11&nbsp;&nbsp;&nbsp;0:00 /bin/bash</div>
<div>
root&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;10&nbsp;&nbsp;0.0&nbsp;&nbsp;0.1&nbsp;&nbsp;34396&nbsp;&nbsp;2808 pts/0&nbsp;&nbsp;&nbsp;&nbsp;R+&nbsp;&nbsp;&nbsp;05:12&nbsp;&nbsp;&nbsp;0:00 ps aux</div>
<div>
root@912e47da3142:/# exit</div>
<div>
exit</div>
<div>
<br /></div>
<div>
# Once exit, container will be restarted right away</div>
<div>
Liaos-MBP:scg-control liaoisaac$ docker container ls</div>
<div>
CONTAINER ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IMAGE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COMMAND&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CREATED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PORTS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NAMES</div>
<div>
912e47da3142&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ubuntu&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"/bin/bash"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;17 seconds ago&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Up 2 seconds&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;hungry_khorana</div>
<div>
Liaos-MBP:scg-control liaoisaac$</div>
<div>
<br /></div>
<div>
<br /></div>
<div>
Liaos-MBP:scg-control liaoisaac$ docker stop 912e47da3142</div>
<div>
912e47da3142</div>
<div>
Liaos-MBP:scg-control liaoisaac$ docker container ls</div>
<div>
CONTAINER ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IMAGE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COMMAND&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CREATED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PORTS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NAMES</div>
<div>
<br /></div>
<div>
# After restart docker in Mac, applications will be restarted</div>
<div>
Liaos-MBP:scg-control liaoisaac$ docker container ls</div>
<div>
CONTAINER ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IMAGE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COMMAND&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CREATED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PORTS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NAMES</div>
<div>
912e47da3142&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ubuntu&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"/bin/bash"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2 days ago&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Up 13 seconds&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;hungry_khoran</div>
<div>
<br /></div>
<div>
<span style="color: #333333; font-family: Monaco; font-size: 9pt;"># After docker restart, container will be restarted again</span></div>
<div>
<span style="color: #333333; font-family: Monaco; font-size: 12px;"># Following is ubuntu example</span></div>
<div>
isaac@isaac-KVM:~$ service docker restart</div>
<div>
==== AUTHENTICATING FOR org.freedesktop.systemd1.manage-units ===</div>
<div>
Authentication is required to restart 'docker.service'.</div>
<div>
Authenticating as: isaac,,, (isaac)</div>
<div>
Password:</div>
<div>
==== AUTHENTICATION COMPLETE ===</div>
<div>
isaac@isaac-KVM:~$ docker container ls</div>
<div>
CONTAINER ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IMAGE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COMMAND&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CREATED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PORTS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NAMES</div>
<div>
e4403fafa5bb&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ubuntu&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"/bin/bash"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3 minutes ago&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Up 5 seconds&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;optimistic_leh&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;mann</div>
</div>
<div>
<br /></div>
<div>
<br /></div>
<div>
<br /></div>
<div>
<br /></div>
<div>
<b><span style="font-size: 16pt;">unless-stopped</span></b></div>
<ol>
<li><div>
Always restart unless it is stopped by command</div>
</li>
<li><div>
Wont restart when daemon restart</div>
</li>
<li><div>
Ex. — restart unless-stopped</div>
</li>
</ol>
<div>
<div>
# Start bash with unless-stopped</div>
<div>
isaac@isaac-KVM:~$ docker container run --restart unless-stopped -it ubuntu /bin/bash</div>
<div>
root@3be8ac8498a7:/# ps aux</div>
<div>
USER&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PID %CPU %MEM&nbsp;&nbsp;&nbsp;&nbsp;VSZ&nbsp;&nbsp;&nbsp;RSS TTY&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STAT START&nbsp;&nbsp;&nbsp;TIME COMMAND</div>
<div>
root&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1&nbsp;&nbsp;4.8&nbsp;&nbsp;0.0&nbsp;&nbsp;18504&nbsp;&nbsp;3536 pts/0&nbsp;&nbsp;&nbsp;&nbsp;Ss&nbsp;&nbsp;&nbsp;17:53&nbsp;&nbsp;&nbsp;0:00 /bin/bash</div>
<div>
root&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;10&nbsp;&nbsp;0.0&nbsp;&nbsp;0.0&nbsp;&nbsp;34396&nbsp;&nbsp;2936 pts/0&nbsp;&nbsp;&nbsp;&nbsp;R+&nbsp;&nbsp;&nbsp;17:53&nbsp;&nbsp;&nbsp;0:00 ps aux</div>
<div>
root@3be8ac8498a7:/# exit</div>
<div>
exit</div>
<div>
<br /></div>
<div>
# Kill the only one process, container stopped and restart automatically because restart policy is unless-stopped</div>
<div>
isaac@isaac-KVM:~$ docker container ls</div>
<div>
CONTAINER ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IMAGE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COMMAND&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CREATED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PORTS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NAMES</div>
<div>
3be8ac8498a7&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ubuntu&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"/bin/bash"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;19 seconds ago&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Up 7 seconds&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;nostalgic_gagarin</div>
<div>
<br /></div>
<div>
# Use command to stop a container</div>
<div>
isaac@isaac-KVM:~$ docker container stop 3be8ac8498a7</div>
<div>
3be8ac8498a7</div>
<div>
isaac@isaac-KVM:~$ docker container ls</div>
<div>
CONTAINER ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IMAGE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COMMAND&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CREATED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PORTS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NAMES</div>
<div>
<br /></div>
<div>
# Container is not started after docker restart because restart policy is unless-stopped</div>
<div>
isaac@isaac-KVM:~$ sudo service docker restart</div>
<div>
isaac@isaac-KVM:~$ docker container ls</div>
<div>
CONTAINER ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IMAGE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;COMMAND&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CREATED&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATUS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PORTS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NAMES</div>
<div>
isaac@isaac-KVM:~$</div>
<div>
<br /></div>
</div>
<div>
<br /></div>
<div>
<br /></div>
<div>
<b><span style="font-size: 16pt;">on-failure</span></b></div>
<ol>
<li><div>
Restart container when it's stopped with non-zero exit code</div>
</li>
<li><div>
Restart container when docker restart</div>
</li>
</ol>
</div>
