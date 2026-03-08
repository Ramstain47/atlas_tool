' 静默启动脚本 - 双击即可运行，不显示命令行窗口
Set WshShell = CreateObject("WScript.Shell")

' 获取当前目录
currentPath = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)

' 启动开发服务器（隐藏窗口）
WshShell.Run "cmd /c cd /d " & Chr(34) & currentPath & Chr(34) & " && npm run dev", 0, False

' 等待服务器启动
WScript.Sleep 3000

' 打开浏览器
WshShell.Run "http://localhost:5173"

' 显示提示
MsgBox "开发服务器已启动！" & vbCrLf & vbCrLf & "浏览器正在打开 http://localhost:5173" & vbCrLf & vbCrLf & "关闭此窗口不会影响服务器运行。" & vbCrLf & "如需停止服务器，请在任务管理器中结束 node.exe 进程。", vbInformation, "图鉴数值配置工具"

Set WshShell = Nothing
