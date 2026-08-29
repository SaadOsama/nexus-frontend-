# # check-all-imports.ps1
# # Run from project root: D:\website matz\Matz-Nexus-Frontend>
# # Usage: powershell -ExecutionPolicy Bypass -File check-all-imports.ps1

# $root = Get-Location
# $srcPath = Join-Path $root "src"
# $files = Get-ChildItem -Path $srcPath -Recurse -Include *.js,*.jsx,*.ts,*.tsx | Where-Object { $_.Length -gt 0 }

# $brokenImports = @()

# function Resolve-ImportTarget {
#     param($basePath, $relativePath)

#     $fullTargetPath = Join-Path $basePath $relativePath
#     $fullTargetPath = [System.IO.Path]::GetFullPath($fullTargetPath)

#     $candidates = @(
#         $fullTargetPath,
#         "$fullTargetPath.js",
#         "$fullTargetPath.jsx",
#         "$fullTargetPath.ts",
#         "$fullTargetPath.tsx",
#         (Join-Path $fullTargetPath "index.js"),
#         (Join-Path $fullTargetPath "index.jsx"),
#         (Join-Path $fullTargetPath "index.ts"),
#         (Join-Path $fullTargetPath "index.tsx")
#     )

#     foreach ($candidate in $candidates) {
#         if (Test-Path -LiteralPath $candidate) {
#             return $true
#         }
#     }
#     return $false
# }

# foreach ($file in $files) {
#     $content = Get-Content -LiteralPath $file.FullName -Raw
#     if ([string]::IsNullOrEmpty($content)) { continue }

#     # Match: from "path" or from 'path' — only relative (./ or ../) or @ alias imports
#     $importMatches = [regex]::Matches($content, "from\s+['""]((?:\.\.?\/|@)[^'""]+)['""]")

#     foreach ($m in $importMatches) {
#         $importPath = $m.Groups[1].Value

#         if ($importPath.StartsWith("@root/")) {
#             $relativePath = $importPath -replace "^@root/", ""
#             $basePath = $root
#         }
#         elseif ($importPath.StartsWith("@/")) {
#             $relativePath = $importPath -replace "^@/", ""
#             $basePath = $srcPath
#         }
#         else {
#             # relative import: resolve against the importing file's directory
#             $relativePath = $importPath
#             $basePath = $file.DirectoryName
#         }

#         $exists = Resolve-ImportTarget -basePath $basePath -relativePath $relativePath

#         if (-not $exists) {
#             $brokenImports += [PSCustomObject]@{
#                 File       = $file.FullName.Replace($root.Path + "\", "")
#                 ImportPath = $importPath
#             }
#         }
#     }
# }

# if ($brokenImports.Count -eq 0) {
#     Write-Host "`nNo broken imports found!" -ForegroundColor Green
# } else {
#     Write-Host "`nFound $($brokenImports.Count) broken import(s):`n" -ForegroundColor Red
#     $brokenImports | Sort-Object File | Format-Table -AutoSize -Wrap
# }
