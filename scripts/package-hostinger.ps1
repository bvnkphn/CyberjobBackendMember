param(
  [string]$OutputPath = "d:\CyberJob_\BACKEND-HOSTINGER.zip"
)

$ErrorActionPreference = "Stop"

$repoDir = "d:\CyberJob_\backend"
$stageDir = Join-Path $env:TEMP ("hostinger-backend-" + [System.Guid]::NewGuid().ToString())

Write-Host "Compiling fresh build locally..."
Push-Location $repoDir
npm run build
Pop-Location

Write-Host "Creating staging directory: $stageDir"
New-Item -ItemType Directory -Path $stageDir | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stageDir "scripts") | Out-Null

Copy-Item -Recurse (Join-Path $repoDir "apps\api\src") (Join-Path $stageDir "src")
Copy-Item -Recurse (Join-Path $repoDir "apps\api\dist") (Join-Path $stageDir "dist")
Copy-Item -Recurse (Join-Path $repoDir "apps\api\prisma") (Join-Path $stageDir "prisma")
Copy-Item -Recurse (Join-Path $repoDir "packages\shared") (Join-Path $stageDir "shared")

Copy-Item (Join-Path $repoDir "deploy\hostinger-standalone\package.json") (Join-Path $stageDir "package.json")
Copy-Item (Join-Path $repoDir "deploy\hostinger-standalone\tsconfig.json") (Join-Path $stageDir "tsconfig.json")
Copy-Item (Join-Path $repoDir "deploy\hostinger-standalone\nest-cli.json") (Join-Path $stageDir "nest-cli.json")
Copy-Item (Join-Path $repoDir "deploy\hostinger-standalone\server.cjs") (Join-Path $stageDir "server.cjs")
Copy-Item (Join-Path $repoDir "deploy\hostinger-standalone\server.cjs") (Join-Path $stageDir "dist\server.cjs")
Copy-Item (Join-Path $repoDir "deploy\hostinger-standalone\embed-shared.cjs") (Join-Path $stageDir "scripts\embed-shared.cjs")
Copy-Item (Join-Path $repoDir "deploy\hostinger-standalone\setup-db.cjs") (Join-Path $stageDir "scripts\setup-db.cjs")


if (Test-Path $OutputPath) {
  Remove-Item -Force $OutputPath
}

Write-Host "Compressing to $OutputPath..."
Compress-Archive -Path "$stageDir\*" -DestinationPath $OutputPath -CompressionLevel Optimal

Remove-Item -Recurse -Force $stageDir
Write-Host "Done: $OutputPath"
