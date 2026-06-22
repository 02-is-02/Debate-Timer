
⏱️ Debate Timer
A cross-platform, lightweight desktop timer for debate competitions, built with Tauri v2 + React + Rust.

📥 Download & Installation
Please visit the Releases page to download the latest installer for your operating system.

🪟 Windows
Download the debate-timer_x.x.x_x64-setup.exe file from the Releases page.

Double-click to run the installer.

(Note: This application relies on the native system Webview2. If you are using an older version of Windows 10, the installer will automatically download and install the required Microsoft WebView2 runtime.)

🍎 macOS (Important Note)
We provide two types of .dmg installers for macOS. Please download the correct one based on your Mac's chip:

M1 / M2 / M3 series (Apple Silicon): Download ..._aarch64.dmg

Intel chips (Older Macs): Download ..._x64.dmg

⚠️ How to fix the "App is damaged and can't be opened" error:
Since this is a free, open-source application, it is not code-signed with Apple's paid Developer Certificate. When you install and open it for the first time, macOS will likely show a warning saying the app is damaged.

You can permanently bypass this in two simple steps:

Open the downloaded .dmg file and drag Debate Timer.app into your Applications folder.

Open the built-in Terminal app on your Mac, copy and paste the following command, then press Enter:

sudo xattr -r -d com.apple.quarantine "/Applications/Debate Timer.app"

   *(After pressing Enter, the Terminal will ask for your **Mac login password**. As you type, no characters will appear on the screen—this is a normal security feature. Just type your password blindly and press Enter. You can now double-click the app to open it normally!)*

---

### 🐧 Linux

* **Debian / Ubuntu based**: Download the `.deb` package and install it via terminal: `sudo dpkg -i <filename>.deb`.
* **Other distributions**: Download the `.AppImage` file, right-click it -> Properties -> Permissions -> check "Allow executing file as program", then double-click to run.

<br>

## 🛠️ Local Development

If you wish to contribute or run the project locally, please ensure you have `Node.js (v18+)` and `Rust stable` installed.

```bash
# 1. Clone the repository
git clone https://github.com/02-is-02/Debate-Timer.git
cd Debate-Timer

# 2. Install frontend dependencies (using npm as an example)
npm install

# 3. Start development server 
# (The first run will take 3~5 minutes as Rust silently compiles core dependencies)
npm run tauri dev
```

🙏 Acknowledgements
Sound Effects
The built-in timer and alarm sound effects are used under open-source/free-use licenses. Sincere thanks to the following creators:

Sound Effect by linhmitto from Pixabay

Sound Effect by teodor5 from MyInstants / Pixabay

Powered by
Cross-platform desktop engine: Tauri v2

Automated build & release pipeline: tauri-apps/tauri-action

License MIT © Ng Wei Hao (APU Chinese Debate Team)
