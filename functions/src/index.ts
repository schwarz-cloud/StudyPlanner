/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import fetch from "node-fetch"; // Using node-fetch v2 for CommonJS compatibility

admin.initializeApp();
const db = admin.firestore();

interface AskGuruRequestData {
  message: string;
  sessionId: string; // sessionId to group messages
}

interface GeminiResponsePart {
  text: string;
}

interface GeminiCandidate {
  content: {
    parts: GeminiResponsePart[];
    role: string;
  };
  // Add other candidate properties if needed, e.g., finishReason, safetyRatings
}

interface GeminiApiResponse {
  candidates: GeminiCandidate[];
  // Add promptFeedback if needed
}

export const askGuru = onCall(
  { secrets: ["GEMINI_API_KEY"] }, // If using new secrets management
  async (request) => {
    if (!request.auth) {
      logger.error("User not authenticated");
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    if (!request.data.message || typeof request.data.message !== "string") {
      logger.error("Request data missing message or message is not a string");
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a 'message' argument (string)."
      );
    }
    if (!request.data.sessionId || typeof request.data.sessionId !== "string") {
      logger.error("Request data missing sessionId or sessionId is not a string");
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a 'sessionId' argument (string)."
      );
    }

    const uid = request.auth.uid;
    const userMessageText = request.data.message;
    const sessionId = request.data.sessionId;

    // Get Gemini API Key from Firebase Functions configuration
    // For new secrets management use process.env.GEMINI_API_KEY (after setting up the secret)
    // For older functions.config(), it's functions.config().gemini.key
    let geminiApiKey = process.env.GEMINI_API_KEY; // For new secrets
    if (!geminiApiKey) {
        try {
            geminiApiKey = functions.config().gemini.key; // Fallback for older config
        } catch (e) {
            logger.error("GEMINI_API_KEY not found in environment variables or functions.config().gemini.key", e);
            throw new HttpsError("internal", "Gemini API key is not configured.");
        }
    }

    if (!geminiApiKey) {
        logger.error("GEMINI_API_KEY is effectively not set.");
        throw new HttpsError("internal", "Gemini API key configuration error.");
    }


    const messagesCollectionRef = db
      .collection("users")
      .doc(uid)
      .collection("chats")
      .doc(sessionId)
      .collection("messages");

    // Save user's message to Firestore
    try {
      await messagesCollectionRef.add({
        text: userMessageText,
        sender: "user",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`User message saved for user ${uid}, session ${sessionId}`);
    } catch (error) {
      logger.error("Error saving user message to Firestore:", error);
      throw new HttpsError("internal", "Failed to save user message.");
    }

    // Call Gemini API
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
    const geminiPrompt = `You are Guru, a wise and helpful academic assistant. A student said: "${userMessageText}". Respond in a helpful and encouraging academic tone.`;

    let guruResponseText = "I'm sorry, I couldn't process that right now. Please try again.";

    try {
      const geminiResponse = await fetch(geminiApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: geminiPrompt }],
            },
          ],
          // Optional: Add generationConfig like temperature, topK, etc.
          // generationConfig: {
          //  temperature: 0.7,
          //  topK: 40,
          // },
        }),
      });

      if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.text();
        logger.error(
          `Gemini API request failed with status ${geminiResponse.status}:`,
          errorBody
        );
        throw new HttpsError("internal", "Failed to get response from AI model.");
      }

      const geminiResponseData = (await geminiResponse.json()) as GeminiApiResponse;

      if (
        geminiResponseData.candidates &&
        geminiResponseData.candidates.length > 0 &&
        geminiResponseData.candidates[0].content &&
        geminiResponseData.candidates[0].content.parts &&
        geminiResponseData.candidates[0].content.parts.length > 0
      ) {
        guruResponseText = geminiResponseData.candidates[0].content.parts[0].text;
      } else {
        logger.warn("Gemini API response was empty or not in expected format", geminiResponseData);
      }
    } catch (error) {
      logger.error("Error calling Gemini API:", error);
      // guruResponseText will remain the default error message
    }

    // Save Guru's response to Firestore
    try {
      await messagesCollectionRef.add({
        text: guruResponseText,
        sender: "guru",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`Guru response saved for user ${uid}, session ${sessionId}`);
    } catch (error) {
      logger.error("Error saving Guru's response to Firestore:", error);
      // Don't throw here, as we still want to return the response to the user
    }
    
    // Update the chat session's last activity timestamp
    try {
        await db.collection("users").doc(uid).collection("chats").doc(sessionId).set({
            lastActivity: admin.firestore.FieldValue.serverTimestamp(),
            lastMessageSnippet: guruResponseText.substring(0, 100) // Store a snippet of the last message
        }, { merge: true });
    } catch (error) {
        logger.error("Error updating chat session metadata:", error);
    }


    return { response: guruResponseText };
  }
);
