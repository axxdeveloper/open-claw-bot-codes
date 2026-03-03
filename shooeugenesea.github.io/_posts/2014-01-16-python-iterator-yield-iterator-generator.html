---
layout: post
title: python 的 iterator 與 (神奇的) yield (iterator generator)
date: 2014-01-16 23:37:00 +0800
tags: [python]
---

<h2>
Reference</h2>
<div>
http://docs.python.org/3/tutorial/classes.html#iterators<br />
http://docs.python.org/3/tutorial/classes.html#generators</div>
<h3>
Iterator</h3>
<div>
這段程式
<br />
<br />
<pre>for i in range(5):
    print(i)</pre>
<br />
執行結果為<br />
<br />
<pre>0
1
2
3
4
</pre>
<br />
可以執行的原因是 range 回傳了一個可以 iterate 的物件,<br />
讓 python 可以呼叫 "next" 取得下一個值.<br />
如果想要自己實作一個能用 for iterate 的物件時,<br />
只需要實作 __iter__ 與 __next__ 這兩個 function,<br />
for 迴圈執行時 python 會自動執行這兩個 function.<br />
我們只要在 __next__ 呼教時維持好物建的狀態即可.<br />
通知 for 迴圈停止的方式是丟出一個 StopIteration 的 error<br><br>
<pre>class NumberIterator:
    def __init__(self, max):
        self.max = max
        self.current = 0
    def __iter__(self):
        print('iter is called. max=',self.max)
        return self
    def __next__(self):
        print('next is called, current=', self.current, ', max=', self.max)
        if ( self.current == self.max ):
            raise StopIteration
        self.current += 1
        return self.current
        
it = NumberIterator(5)
# "for" statement will call iter() of NumberIterator
# so 'iter is called. max=' will be printed
for i in it:
    print(i) #print 1 ~ 5

# there is no "for" statement, so 'iter is called. max=' won't be printed
it = NumberIterator(4)
print(next(it))
print(next(it))
print(next(it))
print(next(it))
print(next(it)) #StopIteration
</pre>
<br />
執行結果<br />
<br />
<pre>d:\workspace_python&gt;python test.py
iter is called. max= 5
next is called, current= 0 , max= 5
1
next is called, current= 1 , max= 5
2
next is called, current= 2 , max= 5
3
next is called, current= 3 , max= 5
4
next is called, current= 4 , max= 5
5
next is called, current= 5 , max= 5
next is called, current= 0 , max= 4
1
next is called, current= 1 , max= 4
2
next is called, current= 2 , max= 4
3
next is called, current= 3 , max= 4
4
next is called, current= 4 , max= 4
Traceback (most recent call last):
  File "test.py", line 27, in <module>
    print(next(it)) #StopIteration
  File "test.py", line 11, in __next__
    raise StopIteration
StopIteration
</module></pre>
<br />
<h3>
yield (iterator generator)</h3>
</div>
<div>
神奇的 yield, 這個 statement 是出現在 function 裡面,&nbsp;</div>
<div>
讓程式先回傳, 但 function 內的狀態保持不變,&nbsp;</div>
<div>
等下次程式的 __next__ 被呼叫時, 程式會從 yield 之後的碼繼續執行.
<br />
<pre>def test_yield():
    i = 0
    print('before the first yield',i)
    yield i
    print('after the first yield',i)
    i += 1
    print('before the second yield',i)
    yield i
    print('after the second yield',i)
    i += 1
    for i in range(3):
        print('before yield in for stmt')
        yield i**2
        print('after yield in for stmt')
    
for i in test_yield():
    print(i)
</pre>
<br />
執行結果
<br />
<pre>d:\workspace_python&gt;python test.py
before the first yield 0
0
after the first yield 0
before the second yield 1
1
after the second yield 1
before yield in for stmt
0
after yield in for stmt
before yield in for stmt
1
after yield in for stmt
before yield in for stmt
4
after yield in for stmt
</pre>
</div>
