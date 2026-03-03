---
layout: post
title: Java Concurrent - ForkJoinPool
date: 2018-09-13 17:09:00 +0800
tags: [java, java concurrent]
---

<h3>
ExecutorService and Problem</h3>
<div>
用一個 ExecutorService submit task 後, 如果 task 會 submit 其他的 task, 這些 task 都會放進 ExecutorService 的 queue 中.</div>
<div>
這樣就沒辦法做到 "第一個 task 與其產生的 subtask 完成後就印一行 log"</div>
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhoV5PAcAPOgGAfCS_6bic1g9GDbEggi7FTk9PGjXGqCM4QoJ4fPLNkGUFCJhsKZoWIwg9R9aZy1JCVZYb7Mfelq9lNZ2qxFuysn0YORDNGNQIROifdu6JdrixwoXwEXGJT16-0Bx_Wug/s1600/Screen+Shot+2018-09-14+at+12.53.12+AM.png" imageanchor="1" style="margin-left: 1em; margin-right: 1em;"><img border="0" data-original-height="793" data-original-width="1600" height="158" src="/assets/images/blog/Screen-Shot-2018-09-14-at-12.53.12-AM.png" width="320" /></a></div>
<div>
<br /></div>
<h3>
ForkJoinPool and Purpose</h3>
<div>
使用了 ForkJoinPool 就可以透過 task 的 fork 與 join 讓 task 變成樹狀結構.</div>
<div>
<ol>
<li>建立 ForkJoinPool</li>
<li>用 ForkJoinPool submit task</li>
<li>task 建立幾個新的 subtask</li>
<li> 呼叫 subtask 的 fork</li>
<li>呼叫 subtask 的 join</li>
<li>執行到 parent 的 task 結束</li>
</ol>
<div>
如此就能讓 task 自然分群</div>
</div>
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjHLNTdCAZPQkqVAFCXXwHc5DrRgiDizwv6aQAT2MvpMAm65uIHXRlDcej9ntmDTVOoD5lN-q_nBapFoNGN1Zmk9zCt7Nq31FTaGJALcGVXuE2E_Cu1KA2O3-8TOWG_I5ZUcFsrRg3IHw/s1600/Screen+Shot+2018-09-14+at+1.03.42+AM.png" imageanchor="1" style="margin-left: 1em; margin-right: 1em;"><img border="0" data-original-height="869" data-original-width="1600" height="173" src="/assets/images/blog/Screen-Shot-2018-09-14-at-1.03.42-AM.png" width="320" /></a></div>
<h3>
Reference and Sample</h3>
<div>
<ol>
<li><a href="https://github.com/shooeugenesea/study-practice/blob/java8/src/main/java/examples/concurrent/ForkJoinPoolMain.java" target="_blank">Sample Code ForkJoinPoolMain.java</a></li>
<li><a href="https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinPool.html" target="_blank">ForkJoinPool API</a></li>
</ol>
</div>
<h3>
Code</h3>
<div>
<pre>public class ForkJoinPoolMain {

    private static AtomicInteger actionCounter = new AtomicInteger();
    public static void main(String[] params) throws ExecutionException, InterruptedException {
        ForkJoinPool pool = new ForkJoinPool();
        System.out.println("main:" + pool.submit(new MyAction(new int[]{1,2,3,4,5,6,7,8,9,10,11})).get());
    }

    private static class MyAction extends RecursiveTask&lt;Integer&gt; {
        // Extends RecursiveAction if no return value required

        private int count;
        private int[] numbers;

        public MyAction(int[] numbers) {
            this.count = actionCounter.incrementAndGet();
            this.numbers = numbers;
        }

        @Override
        protected Integer compute() {
            if (numbers.length &gt; 2) {
                System.out.println(count + " split " + Arrays.toString(numbers) + " to 2 arrays");
                List&lt;MyAction&gt; actions = new ArrayList&lt;&gt;();
                actions.add(new MyAction(Arrays.copyOfRange(numbers, 0, numbers.length / 2)));
                actions.add(new MyAction(Arrays.copyOfRange(numbers, numbers.length / 2, numbers.length)));
                <span style="color: red;"><b>actions.forEach(MyAction::fork);</b></span>
                return actions.stream().mapToInt(<span style="color: red;"><b>MyAction::join</b></span>).sum();
            } else if (numbers.length == 2) {
                System.out.println(count + " add " + numbers[0] + " and " + numbers[1]);
                return numbers[0] + numbers[1];
            }
            System.out.println(count + " just return " + numbers[0]);
            return numbers[0];
        }
    }

}
下篇：<a href="https://www.isaacnote.com/2018/09/forkjoinpool.html">ForkJoinPool 沒處理好也會 deadlock</a></pre>
</div>
<div>
<br /></div>
