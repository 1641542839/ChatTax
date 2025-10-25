# ChatTax - AI Tax Assistant

A modern, full-stack tax assistance application built with Next.js 15, TypeScript, TailwindCSS, and Ant Design.

## 🚀 Features

- **AI Chat Assistant**: Get instant answers to tax questions
- **Tax Checklist**: Track tax preparation progress
- **Tax Calculator**: Estimate federal and state income taxes
- **Modern UI**: Beautiful interface with TailwindCSS and Ant Design
- **Type Safety**: Full TypeScript support
- **Code Quality**: ESLint, Prettier, and Husky pre-commit hooks

## 📋 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + Ant Design
- **Code Quality**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd ChatTax
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
ChatTax/
├── src/
│   ├── app/                # Next.js app directory
│   │   ├── layout.tsx      # Root layout with navbar
│   │   ├── page.tsx        # Home page
│   │   ├── chat/           # Chat page
│   │   ├── checklist/      # Checklist page
│   │   └── calculator/     # Calculator page
│   ├── components/         # Reusable components
│   │   └── layout/         # Layout components
│   └── lib/                # Utility functions
├── public/                 # Static assets
├── CODING_RULES.md         # Development guidelines
└── Configuration files
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 🎨 Code Quality

This project follows strict coding standards:

- SOLID principles
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- Clean code practices

See [CODING_RULES.md](./CODING_RULES.md) for detailed guidelines.

## 🔧 Configuration

### ESLint

Configured with:

- Next.js recommended rules
- TypeScript support
- Prettier integration

### Prettier

Configured with:

- 2-space indentation
- Single quotes
- No semicolons
- TailwindCSS class sorting

### Husky

Pre-commit hooks run:

- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking

## 📄 Routes

- `/` - Home page with feature overview
- `/chat` - AI chat assistant interface
- `/checklist` - Tax preparation checklist
- `/calculator` - Tax calculation tool

## 🤝 Contributing

1. Follow the coding rules in [CODING_RULES.md](./CODING_RULES.md)
2. Run `npm run lint` and `npm run type-check` before committing
3. Write meaningful commit messages
4. Create pull requests for review

## 📝 License

MIT

## 👥 Authors

ChatTax Development Team

---

Made with ❤️ using Next.js 15 and TypeScript
Australian Smart Tax Assistant
