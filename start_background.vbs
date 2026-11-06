' HNU CTF - Silent Background Server Launcher
' Runs php -S 127.0.0.1:8000 router.php without opening a visible command prompt window.

Set WshShell = CreateObject("WScript.Shell")
strPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strPath
WshShell.Run "php -S 127.0.0.1:8000 router.php", 0, False
Set WshShell = Nothing

