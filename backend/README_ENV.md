# Environment Variables Setup

## 🔐 Secure Credential Management

All OAuth credentials and sensitive configuration are now stored in the `.env` file for better security.

## 📁 Files Created/Updated

### 1. `.env` (Contains actual credentials)
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/justiceapp

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/user

# Facebook OAuth Credentials
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback

# LinkedIn OAuth Credentials
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. `.env.example` (Template for new developers)
- Contains placeholder values
- Used as a template for setting up new environments
- Safe to commit to version control

### 3. `.gitignore` (Updated)
- Excludes `.env` file from version control
- Ensures secrets are never accidentally committed

## 🚀 Setup Instructions

### For New Development Environment:

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file with your actual credentials:**
   - Get OAuth credentials from respective providers
   - Update MongoDB connection string if needed
   - Generate a secure JWT secret

3. **Install dependencies and start:**
   ```bash
   npm install
   npm start
   ```

## 🔧 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/justiceapp` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-google-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `your-google-client-secret` |
| `GOOGLE_REDIRECT_URI` | Google OAuth redirect URI | `http://localhost:3000/user` |
| `FACEBOOK_APP_ID` | Facebook app ID | `your-facebook-app-id` |
| `FACEBOOK_APP_SECRET` | Facebook app secret | `your-facebook-app-secret` |
| `FACEBOOK_REDIRECT_URI` | Facebook redirect URI | `http://localhost:3000/auth/facebook/callback` |
| `LINKEDIN_CLIENT_ID` | LinkedIn client ID | `your-linkedin-client-id` |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn client secret | `your-linkedin-client-secret` |
| `LINKEDIN_REDIRECT_URI` | LinkedIn redirect URI | `https://your-ngrok-url/auth/linkedin/callback` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key` |

## 🛡️ Security Best Practices

1. **Never commit `.env` to version control**
2. **Use different credentials for development and production**
3. **Rotate secrets regularly**
4. **Use strong, unique secrets**
5. **Enable additional security features like 2FA on OAuth provider accounts**

## 📝 OAuth Provider Setup

### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/user`

### Facebook OAuth:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create new app
3. Add Facebook Login product
4. Configure OAuth redirect URI: `http://localhost:3000/auth/facebook/callback`

### LinkedIn OAuth:
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create new app
3. Add Sign In with LinkedIn
4. Configure redirect URI: `http://localhost:3000/auth/linkedin/callback`

## 🔍 Troubleshooting

### Common Issues:
1. **MongoDB connection errors**: Check connection string and network access
2. **OAuth failures**: Verify client IDs, secrets, and redirect URIs
3. **JWT errors**: Ensure JWT_SECRET is set and consistent

### Debug Mode:
Set `DEBUG=true` in `.env` to enable detailed logging.

## 📞 Support

For any issues with environment setup, please check:
1. All required variables are set in `.env`
2. No syntax errors in `.env` file
3. Correct values for your environment
4. Proper OAuth provider configuration
