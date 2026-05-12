param(
    [string]$Url,
    [string]$Name,
    [string]$SandboxId
)

$exePath = 'C:\Program Files\PqfJsConsole\PqfJsConsole.exe'
$scriptFilePath = Join-Path $PSScriptRoot '..\script.js'

function Get-JsDocTagValue {
    param(
        [string[]]$Lines,
        [string]$TagName
    )

    $tagLine = $Lines | Where-Object { $_ -match "^\s*\*\s*@$TagName\s+.+" } | Select-Object -First 1
    if (-not $tagLine) {
        return $null
    }

    return ($tagLine -replace "^\s*\*\s*@$TagName\s+", '').Trim()
}

if (-not (Test-Path $exePath)) {
    Write-Error "PqfJsConsole not found at: $exePath"
    exit 1
}

if (-not (Test-Path $scriptFilePath)) {
    Write-Error "script.js not found at: $scriptFilePath"
    exit 1
}

$scriptContent = Get-Content $scriptFilePath

if ([string]::IsNullOrWhiteSpace($Url)) {
    $Url = Get-JsDocTagValue -Lines $scriptContent -TagName 'url'
}

if ([string]::IsNullOrWhiteSpace($Name)) {
    $Name = Get-JsDocTagValue -Lines $scriptContent -TagName 'name'
}

if ([string]::IsNullOrWhiteSpace($SandboxId)) {
    $SandboxId = Get-JsDocTagValue -Lines $scriptContent -TagName 'sandboxId'
}

if ([string]::IsNullOrWhiteSpace($Url)) {
    Write-Error "No URL provided and no '@url' tag found in: $scriptFilePath"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($Name)) {
    Write-Error "No name provided and no '@name' tag found in: $scriptFilePath"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($SandboxId)) {
    Write-Error "No sandbox ID provided and no '@sandboxId' tag found in: $scriptFilePath"
    exit 1
}

& $exePath /url $Url /sandbox $SandboxId /name $Name /upload /file $scriptFilePath
exit $LASTEXITCODE
