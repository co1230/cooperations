$ErrorActionPreference = "Stop"
$backend = Join-Path $PSScriptRoot "backend"
$python = Get-Command python -ErrorAction SilentlyContinue
$bundled = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"

if ($python) {
    $pythonExe = $python.Source
} elseif (Test-Path -LiteralPath $bundled) {
    $pythonExe = $bundled
} else {
    throw "未找到 Python 3.11+，请先安装 Python 并加入 PATH。"
}

Push-Location $backend
try {
    & $pythonExe -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) { throw "C 依赖安装失败" }
    & $pythonExe -m uvicorn main:app --host 127.0.0.1 --port 8002
} finally {
    Pop-Location
}
