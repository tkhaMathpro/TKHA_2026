
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Level } from "./types";

export const generateQuiz = async (topic: string, level: Level): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = "";
  let responseSchema: any = {};

  const commonRules = "Sử dụng LaTeX cho mọi công thức toán/lý/hóa. Trả về JSON thuần túy, không giải thích ngoài lề. Nội dung phải bám sát chương trình THPT 2018.";

  if (level === 'SIEU_DE') {
    prompt = `Tạo đúng 12 câu hỏi trắc nghiệm 4 lựa chọn (mức độ nhận biết, cơ bản) về chủ đề: ${topic}. Mỗi câu chỉ có 1 đáp án đúng duy nhất. ${commonRules}`;
    responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["multiple-choice"] },
          content: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
          answer: { type: Type.STRING, description: "Nội dung chính xác của phương án đúng" },
          explanation: { type: Type.STRING }
        },
        required: ["id", "type", "content", "options", "answer"]
      }
    };
  } else if (level === 'THU_SUC') {
    prompt = `Tạo đúng 4 câu hỏi dạng Đúng/Sai về chủ đề: ${topic}. Mỗi câu phải có đúng 4 ý nhỏ (a, b, c, d). Trong đó 2 ý đầu mức độ thông hiểu, 2 ý sau mức độ vận dụng. ${commonRules}`;
    responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["true-false"] },
          content: { type: Type.STRING, description: "Lời dẫn câu hỏi" },
          subItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                answer: { type: Type.BOOLEAN }
              },
              required: ["text", "answer"]
            },
            minItems: 4, maxItems: 4
          }
        },
        required: ["id", "type", "content", "subItems"]
      }
    };
  } else {
    prompt = `Tạo đúng 6 câu hỏi trả lời ngắn (mức độ vận dụng cao, bài toán thực tế, tư duy chuyên hoặc tuyển sinh) về chủ đề: ${topic}. ${commonRules}`;
    responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["short-answer"] },
          content: { type: Type.STRING },
          answer: { type: Type.STRING, description: "Đáp án ngắn gọn (số hoặc từ khóa)" },
          explanation: { type: Type.STRING }
        },
        required: ["id", "type", "content", "answer"]
      }
    };
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        maxOutputTokens: 20000,
        temperature: 0.7,
        systemInstruction: "Bạn là chuyên gia biên soạn đề thi THPT Quốc gia và đề thi học sinh giỏi. Bạn am hiểu sâu sắc cấu trúc đề thi mới của Bộ Giáo dục Việt Nam."
      },
    });

    const text = response.text;
    if (!text) throw new Error("Không nhận được phản hồi từ AI");
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Lỗi khi gọi Gemini:", error);
    throw error;
  }
};
