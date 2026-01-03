<p align="center">
  <img src="public/logo.svg" width="60" alt="StaticKit" />
</p>

<h1 align="center">StaticKit</h1>

<p align="center">
  A free, open-source front-end for AI image models
</p>

<p align="center">
  <a href="https://github.com/CoreyRab/statickit/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="License" />
  </a>
  <a href="https://github.com/CoreyRab/statickit/stargazers">
    <img src="https://img.shields.io/github/stars/CoreyRab/statickit?style=social" alt="Stars" />
  </a>
</p>

---

StaticKit is an open-source GUI for AI image generation. Think of it as a front-end for Gemini Imagen, Nano Banana Pro, and other image models. Upload any image and create endless variations — swap backgrounds, change models, adjust lighting, orbit the camera, and more.

**Bring your own API key. No account required. Your keys never leave your browser.**

## ✨ Features

- 🖼️ **AI Image Variations** — Generate unlimited variations of any image
- 🎨 **Background Swap** — Change backgrounds with natural lighting match
- 👤 **Model Replacement** — Swap models while preserving products/poses
- 🔄 **Camera Orbit** — View subjects from different angles (front, side, behind)
- 📐 **Smart Resize** — AI-powered resize to any aspect ratio
- ☀️ **Lighting Presets** — Golden hour, blue hour, studio lighting
- 🔑 **BYOK** — Bring your own Gemini API key (stored locally in browser)
- 🔒 **Privacy First** — No accounts, no tracking, no data collection

## 🚀 Quick Start

1. **Clone the repo**
   ```bash
   git clone https://github.com/CoreyRab/statickit.git
   cd statickit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the app**
   ```bash
   npm run dev
   ```

4. **Add your API key**
   - Get a free Gemini API key from https://aistudio.google.com/apikey
   - Paste it when prompted in the app

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **AI Model:** Google Gemini API
- **State:** Zustand

## 🤝 Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](.github/CONTRIBUTING.md) first.

## 📄 License

[AGPL-3.0](LICENSE) — Free to use, modify, and distribute.
If you run this as a network service, you must share your modifications.
