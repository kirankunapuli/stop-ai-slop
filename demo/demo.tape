# Record with: ./demo/record.sh
# Renders demo/demo.mp4; the recorder converts it to demo/demo.gif with gifski.

Output demo/demo.mp4

Set Shell "bash"
Set FontFamily "JetBrains Mono"
Set FontSize 17
Set LineHeight 1.4
Set LetterSpacing 1
Set Width 1200
Set Height 780
Set Padding 28
Set MarginFill "#1e1e2e"
Set Margin 16
Set WindowBar Colorful
Set WindowBarSize 40
Set CursorBlink false
Set TypingSpeed 35ms
Set PlaybackSpeed 1.0
Set Framerate 30
Set Theme "Catppuccin Mocha"

Sleep 300ms

Type "cat demo/sloppy/invoice.py | head -14"
Enter
Sleep 2500ms

Type "cat demo/sloppy/commit-msg.txt"
Enter
Sleep 2500ms

Type "./demo/replay.sh"
Enter
Sleep 8s

Sleep 1500ms
