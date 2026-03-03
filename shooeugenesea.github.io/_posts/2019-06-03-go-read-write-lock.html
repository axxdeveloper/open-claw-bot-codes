---
layout: post
title: Go - read write lock
date: 2019-06-03 05:52:00 +0800
tags: [Go]
---

<br />
<div>
<ul>
<li><div>
Add number to 10000.</div>
</li>
<ul>
<li><div>
RWLock (Use Lock/Unlock to read): 19ms, 92202 read count</div>
<div>
<img src="/assets/images/extracted/go-read-write-lock-0-6e950894.png" width="646" /></div>
</li>
<li><div>
RWLock (Use RLock/RUnlock to read): 597ms, 4789798 read count</div>
<div>
<img src="/assets/images/extracted/go-read-write-lock-1-08cd0c76.png" width="662" /></div>
</li>
</ul>
<li><div>
We can say read lock get more chances to read.. overall make write become slower because limited CPU Core Size (8 in my machine)</div>
</li>
<li><div>
Here is code for copy/paste and try</div>
</li>
<div>
<div>
package main</div>
<div>
<br /></div>
<div>
import (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"fmt"</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"sync"</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"sync/atomic"</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"time"</div>
<div>
)</div>
<div>
<br /></div>
<div>
var rc int32</div>
<div>
var n int</div>
<div>
var m sync.RWMutex</div>
<div>
var wg sync.WaitGroup</div>
<div>
<br /></div>
<div>
func main() {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;from := time.Now()</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for i := 0; i &lt; 100; i++ {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;round := 100</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wg.Add(round)</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;go func() {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;m.RLock()</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;atomic.AddInt32(&amp;rc, 1)</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Sprint(n)</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;m.RUnlock()</div>
<div>
<br /></div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}()</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;go func() {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for i := 0; i &lt; round; i++ {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;m.Lock()</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;n++</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;m.Unlock()</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wg.Done()</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}()</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wg.Wait()</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;duration := time.Now().Sub(from)</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Println("readCount:", rc, "n:", n, "duration:", duration)</div>
<div>
<br /></div>
<div>
}</div>
<div>
<br /></div>
</div>
</ul>
</div>
<div>
<br /></div>
<br />
