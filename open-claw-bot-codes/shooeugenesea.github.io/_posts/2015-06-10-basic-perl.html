---
layout: post
title: Basic Perl 筆記
date: 2015-06-10 10:17:00 +0800
tags: [perl]
---

<br />
<ol>
<li>單引號的 \n 不會換行, 雙引號內的 \n 會換行<br />
<pre>print("line1\nline2\n\n\n\n");
print('line3:abc\nabc');
</pre>
<pre>d:\&gt;test.pl
input string:abc
input number:4
abcabcabcabc
d:\&gt;test.pl
equal:1
d:\&gt;test.pl
line1
line2

line3:abc\nabc
</pre>
</li>
<li>用 . 連字串<br /><pre>$a = 'abc\nabc';
$b = "def\ndef";
$c = $a . $b . "QQQ";
print("$c");
</pre>
<pre>d:\&gt;test.pl
abc\nabcdef
defQQQ
</pre>
</li>
<li>數字 0 是 false, 其他都是 true. <br />空字串是 false, 其他都是 true.<br />undef 是 false.<br />
<pre>print($abc == 0); # print 1, $abc is undef and is false, false is 0
$abc = '';
print($abc == 0); # print 1, $abc is empty string and is false, false is 0
$abc = "0";
print($abc == 0); # print 1, $abc is string 0, Perl transfer to number 0
</pre>
<pre>d:\&gt;test.pl
111
</pre>
</li>
<li>使用 lt,le,eq,ge,gt 作字串的比較, perl 會用 ASCII 或 Unicode 作為順序參考排大小.
<pre>$t1 = "a";
$t2 = "a";
if ($t1 eq $t2) {
    print("same");
} else {
    print("different");
}
</pre>
<pre>d:\&gt;test2.pl
same
</pre>
<pre>$t1 = "a";
$t2 = "b";
if ($t1 eq $t2) {
    print("same");
} else {
    print("different");
}
</pre>
<pre>d:\&gt;test2.pl
different
</pre>
</li>
<li>取得使用者輸入: &lt;STDIN&gt;<br />
<pre>print("What's your name?\n");
$name = &lt;STDIN&gt;;
print("$name, how are you?");
</pre>
</li>
<pre>d:\&gt;test.pl
What's your name?
isaac
isaac
, how are you?
</pre>
<br><br>
<li>這時候就發現 &lt;STDIN&gt; 取得的資料會包含換行, 換行字元是不需要的, 就用 chomp 去掉
<pre>print("What's your name?\n");
$name = &lt;STDIN&gt;;
chomp($name);
print("$name, how are you?");
</pre>
</li>
<br />
<pre>d:\&gt;test.pl
What's your name?
isaac
isaac, how are you?
</pre>
<br><br>
<li>如果輸入的時候按 Ctrl + C, 沒有輸入, &lt;STDIN&gt; 會回傳 undef. 這時候可以用 defined 來判斷是否為 undef
<pre>$name = &lt;STDIN&gt;;
if (defined($name)) {
 chomp($name);
 print("input:$name");
} else {
 print("no input\n");
}
</pre>
</li>
<br />
<pre>d:\&gt;test.pl
no input
Terminating on signal SIGINT(2)
</pre>
<br />
<li>使用陣列
<pre>while ($i &lt; 10) {
 $i += 1;
 $names[$i] = "p$i";
 print("$names[$i]\n");
}
$names[100] = "qq";
print("$names[100]");
</pre>
<pre>d:\&gt;test.pl
p1
p2
p3
p4
p5
p6
p7
p8
p9
p10
qq
</pre>
</li>
<li>取陣列最後一個值的 index: $#names
<pre>$names[100] = "aaa";
print("$#names\n"); 
print($names[$#names]); 
</pre>
<pre>d:\&gt;test.pl
100
aaa
</pre>
</li>
<li>列出陣列全部值 (這裡是要注意 $#names 的值是最後一個 index 而不是長度. )<br />想得到長度要再加 1, 因為還有第 0 個.<pre>$i = 0;
while ($i &lt; 10) {
 $i += 1;
 $names[$i] = $i;
}
$i = 0;
while ($i &lt;= $#names) {
 $i += 1;
 print("$names[$i]");
}
</pre>
<pre>d:\&gt;test.pl
12345678910
</pre>
</li>
<li>index 可以指定負數, -1 就是最後一個值
<pre>$names[0]="0";
$names[1]="1";
$names[2]="2";
$names[3]="3";
print($names[0]); #0
print($names[-1]); #3
print($names[-2]); #2
print($names[-3]); #1
print($names[-4]); #0
</pre>
</li>
<li>用 @串列變數 = (用逗號分隔的串列值) 宣告串列<br />會置換變數, \n 會換行, 就跟雙引號宣告的變數一樣<br />
<pre>@a = (1,2,3); 
print("\@a:@a\n");

@b = (1..3); # 使用 .. 會 +1
print("\@b:@b\n");

@c = (1.4...5.6); # 使用 .. 會無條件捨去小數
print("\@c:@c\n");

@d = (2,6...10,43); 
print("\@d:@d\n");

$e = 10;
$f = 20;
@g = ($e...$f); 
print("\@g:@g\n");

@h = ("a", "b\n", "c");  #有換行效果
print("\@h:@h\n");
</pre>
<pre>d:\&gt;test.pl
@a:1 2 3
@b:1 2 3
@c:1 2 3 4 5
@d:2 6 7 8 9 10 43
@g:10 11 12 13 14 15 16 17 18 19 20
@h:a b
 c
</pre>
</li>
<li>用 @串列變數=qw(用空白分隔的串列值) 宣告串列,<br />不會置換變數, \n 不會換行, 跟單引號宣告的變數一樣
<pre>@a = qw(1 2 3); #可以用 qw()
print("\@a:@a\n"); 

@b = qw&lt;1 data-blogger-escaped-..3=""&gt;; #也可以 qw&lt;&gt;, 但 1..3 會直接印出來
print("\@b:@b\n");

@c = qw/1.4...5.6/; #也可以 qw//
print("\@c:@c\n");

@d = qw!2 6...10 43!; 
print("\@d:@d\n");

$e = 10;
$f = 20;
@g = qw($e...$f); #沒有換變數的效果
print("\@g:@g\n");

@h = qw("a" "b\n" "c");  #無換行效果, 雙引號也會被印出來
print("\@h:@h\n");
</pre>
<pre>d:\&gt;test.pl
@a:1 2 3
@b:1..3
@c:1.4...5.6
@d:2 6...10 43
@g:$e...$f
@h:"a" "b\n" "c"
</pre>
</li>
<li>一次 assign 值給多個變數
<pre>($a,$b,$c) = (1,2,3);
print("a:$a\n");
print("b:$b\n");
print("c:$c\n");
</pre>
<pre>d:\&gt;test.pl
a:1
b:2
c:3
</pre>
</li>
<li>換值
<pre>$a[0] = 0;
$a[1] = 1;
($a[0],$a[1]) = ($a[1],$a[0]);
print("a[0]:$a[0]\n");
print("a[1]:$a[1]\n");
</pre>
<pre>d:\&gt;test.pl
a[0]:1
a[1]:0
</pre>
</li>
<li>如果移除括號也不改變原本意思, 就可以移除括號
<pre>@a = 1...3;
print(@a);
</pre>
<pre>d:\&gt;test.pl
123
</pre>
</li>
<li>如果一個串列值是另一個串列, 被包含在串列裡的會被展開
<pre>@a = 1..3;
$b = 4;
@c = ();
#d is undefined
@e = (@a,$b,@c,@d);
print(@e);
</pre>
<pre>d:\&gt;test.pl
1234
</pre>
</li>
<li>用 pop 可以從串列取值出來, 沒有值的話會取出 undef
<pre>@a = 1..3;
while (defined($val = pop(@a))) {
 print("$val\n");
}
</pre>
<pre>d:\&gt;test.pl
3
2
1
</pre>
</li>
<li>用 push 可以把值放進串列
<pre>@a = 1..3;
push(@a,4);
while (defined($val = pop(@a))) {
 print("$val\n");
}
</pre>
<pre>d:\&gt;test.pl
4
3
2
1
</pre>
</li>
<li>串列可以複製全部的值 (不是 reference, 所以複製後對串列的修改不會互相影響)
<pre>@a = 1...3;
@b = @a;
print("a:\n");
while (defined($val = pop(@a))) {
 print("$val\n");
}
print("b:\n");
while (defined($val = pop(@b))) {
 print("$val\n");
}
</pre>
<pre>d:\&gt;test.pl
a:
3
2
1
b:
3
2
1
</pre>
</li>
<li>一次 assign 值給多個變數
<pre>($a,$b,$c) = (1,2,3);
print("a:$a\n");
print("b:$b\n");
print("c:$c\n");
</pre>
<pre>d:\&gt;test.pl
a:1
b:2
c:3
</pre>
</li>
<li>qw 透過空白來區分值, 也可以 assign 值給多個變數
<pre>($google,$yahoo,$linkedin) = qw {
 http://www.google.com
 http://www.yahoo.com
 http://www.linkedin.com
};
print("google:$google\n");
print("yahoo:$yahoo\n");
print("linkedin:$linkedin\n");

($google,$yahoo,$linkedin) = qw !
 http://www.google.com
 http://www.yahoo.com
 http://www.linkedin.com
!;
print("google:$google\n");
print("yahoo:$yahoo\n");
print("linkedin:$linkedin\n");
</pre>
<pre>d:\&gt;test.pl
google:http://www.google.com
yahoo:http://www.yahoo.com
linkedin:http://www.linkedin.com
google:http://www.google.com
yahoo:http://www.yahoo.com
linkedin:http://www.linkedin.com
</pre>
</li>
<li>shift 從 index 0 取值, unshift 從 index 0 放值
<pre>@a = ();
unshift(@a,"1");
unshift(@a,"2");
unshift(@a,"3");
print("@a\n"); #321
print(shift(@a)); #3
print(shift(@a)); #2
print(shift(@a)); #1
</pre>
</li>
<li>pop 從 index 最後取值, push 從 index 最後放值
<pre>@a = ();
unshift(@a,"1");
unshift(@a,"2");
unshift(@a,"3");
print("@a\n"); #321
push(@a,"4"); #3214
push(@a,"5"); #32145
push(@a,"6"); #321456
print(shift(@a)); #3
print(shift(@a)); #2
print(shift(@a)); #1
print(pop(@a)); #6
print(pop(@a)); #5
print(pop(@a)); #4
</pre>
<pre>d:\&gt;test.pl
3 2 1
321654
</pre>
</li>
<li>pop,push,shift,unshift 可以一次處理整個串列
<pre>@a = ();
unshift(@a, qw/ 1 2 3 /); #123
unshift(@a, qw/ 4 5 6 /); #456123
push(@a, qw/ 7 8 9 /); #456123789
push(@a, qw/ 10 11 12 /); #456123789101112
print(shift(@a)); #4
print(shift(@a)); #5
print(shift(@a)); #6
print(shift(@a)); #1
print(shift(@a)); #2
print(shift(@a)); #3
print(pop(@a)); #12
print(pop(@a)); #11
print(pop(@a)); #10
print(pop(@a)); #9
print(pop(@a)); #8
print(pop(@a)); #7
defined(pop(@a)) ? print("value") : print(" no val"); # no val
</pre>
<pre>d:\&gt;test.pl
456123121110987 no val
</pre>
</li>
<li>切串列: splice
<pre>@a = 1..9;
splice(@a,1); # 從 index 1 之後全切掉
print("@a\n"); #1
@a = 1..9;
@removed = splice(@a,1,3); # 從 index 1 切掉三個
print("@a\n"); #156789
print("@removed\n"); #234
@a = 1..9;
@b = qw (- 9 8 7 6 5 4 3 2 1 -);
splice(@a,1,3,@b); # 從 index 1 切掉三個之後加上 b 串列
print("@a\n"); #1-987654321-56789
@a = 1..9;
splice(@a,1,0,@b); # 從 index 1 加上 b 串列, 完全不切掉任何值
print("@a\n"); #1-987654321-23456789
</pre>
<pre>d:\&gt;test.pl
1
1 5 6 7 8 9
2 3 4
1 - 9 8 7 6 5 4 3 2 1 - 5 6 7 8 9
1 - 9 8 7 6 5 4 3 2 1 - 2 3 4 5 6 7 8 9
</pre>
</li>
<li> print 的時候用 \@ 來跳脫串列的 @
<pre>@yahoo = qw { yahoo hohoho };
print("yahoo:@yahoo\n");
print("mail:test@yahoo.com\n"); #@沒跳脫, 會換成串列內容
print("mail:test\@yahoo.com\n"); #@跳脫了, 不會換成串列內容
</pre>
<pre>d:\&gt;test.pl
yahoo:yahoo hohoho
mail:testyahoo hohoho.com
mail:test@yahoo.com
</pre>
</li>
<li>串列可以當成陣列用
<pre>@names = qw (a b c);
print("index 0:$names[0]\n"); #a
print("index 1:$names[1]\n"); #b
print("index 2:$names[2]\n"); #c
</pre>
<pre>d:\&gt;test.pl
index 0:a
index 1:b
index 2:c
</pre>
</li>
<li>如果緊接著串列變數要印[index]的字串, 串列變數就要別處理
<pre>@names = qw (a b c);
print("index 0:${names[0]}[0]\n"); #用 {} 把變數圈起來
print("index 1:$names[1]"."[1]\n"); #用 . 把字串分開
print("index 2:$names[2]\[2\]\n"); #用 \ 跳脫 [ 與 ]
</pre>
<pre>d:\&gt;test.pl
index 0:a[0]
index 1:b[1]
index 2:c[2]
</pre>
</li>
<li>foreach iterate 串列
<pre>@names = qw (a b c);
foreach $name (@names) {
 print("$name\n");
}
</pre>
<pre>d:\&gt;test.pl
a
b
c
</pre>
</li>
<li>foreach 裡面宣告的變數不會影響外部的變數
<pre>$name = "hello";
@names = qw (a b c);
foreach $name (@names) {
 print("$name\n");
}
print("$name\n"); #hello
</pre>
<pre>d:\&gt;test.pl
a
b
c
hello
</pre>
</li>
<li>預設變數 $_, 比方說在 foreach 的時候沒宣告變數就可以使用 $_
<pre>foreach (qw / a b c /) {
 print("$_\n");
}
</pre>
<pre>d:\&gt;test.pl
a
b
c
</pre>
</li>
<li>reverse 把串列反過來
<pre>@a = (1,2,3,4,5);
print("a:@a\n");
print("reverse a:".reverse(@a)."\n");
</pre>
<pre>d:\&gt;test.pl
a:1 2 3 4 5
reverse a:54321
</pre>
</li>
<li>用 each iterate 串列, each 會一次回傳 index 與 value.
<pre>@a = (1,2,3,4,5);
while (($index,$value) = each(@a)) {
 print("index:$index, value:$value\n");
}
</pre>
<pre>d:\&gt;test.pl
index:0, value:1
index:1, value:2
index:2, value:3
index:3, value:4
index:4, value:5
</pre>
</li>
<li>當進行字串的運算時, 就得到字串的結果. 當執行數字的計算時, 就得到數字的結果. 是字串還是數字是由運算符號決定.
<pre>print(3*3 ."\n");
print(3x3 ."\n");
@a = qw{1 100 3 4 5}; #長度5
print(3*@a ."\n"); #3*5=15
print(3x@a ."\n");
</pre>
<pre>C:\Users\isaac&gt;test.pl
9
333
15
33333
</pre>
</li>
<li>在字串的運算時, 串列會印出字串. 在數字的運算時, 串列會印出個數.
<pre>@a = qw {e f d c b a};
print(2*@a."\n"); #@a 是數字5, 印出 10 (2*5=10)
print(2x@a."\n"); #@a 是數字5, 印出 22222
print(sort(@a)); #印出排序過的字串
</pre>
<pre>C:\Users\isaac&gt;test.pl
12
222222
abcdef
</pre>
</li>
<li>運算串列的時候會印出串列, 但有時候運算串列的時候需要印出串列的 size. 這時候要用 scalar 這個假函式讓它變串列的 size
<pre>@list = qw /a b c/;
print("list:",@list,", size:",scalar @list);
</pre>
<pre>d:\&gt;test.pl
list:abc, size:3
</pre>
</li>
<li>可以在 console 多行資料給串列, 在 windows 下按 Ctrl+Z 結束, 在 Linux 下按 Ctrl+D 結束
<pre>@commands = &lt;STDIN&gt;;
print("commands:",@commands);
</pre>
</li>
<pre>d:\&gt;test.pl
a
b
c
d
e
^Z
commands:a
b
c
d
e
</pre>
<br><br>
<li>STDIN 輸入資料進串列, 每一行都會加上換行符號, 這不一定是我們要的, 可以用 chomp 去掉換行符號
<pre>@commands = &lt;STDIN&gt;;
chomp(@commands);
print("commands:",@commands);
</pre>
</li>
<br />
<pre>d:\&gt;test.pl
a
b
c
d
e
^Z
commands:abcde
</pre>
<br><br>
<li>可以簡化寫法
<pre>chomp(@commands = &lt;STDIN&gt;);
print("commands:",@commands);
</pre>
</li>
<br />
<pre>d:\&gt;test.pl
a
b
c
d
e
^Z
commands:abcde
</pre>
<br><br>
<li>定義副常式 subroutine, 呼叫的方式是用 &amp;副常式名稱 來呼叫.
<pre>&amp;hellosubroutine;

sub hellosubroutine {
 print("hello subroutine");
}
</pre>
<pre>d:\&gt;test.pl
hello subroutine
</pre>
</li>
<li>subroutine 存取的變數都是全域變數
<pre>&amp;changeto5;
print($n,"\n");
&amp;changeto10;
print($n,"\n");

sub changeto5 {
 $n = 5;
}

sub changeto10 {
 $n = 10;
}
</pre>
<pre>d:\&gt;test.pl
5
10
</pre>
</li>
<li>subroutine 的最後一行計算就是回傳值
<pre>print(&amp;changeto5,"\n");
print(&amp;print,"\n");
print(&amp;add1ToN,"\n");
print($n,"\n");

sub add1ToN {
 $n + 1;
}

sub changeto5 {
 $n = 5;
}

sub print {
 print("");
}
</pre>
<pre>d:\&gt;test.pl
5
1
6
5
</pre>
</li>
<li>subroutine 加參數
<pre>sub test {
 print("arg[0]:$_[0]\n");
 print("arg[1]:$_[1]\n");
 print("arg[2]:$_[2]\n");
 print("arg[3]:$_[3]\n");
}

print("======3 args============\n");
&amp;test(1,2,3);
print("======4 args============\n");
&amp;test(1,2,3,4);
</pre>
<pre>d:\&gt;test.pl
======3 args============
arg[0]:1
arg[1]:2
arg[2]:3
arg[3]:
======4 args============
arg[0]:1
arg[1]:2
arg[2]:3
arg[3]:4
</pre>
</li>
<li>參數傳入 subroutine 後會存在 @_ 這個預設串列
<pre>sub test {
 print("@_");
}

&amp;test(1,2,3,4,5);
</pre>
<pre>d:\&gt;test.pl
1 2 3 4 5
</pre>
</li>
<li>用 my 可以宣告 subroutine 裡的區域變數
<pre>sub test {
 $a = "a";
 my $b = "qq";
}

&amp;test;
print("a:$a\n");
if (!defined($b)) {
 print("b is undef");
}
</pre>
<pre>d:\&gt;test.pl
a:a
b is undef
</pre>
<pre>sub max {
 my $max = shift @_;
 for (@_) {
  if ($max &lt; $_) {
   $max = $_;  
  }
 }
 $max; #return
}

print(&amp;max(1,2,3,4,5),"\n");
if (!defined($max)) {
 print("\$max is undef");
}
</pre>
<pre>d:\&gt;test.pl
5
$max is undef
</pre>
</li>
<li>一個 subroutine 中本來就有一個變數, 又透過 my 宣告區域變數, subroutine 在 my 宣告後, 會以 my 宣告的變數值為主, 但又不影響原本的全域變數值
<pre>sub max {
 $max = 333;
 my $max = shift @_;
 for (@_) {
  if ($max &lt; $_) {
   $max = $_;  
  }
 }
 print($max,"\n"); #max=5
 $max; #return 5
}

print(&amp;max(1,2,3,4,5),"\n");
print($max); #max=333
</pre>
<pre>d:\&gt;test.pl
5
5
333
</pre>
</li>
<li>用 my 一次宣告多個變數來接外來的參數
<pre>sub max {
 my($a,$b,$c,$d) = @_;
 print("a:$a,b:$b,c:$c,d:$d\n");
}

&amp;max(1,2,3); 
&amp;max(1,2); 
</pre>
<pre>d:\&gt;test.pl
a:1,b:2,c:3,d:
a:1,b:2,c:,d:

</pre>
</li>
<li>檢查陣列長度是否符合預期
<pre>sub max {
 if (@_ != 2) {
  print("argument size should be 2\n");
 }
 my($a,$b) = @_;
 if ($a &gt; $b) { 
  $a;
 } else {
  $b;
 }
}

print("max:",&amp;max(1,2,3));
</pre>
<pre>D:\&gt;test.pl
argument size should be 2
max:2
</pre>
</li>
<li>use strict 強迫程式碼用比較好的方式撰寫
原本的範例
<pre>sub test {
 foreach $qq (qw /a b c/) {
  print("$qq\n");
 }
}

$qq = 5;
&amp;test;
print("qq:",$qq);
</pre>
<pre>d:\&gt;test.pl
a
b
c
qq:5
</pre>
加上 use strict 之後
<pre>use strict;
sub test {
 foreach $qq (qw /a b c/) {
  print("$qq\n");
 }
}

$qq = 5;
&amp;test;
print("qq:",$qq);
</pre>
<pre>d:\&gt;test.pl
Global symbol "$qq" requires explicit package name at D:\test.pl line 3.
Global symbol "$qq" requires explicit package name at D:\test.pl line 4.
Global symbol "$qq" requires explicit package name at D:\test.pl line 8.
Global symbol "$qq" requires explicit package name at D:\test.pl line 10.
Execution of D:\test.pl aborted due to compilation errors.
</pre>
</li>
<li>return 回傳值<br />
原本 subroutine 的最後一行程式就是該 subroutine 的回傳值, 不過使用 return 就可以在最後一行之前回傳
<pre>sub indexOf {
    my($keyword,@texts) = @_;
    foreach (0...$#texts) {
        if ($keyword eq $texts[$_]) {
            return $_;
        }
    }
    -1;
}

print(&amp;indexOf("test",qw/ ab r ewr /),"\n");
print(&amp;indexOf("test",qw/ ab r ewr test/),"\n");
</pre>
<pre>d:\&gt;test.pl
-1
3
</pre>
</li>
<li>當呼叫 subroutine 時需要用 &amp; 來呼叫, 這是透過 &amp; 來告訴 perl 這是一個 subroutine. 不過如果呼叫的時候有加參數,讓 perl 知道這是個 subroutine, 就不需要 &amp; 了.
<pre>sub say {
    print("say:",@_);
}

say("hello");
</pre>
<pre>d:\&gt;test.pl
say:hello
</pre>
</li>
<li>但是如果 subroutine 的名稱跟 perl 預設的 function 同名, 那還是需要透過 &amp; 來告訴 perl 這是 subroutine 而不是預設的 function.
<pre>sub print {
    print("print:",@_);
}
print("hello\n");
&amp;print("hello");
</pre>
<pre>d:\&gt;test.pl
hello
print:hello
</pre>
</li>
<li>使用 my 宣告的區域變數在 subroutine 結束後值就不在了, 使用 state 宣告的話, 變數的狀態會記在 subroutine 中. 不過要宣告 use 5.010 才可以使用這個功能.
<pre>use 5.010;

sub test {
    my $localn = 0;
    $localn = $localn+1;
    print("test.localn:",$localn,"\n");
    
    state $n = 0;
    $n = $n+1;
    print("test.n:",$n,"\n");
}

sub test2 {
    state $n = 0;
    $n = $n+1;
    print("test2.n:",$n,"\n");
}

&amp;test;
&amp;test;
&amp;test2;
</pre>
<pre>d:\&gt;test.pl
test.localn:1
test.n:1
test.localn:1
test.n:2
test2.n:1
</pre>
<pre>use 5.010;

sub append {
    state @list;
    foreach (@_) {
        push(@list,$_);
    }
    print("list:",@list,"\n");
}

&amp;append(qw/a b c/);
&amp;append(qw/1 2 3/);
&amp;append(qw/Q R T/);
</pre>
<pre>d:\&gt;test.pl
list:abc
list:abc123
list:abc123QRT
</pre>
</li>
<li>console 輸入
<pre>$line = &lt;STDIN&gt;;
chomp($line);
print($line);
</pre>
<pre>d:\&gt;test.pl
test
test
</pre>
<pre>while (defined($line = &lt;STDIN&gt;)) {
    print($line);
}
</pre>
<pre>d:\&gt;test.pl
test
test
qq
qq
BB
BB
^Z

d:\&gt;
</pre>
<pre>while(&lt;STDIN&gt;) {
    print($_);
}
</pre>
<pre>d:\&gt;test.pl
test
test
qq
qq
bb
bb
QQ
QQ
^Z

</pre>
<pre>foreach (&lt;STDIN&gt;) {
    print($_,"\n");
}
</pre>
<pre>d:\&gt;test.pl
a
b
c
^Z
a

b

c
</pre>
這裡值得說明的是: perl 在 while 迴圈中使用 &lt;STDIN&gt; 做了特別處理, 使用 while (&lt;STDIN&gt;) 的效果會變這樣
<pre>while (defined($_ = &lt;STDIN&gt;)) {
    print($_);
}
</pre>
<pre>d:\&gt;test.pl
test
test
bb
bb
^Z
</pre>
不過使用 foreach 則會把 STDIN 的結果全都讀進來才用 foreach iterate.<br />
這代表著如果 STDIN 的 input 量很大, 使用 while 沒關係因為每次換行都會輸出一次.<br />
使用 foreach 來讀大資料的話有可能一次佔用很多記憶體.
</li>
<li>在程式中使用 while (&lt;&gt;) 可以讀取開啟程式時參數指定的檔案, 或者用 - 來當成標準輸入<br />
test2.txt
<pre>{"test2":"test2","a": 1, "b": [1, 2, 3, 4, 5, 6]}
</pre>
julie.txt
<pre>2.59,2.11,2:11,2:23,3-10,2-23,3:10,3.21,3-21
</pre>
test.pl
<pre>while (&lt;&gt;) {
    print("print:$_\n");
}
</pre>
<pre>d:\&gt;test.pl test2.txt julie.txt
print:{"test2":"test2","a": 1, "b": [1, 2, 3, 4, 5, 6]}
print:2.59,2.11,2:11,2:23,3-10,2-23,3:10,3.21,3-21
</pre>
在參數指定 - 可以加上 STDIN 的效果<br />
test.pl
<pre>while (&lt;&gt;) {
    print("print:$_\n");
}
</pre>
<pre>d:\&gt;test.pl test2.txt - julie.txt
print:{"test2":"test2","a": 1, "b": [1, 2, 3, 4, 5, 6]}
qq
print:qq

bb
print:bb

^Z
print:2.59,2.11,2:11,2:23,3-10,2-23,3:10,3.21,3-21
</pre>
看到 - 的處理都會多一個換行, 可以用 chomp 去掉.<br /> 
另外 perl 鼓勵我們少打字, 呼叫 function 的時候不用加括號也可以
<pre>while (&lt;&gt;) {
    chomp;
    print "print:$_\n";
}
</pre>
<pre>d:\&gt;test.pl test2.txt - julie.txt
print:{"test2":"test2","a": 1, "b": [1, 2, 3, 4, 5, 6]}
testt
print:testt
^Z
print:2.59,2.11,2:11,2:23,3-10,2-23,3:10,3.21,3-21

</pre>
如果沒指定參數, &lt;&gt; 就會從 STDIN 讀取輸入
<pre>while (&lt;&gt;) {
    chomp;
    print "print:$_\n";
}
</pre>
<pre>d:\&gt;test.pl
a
print:a
b
print:b
c
print:c
^Z

</pre>
</li>
<li>while(&lt;&gt;) 其實是處理 @ARGV, @ARGV 是 perl 的特殊陣列, 裡面會放起動程式的參數, 進入程式後可以像一般陣列一樣使用
<pre>foreach (@ARGV) {
    print("arg:$_\n");
}
</pre>
<pre>d:\&gt;test.pl a b c
arg:a
arg:b
arg:c

</pre>
<pre>@ARGV = qw/a b c/;
foreach (@ARGV) {
    print("arg:$_\n");
}
</pre>
<pre>d:\&gt;test.pl d d d
arg:a
arg:b
arg:c
</pre>
</li>
<li>print &lt;&gt; 作出 linux 下 cat 的效果
data1.txt
<pre>a
b
c
d
e
</pre>
data2.txt
<pre>d
d
c
b
a
e
</pre>
執行 cat
<pre>[root@Platform-151-ninja Isaac]# cat data1.txt data2.txt 
a
b
c
d
e
d
d
c
b
a
e
</pre>
執行 perl
<pre>print &lt;&gt;;
</pre>
在 linux 執行
<pre>[root@Isaac]# perl test.pl data1.txt data2.txt 
a
b
c
d
e
d
d
c
b
a
e
</pre>
在 windows 執行結果跟在 Linux 執行不太一樣
<pre>d:\&gt;test.pl data1.txt data2.txt
a
b
c
d
ed
d
c
b
a
e
</pre>
</li>
<li>待續...</li>
<li><br /></li>
</ol>
