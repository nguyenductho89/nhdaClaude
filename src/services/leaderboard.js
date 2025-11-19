import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase.js';

let app;
let db;
let functions;
let auth;
let firebaseReady = false;

// Initialize Firebase
try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    functions = getFunctions(app);
    auth = getAuth(app);
    firebaseReady = true;
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Silent fallback to mock data
}

// Auth functions
export async function loginWithGoogle() {
  if (!firebaseReady || !auth) {
    throw new Error('Firebase not initialized');
  }
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export function getCurrentUser() {
  return auth?.currentUser;
}

// Submit score to leaderboard
export async function submitScore(name, score, time, items, device) {
  try {
    if (!firebaseReady || !db) {
      console.error('Firebase not initialized');
      return {
        success: false,
        message: 'Firebase not initialized. Cannot save score.'
      };
    }

    // Submit to Firestore
    const scoreData = {
      name: name.trim(),
      score: parseInt(score),
      time: parseInt(time),
      items: items || {},
      device: device || 'unknown',
      timestamp: Timestamp.now(),
      createdAt: new Date().toISOString()
    };

    console.log('📊 Submitting score to Firestore:', scoreData);
    const docRef = await addDoc(collection(db, 'players'), scoreData);
    console.log('✅ Score saved successfully! ID:', docRef.id);

    return {
      success: true,
      playerId: docRef.id,
      message: 'Score saved successfully!'
    };
  } catch (error) {
    console.error('Error saving score to Firestore:', error);
    return {
      success: false,
      message: 'Error saving score to Firestore: ' + error.message
    };
  }
}

// Get leaderboard
export async function getLeaderboard(period = 'all', limitCount = 100) {
  try {
    if (!firebaseReady || !db) {
      console.error('Firebase not initialized');
      return [];
    }

    // Get from Firestore
    let q = query(
      collection(db, 'players'),
      orderBy('score', 'desc'),
      limit(limitCount)
    );

    // Filter by period if needed
    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      q = query(
        collection(db, 'players'),
        where('timestamp', '>=', Timestamp.fromDate(today)),
        orderBy('timestamp', 'desc'),
        orderBy('score', 'desc'),
        limit(limitCount)
      );
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      q = query(
        collection(db, 'players'),
        where('timestamp', '>=', Timestamp.fromDate(weekAgo)),
        orderBy('timestamp', 'desc'),
        orderBy('score', 'desc'),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const scores = [];
    querySnapshot.forEach((doc) => {
      scores.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`📋 Loaded ${scores.length} scores from Firestore`);
    return scores;

  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

// Submit RSVP (optional)
export async function submitRSVP(data) {
  try {
    if (!firebaseReady || !db) {
      return {
        success: false,
        message: 'Firebase not initialized. Cannot save RSVP.'
      };
    }

    // Submit to Firestore
    const rsvpData = {
      ...data,
      timestamp: Timestamp.now(),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'rsvp'), rsvpData);

    return {
      success: true,
      rsvpId: docRef.id,
      message: 'RSVP saved successfully!'
    };
  } catch (error) {
    console.error('Error saving RSVP to Firestore:', error);
    return {
      success: false,
      message: 'Error saving RSVP: ' + error.message
    };
  }
}

// Detect device type
export function getDeviceType() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  return isMobile ? 'mobile' : 'desktop';
}

// Check if Firebase is ready
export function isFirebaseReady() {
  return firebaseReady;
}

// Get Firebase status for debugging
export function getFirebaseStatus() {
  return {
    configured: isFirebaseConfigured(),
    initialized: firebaseReady,
    hasDb: !!db,
    hasFunctions: !!functions,
    config: {
      projectId: firebaseConfig.projectId,
      hasApiKey: !!firebaseConfig.apiKey
    }
  };
}
