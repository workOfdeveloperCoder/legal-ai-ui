# ⚖️ Pakistan Legal AI - Web Application

A modern AI-powered legal assistant interface designed for Pakistani lawyers and legal professionals.  
The platform provides an organized workspace for managing legal matters, conversations, and AI-assisted legal research.

## 🚀 Features

- 🤖 AI Legal Chat Interface
- 📂 Matter-based workspace management
- 💬 Conversation history management
- 📑 Legal document reference support
- 🔍 Legal research assistance
- 🧠 AI model selection support
- 📱 Responsive modern UI
- ⚡ Fast and scalable React architecture

---

## 🖥️ Screenshots

(Add screenshots here)

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- Shadcn/UI
- Lucide Icons
- React Router
- Axios

### Backend Integration

Currently supports API integration with:

- REST APIs
- JSON Server (Development Mock API)

Future integration:

- FastAPI Backend
- RAG Pipeline
- Qdrant Vector Database
- LLM Providers (DeepSeek / Qwen / Llama)

---

# 📁 Project Structure
src/
│
├── api/
│ └── services/
│ ├── chatService.js
│ └── matterService.js
│
├── components/
│ ├── chat/
│ ├── matter/
│ ├── sidebar/
│ └── ui/
│
├── pages/
│ ├── Dashboard.jsx
│ ├── Matter.jsx
│ └── Chat.jsx
│
├── layouts/
│
├── hooks/
│
├── utils/
│
├── App.jsx
└── main.jsx

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/legal-ai-web.git
cd legal-ai-ui
npm install
```
---

# ▶️ Development

Start development server:
```bash
npm run dev
```

Application will run on:
http://localhost:5173

---

# 🗄️ Mock API Setup

This project uses JSON Server during frontend development.

Install JSON Server:

```bash
npm install -g json-server
```

Run json-server:

```bash
json-server --watch db.json --port 3000
```

API available at: 
http://localhost:3000
