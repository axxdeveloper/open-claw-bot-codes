---
layout: post
title: Convert CQL query result file hex to ascii
date: 2019-04-23 02:19:00 +0800
tags: [cassandra, log]
---

<span><div>
Under Cassandra-2.0.17, I want to query a table by cqlsh</div>
<div>
<br /></div>
<div>
First of all, I put query in a file: ~/query.cql</div>
<div>
<div>
select * from "myData" LIMIT 50000;</div>
</div>
<div>
<br /></div>
<div>
Then use cqlsh to execute command, output to file</div>
<div>
<div>
cqlsh -k mykeyspace -f ~/query.cql &gt; ~/query.out</div>
<div>
<br /></div>
<div>
or&nbsp;</div>
<div>
<br /></div>
<div>
cqlsh -k wsg -e 'select * from "mykeyspace" LIMIT 50000;' &gt; ~/query.out</div>
</div>
<div>
<br /></div>
<div>
Query result format looks like as follows</div>
<div>
<div>
key&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| 5f6261636b7570546167&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
<div>
----------------------------------------------------------------------------+--------------------------------------------------------------</div>
<div>
0x36346265303431622d376335652d346530332d393964352d373135613939306636666532 |&nbsp;&nbsp;bbb</div>
<div>
0x61666637623538372d643537632d346662662d613265662d666262363164626163363138 |&nbsp;&nbsp;aaa</div>
</div>
<div>
<br /></div>
<div>
This table contains many hex string in column name and values, so I convert hex to ASCII code by following code.</div>
<div>
(Not sure only start with 5f and 0x is hex, in my case I only need handle this two)</div>
<div>
<div>
public void convert() throws IOException {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;StringBuilder copy = new StringBuilder();</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;File file = new File("C:\\query.out");</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;for (String line: FileUtils.readLines(file, "UTF-8")) {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (line.startsWith("--")) continue;</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;String[] splitted = StringUtils.splitString(line, " ");</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (splitted.length &lt; 2) continue;</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for (int i = 0; i &lt; splitted.length; i++) {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (splitted[i].startsWith("5f") || splitted[i].startsWith("0x")) {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;splitted[i] = hexToAscii(splitted[i].substring(2));</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;copy.append(Arrays.stream(splitted).filter(s -&gt; !s.equals("|")).collect(Collectors.joining(","))).append("\n");</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;}</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;FileUtils.write(new File("C:\\query.copy"), copy.toString(), "UTF-8");</div>
<div>
}</div>
<div>
<br /></div>
<div>
<br /></div>
<div>
private static String hexToAscii(String hexStr) {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;StringBuilder output = new StringBuilder("");</div>
<div>
<br /></div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;try {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for (int i = 0; i &lt; hexStr.length(); i += 2) {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;String str = hexStr.substring(i, i + 2);</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;output.append((char) Integer.parseInt(str, 16));</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;} catch (NumberFormatException ex) {</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;return hexStr;</div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;}</div>
<div>
<br /></div>
<div>
&nbsp;&nbsp;&nbsp;&nbsp;return output.toString();</div>
<div>
}</div>
</div>
<div>
<br /></div>
</span>
