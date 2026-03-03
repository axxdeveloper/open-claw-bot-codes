---
layout: post
title: "JDK6 to JDK7 => Basic IO"
date: 2014-01-05 10:59:00 +0800
tags: [java, jdk 7]
---

<h3>
Reference</h3>
<div>
<a href="http://docs.oracle.com/javase/tutorial/essential/io/index.html">Lesson: Basic I/O</a></div>
<h3>
讀寫小檔案</h3>
<div>
如果檔案比較小可以使用 Files 提供的 read/write.</div>
<pre>package test;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.Arrays;
import java.util.List;

public class TestIO {

    public static void main(String[] params) throws IOException {
        Charset cs = Charset.forName("utf-8");
        Path path = Paths.get("d:/", "test.txt");
        List<string> lines = Arrays.asList("line1", "line2", "line3");
        Files.write(path, lines, cs, StandardOpenOption.TRUNCATE_EXISTING);
        List<string> readLines = Files.readAllLines(path, cs);
        System.out.println(readLines);
    }

}
</string></string></pre>
<div>
<br /></div>
<div>
<h3>
讀寫大檔案</h3>
</div>
<div>
如果是要讀寫大的檔案, 可以用 Files 的 newBufferedReader/newBufferedWriter/newByteChannel<br />
<pre>package test;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

public class TestIO {

    public static void main(String[] params) throws IOException {
        Charset cs = Charset.forName("utf-8");
        Path path = Paths.get("d:/", "test.txt");
        int wLineCnt = 25000000;
        try (</pre>
<pre>            BufferedWriter writer = Files.newBufferedWriter(</pre>
<pre>                      path, cs, StandardOpenOption.TRUNCATE_EXISTING)) {
            for ( int i = 0; i &lt; wLineCnt; i++ ) {
                writer.write(i + ":" + UUID.randomUUID().toString() + "\n");
            }
            writer.flush();            
        }
        try (BufferedReader reader = Files.newBufferedReader(path, cs)) {
            int rLineCnt = 0;
            String line = null;
            while ((line = reader.readLine()) != null) {
                int num = Integer.valueOf(line.substring(0, line.indexOf(":")));
                if ( rLineCnt++ != num ) {
                    throw new RuntimeException(</pre>
<pre>                                "not equal! " + num + "," + rLineCnt);
                }
            }
            if ( rLineCnt != wLineCnt ) {
                throw new RuntimeException(</pre>
<pre>                           "not equal! " + wLineCnt + "," + rLineCnt);
            }
        }
        System.out.println("done");
    }

}
</pre>
<pre></pre>
<h3>
取根目錄</h3>
<div>
<pre>package test;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Path;

public class TestIO {

    public static void main(String[] params) throws IOException {
        for (Path path: FileSystems.getDefault().getRootDirectories()) {
            System.out.println(path); //列出 C:/ &amp; D:/ ..etc
        }
    }
    
}
</pre>
</div>
<pre></pre>
<pre></pre>
</div>
<div>
<h3>
建資料夾</h3>
<pre>package test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class TestIO {

    public static void main(String[] params) throws IOException {
        Files.createDirectories(Paths.get("d:/test1/test2/test3/test4"));
    }
    
}
</pre>
<pre></pre>
<h3>
Iterate資料夾</h3>
JDK 7提供新的 interface 讓你 iterate 資料夾: <a href="http://docs.oracle.com/javase/7/docs/api/java/nio/file/DirectoryStream.html">DirectoryStream</a>.

<br />
在 API 上說這個 interface 比較 scalable, 可以用來 iterate 很大的 folder.<br />
上網查有人說就的 File#listFiles 會把所有的 folder 載入會佔用比較多的記憶體.<br />
要省記憶體應該要讓資料夾下有上百萬或上千萬個資料夾或檔案才有感覺吧.<br />
我測一百萬個資料夾也沒甚麼差.<br />
後來覺得關鍵是 API 這句話:<br />
<i style="background-color: #f4cccc;"><span style="color: #353833; font-family: &quot;arial&quot; , &quot;helvetica&quot; , sans-serif; font-size: 12px;">The iterator is&nbsp;</span><span style="color: #353833; font-family: &quot;arial&quot; , &quot;helvetica&quot; , sans-serif; font-size: 12px;">weakly consistent</span><span style="color: #353833; font-family: &quot;arial&quot; , &quot;helvetica&quot; , sans-serif; font-size: 12px;">. It is thread safe but does not freeze the directory while iterating, so it may (or may not) reflect updates to the directory that occur after the&nbsp;</span><code style="color: #353833; font-size: 12px;">DirectoryStream</code><span style="color: #353833; font-family: &quot;arial&quot; , &quot;helvetica&quot; , sans-serif; font-size: 12px;">&nbsp;is created.</span></i><br />
在資料夾下檔案或資料夾數量很大時, 原本的 File 仍須要給 API client 精準的資訊.<br />
scale 愈大, "精準"的成本就愈大.<br />
DirectoryStream 選擇一開始就告訴你它不準, 所以贏在起跑點, 可以用較少的資源取資料.<br />
等你真的要處理某個檔案再動作就行了.<br />
我覺得這種 interface 更有利於硬碟在遠端的 case. 硬碟不在本機,<br />
要求 File 物件保證整個資料夾資訊要對太難, 這時候 DirectoryStream 就可以處理很好.<br />
要注意 DirectoryStream 用完要關掉, 可以在 try () 裡面宣告.<br />
<br />
<pre>package test;

