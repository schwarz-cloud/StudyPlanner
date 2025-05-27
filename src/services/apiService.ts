
import type { Course, Exam, Lecture, Quiz } from '@/lib/types';
import { API_BASE_URL, USER_API_PATH } from '@/lib/constants';
import { mockApiCourses, mockApiExams, mockApiLectures, mockApiQuizzes } from '@/lib/mock-data';

async function fetchData<T>(endpoint: string): Promise<T> {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`[apiService] Attempting to fetch data from: ${fullUrl}`);

  try {
    const response = await fetch(fullUrl);

    if (!response.ok) {
      let errorBody = "Could not retrieve error body from response.";
      try {
        errorBody = await response.text(); 
      } catch (textError) {
        console.warn(`[apiService] Failed to read error body as text from ${fullUrl} after a non-ok response. Status: ${response.status}`, textError);
      }
      console.error(`[apiService] API Error (${response.status}) for ${fullUrl}: ${errorBody}`);
      throw new Error(`API request to ${fullUrl} failed with status ${response.status}. Message: ${errorBody}`);
    }

    const responseText = await response.text(); 
    if (!responseText) {
        console.warn(`[apiService] Received empty response body from ${fullUrl} after a successful status.`);
        // Attempt to return what might be an empty array or handle as appropriate for T
        // If T is expected to be an array, an empty string is not valid JSON for it.
        if (typeof [] === typeof ({} as T)) { // Primitive check if T could be an array
          return JSON.parse("[]") as T;
        }
        // For non-array T, this might be acceptable or throw in JSON.parse
    }

    try {
      return JSON.parse(responseText) as T;
    } catch (jsonError) {
      console.error(`[apiService] Failed to parse JSON from ${fullUrl}. Response text (first 500 chars): "${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}". Original JSON parse error:`, jsonError);
      throw new Error(`Failed to parse JSON response from ${fullUrl}. Error: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
    }

  } catch (error) { 
    console.error(`[apiService] Error during fetch or response processing for ${fullUrl}. Original error object:`, error);
    
    if (error instanceof TypeError && (error.message.toLowerCase().includes('failed to fetch') || error.message.toLowerCase().includes('networkerror'))) {
      const additionalMessage = "This might be due to a network issue, the API server being unavailable, or a CORS configuration problem. Please check your network connection and the server status. If developing locally, ensure the API allows requests from your application's origin.";
      console.error(`[apiService] CRITICAL FETCH ERROR for ${fullUrl}: ${additionalMessage}. Original error message: ${error.message}. PLEASE CHECK BROWSER (Network and Console tabs) AND SERVER CONSOLE LOGS FOR MORE DETAILS (e.g., CORS errors, server logs).`);
      throw new Error(`Request to ${fullUrl} failed. ${additionalMessage} (Details: ${error.message})`);
    }
    
    if (error instanceof Error && (error.message.startsWith('API request to') || error.message.startsWith('Failed to parse JSON response from'))) {
        throw error;
    }

    throw new Error(`An unexpected error occurred when trying to fetch from ${fullUrl}. Details: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function fetchCourses(): Promise<Course[]> {
  try {
    const data = await fetchData<unknown>(`/api/courses${USER_API_PATH}`);
    if (Array.isArray(data)) {
      return data as Course[];
    }
    // Handling common API patterns where the array is nested
    if (data && typeof data === 'object') {
      if (Array.isArray((data as any).courses)) return (data as any).courses as Course[];
      if (Array.isArray((data as any).data)) return (data as any).data as Course[];
      if (Array.isArray((data as any).results)) return (data as any).results as Course[];
    }
    console.warn("[apiService] fetchCourses: API response was not an array or a recognized wrapped array. Returning empty array. Response:", data);
    return [];
  } catch (error) {
    console.warn("[apiService] fetchCourses failed. Falling back to mock data.", error);
    return [...mockApiCourses];
  }
}

export async function fetchExams(): Promise<Exam[]> {
  try {
    const data = await fetchData<unknown>(`/api/exams${USER_API_PATH}`);
    if (Array.isArray(data)) {
      return data as Exam[];
    }
    if (data && typeof data === 'object') {
      if (Array.isArray((data as any).exams)) return (data as any).exams as Exam[];
      if (Array.isArray((data as any).data)) return (data as any).data as Exam[];
      if (Array.isArray((data as any).results)) return (data as any).results as Exam[];
    }
    console.warn("[apiService] fetchExams: API response was not an array or a recognized wrapped array. Returning empty array. Response:", data);
    return [];
  } catch (error) {
    console.warn("[apiService] fetchExams failed. Falling back to mock data.", error);
    return [...mockApiExams];
  }
}

export async function fetchLectures(): Promise<Lecture[]> {
  try {
    const data = await fetchData<unknown>(`/api/lectures${USER_API_PATH}`);
    if (Array.isArray(data)) {
      return data as Lecture[];
    }
     if (data && typeof data === 'object') {
      if (Array.isArray((data as any).lectures)) return (data as any).lectures as Lecture[];
      if (Array.isArray((data as any).data)) return (data as any).data as Lecture[];
      if (Array.isArray((data as any).results)) return (data as any).results as Lecture[];
    }
    console.warn("[apiService] fetchLectures: API response was not an array or a recognized wrapped array. Returning empty array. Response:", data);
    return [];
  } catch (error) {
    console.warn("[apiService] fetchLectures failed. Falling back to mock data.", error);
    return [...mockApiLectures];
  }
}

export async function fetchQuizzes(): Promise<Quiz[]> {
  try {
    const data = await fetchData<unknown>(`/api/quizzes${USER_API_PATH}`);
    if (Array.isArray(data)) {
      return data as Quiz[];
    }
    if (data && typeof data === 'object') {
      if (Array.isArray((data as any).quizzes)) return (data as any).quizzes as Quiz[];
      if (Array.isArray((data as any).data)) return (data as any).data as Quiz[];
      if (Array.isArray((data as any).results)) return (data as any).results as Quiz[];
    }
    console.warn("[apiService] fetchQuizzes: API response was not an array or a recognized wrapped array. Returning empty array. Response:", data);
    return []; // Return empty array if not an array or recognized wrapped array
  } catch (error) {
    console.warn("[apiService] fetchQuizzes failed. Falling back to mock data.", error);
    return [...mockApiQuizzes]; // Fallback to mock data
  }
}
