---
layout: post
title: Spring Integration - Basic Terms
date: 2018-09-28 15:05:00 +0800
tags: [spring, java, spring integration]
---

<h2>
Reference</h2>
<div>
<a href="https://github.com/shooeugenesea/study-practice/tree/spring-int" target="_blank">Spring Integration Basic Terms</a><br />
後篇:&nbsp;<a href="https://www.isaacnote.com/2018/10/spring-integration-channels.html">https://www.isaacnote.com/2018/10/spring-integration-channels.html&nbsp;</a></div>
<h2>
Terms</h2>
<h3>
org.springframework.integration.Message&lt;T&gt;</h3>
<div>
用來封裝訊息, 成員包含 MessageHeader 與 Payload</div>
<h3>
org.springframework.integration.MessageHeaders</h3>
<div>
MessageHeaders 是 immutable 的, 包含一些預設的 attribute:&nbsp;id, timestamp, correlation id, and priority</div>
<h3>
Payloads</h3>
<div>
用來裝 message body, 可以自訂 transformer 來傳遞封包</div>
<div>
<h3>
Message Channel</h3>
</div>
<div>
Message Channel 用來傳遞封包, 也用來 decouple producer 與 consumer.</div>
<div>
Message Channel 有兩種模式:&nbsp;</div>
<div>
<ol>
<li>point to point, 一個封包只會被一個 consumer 收到</li>
<li>public/subscribe: 一個封包會被多個 consumer 收到</li>
</ol>
<h3>
Message Endpoints</h3>
<div>
endpoint 泛指 Spring Integration 裡面的各種 component.</div>
<div>
<ul>
<li>Message Adapter: 資料可從外部系統透過 adapter 送進 Spring Integration</li>
<li>Transformer: 轉換訊息</li>
<li>Filter: 決定 Message 是否傳給 Message Channel</li>
<li>Router: 透過 Message 的內容判斷要送給哪一個 Message Channel</li>
<li>Splitter: 把一個 Message 切成好幾個轉送給不同適合的 Message Channel</li>
<li>Aggregator: 把多個訊息合併成一個</li>
<li>Service activator: Message Channel 與 Service instance 之間的介面</li>
</ul>
<h2>
Example</h2>
</div>
<div>
<h4>
spring-context.xml</h4>
</div>
<div>
<br />
<pre>&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:int="http://www.springframework.org/schema/integration"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-3.0.xsd
        http://www.springframework.org/schema/integration http://www.springframework.org/schema/integration/spring-integration-5.0.xsd
        http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-3.0.xsd"&gt;
        &lt;context:component-scan base-package="examples" /&gt;
        &lt;int:channel id="input"/&gt;
        &lt;int:channel id="output"&gt;
            &lt;int:queue capacity="10"/&gt;
        &lt;/int:channel&gt;
        &lt;int:service-activator input-channel="input"
                           output-channel="output"
                           ref="messageHandler"/&gt;
&lt;/beans&gt;
</pre>
</div>
<div>
<h4>
examples/MessageHandler.java
</h4>
<pre>@Component
public class MessageHandler {
    @ServiceActivator
    public String handleMessage(String message) {
        System.out.println("Received message: " + message);
        return "MESSAGE:" + message;
    }
}
</pre>
</div>
</div>
<h4>
examples/Application.java
</h4>
<pre>public class Application {
    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("classpath:spring-context.xml");
        context.start();

        MessageChannel input = context.getBean("input", MessageChannel.class );
        PollableChannel output = context.getBean("output", PollableChannel.class );

        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNextLine()) {
            input.send(MessageBuilder.withPayload(scanner.nextLine()).build());
        }
    }
}
</pre>
<div>
<h4>
Run, input message and send to MessageHandler to print
</h4>
</div>
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEinXy_2dcVbvkxYe6kU67cFk-pFze1W1tabch5vmrpzJ9bYP_42N9IZBlGL8x_L28Krp-AR2izW4MCUZKJlQ6GKL6OIiyPg0_fuLgfKYlZrV5_Esa9ZwMalcLiiNErPS6xiZZyRKjoInA/s1600/Screen+Shot+2018-09-28+at+11.04.24+PM.png" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" data-original-height="516" data-original-width="918" height="223" src="/assets/images/blog/Screen-Shot-2018-09-28-at-11.04.24-PM.png" width="400" /></a></div>
<div>
<br /></div>
