---
layout: post
title: Go - Type Declarations
date: 2019-03-15 17:46:00 +0800
tags: [Go]
---

<br />
<div>
<span style="font-size: 14pt; font-weight: bold;">Named type</span></div>
<div>
Format: type typeName underlying-type</div>
<div>
A constructor with underlying-type value will exist without declaring</div>
<div>
<div>
package main</div>
<div>
import (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"fmt"</div>
<div>
)</div>
<div>
// declare named type</div>
<div>
// type name underlying-type</div>
<div>
type C float64</div>
<div>
type F float64</div>
<div>
// declare constant by named type</div>
<div>
const (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FreezingC C = 0</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BoilingC&nbsp;&nbsp;C = 100</div>
<div>
)</div>
<div>
// convert from C to F</div>
<div>
func CToF(c C) F {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return F(c*9/5 + 32)</div>
<div>
}</div>
<div>
func FToC(f F) C {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return C((f - 32) * 5 / 9)</div>
<div>
}</div>
<div>
func main() {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("Freezing C:%g\n", FreezingC)</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("Freezing F:%g\n", CToF(FreezingC))</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("Boiling C:%g\n", BoilingC)</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("Boiling F:%g\n", CToF(BoilingC))</div>
<div>
}</div>
</div>
<div>
<img src="/assets/images/extracted/named-type-format-type-typename-0-101f6749.png" /></div>
<div>
<br /></div>
<div>
<span style="font-size: 12pt;"><span style="font-size: 12pt; font-weight: bold;">Declare convert function in named type</span></span></div>
<div>
format: func (variableName NamedType) funcName() {...}</div>
<div>
<div>
package main</div>
<div>
import (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"fmt"</div>
<div>
)</div>
<div>
// declare named type</div>
<div>
// type name underlying-type</div>
<div>
type C float64</div>
<div>
type F float64</div>
<div>
// declare constant by named type</div>
<div>
const (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FreezingC C = 0</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BoilingC&nbsp;&nbsp;C = 100</div>
<div>
)</div>
<div>
// convert from C to F</div>
<div>
func (c C) CToF() F {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return F(c*9/5 + 32)</div>
<div>
}</div>
<div>
func main() {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("Freezing C:%g\n", FreezingC)</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("Freezing F:%g\n", FreezingC.CToF())</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("Boiling C:%g\n", BoilingC)</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("Boiling F:%g\n", BoilingC.CToF())</div>
<div>
}</div>
</div>
<div>
<img src="/assets/images/extracted/named-type-format-type-typename-1-91e752c9.png" /></div>
<div>
Comparasion</div>
<div>
Named type can compare with underlying type.</div>
<div>
Different named type can't be compared, will panic</div>
<div>
<div>
package main</div>
<div>
import (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"fmt"</div>
<div>
)</div>
<div>
// declare named type</div>
<div>
// type name underlying-type</div>
<div>
type C float64</div>
<div>
type F float64</div>
<div>
func main() {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("%t\n", C(100) == C(100)) // true</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("%t\n", C(100) == 100)&nbsp;&nbsp;&nbsp;&nbsp;// true</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;//&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("%t", C(100) == F(100)) // panic</div>
<div>
}</div>
</div>
<div>
<div>
<br /></div>
<table style="width: 851px;"><colgroup><col style="width: 465px;"></col><col style="width: 386px;"></col></colgroup><tbody>
<tr><td style="border: 1px solid;"><div>
panic</div>
<div>
<img src="/assets/images/extracted/named-type-format-type-typename-2-3887ce40.png" /></div>
</td><td style="border: 1px solid;"><div>
<img src="/assets/images/extracted/named-type-format-type-typename-3-2489451e.png" /></div>
</td></tr>
</tbody></table>
<div>
Define String() method in named type, this method will be called directly</div>
</div>
<div>
Format: func (Named type) funcName namedType {..}</div>
<div>
<div>
package main</div>
<div>
import (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"fmt"</div>
<div>
)</div>
<div>
// declare named type</div>
<div>
// type name underlying-type</div>
<div>
type C float64</div>
<div>
type F float64</div>
<div>
func (c C) String() string {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return fmt.Sprintf("%g-C", c)</div>
<div>
}</div>
<div>
func main() {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("%s", C(23))</div>
<div>
}</div>
</div>
<div>
<br /></div>
<div>
<br /></div>
<br />
