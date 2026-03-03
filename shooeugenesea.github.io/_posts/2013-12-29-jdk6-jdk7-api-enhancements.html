---
layout: post
title: "JDK6 to JDK7 => API Enhancements"
date: 2013-12-29 12:42:00 +0800
tags: [java, jdk 7]
---

<h2>
Description</h2>
<div>
打算把系統的執行環境從 JDK6 升級到 JDK7, 整理一下有哪些可用.<br />
比較期待的部分是語法, NIO2, G1. 這頁是整理語法的部分.</div>
<h2>
Reference</h2>
<div>
<a href="http://docs.oracle.com/javase/7/docs/technotes/guides/language/enhancements.html#javase7">Enhancements in Java SE 7</a><br />
<a href="http://docs.oracle.com/javase/7/docs/webnotes/adoptionGuide/index.html#lang">Java Language Enhancements</a><br />
<br /></div>
<h2>
Points</h2>
<div>
<ol>
<li>Strings in switch Statements<br /><pre>package test;

public class TestStringSwitch {

 public static void main(String[] params) {
  inJDK7("abc");
  inJDK6("abc");
 }
 
 private static void inJDK7(String txt) {
  switch (txt) {
  case "a":
   System.out.println("a");
   break;
  case "b":
   System.out.println("b");
   break;
  case "abc":
   System.out.println("abc");
   break;
  default:
    System.out.println("not match");
  }
 }
 
 private static void inJDK6(String txt) {
  if ( "a".equals(txt) ) {
   System.out.println("a");
  } else if ( "b".equals(txt) ) {
   System.out.println("b");
  } else if ( "abc".equals(txt) ) {
   System.out.println("abc");
  } else {
   System.out.println("not match");
  }
 }
 
 
}<span style="font-family: &quot;times new roman&quot;;"></span></pre>
</li>
<li>Type Inference for Generic Instance Creation<br />
<pre>package test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class TestGenericDeclare {

  public static void main(String[] params) {
    // JDK6
    Map<string list="" tring="">&gt; map0 = new HashMap<string list="" tring="">&gt;();
    
    // JDK7
    Map<string list="" tring="">&gt; map1 = new HashMap&lt;&gt;();
  }
  
}<span style="font-family: &quot;times new roman&quot;;"></span></string></string></string></pre>
</li>
<li>The try-with-resources Statement<br />試用後可以看到這個語法可以讓程式簡化很多.<br /><pre>package test;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;

public class TestAutoClosable {

    public static void main(String[] params) throws IOException {
        File file1 = new File("d:/test.txt");
        File file2 = new File("d:/test2.txt");
        inJDK6(file1,file2);
        inJDK7(file1,file2);
    }

    private static void inJDK7(File file1, File file2) throws IOException {
        try (
            FileReader fileReader1 = new FileReader(file1);
            FileReader fileReader2 = new FileReader(file2);
            BufferedReader reader1 = new MyBufferedReader("7 reader1", fileReader1);
            BufferedReader reader2 = new MyBufferedReader("7 reader2", fileReader2);
        ) {
            System.out.println(reader1.readLine());
            System.out.println(reader2.readLine());
        }
    }
    
    private static void inJDK6(File file1, File file2) {
        BufferedReader reader1 = null;
        BufferedReader reader2 = null;
        try {
            reader1 = new MyBufferedReader("JDK6 style reader1", new FileReader(file1));
            reader2 = new MyBufferedReader("JDK6 style reader2", new FileReader(file2));
            System.out.println(reader1.readLine());
            System.out.println(reader2.readLine());
        } catch(Throwable ex) {
            ex.printStackTrace();
        } finally {
            if ( reader1 != null ) {
                try {
                    reader1.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
            if ( reader2 != null ) {
                try {
                    reader2.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
    
    private static class MyBufferedReader extends BufferedReader {
        private final String name;
        public MyBufferedReader(String name, Reader reader) {
            super(reader);
            this.name = name;
        }
        @Override
        public void close() throws IOException {
            super.close();
            System.out.println("close " + name);
        }
    }
    
}<span style="font-family: &quot;times new roman&quot;;"></span></pre>
</li>
<li>Catching Multiple Exception Types and Rethrowing Exceptions with Improved Type Checking<br />有時對於不特別處理的 checked exception 動作也只是往外丟, 在 JDK7 之前需要在 method 上特別註明這個 checked exception, 但 JDK7 之後, 沒有特別需要的, 直接往外丟的 exception 就算沒有在 method 上宣告, compiler 也不會判你錯.<br />
<pre>package test;

public class TestHandleMoreThanOneException {

    public static void main(String[] params) throws Exception {
        rethrowEx("3");
    }

    private static void rethrowEx(String exNum) <span style="color: red;">throws Ex1,Ex2</span> {
        try {
            throwEx(exNum);
        } catch (Ex1 | Ex2 e) {
            throw e;
        <span style="color: red;">} catch (Exception e) {
            throw e;
        }</span>
    }
    
    private static void throwEx(String exNum) <span style="color: red;">throws Ex1, Ex2</span> {
        switch (exNum) {
        case "1":
            throw new Ex1();
        case "2":
            throw new Ex2();
        default:
            System.out.println("not match");
        }
    }
    
    public static class Ex1 extends Exception {}
    public static class Ex2 extends Exception {}
    
}
</pre>
</li>
<li><br /></li>
</ol>
</div>
<div>
<br /></div>
