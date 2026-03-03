---
layout: post
title: ForkJoinPool - Thread Management
date: 2018-09-22 18:18:00 +0800
tags: [java, java concurrent]
---

<h3>
Reference</h3>
<div>
<a href="https://github.com/shooeugenesea/study-practice/blob/java8/src/main/java/examples/concurrent/ForkJoinPoolManyThreadMain.java" target="_blank">ForkJoinPoolManyThreadMain.java</a></div>
<div>
<a href="http://gee.cs.oswego.edu/dl/papers/fj.pdf" target="_blank">ForkJoinPool Paper</a><br />
<a href="https://www.isaacnote.com/2018/09/forkjoinpool-error-handling.html">ForkJoinPool - Error Handling</a></div>
<h3>
Question</h3>
<div>
原本以為 new ForkJoinPool(2) 像這樣的宣告, 是讓 ForkJoinPool 最多維持 2 個 thread 來執行.</div>
<div>
可是當實際觀察的時候, 卻發現有非常多個 thread 被叫起來跑.</div>
<div>
比方說原本 fork -&gt; join 的範例, 如果把 thread name 印出來, 就會發現有很多個 thread 被叫起來.</div>
<div>
而且每秒印出的 pool 也會發現 pool size 變大.<br />
<br /></div>
<h3>
Codes: Thread size exceed parallel level</h3>
<div>
<pre>public class ForkJoinPoolManyThreadMain {

    static final CountDownLatch latch = new CountDownLatch(1);
    private static final AtomicInteger threadCount = new AtomicInteger();

    public static void main(String[] params) throws ExecutionException, InterruptedException {
        ForkJoinPool pool = new ForkJoinPool(2);
        ScheduledExecutorService s = Executors.newScheduledThreadPool(1);
        s.scheduleAtFixedRate(() -&gt; {
            System.out.println(pool); }, 0, 1, TimeUnit.SECONDS);
        pool.execute(new MainAction());
        latch.await();
        s.shutdown();
        pool.shutdown();
    }

    private static class MainAction extends RecursiveAction {

        @Override
        protected void compute() {
            List&lt;SubAction&gt; actions = IntStream.range(0,100).mapToObj(idx -&gt; new SubAction()).collect(toList());
            actions.forEach(SubAction::fork);
            actions.forEach(SubAction::join);
            latch.countDown();
        }
    }

    private static class SubAction extends RecursiveAction {

        @Override
        protected void compute() {
            try {
                System.out.println(Thread.currentThread().getName() + " sleep 1 seconds");
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

}</pre>
<h3>
</h3>
<h3>
Output</h3>
</div>
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjtb6sIkOUYXByy0h4I_OBfFwxYI52H5ZGYJopIQrybPGDsShyphenhyphenPoe1VBzXjb7ngzyMAoFmgLR1Dne7c2LxcPEufUPVf-FG2hQg-yX59PHgJ0De1KaZYyosbSIHE4yyFlqh6obl6pj_RmQ/s1600/Screen+Shot+2018-09-22+at+10.27.19+PM.png" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" data-original-height="390" data-original-width="1600" height="96" src="/assets/images/blog/Screen-Shot-2018-09-22-at-10.27.19-PM.png" width="400" /></a></div>
<div>
從印出來的 log 就可以發現: thread 超過 2 個到達 14 個. pool size 實際上也到達 16</div>
<div>
<br /></div>
<div>
<br /></div>
<div>
<br /></div>
<br />
<br />
<h3>
Requirement</h3>
<div>
發現這件事情的時候覺得無法理解, 同時也發現原本以為 main task 的 thread 是跟被 join 的 thread 合再一起了. 結果看起來是有很多新的 thread 被產生出來執行. <span style="color: red;">如此我們怎麼確保不會有過多的 thread 被建立出來?</span>&nbsp;</div>
<br />
<h3>
Suggestion: Customized ThreadFactory? (Don't do this)</h3>
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjhYpH3D5Fa1RPluAHwMvbCTaM9THFIHgRlIMWZKzUOnD3fb0yCwFR7hQwzVmF7i6N9Yx1Il4qf2XKwo7mDyODRWJ3jKVvCTy6U7Fy2rxfgiBfmODjue__d_dv1iqdEOvDZKl4Yx1kL5Q/s1600/Screen+Shot+2018-09-23+at+1.08.56+AM.png" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" data-original-height="508" data-original-width="1084" height="186" src="/assets/images/blog/Screen-Shot-2018-09-23-at-1.08.56-AM.png" width="400" /></a></div>
<div>
因為 ForkJoinPool 裡的這段程式, 網路上有人建議是提供自己的 thread factory, <span style="color: red;">如果超過指定的 thread 數量就回傳 null</span>. 如此就被 ForkJoinPool 當成一個錯誤而繼續使用既有的 thread.</div>
<div>
<br /></div>
<div>
這個做法的確可以控制建立的 thread 數量 , 不過回傳 null 對 ForkJoinPool 來說是一個錯誤, 以 ForkJoinPool 的規則來說這個時候是要 createWorker 的, 不應該出現錯誤而回傳 null.<br><br>
</div>
<br />
<h3>
How: Join after done</h3>
<div>
突然想到會產生新的 thread 是不是因為 join 導致 MainAction 停住, 但又不是正在執行, 所以為了避免&nbsp;starvation 使 ForkJoinPool 需要建立一個新的 thread. 所以試著先判斷 isDone, done 才 join. 結果就可以了.&nbsp; (但還不清楚原因)</div>
<br />
<h3>
Working Code</h3>
<div>
<pre>public class ForkJoinPoolFixedThreadMain {

    public static final CountDownLatch latch = new CountDownLatch(1);

    public static void main(String[] params) throws ExecutionException, InterruptedException {
        ForkJoinPool pool = <span style="color: red;">new ForkJoinPool()</span>;
        MainAction action = new MainAction();
        ScheduledExecutorService s = Executors.newScheduledThreadPool(1);
        s.scheduleAtFixedRate(() -&gt; System.out.println(pool), 0, 1, TimeUnit.SECONDS);
        pool.execute(action);
        latch.await();
        s.shutdown();
    }

    private static class MainAction extends RecursiveAction {

        @Override
        protected void compute() {
            List&lt;SubAction&gt; actions = IntStream.range(0,100).mapToObj(idx -&gt; new SubAction()).collect(toList());
            actions.forEach(SubAction::fork);
            while(!actions.isEmpty()) {
                for (Iterator&lt;SubAction&gt; i = actions.iterator(); i.hasNext(); ) {
                    SubAction action = i.next();
                    if (action.isDone()) {
                        action.join();
                        i.remove();
                    }
                }
            }
            latch.countDown();
        }
    }

    private static class SubAction extends RecursiveAction {

        @Override
        protected void compute() {
            long start = System.currentTimeMillis();
            while (true) {
                if (System.currentTimeMillis() - start &gt; 1000) {
                    break;
                }
            }
        }
    }

}
</pre>
<br />
<h3>
Output</h3>
</div>
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3eHPo7ZLfVwXOOThNf3TdRW_k0jtYXjdhBU77uwBu5wHDp0oEnLNH23XOEsgi0af9tMOHVZGAJkq-f6vXOexQ11F5TzUqOV-fr6tHF3lRF1hwBl0rz2HmZ0QXm9kvGzowIKn4z_xV0g/s1600/Screen+Shot+2018-09-23+at+2.32.45+AM.png" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" data-original-height="482" data-original-width="1600" height="120" src="/assets/images/blog/Screen-Shot-2018-09-23-at-2.32.45-AM.png" width="400" /></a></div>
<div>
因為呼叫 new ForkJoinPool() 所以 pool size 最多就維持在 8 (我的電腦有 8 core)</div>
