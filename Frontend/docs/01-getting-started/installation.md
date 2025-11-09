# Installation Guide

Complete setup instructions for ChatTax Frontend development environment.

## Prerequisites

### Required Software

**Node.js & npm**
- Node.js version: **18.17.0 or higher** (18.x or 20.x recommended)
- npm version: **9.0.0 or higher**

Check versions:
```bash
node --version  # Should be v18.17.0+
npm --version   # Should be 9.0.0+
```

**Download**: https://nodejs.org/

### Recommended Tools

- **VS Code**: https://code.visualstudio.com/
- **Git**: https://git-scm.com/
- **Backend API**: Running on `http://localhost:8000` (see [Backend Installation](../../../Backend/docs/01-getting-started/installation.md))

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## Installation Steps

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/1641542839/ChatTax.git
cd ChatTax/Frontend
```

### 2. Install Dependencies

```bash
# Install all npm packages
npm install

# This will install:
# - next@15.0.2
# - react@18.0.0
# - react-dom@18.0.0
# - typescript@5.x
# - antd@5.x
# - zustand@4.x
# - tailwindcss@3.x
# - and all development dependencies
```

**Expected time**: 2-5 minutes depending on internet speed

### 3. Environment Configuration

Create environment file:

```bash
# Copy example environment file
cp .env.example .env.local

# Or on Windows PowerShell:
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```env
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Optional: Environment
NEXT_PUBLIC_ENV=development

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG=true
```

**Important**: 
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Never commit `.env.local` to git
- Backend must be running on specified URL

### 4. Verify Installation

Check if everything is installed correctly:

```bash
# Check Next.js installation
npx next --version

# Check TypeScript
npx tsc --version

# List installed packages
npm list --depth=0
```

---

## Running the Application

### Development Server

```bash
# Start development server
npm run dev

# Server starts on http://localhost:3000
```

Output should show:
```
   ▲ Next.js 15.0.2
   - Local:        http://localhost:3000
   - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.3s
```

### Verify Backend Connection

1. Open browser: `http://localhost:3000`
2. Check browser console for errors
3. Try login/register to test API connection

**If Backend connection fails**:
- Ensure Backend is running on `http://localhost:8000`
- Check CORS settings in Backend
- Verify `.env.local` has correct API URL

---

## Build for Production

### Production Build

```bash
# Create optimized production build
npm run build

# Output will be in .next/ directory
```

Build process:
1. Type checking with TypeScript
2. Linting with ESLint
3. Bundle optimization
4. Static page generation
5. Image optimization

### Run Production Build Locally

```bash
# Start production server
npm run start

# Runs on http://localhost:3000
```

### Preview Build Analysis

```bash
# Analyze bundle size
npm run build
# Check .next/analyze/ for bundle report
```

---

## Project Structure

After installation, your Frontend directory should look like:

```
Frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   ├── login/        # Login page
│   │   ├── chat/         # Chat interface
│   │   └── checklist/    # Checklist page
│   ├── components/       # React components
│   │   ├── chat/         # Chat components
│   │   ├── checklist/    # Checklist components
│   │   └── layout/       # Layout components
│   ├── services/         # API service layer
│   │   ├── api.ts        # Base API client
│   │   ├── auth.ts       # Authentication service
│   │   ├── chat.ts       # Chat service
│   │   └── checklist.ts  # Checklist service
│   ├── store/            # Zustand stores
│   │   ├── chatStore.ts  # Chat state
│   │   └── authStore.ts  # Auth state
│   ├── types/            # TypeScript types
│   │   └── api.ts        # API type definitions
│   └── lib/              # Utilities
├── public/               # Static assets
├── docs/                 # Documentation
├── .env.local           # Environment variables (create this)
├── .env.example         # Example environment file
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind CSS config
├── tsconfig.json        # TypeScript config
├── package.json         # Dependencies
└── README.md            # Project overview
```

---

## Package Overview

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.0.2 | React framework with SSR |
| `react` | 18.0.0 | UI library |
| `react-dom` | 18.0.0 | React DOM renderer |
| `typescript` | 5.x | Type safety |
| `antd` | 5.x | UI component library |
| `zustand` | 4.x | State management |
| `tailwindcss` | 3.x | Utility-first CSS |

### Development Dependencies

| Package | Purpose |
|---------|---------|
| `eslint` | Code linting |
| `prettier` | Code formatting |
| `@types/*` | TypeScript type definitions |
| `autoprefixer` | CSS vendor prefixing |
| `postcss` | CSS processing |

---

## Common Installation Issues

### Issue: Node Version Mismatch

**Error**: `The engine "node" is incompatible with this module`

**Solution**:
```bash
# Check Node version
node --version

# Install correct version using nvm (Node Version Manager)
nvm install 18
nvm use 18
```

### Issue: npm Install Fails

**Error**: `ERESOLVE unable to resolve dependency tree`

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall
npm install
```

### Issue: Port 3000 Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Option 1: Use different port
PORT=3001 npm run dev

# Option 2: Kill process on port 3000 (Windows)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Option 3: Find and kill manually
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: TypeScript Errors on First Run

**Error**: `Cannot find module '@/types/api'`

**Solution**:
```bash
# Restart TypeScript server in VS Code
# Press Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild
npm run build
```

### Issue: Backend Connection Failed

**Error**: `Failed to fetch` or CORS errors in browser console

**Solution**:
1. Ensure Backend is running: `http://localhost:8000/docs`
2. Check `.env.local` has correct API URL
3. Verify Backend CORS settings allow `http://localhost:3000`
4. Check Backend `main.py` has CORS middleware configured

---

## Next Steps

After successful installation:

1. **Quick Start**: Follow [Quick Start Guide](./quickstart.md)
2. **Configuration**: Review [Configuration Guide](./configuration.md)
3. **API Integration**: Read [API Integration Guide](../03-api/integration.md)
4. **Architecture**: Understand [System Overview](../02-architecture/overview.md)

---

## Development Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Run production server
npm run start

# Type checking
npm run type-check

# Linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

---

## Environment-Specific Setup

### Windows Setup

```powershell
# Set execution policy (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
npm install

# Run development server
npm run dev
```

### macOS/Linux Setup

```bash
# Ensure Node.js is installed
which node

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## For GitHub Copilot

**Installation Context**:
ChatTax Frontend is a Next.js 15 TypeScript application requiring Node.js 18+. Dependencies include React 18, Ant Design 5, Zustand 4, and Tailwind CSS 3. The application connects to a FastAPI Backend running on `http://localhost:8000`.

**Critical Setup Steps**:
1. Node.js 18.17.0+ required
2. Create `.env.local` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
3. Run `npm install` to install dependencies
4. Start with `npm run dev` on port 3000
5. Backend must be running for full functionality

**Common Issues**:
- Port 3000 conflicts → use `PORT=3001 npm run dev`
- CORS errors → check Backend CORS settings
- Type errors → restart TypeScript server
- Module not found → clear cache and reinstall

**Key Files**:
- `.env.local` - Environment configuration (create from `.env.example`)
- `package.json` - Dependency versions
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript settings
- `src/services/api.ts` - API client using fetch

---

**Next**: [Quick Start Guide](./quickstart.md) | [Configuration](./configuration.md) | [Back to Docs](../)
