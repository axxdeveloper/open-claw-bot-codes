---
layout: post
title: 處理正在 iterate 的 dictionary
date: 2013-12-24 03:40:00 +0800
tags: [python]
---

<br />
<div>
今天練習 Python 的時候發現&nbsp;<a href="http://docs.python.org/3/tutorial/datastructures.html#looping-techniques">5.6. Looping Techniques</a>&nbsp;有個提示</div>
<div>
<span style="background-color: #f4cccc; color: #222222; font-family: 'Lucida Grande', Arial, sans-serif; font-size: 16px; line-height: 22.399999618530273px; text-align: justify;"><i>"To change a sequence you are iterating over while inside the loop (for example to duplicate certain items), it is recommended that you first make a copy. Looping over a sequence does not implicitly make a copy."</i></span></div>
<div>
<br /></div>
<div>
照著文件上的程式輸入
<br />
<pre>&gt;&gt;&gt; words = ['a','b','cc']
&gt;&gt;&gt; for w in words:
    if len(w)&gt;1:
        print('insert',w)
        words.insert(0,w)
</pre>
</div>
<div>
<br />
執行之後就出現<br />
<span style="color: red;">insert cc</span><br />
<span style="color: red;">insert cc</span><br />
<span style="color: red;">insert cc</span><br />
<span style="color: red;">insert cc</span><br />
<span style="color: red;">insert cc</span><br />
<span style="color: red;">insert cc</span><br />
<span style="color: red;">insert cc</span><br />
<span style="color: red;">insertTraceback (most recent call last):</span><br />
<span style="color: red;">&nbsp; File "&lt;pyshell#208&gt;", line 3, in &lt;module&gt;</span><br />
<span style="color: red;">&nbsp; &nbsp; print('insert',w)</span><br />
<span style="color: red;">&nbsp; File "C:\Python33\lib\idlelib\PyShell.py", line 1318, in write</span><br />
<span style="color: red;">&nbsp; &nbsp; return self.shell.write(s, self.tags)</span><br />
<span style="color: red;">KeyboardInterrupt</span></div>
<div>
<br />
要 Ctrl+C 才能停下來.<br />
這時候檢查一下哪打錯了, 原來我打<br />
<pre>for w in <span style="color: red;"><b>words:</b></span>
</pre>
<br />
但文件上是<br />
<pre>for w in <span style="color: red;">words[:]:</span>
</pre>
<br />
修正之後果然就正常了.<br />
原來 words[:] 是 words 的 copy.<br />
試一下<br />
<pre>&gt;&gt;&gt; words is words
True
&gt;&gt;&gt; words is words[:]
False
</pre>
果然沒錯.<br />
<br />
在 Java 也是一樣, 如果要改變正在 iterate 的 list 也會有問題<br />
<pre>package test;

import java.util.Arrays;
import java.util.List;

public class TestIter {

    public static void main(String[] params) {
        List<string> words = Arrays.asList("a","b","cc");
        for (String w: words) {
            if (w.length() &gt; 1) {
                System.out.println("insert " + w);
                words.add(w);
            }
        }
    }
    
}
</string></pre>
會報錯
<br />
<pre>insert cc
Exception in thread "main" java.lang.UnsupportedOperationException
    at java.util.AbstractList.add(Unknown Source)
    at java.util.AbstractList.add(Unknown Source)
    at test.TestIter.main(TestIter.java:13)
</pre>
<br />
要改成<br />
<pre>package test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class TestIter {

    public static void main(String[] params) {
        List<string> words = Arrays.asList("a","b","cc");
        List<string> copyWords = new ArrayList<string>(words);
        for (String w: words) {
            if (w.length() &gt; 1) {
                System.out.println("insert " + w);
                copyWords.add(0,w);
            }
        }
        System.out.println(words);
        System.out.println(copyWords);
    }
    
}
</string></string></string></pre>
<br />
寫了 Python 跟 Java 這兩段程式, 感覺有微妙的差異...<br />
<pre></pre>
</div>
