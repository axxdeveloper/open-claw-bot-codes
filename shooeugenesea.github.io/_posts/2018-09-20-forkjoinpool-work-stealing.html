---
layout: post
title: ForkJoinPool - Work stealing
date: 2018-09-20 03:16:00 +0800
tags: [java, java concurrent]
---

<br />
<h3>
Reference</h3>
<div>
<a href="https://en.wikipedia.org/wiki/Work_stealing">https://en.wikipedia.org/wiki/Work_stealing</a></div>
前篇:&nbsp;<span style="background-color: #edf4ff; color: #888888; font-family: &quot;arial&quot; , &quot;helvetica&quot; , sans-serif; font-size: 13px;"><a href="https://www.isaacnote.com/2018/09/forkjoinpool.html">Java Concurrency - ForkJoinPool 的 deadlock</a></span><br />
下篇:&nbsp;<a href="https://www.isaacnote.com/2018/09/forkjoinpool-error-handling.html">ForkJoinPool - Error Handling</a><br />
<h3>
Introduction</h3>
<div>
ForkJoinPool 實作 work stealing 的概念, 簡單說明一下</div>
<h3>
Work-stealing</h3>
<ol>
<li>每個 thread 會有一個 queue, queue 裡面放的是 CPU bound 的工作</li>
<li>queue 裡面的工作可能會產生新的能平行作業的工作</li>
<li>新產生的工作會放在 queue 裡面</li>
<li>如果有 thread 把 queue 裡面的工作做完了, 就會去別的 queue 拿工作來處理 (steal)</li>
</ol>
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiuwFgJd3vtsNjZcG-Z8ro36PakWkv0r9rshtz6qkNYGBD8EZQk1Plc2eeP1SerbJSTF9NebUp6WXtxeMbslgGQsej6av73rlzhEhZfxKFkNSmK1FXtgAwianBJm3K6r061KAcH2WNhvA/s1600/Screen+Shot+2018-09-14+at+1.03.42+AM.png" imageanchor="1" style="margin-left: 1em; margin-right: 1em;"><img border="0" data-original-height="869" data-original-width="1600" height="346" src="/assets/images/blog/Screen-Shot-2018-09-14-at-1.03.42-AM.png" width="640" /></a></div>
<h3>
</h3>
