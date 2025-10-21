const admin = require('firebase-admin');
const config = require('../config/config');
const logger = require('../utils/logging');



const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1lsTWN700Zq/1\\naho7eqeEK8DruOPPBi8lUmiFPg4OJDRmmtnxws6KZxXr69ZhfRXPh0hUV8lTMKAm\\nfniJq+KQMkVyQe/AXNOSEs60Mdqnz79kazn1fujGAB6pL5lhrN0QA6NVAXgSLnB8\\n1EJx77h+g+M5HKecHDqBgGVKbES2OGNuqwhI7M8DRAlDFzxAQSxgzZUpsUbgiveJ\\nF284856H7RXDx1u65YJSE0EJBWsn8mdac+41imCr1FW9kHX0s7DnSRe+p1WRDPSx\\nykVkEzx2NSYbNz2sOtYvLtSCWC4JgSV1r7PlNdtxvQ25TXfaB+2q4+BuL8SRAEvz\\n74z62v2LAgMBAAECggEAAqvdPou8CZlrWXk6q5A4eKfZAwlmDBkP+ETrh5lhU1SZ\\nPaKCNg9/QpHAGgedJd444Hk+Owr3HyAQx4O/OfuyWI3RNw4V7rigpX5Aq4otGksb\\ninb5zPfAM8bQAf3SttIi+J7IouPVa5VGMwcGk6egJb77nfmUt96ljT7TTN0XjFjm\\nsntM6FdL9pEjLVwWkCJumBV/bt8n1sUvnvOBXX9IuSQkmtfbpjmuA4qjuPHvZwQV\\ntXcFlcxvOEUhu3tpScZOWJjG1hihdFsgHIkJkTnCfIEcxBPkDjzTyA3O/i2vwjRT\\nERa24Tlg/Trve+PZ4QCInX/IJQnaB0KdkNwQxcBICQKBgQD96uIpAvywtjk88OCc\\nwXVZHajf5zekt1Cemdj5bk1yiP/S41yQGDCriZQsdYIk+AbGiR/OWxTQM12J4PnK\\nfspuAqDKIqSGAUB5rDaittW9kUneBEJZiE7clf/EtL31SoDoJP+kYq2N9x/Bh+4N\\nOzPVjibVkBy+CnKwHeYGWiyAnQKBgQC3FAbfi6ElVFURG9tcQdf+YIilWQlNgZz2\\nJo8CMnI/HnjKaxtyx3BqmEqkVogq/4YP/NQ24lTXHvI8yOa21DkQrMZt1Mx/HBwi\\nIUUwQI1CskesUiSQBZgQBd1iW1UzYD5rYMuvHAdB9V48ix8K69cs9l4EuDFs9fav\\nxawZIXL6RwKBgQDCaQ6UHAdhPYQBluRC4RR6EO110VCXOwvtAxpPkBaYNTC6RP5g\\nDUVmcUYT7DyjFYwKgn7pvm7nIgziPnDCi+Vt6XE2kuOo/lhhUGvclWR9ajpGVLiA\\nWI8Y8XgNId23az3bgEiDklITujyELxEi7Es5nUc6iMaY8uLw2VN/VZdxOQKBgC46\\nHFIty47FcIVVZ1owNf3BGj/F75dmdt+gdNO1MSvG4fEagl/FBBmmQpKkVtWkl5FJ\\n4bvKAmofIkM+5yKbC52uQpxQ8yHVUzU6+WFpq0GACqD0TM8g2niRQoknTqgeUSSD\\n2GpqxVpePmFDL59uVXLA8pR2feRpZtSTMRVXYNTZAoGAVnS+PvtDx2jN+YMhUT5u\\nBidB9CbHAtRS17h150QYUzW6fOFOzSrGWRKtXzVc6vfqGtzGrXUllsgMTe5uFiFR\\nHWdWc/E5kygOLhsI9X4TaKqoN9mLU5Njs9mky0dRH06d0fVGF7HZFFF281Lbc5op\\nKnhnoXLMZ1Ncrb9rrA0119s=\\n-----END PRIVATE KEY-----\\n",
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
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
