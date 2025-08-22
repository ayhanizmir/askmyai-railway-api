const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MongoClient } = require('mongodb');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Railway
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://askmyai_user:AskMyAI2024!@cluster0.jhsptkt.mongodb.net/askmyai?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true';
const client = new MongoClient(MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  tls: true,
  tlsAllowInvalidCertificates: true
});

// Google Play API ayarları
const packageName = 'com.ayhanisidici35.ask_my_ai_message_magic_node_v5';
const playAPI = google.androidpublisher('v3');

// Google Play API authentication
const getGooglePlayAuth = () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
  });
  return auth;
};

// Subscription durumunu kontrol et
const verifySubscription = async (purchaseToken) => {
  try {
    const auth = await getGooglePlayAuth();
    const authClient = await auth.getClient();
    
    const response = await playAPI.purchases.subscriptionsv2.get({
      packageName: packageName,
      token: purchaseToken,
      auth: authClient
    });
    
    const subscription = response.data.subscriptionPurchase;
    const isActive = subscription.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE';
    const expiryTime = new Date(subscription.lineItems[0].expiryTime);
    const isExpired = expiryTime < new Date();
    
    return {
      isPremium: isActive && !isExpired,
      expiryTime: expiryTime,
      state: subscription.subscriptionState,
      productId: subscription.lineItems[0].productId
    };
  } catch (error) {
    console.error('Google Play API Error:', error);
    throw new Error('Subscription verification failed');
  }
};

// MongoDB'ye subscription kaydet
const saveSubscription = async (purchaseToken, subscriptionData) => {
  try {
    await client.connect();
    const db = client.db('askmyai');
    const collection = db.collection('subscriptions');
    
    await collection.updateOne(
      { purchaseToken: purchaseToken },
      {
        $set: {
          ...subscriptionData,
          lastChecked: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('MongoDB Error:', error);
    throw new Error('Database operation failed');
  }
};

// API Routes

// Test connection
app.post('/api/testConnection', async (req, res) => {
  try {
    console.log('🔧 Railway API - testConnection called');
    
    // MongoDB bağlantısını test et
    await client.connect();
    const db = client.db('askmyai');
    await db.admin().ping();
    
    res.json({
      success: true,
      message: 'Railway API connection test successful',
      timestamp: new Date().toISOString(),
      platform: 'Railway'
    });
  } catch (error) {
    console.error('❌ Railway API - testConnection error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      platform: 'Railway'
    });
  }
});

// Verify subscription
app.post('/api/verifySubscription', async (req, res) => {
  try {
    console.log('🔧 Railway API - verifySubscription called');
    const { purchaseToken, userId, deviceId, googlePlayAccountId, productId } = req.body;
    
    if (!purchaseToken) {
      return res.status(400).json({
        success: false,
        error: 'Purchase token is required'
      });
    }
    
    // Google Play'den subscription'ı doğrula
    const subscriptionData = await verifySubscription(purchaseToken);
    
    // MongoDB'ye kaydet
    await saveSubscription(purchaseToken, subscriptionData);
    
    res.json({
      success: true,
      data: subscriptionData,
      platform: 'Railway'
    });
  } catch (error) {
    console.error('❌ Railway API - verifySubscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      platform: 'Railway'
    });
  }
});

// Get active subscriptions
app.get('/api/getActiveSubscriptions', async (req, res) => {
  try {
    console.log('🔧 Railway API - getActiveSubscriptions called');
    
    await client.connect();
    const db = client.db('askmyai');
    const collection = db.collection('subscriptions');
    
    // Aktif subscription'ları al
    const activeSubscriptions = await collection.find({
      isPremium: true,
      expiryTime: { $gt: new Date() }
    }).toArray();
    
    console.log(`📊 Railway API - Found ${activeSubscriptions.length} active subscriptions`);
    
    res.json({
      success: true,
      subscriptions: activeSubscriptions,
      count: activeSubscriptions.length,
      platform: 'Railway'
    });
  } catch (error) {
    console.error('❌ Railway API - getActiveSubscriptions error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      platform: 'Railway'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    platform: 'Railway',
    version: '1.0.0'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Railway API server running on port ${PORT}`);
  console.log(`🔧 Platform: Railway`);
  console.log(`📊 MongoDB URI: ${MONGODB_URI ? 'Configured' : 'Not configured'}`);
  console.log(`🔑 Google Service Account: ${process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'Configured' : 'Not configured'}`);
});

module.exports = app;
