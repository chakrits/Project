# Test Center Management System

## Overview

**Test Center Management System** is a comprehensive testing and development tools platform. This system provides developers and testers with powerful utilities for encryption, data conversion, API mocking, and automated testing processes.

Built with modern web technologies, this platform offers a secure, user-friendly interface for managing various development and testing tasks without requiring any backend server - all processing is done client-side for maximum privacy and security.

## 🚀 Key Features

### 🔧 **Development Tools**
- **AES Encryption/Decryption** - Advanced encryption with multiple cipher systems
- **JSON String Converter** - Convert and validate JSON data with error analysis  
- **Base64 ⇄ PDF Converter** - Bidirectional conversion between PDF files and Base64 strings
- **PDF to Base64 Encoder** - Convert PDF files to various Base64 formats (Plain, Data URI, HTML Embed, HTML Object)

### 🖥️ **Mock Server** *(NEW)*
- **Local API Mocking Engine** - Define mock API endpoints with dynamic path matching (e.g., `/users/:id`)
- **Condition-Based Routing** - Route to specific responses using IF/THEN rules evaluated against `body`, `query`, `header`, or path `params` — operators: `eq`, `neq`, `contains`, `exists`, `regex`
- **Template Interpolation** - Use `{{query.field}}` and `{{body.field}}` as dynamic placeholders in response bodies (resolved at request time)
- **Prism-Style Response Selection** - Multi-priority fallback: conditions → `?__code` → `?__example` → `Prefer` header → default
- **Multiple Response Examples** - Configure multiple response variants per endpoint (Success, Not Found, Validation Error, etc.)
- **Response Delay Simulation** - Simulate network latency with dynamic response delays
- **Import API Specifications** - Import Swagger/OpenAPI and Postman collections with drag-and-drop support
- **Traffic Inspector** - Real-time traffic logging with side-by-side Request vs Response view
- **API Rate Limiting** - Protect endpoints against abuse with a built-in memory-based sliding window rate limiter
- **Copy as cURL** - Generate cURL commands from logged requests with one click
- **React Dashboard** - Modern dark-themed UI built with React 19 + Tailwind CSS

### 🧪 **Automated Testing** *(NEW)*
- **Playwright E2E Tests** - Built-in configuration for Playwright End-to-End UI automation testing
- **MCP Integration** - Read and run Playwright tests directly with Model Context Protocol (MCP) using batch scripts

### 📝 **E-Forms**
- **Auto Login Form** - Automated form filling and login testing utilities

### 🛡️ **Security & Privacy**
- **Client-side Processing** - All data processing happens locally in your browser
- **No Server Upload** - Your files and data never leave your device
- **Real-time Validation** - Instant feedback and error checking
- **Secure Algorithms** - Industry-standard encryption and encoding methods

## 🎯 **Available Tools**

| Tool | Description | Features |
|------|-------------|----------|
| **AES Encryption** | Advanced encryption & decryption tool | Multiple cipher modes, key generation, secure processing |
| **JSON Converter** | JSON string conversion and validation | Error analysis, format validation, string conversion |
| **Base64 to PDF** | Decode Base64 strings to PDF files | Instant preview, download, validation, multiple input formats |
| **PDF to Base64** | Encode PDF files to Base64 strings | Drag & drop upload, multiple output formats, progress tracking |
| **Mock Server** | Local API mocking dashboard | Dynamic path matching, Prism-style responses, traffic inspector, cURL export |
| **Auto Login** | Automated form testing | Form auto-fill, login testing, validation |

## 🎨 **Dashboard Features**

### **Modern UI Components**
- Responsive Bootstrap 5 design
- Dark/Light theme support  
- Interactive charts and widgets
- Real-time notifications
- Progress tracking
- File drag & drop interface

### **User Experience**
- Intuitive navigation
- Quick action shortcuts
- Status indicators
- Error handling with clear messages
- Mobile-responsive design

## 🔧 **Technical Stack**

