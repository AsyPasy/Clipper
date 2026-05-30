#include <napi.h>
#include <windows.h>
#include <thread>
#include <atomic>

static HHOOK g_hook = nullptr;
static DWORD g_targetKey = 0;
static Napi::ThreadSafeFunction g_tsfn;
static std::thread g_hookThread;
static std::atomic<bool> g_running(false);
static DWORD g_threadId = 0;

LRESULT CALLBACK LowLevelKeyboardProc(
  int nCode, WPARAM wParam, LPARAM lParam
) {
  if (nCode == HC_ACTION && wParam == WM_KEYDOWN) {
    KBDLLHOOKSTRUCT* kb = (KBDLLHOOKSTRUCT*)lParam;
    if (kb->vkCode == g_targetKey) {
      g_tsfn.NonBlockingCall([](
        Napi::Env env,
        Napi::Function cb
      ) {
        cb.Call({});
      });
    }
  }
  return CallNextHookEx(g_hook, nCode, wParam, lParam);
}

void HookThreadFunc() {
  g_threadId = GetCurrentThreadId();
  g_hook = SetWindowsHookEx(
    WH_KEYBOARD_LL,
    LowLevelKeyboardProc,
    GetModuleHandle(nullptr),
    0
  );
  MSG msg;
  while (g_running && GetMessage(&msg, nullptr, 0, 0)) {
    TranslateMessage(&msg);
    DispatchMessage(&msg);
  }
  if (g_hook) {
    UnhookWindowsHookEx(g_hook);
    g_hook = nullptr;
  }
}

Napi::Value RegisterHotkey(
  const Napi::CallbackInfo& info
) {
  Napi::Env env = info.Env();
  g_targetKey = info[0].As<Napi::Number>().Uint32Value();
  Napi::Function cb = info[1].As<Napi::Function>();

  if (g_running) {
    g_running = false;
    PostThreadMessage(g_threadId, WM_QUIT, 0, 0);
    if (g_hookThread.joinable()) g_hookThread.join();
    g_tsfn.Release();
  }

  g_tsfn = Napi::ThreadSafeFunction::New(
    env, cb, "HotkeyCallback", 0, 1
  );
  g_running = true;
  g_hookThread = std::thread(HookThreadFunc);
  return env.Undefined();
}

Napi::Value UnregisterHotkey(
  const Napi::CallbackInfo& info
) {
  if (g_running) {
    g_running = false;
    PostThreadMessage(g_threadId, WM_QUIT, 0, 0);
    if (g_hookThread.joinable()) g_hookThread.join();
    g_tsfn.Release();
  }
  return info.Env().Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("registerHotkey",
    Napi::Function::New(env, RegisterHotkey));
  exports.Set("unregisterHotkey",
    Napi::Function::New(env, UnregisterHotkey));
  return exports;
}

NODE_API_MODULE(hotkey_hook, Init)