Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$projectDir = $PSScriptRoot
$npmCmd     = "C:\Program Files\nodejs\npm.cmd"
$iconFile   = "$env:USERPROFILE\Desktop\ielts-icon.ico"

# --- System-tray notification icon (no visible window needed) ---
$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon    = if (Test-Path $iconFile) { New-Object System.Drawing.Icon($iconFile) } `
                else { [System.Drawing.SystemIcons]::Application }
$tray.Text    = "IELTS Tracker"
$tray.Visible = $true

function Show-Tip([string]$msg) {
    $tray.ShowBalloonTip(3500, "IELTS Tracker", $msg, [System.Windows.Forms.ToolTipIcon]::None)
    Start-Sleep -Milliseconds 400
}

function Test-Port3000 {
    (netstat -ano 2>$null |
     Select-String "LISTENING" |
     Select-String "[\s:]3000[\s\r]").Count -gt 0
}

try {
    # Server already up -> just open the browser
    if (Test-Port3000) {
        Show-Tip "Opening browser..."
        Start-Sleep -Seconds 1
        Start-Process "http://localhost:3000"
        exit 0
    }

    Show-Tip "Starting server, please wait..."

    # Launch npm run dev with absolutely no window
    $psi                  = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName         = "cmd.exe"
    $psi.Arguments        = "/c `"$npmCmd`" run dev"
    $psi.WorkingDirectory = $projectDir
    $psi.UseShellExecute  = $false
    $psi.CreateNoWindow   = $true
    [System.Diagnostics.Process]::Start($psi) | Out-Null

    # Poll until port 3000 is listening (up to 60 s)
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Port3000) { $ready = $true; break }
    }

    if ($ready) {
        Show-Tip "Server ready!  Opening browser..."
        Start-Sleep -Seconds 1
        Start-Process "http://localhost:3000"
    } else {
        Show-Tip "Startup timed out.  Run: npm run dev"
        Start-Sleep -Seconds 5
    }
} finally {
    $tray.Visible = $false
    $tray.Dispose()
}
