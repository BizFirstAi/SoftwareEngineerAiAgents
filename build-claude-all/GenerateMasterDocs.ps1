# CompressRepoNow.ps1
# Create single master markdown file and llms.txt for AI tool accessibility

$ErrorActionPreference = "Stop"

$RepoRoot = "C:\BizFirstGO_FI_AI\SoftwareEngineerAiAgents"
$ClaudiaDir = Join-Path $RepoRoot "Claudia"
$OutputFile = Join-Path $RepoRoot "claudia-all.md"
$LLMSFile = Join-Path $RepoRoot "llms.txt"

Write-Host "Creating master documentation file..."
Write-Host ""

# Collect all markdown files from Claudia
$MdFiles = Get-ChildItem -Path $ClaudiaDir -Recurse -Filter "*.md" | Sort-Object FullName

# Create master markdown
$Content = @()
$Content += "# Claudia AI Agent Repository — Complete Reference"
$Content += ""
$Content += "**All AI Agent Systems, Knowledge, and Procedures**"
$Content += ""
$Content += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$Content += ""
$Content += "---"
$Content += ""
$Content += "## Quick Navigation"
$Content += ""
$Content += "- **Agents:** AppAgent, WorkflowAgent, FormAgent, CredentialAgent, ServerAgent, RougeAgent, APIKeyAgent"
$Content += "- **Knowledge:** 50+ comprehensive reference documents"
$Content += "- **Procedures:** 40+ step-by-step guides and questionnaires"
$Content += "- **Strategy:** Review reports, recommendations, implementation plans"
$Content += ""
$Content += "---"
$Content += ""

# Add each file
foreach ($File in $MdFiles) {
    $RelativePath = $File.FullName -replace [regex]::Escape($ClaudiaDir), "Claudia"
    $FileContent = Get-Content -Path $File.FullName -Raw

    $Content += "## $($RelativePath)"
    $Content += ""
    $Content += $FileContent
    $Content += ""
    $Content += "---"
    $Content += ""
}

# Write combined file
$Content -join "`n" | Set-Content -Path $OutputFile -Encoding UTF8
$Size = [math]::Round((Get-Item $OutputFile).Length / 1MB, 2)

Write-Host "✅ Created: claudia-all.md"
Write-Host "   Size: $Size MB"
Write-Host "   Path: $OutputFile"
Write-Host ""

# Create llms.txt
$LLMSContent = @"
# llms.txt - AI Tool Access

Use these files to access the Claudia AI Agent Repository:

## Master File (Complete Reference)
- claudia-all.md - All content combined in single file (~100+ pages)

## Individual Components
README.md - Repository overview
Claudia/AGENTS.md - Agent index and specifications
Claudia/COMPREHENSIVE_REVIEW_REPORT.md - Full repo analysis
Claudia/Recommendations_ForPublicUX.md - UX optimization guide
Claudia/Implementation_Plan.md - Execution roadmap

## Key Folders
Claudia/Agents/ - Agent specifications (10+ agents)
Claudia/Knowledge/ - Reference material (50+ files)
Claudia/Procedure/ - Step-by-step guides (40+ files)

## Best Practices for AI Tools
1. Start with README.md for overview
2. Use claudia-all.md for complete reference in one fetch
3. Individual files in Claudia/ for focused topics
4. Check llms.txt (this file) for structure

---
Repository: https://github.com/BizFirstAi/SoftwareEngineerAiAgents
Last Updated: $(Get-Date -Format 'yyyy-MM-dd')
"@

$LLMSContent | Set-Content -Path $LLMSFile -Encoding UTF8

Write-Host "✅ Created: llms.txt"
Write-Host "   Path: $LLMSFile"
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "Master files ready for AI tools!"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""
Write-Host "Files at root:"
Write-Host "  • claudia-all.md - Complete reference (1 file to fetch)"
Write-Host "  • llms.txt - Structure guide"
Write-Host "  • README.md - Quick start"
Write-Host "  • LICENSE"
Write-Host ""
Write-Host "AI tools can now:"
Write-Host "  1. Fetch claudia-all.md for complete content"
Write-Host "  2. Use llms.txt for navigation"
Write-Host "  3. Read individual files for details"
Write-Host ""
