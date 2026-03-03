---
layout: post
title: Java Concurrent CyclicBarrier
date: 2018-07-09 17:48:00 +0800
tags: [java, java concurrent]
---

<h2>
Introduction</h2>
<div>
CyclicBarrier 很久沒用都忘了, 來複習一下..</div>
<h2>
Description</h2>
<div>
簡單說就是很多個 thread 去作事情, 作完之後就 await.</div>
<div>
CyclicBarrier 等作完的 thread 達到指定的個數後, await 就結束.</div>
<h2>
Code</h2>
<div>
<pre>public class CyclicBarrierMain {

    public static void main(String[] params) throws InterruptedException {
        int runner = 5;
        CountDownLatch gameOver = new CountDownLatch(runner);
        CyclicBarrier b = new CyclicBarrier(runner, () -&gt; {
            System.out.println("barrier done");
        });
        IntStream.range(0,runner).forEach(idx -&gt; {
            new Thread() {
                @Override
                public void run() {
                    try {
                        System.out.println("wait " + idx);
                        b.await();
                        System.out.println("count down " + idx);
                        gameOver.countDown();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }.start();
        });
        gameOver.await();
        System.out.println("game over");
    }

}
</pre>
</div>
