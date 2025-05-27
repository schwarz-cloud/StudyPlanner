
// src/services/firestoreService.ts
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { PomodoroSession, DistractionAttempt } from '@/lib/types';

const USER_COLLECTION = 'users';
// const WHITELIST_FIELD = 'urlWhitelist'; // No longer used for web app whitelist
const POMODORO_SESSIONS_SUBCOLLECTION = 'pomodoroSessions';
const DISTRACTION_ATTEMPTS_SUBCOLLECTION = 'distractionAttempts';

// Whitelist functions related to Firestore are removed as per no-login requirement for Focus Mode page.
// LocalStorage will be used on the page itself.

// /**
//  * Retrieves the URL whitelist for a given user.
//  * @param userId The ID of the user.
//  * @returns A promise that resolves to an array of whitelisted URLs.
//  */
// export async function getUserWhitelist(userId: string): Promise<string[]> {
//   if (!userId) {
//     console.warn('[firestoreService] getUserWhitelist: userId is missing.');
//     return [];
//   }
//   try {
//     const userDocRef = doc(db, USER_COLLECTION, userId);
//     const userDocSnap = await getDoc(userDocRef);
//     if (userDocSnap.exists()) {
//       const data = userDocSnap.data();
//       return data?.[WHITELIST_FIELD] || [];
//     }
//     return [];
//   } catch (error) {
//     console.error('[firestoreService] Error getting user whitelist:', error);
//     throw error;
//   }
// }

// /**
//  * Adds a URL to the user's whitelist.
//  * @param userId The ID of the user.
//  * @param url The URL to add.
//  * @returns A promise that resolves when the operation is complete.
//  */
// export async function addUrlToWhitelist(userId: string, url: string): Promise<void> {
//   if (!userId || !url) {
//     console.warn('[firestoreService] addUrlToWhitelist: userId or url is missing.');
//     return;
//   }
//   try {
//     const userDocRef = doc(db, USER_COLLECTION, userId);
//     // Use setDoc with merge:true to create the document if it doesn't exist,
//     // or update it if it does.
//     await setDoc(userDocRef, {
//       [WHITELIST_FIELD]: arrayUnion(url)
//     }, { merge: true });
//   } catch (error) {
//     console.error('[firestoreService] Error adding URL to whitelist:', error);
//     throw error;
//   }
// }

// /**
//  * Removes a URL from the user's whitelist.
//  * @param userId The ID of the user.
//  * @param url The URL to remove.
//  * @returns A promise that resolves when the operation is complete.
//  */
// export async function removeUrlFromWhitelist(userId: string, url: string): Promise<void> {
//   if (!userId || !url) {
//      console.warn('[firestoreService] removeUrlFromWhitelist: userId or url is missing.');
//     return;
//   }
//   try {
//     const userDocRef = doc(db, USER_COLLECTION, userId);
//     await updateDoc(userDocRef, {
//       [WHITELIST_FIELD]: arrayRemove(url)
//     });
//   } catch (error) {
//     console.error('[firestoreService] Error removing URL from whitelist:', error);
//     throw error;
//   }
// }

/**
 * Logs a completed Pomodoro session to Firestore.
 * This function may be called if user is logged in elsewhere or if re-enabled.
 * For the no-login Focus Mode page, its call is currently disabled.
 * @param userId The ID of the user.
 * @param sessionData The Pomodoro session data.
 * @returns A promise that resolves with the ID of the logged session document.
 */
export async function logPomodoroSession(userId: string, sessionData: Omit<PomodoroSession, 'userId' | 'id'>): Promise<string> {
  if (!userId) {
    console.warn('[firestoreService] logPomodoroSession: userId is missing. Session not logged.');
    throw new Error("User ID is required to log session.");
  }
  try {
    const sessionsCollectionRef = collection(db, USER_COLLECTION, userId, POMODORO_SESSIONS_SUBCOLLECTION);
    const sessionToLog = {
      ...sessionData,
      userId, 
      startTime: Timestamp.fromMillis(sessionData.startTime), 
      endTime: sessionData.endTime ? Timestamp.fromMillis(sessionData.endTime) : serverTimestamp(), 
    };
    const docRef = await addDoc(sessionsCollectionRef, sessionToLog);
    return docRef.id;
  } catch (error) {
    console.error('[firestoreService] Error logging Pomodoro session:', error);
    throw error;
  }
}


/**
 * Logs a distraction attempt to Firestore.
 * This function is intended for use by the Chrome Extension.
 * @param userId The ID of the user.
 * @param url The URL the user attempted to visit.
 * @returns A promise that resolves with the ID of the logged distraction document.
 */
export async function logDistractionAttempt(userId: string, url: string): Promise<string> {
  if (!userId || !url) {
    console.warn('[firestoreService] logDistractionAttempt: userId or url is missing.');
    throw new Error("User ID and URL are required to log distraction.");
  }
  try {
    const distractionsCollectionRef = collection(db, USER_COLLECTION, userId, DISTRACTION_ATTEMPTS_SUBCOLLECTION);
    const distractionToLog: Omit<DistractionAttempt, 'id' | 'userId'> & { timestamp: Timestamp } = { 
      url,
      timestamp: serverTimestamp() as Timestamp, 
    };
    const docRef = await addDoc(distractionsCollectionRef, distractionToLog);
    return docRef.id;
  } catch (error) {
    console.error('[firestoreService] Error logging distraction attempt:', error);
    throw error;
  }
}
