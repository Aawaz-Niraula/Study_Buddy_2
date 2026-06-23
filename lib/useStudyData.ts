// Re-export from the shared context so existing imports keep working.
// The actual implementation (caching + parallel fetching) lives in StudyDataContext.tsx.
export type { StudySession, StudyTest } from "./StudyDataContext";
export { useStudyData } from "./StudyDataContext";
