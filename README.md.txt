# AI Image Analyzer

A full-stack web application that allows users to upload up to 10 images and get AI-powered analysis results using a specialized LLM optimized for image analysis tasks.

## 🚀 Features

- **Drag & Drop Upload**: Upload 1-10 images (JPEG, PNG, GIF, WebP)
- **AI Analysis**: Powered by specialized LLM with advanced image understanding
- **Modern UI**: Glass morphism design with Framer Motion animations
- **Security First**: Immediate file cleanup, no data retention
- **Responsive Design**: Works on all screen sizes
- **Production Ready**: Optimized for deployment

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** with custom glass morphism effects
- **Framer Motion** for smooth animations
- **React Dropzone** for drag & drop functionality
- **Headless UI** for accessible components
- **Lucide React** for icons
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **Multer 2.x** for secure file uploads
- **Google Generative AI** (Gemini) for image analysis
- **Sharp** for image processing
- **Helmet & CORS** for security
- **Rate limiting** and compression

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
- Gemini API key from Google AI Studio

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
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   MAX_FILE_SIZE=10485760
   MAX_FILES=10
   ```
   
   Create `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_MAX_FILE_SIZE=10485760
   VITE_MAX_FILES=10
   VITE_APP_NAME=AI Image Analyzer
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
   - Health Check: http://localhost:5000/health

## 🔐 Security Features

- **Helmet.js** - Security headers and XSS protection
- **CORS** - Cross-origin request protection
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **File Validation** - Type, size, and content validation
- **Immediate Cleanup** - Files deleted after processing
- **Input Sanitization** - All inputs validated and sanitized
- **Error Handling** - Secure error messages (no data leaks)

## 📝 API Endpoints

| Method | Endpoint | Description | Rate Limited |
|--------|----------|-------------|--------------|
| `POST` | `/api/analyze` | Upload and analyze images | ✅ |
| `GET` | `/health` | Health check endpoint | ❌ |

### POST /api/analyze
**Request:**
```javascript
// FormData with files
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);
formData.append('prompt', 'Analyze these images');
```

**Response:**
```json
{
  "success": true,
  "analysis": "Detailed AI analysis of the images...",
  "processedImages": 2,
  "processingTime": "1.2s",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🎨 Custom CSS Classes

The application includes custom Tailwind classes for consistent styling:

- **`.glass-effect`** - Glass morphism container with backdrop blur
- **`.glow-button`** - Gradient button with hover glow effect
- **`.gradient-text`** - Gradient text effect
- **`.dropzone-active`** - Active dropzone styling
- **`.spinner`** - Loading spinner animation

## 🚀 Deployment

### Frontend (Netlify/Vercel)
```bash
npm run build
# Deploy the 'dist' folder
```

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`

### Backend (Render/Railway)
**Environment Variables:**
- `GEMINI_API_KEY` - Your Gemini API key
- `NODE_ENV` - `production`
- `FRONTEND_URL` - Your deployed frontend URL

**Build Settings:**
- Build command: `npm install`
- Start command: `npm start`

## 🧪 Testing

```bash
# Backend health check
curl http://localhost:5000/health

# Frontend development
npm run dev

# Build for production
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Live Demo](#) (Coming soon)
- [API Documentation](#) (Coming soon)
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Docs](https://ai.google.dev/)

## 🛠️ Development Status

**Current Status**: 🚧 In Development

- [x] Project structure setup
- [x] Package configurations
- [x] Security middleware
- [x] Rate limiting
- [x] CORS configuration
- [x] Basic React frontend
- [x] Tailwind CSS with custom classes
- [ ] File upload middleware
- [ ] Gemini AI integration
- [ ] Frontend UI components
- [ ] Image dropzone component
- [ ] Analysis results display
- [ ] Error handling UI
- [ ] Loading states
- [ ] Testing
- [ ] Production deployment

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check if port is in use
lsof -i :5000
# Kill process if needed
kill -9 PID
```

**Frontend build errors:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**CORS errors:**
- Verify `FRONTEND_URL` in backend `.env`
- Check that frontend is running on the specified port

**File upload errors:**
- Verify file size limits (10MB max)
- Check file types (JPEG, PNG, GIF, WebP only)
- Ensure uploads directory exists and is writable

### Performance Tips

- Use `npm run build` for production builds
- Enable gzip compression on your server
- Optimize images before upload
- Monitor memory usage with `/health` endpoint

---

Built with ❤️ using modern web technologies# AI Image Analyzer

A full-stack web application that allows users to upload up to 10 images and get AI-powered analysis results using Claude 3.5 Sonnet.

## 🚀 Features

- **Drag & Drop Upload**: Upload 1-10 images (JPEG, PNG, GIF, WebP)
- **AI Analysis**: Powered by Claude 3.5 Sonnet API
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
- Claude API key from Anthropic

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
   CLAUDE_API_KEY=your_claude_api_key_here
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