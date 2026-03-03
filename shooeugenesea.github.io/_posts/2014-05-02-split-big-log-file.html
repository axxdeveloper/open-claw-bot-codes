---
layout: post
title: split big log file
date: 2014-05-02 02:54:00 +0800
tags: [log]
---

<h2>
Description</h2>
<div>
一個 log 檔 3G 怎麼看? 不想裝工具, 就只能把檔案切小</div>
<h2>
Dependencies</h2>
<div>
JDK7</div>
<div>
apache commons io</div>
<h2>
Codes</h2>
<pre>    public static void main(String[] params) throws IOException {
        String bigPath = "D:\\logfiles\\biglogfile.log";
        File f = new File(bigPath);
        try (BufferedReader r = new BufferedReader(new FileReader(f))) {
            System.out.println(f.exists());
            int fileCnt = 0;
            List<string> lines = new ArrayList<string>();
            String line;
            while ((line = r.readLine()) != null) {
                if ( lines.size() == 10000 ) {
                    File fileToWrite = new File(f.getParentFile(), f.getName() + "." + fileCnt++);
                    FileUtils.writeLines(fileToWrite, lines);
                    System.out.println("write file:" + fileToWrite);
                    lines.clear();
                }
                lines.add(line);
            }
            File fileToWrite = new File(f.getParentFile(), f.getName() + "." + fileCnt++);
            FileUtils.writeLines(fileToWrite, lines);
            System.out.println("write file:" + fileToWrite);
        } catch (Throwable ex) {
            ex.printStackTrace();
        } 
    }
</string></string></pre>
