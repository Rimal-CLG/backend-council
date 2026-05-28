$ErrorActionPreference = 'Stop'
$baseUrl = 'http://localhost:3000'

Write-Host "1. Testing /context/build..." -ForegroundColor Cyan
$contextBody = @{
    framework = 'NestJS'
    database = 'PostgreSQL'
    error = 'Connection Timeout'
} | ConvertTo-Json
$contextResult = Invoke-RestMethod -Uri "$baseUrl/context/build" -Method Post -ContentType 'application/json' -Body $contextBody
Write-Host "   Success! Generated Context size: $($contextResult.contextSize)" -ForegroundColor Green

Write-Host "`n2. Testing /uploads/file..." -ForegroundColor Cyan
# create dummy log file
Set-Content -Path test-file.log -Value 'ERROR: Something went wrong in production'
$uploadResult = curl.exe -s -X POST $baseUrl/uploads/file -F "file=@test-file.log" | ConvertFrom-Json
$fileId = $uploadResult.fileId
Write-Host "   Success! Uploaded File ID: $fileId" -ForegroundColor Green

Write-Host "`n3. Testing /repository/upload..." -ForegroundColor Cyan
$repoResult = curl.exe -s -X POST $baseUrl/repository/upload -F "file=@src.zip" | ConvertFrom-Json
$repoId = $repoResult.repositoryId
Write-Host "   Success! Uploaded Repository ID: $repoId" -ForegroundColor Green

Write-Host "`n4. Testing /repository/context-preview/:repositoryId..." -ForegroundColor Cyan
$previewResult = Invoke-RestMethod -Uri "$baseUrl/repository/context-preview/$repoId" -Method Get
Write-Host "   Success! Context Preview Fetched:" -ForegroundColor Green
Write-Host "   Repository Summary: $($previewResult.repositorySummaryText.Substring(0, [math]::Min(50, $previewResult.repositorySummaryText.Length)))..."
Write-Host "   Database Files: $($previewResult.databaseAgentFiles.Length)"
Write-Host "   Security Files: $($previewResult.securityAgentFiles.Length)"
Write-Host "   Debug Files: $($previewResult.debugAgentFiles.Length)"

Write-Host "`n5. Testing /council/analyze (with fileId and repositoryId)..." -ForegroundColor Cyan
$analyzeBody = @{
    fileIds = @($fileId)
    repositoryId = $repoId
    error = 'Prisma connection failed on startup'
    generatePatch = $true
} | ConvertTo-Json
$analyzeResult = Invoke-RestMethod -Uri "$baseUrl/council/analyze" -Method Post -ContentType 'application/json' -Body $analyzeBody
Write-Host "   Success! Council Analysis Complete:" -ForegroundColor Green
Write-Host "   Summary: $($analyzeResult.analysis.summary)"
Write-Host "   Root Cause: $($analyzeResult.analysis.finalRootCause)"
Write-Host "   Confidence: $($analyzeResult.analysis.confidence)"
if ($analyzeResult.patch) {
    Write-Host "   Generated Patch for $($analyzeResult.patch.files.Length) files!" -ForegroundColor Cyan
}

Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
