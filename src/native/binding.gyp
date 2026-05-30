{
  "targets": [{
    "target_name": "hotkey_hook",
    "sources": ["hotkey_hook.cpp"],
    "include_dirs": [
      "<!@(node -p \"require('node-addon-api').include\")"
    ],
    "libraries": ["user32.lib"],
    "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
    "conditions": [[
      "OS=='win'", {
        "msvs_settings": {
          "VCCLCompilerTool": {
            "ExceptionHandling": 1
          }
        }
      }
    ]]
  }]
}