### 7. Environment Variables Documentation

**File: `ENV_VARIABLES.md`**
```markdown
# Environment Variables Reference

## Frontend Variables (Vite)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | http://localhost:5001 | Yes |
| `VITE_MAX_FILE_SIZE` | Max file size in bytes | 10485760 | No |
| `VITE_MAX_FILES` | Max files per upload | 10 | No |
| `VITE_APP_NAME` | Application name | AI Image Analyzer | No |
| `VITE_DEV_MODE` | Development mode flag | true | No |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | false | No |

## Backend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | - | Yes |
| `FRONTEND_URL` | Frontend application URL | http://localhost:5173 | Yes |
| `NODE_ENV` | Node environment | development | No |
| `PORT` | Server port | 5000 | No |
| `AI_MODEL` | Gemini model name | gemini-1.5-flash | No |
| `MAX_FILE_SIZE` | Max upload size (bytes) | 10485760 | No |
| `MAX_FILES` | Max files per request | 10 | No |
| `RATE_LIMIT_MAX` | Rate limit per window | 100 | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | 900000 | No |

## API Key Setup

### Getting a Gemini API Key
1. Visit [Google AI Studio]
2. Sign in with your Google account
3. Create a new project or select existing
4. Generate an API key
5. Copy the key (format: `AIza...`)

### Security Best Practices
- Never commit API keys to version control
- Use different keys for development and production
- Rotate keys regularly
- Monitor usage in Google Cloud Console
- Set usage quotas to prevent unexpected charges

## Development vs Production

### Development
- Use localhost URLs
- Enable detailed logging
- Allow CORS from development origins
- Use non-minified builds

### Production
- Use HTTPS URLs only
- Disable debug logging
- Restrict CORS to production domains
- Enable compression and minification
- Set appropriate rate limits