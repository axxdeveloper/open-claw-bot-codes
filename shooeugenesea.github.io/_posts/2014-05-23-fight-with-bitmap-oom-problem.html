---
layout: post
title: Fight with Bitmap OOM problem.
date: 2014-05-23 18:42:00 +0800
tags: [android]
---

<h2>
Reference</h2>
<div>
<a href="https://developer.android.com/training/displaying-bitmaps/manage-memory.html" target="_blank">Managing Bitmap Memory</a><br />
<a href="http://developer.android.com/guide/practices/screens_support.html" target="_blank">Supporting Multiple Screens</a></div>
<div>
<a href="https://github.com/shooeugenesea/BrightImage" target="_blank">BrightImage in Github</a></div>
<div>
<a href="https://play.google.com/store/apps/details?id=net.brightimage" target="_blank">BrightImage in Google Play</a><br />
<a href="http://viralpatel.net/blogs/pick-image-from-galary-android-app/" target="_blank">How To Pick Image From Gallery In Android App</a></div>
<h2>
Description</h2>
<div>
為了買大樂透不想每次都開 APP 顯示 QR Code 很慢, 所以<a href="http://shooeugenesea-developer.blogspot.com/2014/05/first-android-app-max-brightness-widget.html" target="_blank">做了 MAX Brightness 這個 Widget</a>.</div>
<div>
做好之後, 的確可以方便的把亮度調最大再開 QR Code 的 screenshot, 掃完圖後也可以方便的恢復原本亮度.<br />
朋友聽完這個 Widget 之後就問: 幹嘛不乾脆做一個功能直接把圖秀出來亮度最亮就好?<br />
真是一語驚醒夢中人... 於是就開始做 BrightImage 這個 APP.<br />
需求就很簡單: 選一張圖顯示, 顯示的時候調最亮, 選過一次就不用重選.<br />
<h2>
Development Note</h2>
整個 APP 開發起來很簡單, 比較麻煩的是 Bitmap 這個東西.<br />
由於功能包含可以選圖呈現, 所以測試的時候就也亂選圖, 結果選到一張手機拍的照片後程式就 crash 了... Orz<br />
看 log 發現是 OutOfMemory, 引發 OutOfMemory 的圖有 3264*1826 這麼大.<br />
程式的寫法是<br />
<br />
<pre>Bitmap bitmap = BitmapFactory.decodeFile(picturePath);
imageView.setImageBitmap(bitmap);
</pre>
<br />
這樣的寫法, 小圖沒問題, 大圖就爆了. 就算沒爆, 只要橫放&amp;直放手機或者重複幾次就會爆.<br />
後來上網查, 發現要 recycle, 所以我就在 onPause 去把 Bitmap recycle 掉, 結果沒那麼簡單. recycle 的時機很重要, 有時候 recycle 了, 底層還沒 recycle 完, 有時是 imageView 預設的圖在佔空間.<br />
試了多種組合都沒用. 由於每天大概只做半小時吧, 加上最近忙家裡有事, 這個問題擺了幾週..<br />
<br />
這幾週中有試到一種方式不會 OutOfMemory.<br />
<br />
<pre>Display display = getWindowManager().getDefaultDisplay();
imageView.setImageBitmap(Bitmap.createScaledBitmap(BitmapFactory.decodeFile(picturePath),display.getWidth(), display.getHeight(), true));
</pre>
<br />
這樣的寫法, 雖然圖片在螢幕翻轉的時候圖片會被 scale 成怪怪的樣子, 但不會 OOM.<br />
當時沒發現原因, 直到今天才突然想到: 啊! 其實存在 imageView 裡面的 Bitmap size 比較小所以不會 OOM.<br />
加 log 去檢查發現果然沒錯 =&gt; 雖然很簡單的規則卻過很久才想到 Orz<br />
<br />
一開始想說是不是要自己算寬高, 可是這樣程式會比較雜. 想說難道沒有相關的 API 嗎?<br />
看 Bitmap 有個 API: Bitmap#getScaledWidth(targetDensity:int), 就去查 Density 甚麼意思.<br />
然後發現 Bitmap#getScaledWidth(targetDensity:int) 似乎可以達到把圖縮小的目的.<br />
重要的是不用自己去算寬高, 感覺太雜了.<br />
<br />
一開始縮小圖片的方式只有<br />
<br />
<pre>bitmap.getScaledHeight(DisplayMetrics.DENSITY_LOW);
</pre>
<br />
一開始測試沒問題, 結果上傳到 Google Play 後自己測試又遇到 OOM!!<br />
看 log 發現原來原本的 density 是 240, DENSITY_LOW 是 120, 用 DENSITY_LOW 去縮小圖卻沒用, 因為圖片還是太大, 還是會遇到 OOM.<br />
想是不是還是得自己算寬高的時候, 突然想到一個很瞎的方式: catch OOM 然後縮小 targetDensity 來縮小記憶體用量.<br />
<br />
<pre>for ( int i = 1; i &lt; 10; i++ ) {
  int targetDensity = bitmap.getDensity() / i;
  try {
    int h = bitmap.getScaledHeight(DisplayMetrics.DENSITY_LOW);
    int w = bitmap.getScaledWidth(targetDensity);
    Log.i(getClass().getName(), "reduce density to " + targetDensity);
    imageView.setImageBitmap(Bitmap.createScaledBitmap(bitmap, w, h, true));
    break;
  } catch (OutOfMemoryError e) {
    Log.w(getClass().getName(), "OOM when targetDensity:" + targetDensity);
  }    
}
</pre>
<br />
結果這個方法有用. 想想應該不會有情況是把圖片的精細度縮 1024 倍還看不到, 就設定只要測10次就好了.<br />
<br />
PS. 這次有加可以選圖的功能, 上網查詢後發現意外的簡單.<br />
<br />
<pre>private void selectPicture() {
  Intent i = new Intent(Intent.ACTION_PICK, android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
  startActivityForResult(i, RESULT_LOAD_IMAGE);
}

@Override
protected void onActivityResult(int requestCode, int resultCode, Intent data) {
  super.onActivityResult(requestCode, resultCode, data);
  if (requestCode == RESULT_LOAD_IMAGE &amp;&amp; resultCode == RESULT_OK &amp;&amp; null != data) {
    Uri selectedImage = data.getData();
    String[] filePathColumn = { MediaStore.Images.Media.DATA };
  
    Cursor cursor = getContentResolver().query(selectedImage, filePathColumn, null, null, null);
    cursor.moveToFirst();
  
    int columnIndex = cursor.getColumnIndex(filePathColumn[0]);
    String picturePath = cursor.getString(columnIndex);
    cursor.close();
                       
    loadImage();
  }
}
</pre>
<br /></div>
