---
layout: post
title: Go - Package and Files
date: 2019-03-16 18:14:00 +0800
tags: [Go]
---

<br />
<div>
<span style="font-size: 14pt;"><b>Package Variables</b></span></div>
<ol>
<li><div>
Exported identifiers start with an upper-case letter</div>
</li>
<li><div>
files in the same package can be in the same folder</div>
</li>
<li><div>
Package level variables can't be duplicated, even they are in different files</div>
</li>
</ol>
<div>
<div>
// file:declaration/variables2.go</div>
<div>
package declaration</div>
<div>
import ()</div>
<div>
var localVarInVariables = "localVarInVariables2"</div>
<div>
var PackageVarInVariables = "PackageVarInVariables2"</div>
<div>
<br /></div>
<div>
// file:declaration/variables3.go</div>
<div>
package declaration</div>
<div>
import (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"fmt"</div>
<div>
)</div>
<div>
func AccessDifferentFileVaraible() string {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return fmt.Sprintf("%s\n%s\n", PackageVarInVariables, localVarInVariables)</div>
<div>
}</div>
<div>
<br /></div>
<div>
// file:main/main.go</div>
<div>
package main</div>
<div>
import (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"declaration"</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"fmt"</div>
<div>
)</div>
<div>
func main() {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("%s", declaration.AccessDifferentFileVaraible())</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("%s", declaration.PackageVarInVariables)</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;//&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("%s", declaration.localVarInVariables) // panic</div>
<div>
}</div>
</div>
<div>
<img src="/assets/images/extracted/package-and-files-0-fa7e5ea4.png" /></div>
<div>
<span style="font-size: 14pt;"><b>Package functions</b></span></div>
<div>
<div>
// main/main.go</div>
<div>
package main</div>
<div>
import (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"declaration"</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"fmt"</div>
<div>
)</div>
<div>
func main() {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("PackageFunc:%s\n", declaration.PackageFunc())&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// func1.go</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("PackageShowFunc:%s\n", declaration.PackageShowFunc())&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;// func2.go</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("PackageShowFunc:%s\n",&nbsp;&nbsp;declaration.NamedType("NamedTyped.PackageToString").PackageToString()) // func1.go</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;//&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fmt.Printf("PackageShowFunc:%s\n",&nbsp;&nbsp;declaration.NamedType("NamedTyped.PackageToString").localToString())&nbsp;&nbsp;&nbsp;//&nbsp;&nbsp;func1.go, panic</div>
<div>
}</div>
<div>
<br /></div>
<div>
// declaration/func1.go</div>
<div>
package declaration</div>
<div>
import (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"fmt"</div>
<div>
)</div>
<div>
type NamedType string</div>
<div>
func (n NamedType) PackageToString() string {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return fmt.Sprintf("PackageToString:%s", n)</div>
<div>
}</div>
<div>
func (n NamedType) localToString() string {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return fmt.Sprintf("localToString:%s", n)</div>
<div>
}</div>
<div>
func PackageFunc() string {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return "PackageFunc"</div>
<div>
}</div>
<div>
func localFunc() string {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return "localFunc"</div>
<div>
}</div>
<div>
<br /></div>
<div>
// declaration/func2.go</div>
<div>
package declaration</div>
<div>
import (</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"fmt"</div>
<div>
)</div>
<div>
func PackageShowFunc() string {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return fmt.Sprintf("PackageFunc:%s, LocalFunc:%s", PackageFunc(),&nbsp;&nbsp;localFunc())</div>
<div>
}</div>
</div>
<div>
<img src="/assets/images/extracted/package-and-files-1-3461301a.png" /></div>
<div>
<br /></div>
<br />
