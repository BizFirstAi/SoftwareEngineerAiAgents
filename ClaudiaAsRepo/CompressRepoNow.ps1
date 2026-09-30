$ErrorActionPreference = "Stop"

$ScriptDir = "C:\BizFirstGO_FI_AI\SoftwareEngineerAiAgents\ClaudiaAsRepo"
$RepoRoot = "C:\BizFirstGO_FI_AI\SoftwareEngineerAiAgents"
$ClaudiaDir = Join-Path $RepoRoot "Claudia"
$ZipPath = Join-Path $ScriptDir "claudia.V1.zip"

Write-Host "Source: $ClaudiaDir"
Write-Host "Output: $ZipPath"
Write-Host ""

if (-not (Test-Path $ClaudiaDir)) {
    Write-Host "Error: Claudia folder not found"
    exit 1
}

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
    Write-Host "Removed existing zip"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($ClaudiaDir, $ZipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

$Size = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)
Write-Host "Success: claudia.V1.zip created"
Write-Host "Size: $Size MB"
