Add-Type -AssemblyName System.Drawing
$base = "c:/Users/Administrator/zhishuai/desktop-ui"
$src = [System.Drawing.Image]::FromFile("$base/public/logo.png")
$sizes = @(256,128,64,48,32,16)
$pngs = @()
foreach($s in $sizes){
  $bmp = New-Object System.Drawing.Bitmap $s,$s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($src,0,0,$s,$s)
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms,[System.Drawing.Imaging.ImageFormat]::Png)
  $pngs += ,$ms.ToArray()
  $g.Dispose(); $bmp.Dispose(); $ms.Dispose()
}
$src.Dispose()
$msOut = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($msOut)
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$pngs.Count)
$offset = 6 + 16*$pngs.Count
for($i=0;$i -lt $pngs.Count;$i++){
  $w = $sizes[$i]; if($w -ge 256){$w=0}
  $bw.Write([Byte]$w); $bw.Write([Byte]$w); $bw.Write([Byte]0); $bw.Write([Byte]0)
  $bw.Write([UInt16]1); $bw.Write([UInt16]32)
  $bw.Write([UInt32]$pngs[$i].Length); $bw.Write([UInt32]$offset)
  $offset += $pngs[$i].Length
}
foreach($p in $pngs){ $bw.Write($p) }
$bw.Flush()
[System.IO.File]::WriteAllBytes("$base/public/favicon.ico", $msOut.ToArray())
$bw.Dispose(); $msOut.Dispose()
Write-Output "favicon.ico generated"