- **Backend:** Node.js + Express.js
- **Framework:** Bootstrap 5 (main app), React 19 + Vite (Mock Server)
- **CSS:** Custom CSS (main app), Tailwind CSS v4 (Mock Server)
- **JavaScript:** jQuery + Vanilla JS (main app)
- **Icons:** Font Awesome 5, Simple Line Icons, Lucide React
- **Charts:** Chart.js, Sparkline
- **UI Components:** Custom components based on Bootstrap 5
- **Mock Engine:** path-to-regexp (dynamic routing), express-rate-limit (rate limiter), uuid (trace IDs)
- **Testing:** Playwright for E2E automated UI testing
- **Data Storage:** Local JSON files (no database)
- **File Processing:** FileReader API, Canvas API
- **Security:** Client-side encryption libraries

## 📁 **Project Structure**

```
test-center/
├── server.js                # Express.js server (Clean URLs + Mock Server)
├── package.json             # Node.js dependencies
├── index.html               # Main dashboard
├── tools/
│   ├── aes-encryption.html  # AES encryption tool
│   ├── json-converter.html  # JSON conversion tool
│   ├── base64-pdf.html      # Base64 to PDF converter
│   ├── pdf-base64.html      # PDF to Base64 converter
│   └── mini_postman.html    # Mini Postman API tester
├── mock-server/             # 🆕 Mock Server feature
│   ├── index.js             # Module entry point
│   ├── engine/
│   │   ├── pathMatcher.js   # Dynamic path matching (path-to-regexp)
│   │   ├── responseSelector.js  # Prism-style response selection
│   │   └── logger.js        # Transaction logging
│   ├── routes/
│   │   ├── mockRouter.js    # Catch-all /mock-api/* router
│   │   └── managementApi.js # CRUD API for dashboard
│   ├── db/
│   │   ├── endpoints.json   # Mock endpoint definitions
│   │   └── logs.json        # Traffic transaction logs
│   └── frontend/            # React/Vite dashboard app
│       ├── src/             # React components
│       └── dist/            # Production build (served by Express)
├── forms/
│   └── auto-login.html      # Auto login form
├── assets/
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript files
│   └── img/                 # Images and icons
├── components/              # Shared layout components
├── tests/                   # Playwright E2E test suites
├── playwright.config.js     # Playwright configuration
└── run-test-ui.bat          # Script to run Playwright UI
```

## 🚀 **Getting Started**

```bash
# 1. Clone the repository
git clone <repo-url>
cd test-tools

# 2. Install dependencies (also builds the Mock Server dashboard automatically)
npm install

# 3. Start the server
npm start
# → http://localhost:3000
```

Open your browser at **http://localhost:3000** and navigate to any tool from the sidebar.

> `npm install` automatically builds the React dashboard via `postinstall`. No extra steps needed.

### **Mock Server — Quick Start**

The Mock Server dashboard is accessible at **http://localhost:3000/tools/mock-server**

**Define a mock endpoint** via the dashboard UI, then send requests:

```bash
# Default response
curl http://localhost:3000/mock-api/api/users/123

# Force specific status code
curl http://localhost:3000/mock-api/api/users/123?__code=404

# Force specific example by label
curl http://localhost:3000/mock-api/api/users/123?__example=not_found

# Use Prefer header
curl -H "Prefer: code=404" http://localhost:3000/mock-api/api/users/123
```

**Response selection priority (highest → lowest):**
1. **Condition match** — IF `body`/`query`/`header`/`params` matches → route to specific response
2. Query param `?__code=404` → match by status code
3. Query param `?__example=label` → match by response label
4. Header `Prefer: code=404` → match by status code
5. Header `Prefer: example=label` → match by response label
6. Default → response marked `isDefault: true`
7. Fallback → first response in the list

**Condition-based routing examples:**
```bash
# Condition: IF body.role == "admin" → return AdminResponse
curl -X POST http://localhost:3000/mock-api/api/login \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'

# Condition: IF header.authorization exists → return 200, else 401
curl http://localhost:3000/mock-api/api/secure \
  -H "Authorization: Bearer token123"

# Condition: IF params.id == "1" → return SpecialItem
curl http://localhost:3000/mock-api/api/items/1
```