import java.io.File;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class TestIO {

    public static void main(String[] params) throws IOException {
        long start = System.currentTimeMillis();
        createFolders();
        System.out.println("spend " +&nbsp;(System.currentTimeMillis() - start)&nbsp;</pre>
<pre>                    + " millis to create folders");</pre>
<pre>        
        start = System.currentTimeMillis();
        System.out.println(listFoldersNIO(Paths.get("d:/test")));
        System.out.println("spend " + (System.currentTimeMillis() - start)&nbsp;</pre>
<pre>                    + " millis to list folders (NIO)");

        start = System.currentTimeMillis();
        System.out.println(listFoldersIO(Paths.get("d:/test").toFile()));
        System.out.println("spend " + (System.currentTimeMillis() - start)&nbsp;</pre>
<pre>                    + " millis to list folders (IO)");
    }

    private static void createFolders() throws IOException {
        for ( int i = 0; i &lt; 1000000; i++ ) {
            Files.createDirectories(Paths.get("d:/test/test" + i));
            System.out.println(i);
        }
        System.out.println("done");
    }

    private static int listFoldersIO(File folder) {
        int cnt = 0;
        for ( String child: folder.list() ) {
            new File(child);
            cnt++;
        }
        return cnt;
    }
    
    private static int listFoldersNIO(Path path) throws IOException {
        int cnt = 0;
        try ( DirectoryStream<path> dirStream = Files.newDirectoryStream(path) ) {
            for ( Path child: dirStream ) {
                child.toFile();
                cnt++;
            }
        }
        return cnt;
    }
    
}
</path></pre>
</div>
<div>
<br /></div>
<div>
<h3>
指定 pattern 找資料夾下的檔名</h3>
JDK 7提供新的概念叫 <a href="http://docs.oracle.com/javase/tutorial/essential/io/fileOps.html#glob">Glob</a>, 蠻好理解的.<br />
不過其中有個 ** 的語法說明 "<span style="background-color: #f4cccc;"><i>works like&nbsp;<code>*</code>&nbsp;but crosses directory boundaries</i></span>" 讓我有錯誤的期望以為只要 Files.newDirectoryStream(p, "**/*.{java,jar}") 就可以列舉全部的檔案, 測試結果不行..<br />
可能要用 Files#walkFileTree. 我還沒看&nbsp;walkFileTree 有甚麼特殊的地方,<br />
但 API 沒特別好用的話我自己作就好了為什麼要提供&nbsp;walkFileTree 呢...?<br />
(在下面的段落練習了 walkFileTree, 比起自己寫用 walkFileTree 簡潔多了 XD)<br />
<br />
<pre>package test;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class TestIO {

    public static void main(String[] params) throws IOException {
        listAll(Paths.get("d:\\Isaac"), "*.{java,jar}");
    }

    private static void listAll(Path p, String globPattern) throws IOException {
        try (</pre>
<pre>            DirectoryStream&lt;Path&gt; s = Files.newDirectoryStream(p, globPattern)</pre>
<pre>            ) {
            for ( Path c: s ) {
                System.out.println(c);
            }
        }
        try (DirectoryStream&lt;Path&gt; s = Files.newDirectoryStream(p)) {
            for ( Path c: s ) {
                if ( Files.isDirectory(c, LinkOption.NOFOLLOW_LINKS) ) {
                    listAll(c, globPattern);
                }
            }
        }
    }
    
}
</pre>
<h3>
搜尋 activemq source code 中有關鍵字 "Queue" 的檔案</h3>
<div>
自己實作 DirectoryStream.Filter 的時候不能方便的使用 glob 有點可惜..</div>
<div>
<br /></div>
<div>
<pre>package test;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;

public class TestIO {

    public static void main(String[] params) throws IOException {
        listAll(Paths.get("d:\\activemq-parent-5.8.0-source-release"), "Queue");
    }

