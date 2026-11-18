# Actualiza la tabla de contenido del documento 111 con Word (requiere Microsoft Word).
# Uso: powershell -ExecutionPolicy Bypass -File scripts/update_toc_word.ps1 [ruta_docx]
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$defaultPath = Join-Path (Split-Path -Parent $scriptDir) "docs\Proyecto_Grado_AgielShield.docx"
$path = if ($args.Count -gt 0) { $args[0] } else { $defaultPath }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($path, $false, $false)
    $doc.Fields.Update() | Out-Null
    $doc.Repaginate()
    foreach ($toc in $doc.TablesOfContents) {
        $toc.Update()
        $toc.UpdatePageNumbers()
    }
    $doc.Repaginate()
    foreach ($toc in $doc.TablesOfContents) {
        $toc.UpdatePageNumbers()
    }
    $doc.Save()
    $doc.Close($false)
    Write-Output "TOC actualizado: $path"
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
