---
layout: post
title: ForkJoinPool - Error Handling
date: 2018-09-21 08:28:00 +0800
tags: [java, java concurrent]
---

<h3>
Reference</h3>
<div>
Git:&nbsp;<a href="https://github.com/shooeugenesea/study-practice/blob/java8/src/main/java/examples/concurrent/ForkJoinPoolErrorMain.java">ForkJoinPoolErrorMain.java</a><br />
前篇:&nbsp;<a href="https://www.isaacnote.com/2018/09/forkjoinpool-work-stealing.html">ForkJoinPool - Workstealing</a><br />
Next:&nbsp;<a href="https://www.isaacnote.com/2018/09/forkjoinpool-thread-management.html">ForkJoinPool - Thread Management</a></div>
<h3>
Error Handling</h3>
<div>
如果 fork 出去的 task/action 有 exception, 呼叫 join 的時候要注意 catch exception.</div>
<div>
不然 task/action 就死掉失控了.</div>
<div>
而且可怕的是: 不會有 log.</div>
<h3>
Codes</h3>
<div>
這段程式是說每個 action 有個 id, 奇數 id 會報 exception.</div>
<h4>
Exception without catch when join</h4>
<div>
先是不要 catch 的情況
<br />
<pre>public class ForkJoinPoolErrorMain {

    static final CountDownLatch latch = new CountDownLatch(1);

    public static void main(String[] params) throws InterruptedException {
        ForkJoinPool pool = new ForkJoinPool(2);
        ScheduledExecutorService s = Executors.newScheduledThreadPool(1);
        s.scheduleAtFixedRate(() -&gt; System.out.println(pool), 0, 1, TimeUnit.SECONDS);
        pool.submit(new ErrorAction(MAIN_TASK_ID));
        latch.await(10, TimeUnit.SECONDS);
        pool.shutdown();
        s.shutdown();
    }

    static class ErrorAction extends RecursiveAction {

        public static final int MAIN_TASK_ID = -1;
        private final int id;

        ErrorAction(int id) {
            this.id = id;
        }

        private boolean isSubTask() {
            return id &gt;= 0;
        }

        @Override
        protected void compute() {
            if (isSubTask()) {
                if (id % 2 == 1) {
                    throw new IllegalStateException("Error when id is odd number");
                }
            } else {
                List&lt;ErrorAction&gt; actions = IntStream.range(0,10).mapToObj(idx -&gt; new ErrorAction(idx)).collect(Collectors.toList());
                actions.forEach(ErrorAction::fork);
                actions.forEach(action -&gt; {
                    action.join();
                });
                latch.countDown();
            }
            System.out.println("compute done. id=" + id);
        }
    }

}</pre>
輸出如下, 不過一個 exception 也沒有.<br />
main action 也沒有完成.(main action id = -1)<br />
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgFhZmcvj-lHxTWkrFeUH97BNx18nGHe2veTMihz01mwB-Qv9BUS7ZdF8kgmD0jm8rnx0vWuTjS5jBKq896nVhQ0lGSouE-NzBWFigJorQsK432mTgG0N49A26DK9Bu3yxmX0x9dtGdPw/s1600/Capture.PNG" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" data-original-height="295" data-original-width="1035" height="182" src="/assets/images/blog/Capture.png" width="640" /></a></div>
<br><br>
<h4>
Exception with catch statement</h4>
<div>
有 catch 的程式如下</div>
<div>
<pre>public class ForkJoinPoolErrorMain {

    static final CountDownLatch latch = new CountDownLatch(1);

    public static void main(String[] params) throws InterruptedException {
        ForkJoinPool pool = new ForkJoinPool(2);
        ScheduledExecutorService s = Executors.newScheduledThreadPool(1);
        s.scheduleAtFixedRate(() -&gt; System.out.println(pool), 0, 1, TimeUnit.SECONDS);
        pool.submit(new ErrorAction(MAIN_TASK_ID));
        latch.await(10, TimeUnit.SECONDS);
        pool.shutdown();
        s.shutdown();
    }

    static class ErrorAction extends RecursiveAction {

        public static final int MAIN_TASK_ID = -1;
        private final int id;

        ErrorAction(int id) {
            this.id = id;
        }

        private boolean isSubTask() {
            return id &gt;= 0;
        }

        @Override
        protected void compute() {
            if (isSubTask()) {
                if (id % 2 == 1) {
                    throw new IllegalStateException("Error when id is odd number");
                }
            } else {
                List&lt;ErrorAction&gt; actions = IntStream.range(0,10).mapToObj(idx -&gt; new ErrorAction(idx)).collect(Collectors.toList());
                actions.forEach(ErrorAction::fork);
                actions.forEach(action -&gt; {
                    try {
                        action.join();
                    } catch (Exception ex) {
                        System.err.println(ex + ", id=" + action.id);
                    }
                });
                latch.countDown();
            }
            System.out.println("compute done. id=" + id);
        }
    }

}
</pre>
<br /></div>
這個程式就可以印 error, 而且 maintask 可以執行完成<br />
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8TvO_AnqIYZJtGSz1xaKKNWacmo6iOe7KJMXJ2DGnxXFpM4yLHMkIoMWhk-ggIEJ2sfNx41nzTp8pxqgE5rivOlvOUMR-P-XONsEtZPcZXCxTNkDeohBzu086HNw2pltewuf84BPWvg/s1600/Capture.PNG" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" data-original-height="293" data-original-width="1025" height="180" src="/assets/images/blog/Capture.png" width="640" /></a></div>
<br><br>
<h4>
Exception with ExecutorService</h4>
</div>
<div>
如果是 ExecutorService, 就算是丟 RuntimeException.</div>
<div>
ExecutorService 還是會把 exception 印到 console 上.
<br />
<pre>public class ExecutorServiceWithExceptionMain {

    public static void main(String[] params) {
        ExecutorService ex = Executors.newSingleThreadExecutor();
        ex.execute(() -&gt; {
            throw new IllegalStateException("test throw illegalState");
        });
        ex.shutdown();
    }

}</pre>
即使是直接丟 exception 也會印到 console.<br />
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhvCsiCJHZaRv4t3dEVisL6I8tqEpm-KCBqy3cdhnlyILcYTiizb6MfK8wr5UNXJbRYbDXOaqq3_aujZih9GPuAm7_pvnMh9Dz5vX8tzyoHAQmmUYep-zfn_3fZ5u81ktk33PruEa4Y9Q/s1600/Capture.PNG" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" data-original-height="139" data-original-width="973" height="56" src="/assets/images/blog/Capture.png" width="400" /></a></div>
<br /></div>