    private static void listAll(Path p, final String containTxt)&nbsp;</pre>
<pre>    throws IOException {
        DirectoryStream.Filter&lt;Path&gt; f = new DirectoryStream.Filter&lt;Path&gt;() {
            @Override
            public boolean accept(Path entry) throws IOException {
                if ( Files.isDirectory(entry, LinkOption.NOFOLLOW_LINKS)&nbsp;</pre>
<pre>                               || !entry.toString().endsWith(".java") ) {
                    return false;
                }
                try (BufferedReader reader = Files.newBufferedReader(</pre>
<pre>                                      entry, Charset.forName("UTF8"))) {
                    String line = null;
                    while ( (line = reader.readLine()) != null ) {
                        if ( line.contains(containTxt) ) {
                            return true;
                        }
                    }
                }
                return false;
            }
        };
        try (DirectoryStream&lt;Path&gt; s = Files.newDirectoryStream(p, f)) {
            for ( Path c: s ) {
                System.out.println("match " + c);
            }
        }
        try (DirectoryStream&lt;Path&gt; s = Files.newDirectoryStream(p)) {
            for ( Path c: s ) {
                if ( Files.isDirectory(c, LinkOption.NOFOLLOW_LINKS) ) {
                    listAll(c, containTxt);
                }
            }
        }
    }
    
}
</pre>
<br /></div>
<h3>
用 Files#walkFileTree + FileVisitor 列出所有資料夾下的 java 與 jar 檔</h3>
</div>
<div>
<pre>package test;

import java.io.IOException;
import java.nio.file.FileVisitResult;
import java.nio.file.FileVisitor;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;

public class TestIO {

    public static void main(String[] params) throws IOException {
        Path p = Paths.get("d:/Isaac");
        FileVisitor&lt;Path&gt; f = new SimpleFileVisitor&lt;Path&gt;() {
            @Override
            public FileVisitResult visitFile(Path file,BasicFileAttributes attrs)&nbsp;               throws IOException {</pre>
<pre>                String filepath = file.toString();
                if ( filepath.endsWith(".java") || filepath.endsWith(".jar") ) {
                    System.out.println(filepath);
                }
                return super.visitFile(file, attrs);
            }
        };
        Files.walkFileTree(p, f);
    }

}</pre>
<h3>
搜尋 activemq source code 中有關鍵字 "Queue" 的檔案 (用 glob)</h3>
<div>
前面才提到 "自己實作 FileVisitor 的話不方便用 glob 很可惜" 而已, 就發現其實有提供. 那就是 PathMatcher.
<br />
<pre>package test;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.PathMatcher;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;

public class TestIO {

    public static void main(String[] params) throws Throwable {
        final PathMatcher matcher =&nbsp;</pre>
<pre>                   FileSystems.getDefault().getPathMatcher("glob:*.{java,jar}");
        Files.walkFileTree(Paths.get("d:/Isaac"), new SimpleFileVisitor&lt;Path&gt;(){
            @Override
            public FileVisitResult visitFile(Path file,
                    BasicFileAttributes attrs) throws IOException {
                if ( matcher.matches(file.getFileName()) ) {
                    System.out.println("match " + file);
                }
                return super.visitFile(file, attrs);
            }
        });
    }

}
</pre>
</div>
<div>
<br /></div>
<h3>
監聽一個 path 是否備新增/刪除/修改</h3>
<pre>package test;

import java.nio.file.FileSystems;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardWatchEventKinds;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class TestIO {

    public static void main(String[] params) throws Throwable {
        ExecutorService e = Executors.newSingleThreadExecutor();
        Path path = Paths.get("d:/Isaac");
        try (final WatchService w = FileSystems.getDefault().newWatchService()) {
            path.register(w, StandardWatchEventKinds.ENTRY_CREATE,&nbsp;</pre>
<pre>                             StandardWatchEventKinds.ENTRY_DELETE,&nbsp;</pre>
<pre>                             StandardWatchEventKinds.ENTRY_MODIFY);
            e.execute(new Runnable(){
                @Override
                public void run() {
                    while (true) {
                        try {
                            WatchKey k = w.take();
                            for ( WatchEvent&lt;?&gt; e: k.pollEvents() ) {
                                @SuppressWarnings("unchecked")
                                WatchEvent&lt;Path&gt; pathEvent = (WatchEvent&lt;Path&gt;)e;
                                Path path = pathEvent.context();
                                System.out.println(pathEvent.kind() + ":"  path);
                                if (!k.reset()) {
                                    break;
                                }
                            }
                        } catch (Throwable ex) {
                            ex.printStackTrace();
                        }                    
                    }
                }});
            TimeUnit.DAYS.sleep(1);
        }   
    }
}
</pre>
</div>
<div>
<br /></div>
<div>
<br /></div>
