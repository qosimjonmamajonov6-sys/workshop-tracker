# Kill existing
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue

# Start Backend
Start-Process "node" "server.js" -WindowStyle Hidden -WorkingDirectory "C:\Users\PC\.gemini\antigravity\scratch\workshop-tracker"

# Start Frontend
Start-Process "npm" "run dev -- --host 127.0.0.1" -WindowStyle Hidden -WorkingDirectory "C:\Users\PC\.gemini\antigravity\scratch\workshop-tracker\frontend"

# Wait for servers to start
Start-Sleep -s 10

# Start Ngrok tunnels (using a config file to avoid multiple instance issues)
$config = @"
tunnels:
  backend:
    proto: http
    addr: 5000
  frontend:
    proto: http
    addr: 5173
"@
$config | Out-File -FilePath "ngrok-config.yml" -Encoding ascii

Start-Process "C:\Users\PC\AppData\Local\bin\ngrok.exe" "start --all --config=ngrok-config.yml" -WindowStyle Hidden
