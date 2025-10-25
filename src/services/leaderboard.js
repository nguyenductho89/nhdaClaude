import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseConfig } from '../config/firebase.js';

let app;
let functions;

// Initialize Firebase
try {
  app = initializeApp(firebaseConfig);
  functions = getFunctions(app);
} catch (error) {
  console.warn('Firebase not initialized. Using mock data.', error);
}

// Submit score to leaderboard
export async function submitScore(name, score, time, items, device) {
  try {
    if (!functions) {
      console.log('Mock: Submit score', { name, score, time, items, device });
      return { success: true, playerId: 'mock-' + Date.now() };
    }

    const submitScoreFn = httpsCallable(functions, 'submitScore');
    const result = await submitScoreFn({ name, score, time, items, device });
    return result.data;
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
}

// Get leaderboard
export async function getLeaderboard(period = 'all', limit = 100) {
  try {
    if (!functions) {
      // Mock leaderboard data
      return [
        { id: '1', name: 'Nguyễn Văn A', score: 2500, time: 180, device: 'mobile' },
        { id: '2', name: 'Trần Thị B', score: 2300, time: 200, device: 'desktop' },
        { id: '3', name: 'Lê Văn C', score: 2100, time: 190, device: 'mobile' }
      ];
    }

    const getLeaderboardFn = httpsCallable(functions, 'getLeaderboard');
    const result = await getLeaderboardFn({ period, limit });
    return result.data;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

// Submit RSVP (optional)
export async function submitRSVP(data) {
  try {
    if (!functions) {
      console.log('Mock: Submit RSVP', data);
      return { success: true, rsvpId: 'mock-rsvp-' + Date.now() };
    }

    const submitRSVPFn = httpsCallable(functions, 'submitRSVP');
    const result = await submitRSVPFn(data);
    return result.data;
  } catch (error) {
    console.error('Error submitting RSVP:', error);
    throw error;
  }
}

// Detect device type
export function getDeviceType() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  return isMobile ? 'mobile' : 'desktop';
}
