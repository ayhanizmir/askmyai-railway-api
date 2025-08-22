# AskMyAI Railway API

Railway üzerinde çalışan AskMyAI subscription yönetim API'si.

## 🚀 Özellikler

- ✅ Google Play subscription doğrulama
- ✅ MongoDB subscription saklama
- ✅ Aktif subscription'ları listeleme
- ✅ Bağlantı testi
- ✅ Rate limiting
- ✅ Security headers

## 📋 API Endpoints

### 1. Test Connection
```http
POST /api/testConnection
```

### 2. Verify Subscription
```http
POST /api/verifySubscription
Content-Type: application/json

{
  "purchaseToken": "token123",
  "userId": "user456",
  "deviceId": "device789",
  "googlePlayAccountId": "account123",
  "productId": "askmyai_pro_weekly"
}
```

### 3. Get Active Subscriptions
```http
GET /api/getActiveSubscriptions
```

### 4. Health Check
```http
GET /health
```

## 🔧 Railway Deployment

1. **Railway'e giriş yap**
2. **New Project** → **Deploy from GitHub**
3. **Repository seç** → **railway-api**
4. **Environment variables ekle:**
   - `MONGODB_URI`
   - `GOOGLE_SERVICE_ACCOUNT_KEY`
5. **Deploy**

## 📊 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Play service account JSON | ✅ |
| `PORT` | Server port (default: 3000) | ❌ |

## 🔒 Security

- Rate limiting: 100 requests/15 minutes
- CORS enabled
- Helmet security headers
- Input validation

## 📝 Logs

Railway dashboard'dan canlı logları takip edebilirsiniz.
