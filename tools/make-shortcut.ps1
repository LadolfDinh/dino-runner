# Tao shortcut "Dino Runner" co icon tren Desktop, chuyen file .bat cu vao Thung rac.
$ErrorActionPreference = 'Stop'
$app = 'C:\myWebApp\myWebapp_1'
$desktop = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop 'Dino Runner.lnk'

$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut($lnkPath)
$lnk.TargetPath = "$env:WINDIR\System32\wscript.exe"
$lnk.Arguments = '"' + $app + '\DinoRunner.vbs"'
$lnk.WorkingDirectory = $app
$lnk.IconLocation = "$app\assets\icon.ico,0"
$lnk.Description = 'Dino Runner - game khung long nhay'
$lnk.WindowStyle = 1
$lnk.Save()
"Da tao: $lnkPath"
