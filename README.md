<p align="center">
  <img src="public/banner.jpg?v=2" width="700" alt="StaticKit" />
</p>

<p align="center">
  A free, open-source front-end for AI image models
</p>

<p align="center">
  <a href="https://github.com/CoreyRab/statickit/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white" alt="Next.js" />
  <a href="https://github.com/CoreyRab/statickit/pulls">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" />
  </a>
  <a href="https://github.com/CoreyRab/statickit/stargazers">
    <img src="https://img.shields.io/github/stars/CoreyRab/statickit?style=social" alt="Stars" />
  </a>
</p>

<p align="center">
  <a href="https://statickit.ai">Website</a> · <a href="https://github.com/CoreyRab/statickit">GitHub</a> · <a href="https://x.com/coreyrab">Twitter</a>
</p>

<p align="center">
  <i>If this helps you, please star ⭐</i>
</p>

---

StaticKit is an open-source frontend for AI image models. Instead of copy-pasting prompts into a chat interface, StaticKit gives you a proper editing UI with prompt engineering baked into presets. One click to swap a background, change lighting, or replace a model. The complex prompts happen under the hood.

**Bring your own API key. No watermarks. No subscriptions. Keys encrypted and synced across devices.**

## Features

**Core Editing**
- Natural language image editing
- Background swap with automatic lighting matching
- Model/person replacement while preserving pose and product
- Smart resize to any aspect ratio (extends or crops intelligently)
- Lighting presets (golden hour, studio, neon, etc.)

**Reference Images**
- Upload a reference photo to extract its background
- Use a specific person from a reference as the model
- Composite subjects into new environments

**Workflow**
- Version history with branching
- Compare mode for A/B testing variations side-by-side
- Batch download all versions and sizes
- Keyboard shortcuts for power users

**BYOK (Bring Your Own Key)**
- Use your own Gemini API key
- Free account with encrypted key storage
- Keys sync across all your devices
- No tracking, no vendor lock-in

## Quick Start

1. Clone the repo
   ```bash
   git clone https://github.com/CoreyRab/statickit.git
   cd statickit
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the app
   ```bash
   npm run dev
   ```

4. Create a free account and add your API key
   - Sign up with Google or email
   - Get a free Gemini API key from https://aistudio.google.com/apikey
   - Paste it when prompted (encrypted and synced across devices)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Radix UI
- Google Gemini API
- Zustand

## Contributing

Contributions welcome. See [CONTRIBUTING.md](.github/CONTRIBUTING.md).

## License

[MIT](LICENSE)