**Template interpolation examples:**
```bash
# {{query.name}} is replaced at request time
curl "http://localhost:3000/mock-api/api/greet?name=chakrit"
# → {"message": "Hello chakrit"}

# {{body.username}} is replaced from request body
curl -X POST http://localhost:3000/mock-api/api/profile \
  -H "Content-Type: application/json" \
  -d '{"username":"john"}'
# → {"welcome": "Hi john"}
```

### **Mock Server — Frontend Development**

To modify the React dashboard:

```bash
# Install frontend dependencies (first time only)
cd mock-server/frontend
npm install

# Dev mode with hot reload
npm run dev
# → http://localhost:5173 (proxies API to :3000)

# Build for production
npm run build
# → Output in mock-server/frontend/dist/ (served by Express)
```

## 🔒 **Privacy & Security Notice**

This Test Center Management System is designed with privacy as a core principle:

- ✅ **No data transmission** - All processing happens in your browser
- ✅ **No server storage** - Your files are never uploaded anywhere
- ✅ **No tracking** - No analytics or user tracking implemented
- ✅ **Open source** - All code is transparent and auditable

## 🛠️ **Development**

### **Adding New Tools**

1. Create new HTML file in `/tools/` directory
2. Use the template structure (copy from existing tools)
3. Modify only the `<div class="container">` content area
4. Update sidebar navigation in `index.html`
5. Test functionality and responsive design

### **Template Structure**

All tools follow the same template pattern:
- **Header:** Logo, navigation, user menu
- **Sidebar:** Tool navigation and menu
- **Container:** Main content area (customize this section only)
- **Footer:** Copyright and links

## 📈 **Tool Statistics**

- **Total Tools:** 6+ (and growing)
- **Processing Speed:** Real-time client-side processing
- **File Support:** PDF, JSON, Text files
- **Max File Size:** 50MB for PDF processing
- **Mock Server Logs:** Up to 500 recent transactions
- **Browser Support:** Modern browsers with HTML5 support

## 🎭 **Customization**

The system supports easy customization:
- **Themes:** Dark/Light mode toggle
- **Colors:** Logo header, navbar, sidebar color options  
- **Layout:** Multiple sidebar styles available
- **Components:** Modular component system

## 🔄 **Updates & Roadmap**

### **Recent Updates**
- ✅ **Mock Server** — Condition-Based Routing: IF/THEN rules on `body`, `query`, `header`, or path `params` (operators: `eq`, `neq`, `contains`, `exists`, `regex`)
- ✅ **Mock Server** — Template Interpolation: `{{query.field}}` and `{{body.field}}` placeholders resolved at request time
- ✅ **Mock Server** — Header & Path Param conditions for auth-gate and path-specific response logic
- ✅ **Mock Server** — API specification imports (Swagger/OpenAPI and Postman collections)
- ✅ **Mock Server** — Response delay simulation for testing network latency
- ✅ **Mock Server** — API Rate Limiting protection
- ✅ **Mock Server** — Local API mocking with React dashboard, Prism-style response selection, and traffic inspector
- ✅ **Testing** — Playwright E2E automation testing integration and MCP scripts
- ✅ URL Generator / Document List tool
- ✅ Mini Postman API tester with CORS proxy
- ✅ PDF ⇄ Base64 bidirectional conversion
- ✅ Advanced file validation
- ✅ Progress tracking for large files
- ✅ Multiple output format support
- ✅ Enhanced error handling

### **Planned Features**
- 🔄 Mock Server — WebSocket support
- 🔄 Additional encryption algorithms
- 🔄 Batch file processing
- 🔄 Export/Import configurations
- 🔄 Advanced testing automation

## 📞 **Support & Contact**

**Developed by:** Chakrit Salaeman & Claude  
**License:** Free to use and modify  

For questions, suggestions, or contributions, please feel free to reach out.

**Built with ❤️ for developers and testers worldwide**