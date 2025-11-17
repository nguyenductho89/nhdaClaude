import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase.js';

let app;
let db;
let functions;
let firebaseReady = false;

// Initialize Firebase
try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    functions = getFunctions(app);
    firebaseReady = true;
  }
} catch (error) {
  // Silent fallback to mock data
}

// Submit score to leaderboard
export async function submitScore(name, score, time, items, device) {
  try {
    if (!firebaseReady || !db) {
      // Save to localStorage as fallback
      const localScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
      const newScore = {
        id: 'local-' + Date.now(),
        name,
        score,
        time,
        items,
        device,
        timestamp: new Date().toISOString()
      };
      localScores.push(newScore);
      // Keep only top 100 scores
      localScores.sort((a, b) => b.score - a.score);
      localStorage.setItem('gameScores', JSON.stringify(localScores.slice(0, 100)));
      return { success: true, playerId: newScore.id };
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

    const docRef = await addDoc(collection(db, 'scores'), scoreData);

    return {
      success: true,
      playerId: docRef.id,
      message: 'Score saved successfully!'
    };
  } catch (error) {
    // Fallback to localStorage
    const localScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
    const newScore = {
      id: 'local-' + Date.now(),
      name,
      score,
      time,
      items,
      device,
      timestamp: new Date().toISOString()
    };
    localScores.push(newScore);
    localScores.sort((a, b) => b.score - a.score);
    localStorage.setItem('gameScores', JSON.stringify(localScores.slice(0, 100)));

    return {
      success: true,
      playerId: newScore.id,
      message: 'Score saved locally (Firebase error)'
    };
  }
}

// Get leaderboard
export async function getLeaderboard(period = 'all', limitCount = 100) {
  try {
    if (!firebaseReady || !db) {
      // Get from localStorage
      const localScores = JSON.parse(localStorage.getItem('gameScores') || '[]');

      if (localScores.length === 0) {
        // Return mock data if no local scores
        return [
          { id: '1', name: 'Nguyễn Văn A', score: 2500, time: 180, device: 'mobile' },
          { id: '2', name: 'Trần Thị B', score: 2300, time: 200, device: 'desktop' },
          { id: '3', name: 'Lê Văn C', score: 2100, time: 190, device: 'mobile' }
        ];
      }

      return localScores.slice(0, limitCount);
    }

    // Get from Firestore
    let q = query(
      collection(db, 'scores'),
      orderBy('score', 'desc'),
      limit(limitCount)
    );

    // Filter by period if needed
    if (period === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      q = query(
        collection(db, 'scores'),
        where('timestamp', '>=', Timestamp.fromDate(today)),
        orderBy('timestamp', 'desc'),
        orderBy('score', 'desc'),
        limit(limitCount)
      );
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      q = query(
        collection(db, 'scores'),
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

    return scores;

  } catch (error) {

    // Fallback to localStorage
    const localScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
    return localScores.slice(0, limitCount);
  }
}

// Submit RSVP (optional)
export async function submitRSVP(data) {
  try {
    if (!firebaseReady || !db) {
      // Save to localStorage
      const localRSVPs = JSON.parse(localStorage.getItem('gameRSVPs') || '[]');
      const newRSVP = {
        id: 'local-rsvp-' + Date.now(),
        ...data,
        timestamp: new Date().toISOString()
      };
      localRSVPs.push(newRSVP);
      localStorage.setItem('gameRSVPs', JSON.stringify(localRSVPs));
      return { success: true, rsvpId: newRSVP.id };
    }

    // Submit to Firestore
    const rsvpData = {
      ...data,
      timestamp: Timestamp.now(),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'rsvps'), rsvpData);

    return {
      success: true,
      rsvpId: docRef.id,
      message: 'RSVP saved successfully!'
    };
  } catch (error) {
    // Fallback to localStorage
    const localRSVPs = JSON.parse(localStorage.getItem('gameRSVPs') || '[]');
    const newRSVP = {
      id: 'local-rsvp-' + Date.now(),
      ...data,
      timestamp: new Date().toISOString()
    };
    localRSVPs.push(newRSVP);
    localStorage.setItem('gameRSVPs', JSON.stringify(localRSVPs));

    return {
      success: true,
      rsvpId: newRSVP.id,
      message: 'RSVP saved locally (Firebase error)'
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
