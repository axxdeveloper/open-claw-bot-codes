---
layout: post
title: Java Concurrent Phaser
date: 2018-07-09 03:27:00 +0800
tags: [java, java concurrent]
---

<h2>
Introduction</h2>
<div>
今天才知道 Java 7 有提供一個 Phaser class 來處理更複雜的 CountDownLatch 需求.</div>
<h2>
Simple Phaser</h2>
<div>
想用 Phaser, 首先你的 threads 工作要有分階段, 一個階段沒做完就不能進行下個階段.<br />
有了這個限制後就可以照下面的流程做事情</div>
<div>
<ol>
<li>先註冊, 看有幾個 thread 要做事情.<br />=&gt; 透過呼叫 Phaser#register 去註冊</li>
<li>做完之後呼叫 arrive, 告訴 Phaser 有事情做完了</li>
<li>當每個 thread 都把事情做完, Phaser 就會進入下一個階段, 稱做 advance</li>
<li>當進入下一階段, Phaser 的 onAdvance method 就會被呼叫, <br />這個 method 是留給我們 developer 去實做</li>
</ol>
<div>
以上. 簡單的概念, 覺得看好久都沒看懂, 希望看這篇的人可以簡單看懂.</div>
</div>
<div>
接著是範例, 這範例是<br />
<br />
<ol>
<li>假設有幾個人賽跑</li>
<li>首先要到達起跑線&nbsp;</li>
<li>都到了以後才開跑&nbsp;</li>
<li>每個人都到達終點舊比賽結束.</li>
</ol>
<br />
<pre>public class PhaserRacingGame {

    public static void main(String[] params) {
        Random r = new Random();
        Phaser perGamePhase = new Phaser() {
            @Override
            protected boolean onAdvance(int phase, int registeredParties) {
                System.out.println("phase:" + phase + ", registeredParties:" + registeredParties + ", arrived:" + getArrivedParties());
                switch (phase) {
                    case 0:
                        System.out.println("start!");
                        break;
                    case 1:
                        System.out.println("game finish");
                        break;
                    default:
                        System.out.println("unexpected:" + phase);
                }
                return super.onAdvance(phase, registeredParties);
            }
        };
        IntStream.range(0,5).forEach(idx -&gt; {
            perGamePhase.register();
            new Thread(() -&gt; {
                System.out.println(idx + " arrive starting line and wait for start");
                perGamePhase.arriveAndAwaitAdvance();
                System.out.println(idx + " run!! startTime:" + System.currentTimeMillis());
                long spendTime = r.nextInt(1000);
                sleep(spendTime);
                perGamePhase.arrive();
            }).start();
        });
        sleep(5000);
    }

    private static void sleep(long ms) {
        try {
            TimeUnit.MILLISECONDS.sleep(ms);
        } catch (InterruptedException e) {
        }
    }

}</pre>
</div>
<div>
<h2>
Parent Phaser</h2>
</div>
<div>
再來比較複雜的是 Parent Phaser, Parent Phaser 的目的是減少 synchronization 的時候搶 lock 的碰撞.&nbsp;</div>
<div>
使用 Parent Phaser 的時候要注意的是: advance 是發生在 Parent Phaser 而不是 Child Phaser,&nbsp;</div>
<div>
使用 Parent Phaser 的時候, 是可以確保每個 Child Phaser 準備號都進入下一個 phase 的時候, 已經先到達的 Child Phaser 才可以更進一步 arrive.</div>
<div>
比方說世足十六強賽, 要等所有能進入八強賽的隊伍都出線之後才可以開始進行八強賽.</div>
<div>
那 Parent Phaser 就是賽程, 十六強賽則是有八個 Child Phaser.</div>
<div>
以下範例是看出特性, 方便 copy paste 觀察</div>
<div>
<pre>public class ParentPhaser {

    public static void main(String[] params) {
        Phaser parent = new Phaser() {
            @Override
            protected boolean onAdvance(int phase, int registeredParties) {
                System.out.println("parent phase:" + phase + ", registeredParties:" + registeredParties);
                return super.onAdvance(phase, registeredParties);
            }
        };
        Phaser child1 = new Phaser(parent, 4) {
            @Override
            protected boolean onAdvance(int phase, int registeredParties) {
                System.out.println("child phase:" + phase + ", registeredParties:" + registeredParties);
                return super.onAdvance(phase, registeredParties);
            }
        };
        Phaser child2 = new Phaser(parent, 3) {
            @Override
            protected boolean onAdvance(int phase, int registeredParties) {
                System.out.println("child phase:" + phase + ", registeredParties:" + registeredParties);
                return super.onAdvance(phase, registeredParties);
            }
        };
        IntStream.range(0,10).forEach(idx -&gt; {
            child1.arrive();
            child1.arrive();
            child1.arrive();
            child1.arrive();
//            child1.arrive(); // cause error, child1 need wait for child2 finish
            child2.arrive();
            child2.arrive();
            child2.arrive();
        });
    }

}
</pre>
</div>
