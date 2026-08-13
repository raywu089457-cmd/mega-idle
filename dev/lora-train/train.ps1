# 方案 4（備用）：風格 LoRA 訓練一鍵腳本
# 前置：git、python 3.10/3.11（kohya sd-scripts 不支援 3.14；若系統只有 3.14 需先裝 3.11）
$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. 檢查 python 版本
$py = python --version 2>&1
Write-Host "Python: $py"
if ($py -notmatch "3\.(10|11)") {
  Write-Host "警告：kohya sd-scripts 需要 Python 3.10/3.11（目前 $py）。請先安裝並改用對應的 python 執行。"
}

# 2. 取得 sd-scripts
$SD = Join-Path $env:TEMP "sd-scripts"
if (-not (Test-Path $SD)) {
  git clone --recursive https://github.com/kohya-ss/sd-scripts.git $SD
}

# 3. venv + 依賴（約 5-10 分鐘）
if (-not (Test-Path "$SD/.venv")) {
  python -m venv "$SD/.venv"
  & "$SD/.venv/Scripts/python.exe" -m pip install --upgrade pip
  & "$SD/.venv/Scripts/python.exe" -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
  & "$SD/.venv/Scripts/python.exe" -m pip install -r "$SD/requirements.txt"
  & "$SD/.venv/Scripts/python.exe" -m pip install bitsandbytes
}

# 4. 訓練（3070 Ti 8GB，約 30-60 分鐘）
& "$SD/.venv/Scripts/python.exe" "$SD/train_network.py" --config_file (Join-Path $ROOT "train-config.toml")
Write-Host "完成：輸出在 dev/lora-train/output/mega-idle-style.safetensors"
Write-Host "使用：放入 ComfyUI/models/loras/ 並在 LoraLoader 指定 mega-idle-style"
