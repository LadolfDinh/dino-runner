' Mo Dino Runner an, khong hien cua so den.
' Shortcut tren Desktop goi: wscript.exe "C:\myWebApp\myWebapp_1\DinoRunner.vbs"
Option Explicit
Dim sh, fso, appDir, node
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)

node = sh.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe"
If Not fso.FileExists(node) Then node = "node"

sh.CurrentDirectory = appDir
' 0 = an cua so, False = khong cho
sh.Run """" & node & """ """ & appDir & "\launcher.js""", 0, False
