Dim oShell, ps1Path
Set oShell = CreateObject("WScript.Shell")
ps1Path = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\")) & "start-app.ps1"
oShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -NonInteractive -File """ & ps1Path & """", 0, False
Set oShell = Nothing
