
export type Level = 'SIEU_DE' | 'THU_SUC' | 'VE_DICH';

export interface SubItem {
  text: string;
  answer: boolean;
  userSelected?: boolean; // Trạng thái người dùng chọn
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  content: string;
  options?: string[]; // Cho trắc nghiệm
  subItems?: SubItem[]; // Cho Đúng/Sai
  answer?: string; // Đáp án đúng cho MC hoặc Short Answer
  explanation?: string;
}

export interface QuizData {
  topic: string;
  level: Level;
  questions: Question[];
}
