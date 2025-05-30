# AI Image Analyzer

A full-stack web application that allows users to upload up to 10 images and get AI-powered analysis results using pre-trained LLM, with appropriate instructions and prompt structure

## 🚀 Features

- **Drag & Drop Upload**: Upload 1-10 images (JPEG, PNG, GIF, WebP)
- **AI Analysis**: Done with specialistic LLM model with cross-checking capabilities
- **Modern UI**: Glass morphism design with Framer Motion animations
- **Security First**: Immediate file cleanup, no data retention
- **Responsive Design**: Works on all screen sizes
- **Production Ready**: Optimized for deployment

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **Multer 2.x** for file uploads
- **Anthropic SDK** for AI integration
- **Helmet & CORS** for security

## 📁 Project Structure

```
image-analyzer-app/
├── backend/
│   ├── routes/          # API endpoints
│   ├── middleware/      # Express middleware
│   ├── utils/           # Helper functions
│   ├── uploads/         # Temporary storage
│   └── server.js        # Main server file
└── frontend/
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   ├── hooks/       # Custom hooks
    │   └── utils/       # Frontend utilities
    └── public/          # Static assets
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API key from any LLM

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/image-analyzer-app.git
   cd image-analyzer-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   
   Create `backend/.env`:
   ```env
   API_KEY=your_api_key_here
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```
   
   Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_MAX_FILE_SIZE=10485760
   VITE_MAX_FILES=10
   ```

5. **Start development servers**
   
   Backend (in one terminal):
   ```bash
   cd backend
   npm run dev
   ```
   
   Frontend (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🔐 Security Features

- File type validation
- File size limits (10MB per file)
- Immediate file cleanup after processing
- Rate limiting
- CORS protection
- Security headers with Helmet
- Input sanitization

## 📝 API Endpoints

- `POST /api/analyze` - Upload and analyze images
- `GET /health` - Health check endpoint

## 🚀 Deployment

### Frontend (Netlify)
- Build command: `npm run build`
- Publish directory: `dist`

### Backend (Render)
- Build command: `npm install`
- Start command: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Live Demo](#) (Coming soon)
- [API Documentation](#) (Coming soon)

---

**Current Status**: 🚧 In Development

- [x] Project structure setup
- [x] Package configurations
- [x] Basic React frontend
- [ ] Backend API implementation
- [ ] File upload system
- [ ] AI integration
- [ ] UI components
- [ ] Testing
- [ ] Deployment