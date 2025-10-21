const admin = require('firebase-admin');
const config = require('../config/config');
const logger = require('../utils/logging');

// sanitize FIREBASE_PRIVATE_KEY from .env:
// 1) remove surrounding single/double quotes if present
// 2) replace escaped \n with real newlines
// 3) fallback: if still not a PEM, attempt base64 decode
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || '';
let privateKey = rawPrivateKey.replace(/(^["']|["']$)/g, '').replace(/\\n/g, '\n');
if (!privateKey.includes('-----BEGIN')) {
  try {
    const decoded = Buffer.from(privateKey, 'base64').toString('utf8');
    if (decoded.includes('-----BEGIN')) privateKey = decoded;
  } catch (e) {
    // ignore decode errors, keep original
  }
}

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: privateKey,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

// guard against multiple initializations (useful in dev/reload)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    logger.log('Firebase Admin SDK initialization error: ' + error.message);
  }
}

// Sends FCM data message to specific device token
exports.sendToDevice = async (fcmToken, dataPayload) => {
  try {
    if (!fcmToken) throw new Error('FCM Token is required');
    const message = {
      token: fcmToken,
      data: dataPayload
    };
    const response = await admin.messaging().send(message);
    logger.log(`FCM sent successfully, messageId: ${response}`);
    return response;
  } catch (error) {
    logger.log('FCM send error: ' + error.message);
    throw error;
  }
};
