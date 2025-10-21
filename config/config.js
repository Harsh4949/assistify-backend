require('dotenv').config();

module.exports = {
  mongoUri: process.env.MONGO_URI ,
  port: process.env.PORT || 4000,

  // Full path to your Firebase service account private key JSON file
  // Download from Firebase Console > Project Settings > Service Accounts > Generate new private key

  fcmServiceAccount: process.env.FCM_SERVICE_ACCOUNT || '../serviceAccountKey.json',
  
  // Optional: other config
  logLevel: process.env.LOG_LEVEL || 'info'
};
