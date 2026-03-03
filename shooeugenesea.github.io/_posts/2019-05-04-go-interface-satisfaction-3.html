---
layout: post
title: Go - Interface Satisfaction - 3
date: 2019-05-04 19:12:00 +0800
tags: [Go]
---

<br />
<div>

<div>
<ul>
<li class=""><div>
Pointer variable can call function with pointer or type receiver.
</div>
<div>
Value content variable can call function with pointer receiver or value receiver
</div>
<div>
Interface value content variable CAN NOT call function with pointer
</div>
<div>
<img src="/assets/images/extracted/go-interface-satisfaction-3-0-a805203e.png" width="616" /></div>
</li>
</ul>
<div>
<div>
package main
</div>
<div>
<br /></div>
<div>
import (
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;"fmt"
</div>
<div>
)
</div>
<div>
<br /></div>
<div>
func main() {
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;var a A
</div>
<div>
<br /></div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;var b B = B("BB")
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;b.a() // It is legal because compiler will take b's address to call func (b *B) a()
</div>
<div>
<br /></div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;// But variable a is no lucky, there is no such sugar, so a can't be assigned to b
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;// Because a is a value, not a pointer. value variable can't call a function declared for pointer
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;//&nbsp;&nbsp;&nbsp;&nbsp;a = b // compile error! because there is no a() implementation for value in B
</div>
<div>
<br /></div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;var bp *B = &amp;b
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;a = bp // OK! There is an a() implementation for pointer in B, so ok
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;a.a()
</div>
<div>
<br /></div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;var c C = C("CC")
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;a = c // OK! There is an a() implementation for value in C
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;a.a()
</div>
<div>
<br /></div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;var cp *C = &amp;c
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;a = cp // OK! Because a function defined with value type, no matter pointer or value type can call it
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;a.a()
</div>
<div>
<br /></div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;a = nil
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;fmt.Println(a)
</div>
<div>
}
</div>
<div>
<br /></div>
<div>
type C string
</div>
<div>
<br /></div>
<div>
func (c C) a() {
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;fmt.Println("c.a")
</div>
<div>
}
</div>
<div>
<br /></div>
<div>
type B string
</div>
<div>
<br /></div>
<div>
func (b *B) a() {
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;fmt.Println("b.a")
</div>
<div>
}
</div>
<div>
<br /></div>
<div>
type A interface {
</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;a()
</div>
<div>
}
</div>
</div>
<div>
<br /></div>
</div>
</div>
