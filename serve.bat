@echo off
cd /d "%~dp0"
echo Opening preview at http://127.0.0.1:8765
echo Press Ctrl+C in this window to stop the server.
start "" "http://127.0.0.1:8765"
python -m http.server 8765
