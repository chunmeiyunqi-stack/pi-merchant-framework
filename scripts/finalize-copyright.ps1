$copyrightHeader = @"
/*
 * 软件名称：先锋人工智能服务框架软件
 * 版本号：V2.0.0
 * 著作权人：秦晓望
 * 开发完成日期：2026年05月
 */

"@

$head = Get-Content -Path copyright-source-code-head-clean.txt
$tail = Get-Content -Path copyright-source-code-tail-clean.txt
$separator = "// ... [SKIPPED MIDDLE CONTENT] ..."

$allLines = @()
$allLines += $head
$allLines += $separator
$allLines += $tail

$finalOutput = @()
$finalOutput += $copyrightHeader

for ($i = 0; $i -lt $allLines.Count; $i++) {
    $finalOutput += $allLines[$i]
    if (($i + 1) % 50 -eq 0 -and ($i + 1) -lt $allLines.Count) {
        $finalOutput += ""
        $finalOutput += "--- PAGE BREAK ---"
        $finalOutput += ""
    }
}

$finalOutput | Out-File -FilePath copyright-source-code.txt -Encoding UTF8
Write-Host "Successfully generated copyright-source-code.txt"
