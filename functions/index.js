const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Submit score endpoint
exports.submitScore = functions.https.onCall(async (data, context) => {
  // Validate input
  const { name, score, time, items, device } = data;

  if (!name || !score || !time || !device) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  // Validate data types
  if (typeof name !== 'string' || typeof score !== 'number' || typeof time !== 'number') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid data types');
  }

  // Validate ranges
  if (score < 0 || score > 100000) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid score range');
  }

  if (time < 10) {
    throw new functions.https.HttpsError('invalid-argument', 'Time too short (possible cheating)');
  }

  if (!['mobile', 'desktop'].includes(device)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid device type');
  }

  // Rate limiting
  const ip = context.rawRequest.ip;
  const oneHourAgo = new Date(Date.now() - 3600000);

  const recentSubmissions = await db.collection('players')
    .where('ip', '==', ip)
    .where('createdAt', '>', oneHourAgo)
    .get();

  if (recentSubmissions.size >= 10) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many submissions. Please try again later.');
  }

  // Name filtering
  const filteredName = filterProfanity(name);

  // Save to Firestore
  try {
    const playerRef = await db.collection('players').add({
      name: filteredName,
      score: parseInt(score),
      time: parseInt(time),
      items: items || {},
      device: device,
      ip: ip,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, playerId: playerRef.id };
  } catch (error) {
    console.error('Error saving player score:', error);
    throw new functions.https.HttpsError('internal', 'Failed to save score');
  }
});

// Get leaderboard
exports.getLeaderboard = functions.https.onCall(async (data, context) => {
  const { period = 'all', limit = 100 } = data;

  let query = db.collection('players')
    .orderBy('score', 'desc')
    .orderBy('time', 'asc');

  // Filter by period
  if (period === 'daily') {
    const yesterday = new Date(Date.now() - 86400000);
    query = query.where('createdAt', '>', yesterday);
  } else if (period === 'weekly') {
    const lastWeek = new Date(Date.now() - 604800000);
    query = query.where('createdAt', '>', lastWeek);
  }

  try {
    const snapshot = await query.limit(Math.min(limit, 100)).get();

    const players = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      players.push({
        id: doc.id,
        name: data.name,
        score: data.score,
        time: data.time,
        items: data.items,
        device: data.device,
        createdAt: data.createdAt?.toDate()
      });
    });

    return players;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch leaderboard');
  }
});

// Submit RSVP (optional)
exports.submitRSVP = functions.https.onCall(async (data, context) => {
  const { name, phone, guests, note, playedGame, score, device } = data;

  if (!name || !phone) {
    throw new functions.https.HttpsError('invalid-argument', 'Name and phone are required');
  }

  // Rate limiting
  const ip = context.rawRequest.ip;
  const oneHourAgo = new Date(Date.now() - 3600000);

  const recentRSVPs = await db.collection('rsvp')
    .where('ip', '==', ip)
    .where('createdAt', '>', oneHourAgo)
    .get();

  if (recentRSVPs.size >= 3) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many RSVP submissions');
  }

  try {
    const rsvpRef = await db.collection('rsvp').add({
      name: name,
      phone: phone,
      guests: guests || 1,
      note: note || '',
      playedGame: playedGame || false,
      score: score || 0,
      device: device || 'unknown',
      ip: ip,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, rsvpId: rsvpRef.id };
  } catch (error) {
    console.error('Error saving RSVP:', error);
    throw new functions.https.HttpsError('internal', 'Failed to save RSVP');
  }
});

// Simple profanity filter
function filterProfanity(text) {
  const badWords = [
    'spam', 'test123', 'admin', 'fuck', 'shit', 'damn',
    // Add Vietnamese bad words
    'đụ', 'địt', 'lồn', 'cặc', 'buồi'
  ];

  let filtered = text.trim();

  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });

  // Limit length
  return filtered.substring(0, 50);
}
