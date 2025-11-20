const admin = require('firebase-admin');
const config = require('../config/config');
const logger = require('../utils/logging');
require("dotenv").config();

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: "googleapis.com"
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  logger.log('Firebase Admin SDK initialization error: ' + error.message);
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

exports.verifyIdToken = async function verifyIdToken(req, res, next) {
  const auth = req.header('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const idToken = auth.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token', details: e.message });
  }
};

