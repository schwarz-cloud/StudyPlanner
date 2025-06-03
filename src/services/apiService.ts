import type { Course, Exam, Lecture, Quiz } from '@/lib/types';
import { API_BASE_URL, USER_API_PATH } from '@/lib/constants';

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
      if (typeof [] === typeof ({} as T)) {
        return JSON.parse("[]") as T;
      }
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
      const additionalMessage = "This might be due to a network issue, the API server being unavailable, or a CORS configuration problem. Please check your network connection and the server status.";
      console.error(`[apiService] CRITICAL FETCH ERROR for ${fullUrl}: ${additionalMessage}. Original error message: ${error.message}`);
      throw new Error(`Request to ${fullUrl} failed. ${additionalMessage} (Details: ${error.message})`);
    }

    throw new Error(`An unexpected error occurred when trying to fetch from ${fullUrl}. Details: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// All fetch functions only return live API data (no mocks)

export async function fetchCourses(): Promise<Course[]> {
  const data = await fetchData<unknown>(`/api/courses${USER_API_PATH}`);
  console.log("[apiService] Raw course API response:", data);

  if (data && typeof data === 'object' && Array.isArray((data as any).course)) {
    return (data as any).course.map((c: any) => ({
      courseId: c.courseId,
      code: c.courseCode,
      title: c.courseTitle,
      language: c.language,
      semester: c.semester,
      schedule: Array.isArray(c.schedule)
        ? c.schedule.map((s: any) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')
        : "N/A"
    }));
  }

  throw new Error("[apiService] fetchCourses: Unexpected API response structure.");
}


export async function fetchExams(): Promise<Exam[]> {
  const data = await fetchData<unknown>(`/api/exams${USER_API_PATH}`);
  console.log("[apiService] Raw exam API response:", data);

  if (data && typeof data === 'object' && Array.isArray((data as any).exams)) {
    return (data as any).exams.map((e: any) => ({
      examId: e.examId,
      examTitle: e.examTitle,
      courseId: e.courseId,
      duration: e.duration,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      language: e.language,
      totalMark: e.totalMark,
      generatedAt: e.generatedAt,
      totalQuestions: e.totalQuestions,
      creatorId: e.creatorId,
      fileName: e.fileName,
    }));
  }

  throw new Error("[apiService] fetchExams: Unexpected API response structure.");
}



export async function fetchLectures(): Promise<Lecture[]> {
  const data = await fetchData<unknown>(`/api/lectures${USER_API_PATH}`);
  console.log("[apiService] Raw lecture API response:", data);

  if (data && typeof data === 'object' && Array.isArray((data as any).lectures)) {
    return (data as any).lectures.map((l: any) => ({
      lectureId: l.lectureId,
      title: l.title,
      courseId: l.courseId,
      startsAt: l.startsAt,
      endsAt: l.endsAt,
      isDone: l.isDone,
      hierarchy: l.hierarchy,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt
    }));
  }

  throw new Error("[apiService] fetchLectures: Unexpected API response structure.");
}



export async function fetchQuizzes(): Promise<Quiz[]> {
  const data = await fetchData<unknown>(`/api/quizzes${USER_API_PATH}`);
  console.log("[apiService] Raw quiz API response:", data);

  if (data && typeof data === 'object' && Array.isArray((data as any).quiz)) {
    return (data as any).quiz.map((q: any) => ({
      quizId: q.quizId,
      title: q.title,
      courseId: q.Lecture?.courseId ?? null,
      lectureId: q.Lecture?.lectureId ?? null,
      totalMarks: q.totalMark,
      creationDate: q.createdAt
    }));
  }

  throw new Error("[apiService] fetchQuizzes: Unexpected API response structure.");
}


