import "../config/env.js";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const DEFAULT_GOOGLE_AI_MODEL =
    process.env.GOOGLE_AI_MODEL ||
    process.env.GEMMA_MODEL ||
    process.env.AI_CHAT_MODEL ||
    process.env.GEMINI_MODEL ||
    "gemini-3.1-flash-lite";


const normalizeGeminiError = (error) => {
    const rawMessage =
        error?.message ||
        error?.error?.message ||
        "Gemini request failed";

    if (
        rawMessage.includes("RESOURCE_EXHAUSTED") ||
        rawMessage.includes("Quota exceeded") ||
        rawMessage.includes('"code":429') ||
        rawMessage.includes("429")
    ) {
        const friendlyError = new Error(
            "Google AI Studio quota is exhausted right now. Try again later or reduce AI usage."
        );
        friendlyError.code = "GOOGLE_AI_QUOTA_EXHAUSTED";
        throw friendlyError;
    }

    throw error;
};

const getGeminiClient = (apiKey = process.env.GEMINI_API_KEY) => {
    if (!apiKey) {
        throw new Error("Gemini API key is not configured");
    }
    return new GoogleGenAI({ apiKey });
};

// Returns an OpenAI-compatible client pointed at local Ollama
const getOllamaClient = () => {
    return new OpenAI({
        baseURL: (process.env.OLLAMA_URL || "http://localhost:11434") + "/v1",
        apiKey: "ollama", // Ollama does not require a real key
    });
};

const isOllamaConfigured = () => Boolean(process.env.OLLAMA_MODEL);

const extractJson = (text) => {
    if (!text) return null;

    let cleanText = text.trim();

    try {
        // 1. Strip markdown code blocks
        cleanText = cleanText.replace(/```json\s?|```/g, "").trim();

        // 2. Find the JSON object/array boundaries
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');

        let start = -1;
        let end = -1;

        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            start = firstBrace;
            end = lastBrace;
        } else if (firstBracket !== -1) {
            start = firstBracket;
            end = lastBracket;
        }

        if (start !== -1 && end !== -1 && end > start) {
            cleanText = cleanText.substring(start, end + 1);
        }

        // 3. Handle common JSON artifacts like trailing commas
        const sanitized = cleanText
            .replace(/,\s*([\]}])/g, '$1') // Trailing commas
            .replace(/(\r\n|\n|\r)/gm, " "); // Newlines inside strings (best effort)

        return JSON.parse(sanitized);
    } catch (error) {
        // Fallback to original text if sanitization failed or first attempt failed
        try {
            return JSON.parse(cleanText);
        } catch (innerError) {
            console.error("[AI Service] JSON Extraction failed. Raw text was:", text);
            throw new Error("Failed to parse AI response as JSON: " + innerError.message);
        }
    }
};

// Generate using local Ollama (OpenAI-compatible API)
const generateWithOllama = async (prompt, schema = null, options = {}) => {
    const client = getOllamaClient();
    const modelName = process.env.OLLAMA_MODEL || "gemma3:4b";

    let finalPrompt = prompt;
    if (schema) {
        finalPrompt += `\n\nIMPORTANT: Your response must be a single valid JSON object strictly following this schema:\n${JSON.stringify(schema, null, 2)}\n\nDo not include any conversational text or markdown backticks. Return raw JSON only.`;
    }

    console.log(`[AI Service] Calling local Ollama: ${modelName}`);

    const completion = await client.chat.completions.create({
        model: modelName,
        messages: [{ role: "user", content: finalPrompt }],
        temperature: options.temperature || 0.2,
    });

    const text = completion.choices[0]?.message?.content || "";
    const result = extractJson(text);
    console.log(`[AI Service] Done.`);
    return result;
};

export const generateWithGemini = async (prompt, schema = null, options = {}) => {
    // If Ollama is configured locally, use it instead of Google AI
    if (isOllamaConfigured()) {
        return generateWithOllama(prompt, schema, options);
    }

    try {
        const ai = getGeminiClient(options.apiKey);

        // Priority: options.model > process.env.GEMINI_MODEL > default
        const modelName = options.model || process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
        const keyUsed = options.keyName || "GEMINI_API_KEY";

        console.log(`[AI Service] Calling Google Gemini: ${modelName} (using ${keyUsed})`);

        // Detect if the model supports native JSON mode (all Gemini models do, Gemma does not)
        const isGemini = modelName.includes("gemini");

        let finalPrompt = prompt;
        const config = {};

        if (options.temperature) {
            config.temperature = options.temperature;
        }

        if (isGemini) {
            // Use native JSON mode — guarantees clean JSON output without markdown wrappers
            config.responseMimeType = "application/json";
        } else if (schema) {
            // For Gemma models, inject the schema into the prompt text instead
            finalPrompt += `\n\nIMPORTANT: Your response must be a single valid JSON object strictly following this schema:\n${JSON.stringify(schema, null, 2)}\n\nDo not include any conversational text or markdown backticks. Return raw JSON only.`;
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: finalPrompt,
            config,
        });

        const text = response.text;

        // Use our robust extractor to handle the text output
        const result = extractJson(text);
        console.log(`[AI Service] Done.`);
        return result;
    } catch (error) {
        console.error("[AI Service] Gemini Error:", error);
        throw error;
    }
};

const generateJson = async (prompt, schema = null, options = {}) => {
    return generateWithGemini(prompt, schema, options);
};

const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

export const isAiConfigured = () => isGeminiConfigured();

export const generateLectureSummary = async ({
    courseTitle,
    moduleTitle,
    lectureTitle,
    lectureText,
    transcriptText,
}) => {
    const parsed = await generateJson(`You are helping learners in low-connectivity environments.

Course: ${courseTitle}
Module: ${moduleTitle}
Lecture: ${lectureTitle}

Lecture text:
${lectureText || "N/A"}

Transcript:
${transcriptText || "N/A"}

Return strict JSON with this shape only:
{
  "summary": "2-4 sentence concise summary",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4"]
}

Rules:
- Be accurate to the provided lecture context only.
- Keep language student-friendly.
- Keep keyPoints practical and short.
- Do not include markdown.
- Return valid JSON only.`, {
        type: "object",
        properties: {
            summary: { type: "string" },
            keyPoints: {
                type: "array",
                items: { type: "string" },
            },
        },
        required: ["summary", "keyPoints"],
    }, {
        apiKey: process.env.GEMINI_API_KEY_SUMMARY || process.env.GEMINI_API_KEY,
        keyName: process.env.GEMINI_API_KEY_SUMMARY ? "GEMINI_API_KEY_SUMMARY" : "GEMINI_API_KEY",
    });

    return {
        summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
        keyPoints: Array.isArray(parsed.keyPoints)
            ? parsed.keyPoints
                .map((item) => String(item || "").trim())
                .filter(Boolean)
                .slice(0, 6)
            : [],
    };
};

export const generateLectureAssistantReply = async ({
    courseTitle,
    moduleTitle,
    lectureTitle,
    lectureText,
    transcriptText,
    messages,
}) => {
    if (!isGeminiConfigured()) {
        throw new Error("GEMINI_API_KEY is required for Google AI Studio");
    }
    const assistantModel = DEFAULT_GOOGLE_AI_MODEL;
    const assistantLabel = `Google AI Studio (${assistantModel})`;

    const conversation = messages
        .slice(-6)
        .map(
            (message) =>
                `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`
        )
        .join("\n");

    const parsed = await generateJson(`You are an educational assistant for a lecture.

Course: ${courseTitle}
Module: ${moduleTitle}
Lecture: ${lectureTitle}

Grounding context:
Lecture text:
${lectureText || "N/A"}

Transcript:
${transcriptText || "N/A"}

Conversation so far:
${conversation || "User: Generate practice MCQs from this lecture."}

Return strict JSON with this shape only:
{
  "reply": "Short helpful answer grounded in the lecture",
  "mcqs": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why it is correct"
    }
  ]
}

Rules:
- If the user explicitly asks for MCQs or practice questions, generate 3 or 4 good ones.
- If the user asks a general question or doubt, focus on a clear explanation and ONLY include MCQs if they help reinforce the specific concept being discussed.
- If the user is just chatting or MCQs are not helpful, return an empty array [] for "mcqs".
- Do not use markdown.
- Make options plausible and non-duplicative.
- Return valid JSON only.`, {
        type: "object",
        properties: {
            reply: { type: "string" },
            mcqs: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        question: { type: "string" },
                        options: {
                            type: "array",
                            items: { type: "string" },
                        },
                        correctAnswer: { type: "number" },
                        explanation: { type: "string" },
                    },
                    required: ["question", "options", "correctAnswer", "explanation"],
                },
            },
        },
        required: ["reply", "mcqs"],
    }, {
        model: assistantModel,
        temperature: 0.2,
        apiKey: process.env.GEMINI_API_KEY_CHAT || process.env.GEMINI_API_KEY,
        keyName: process.env.GEMINI_API_KEY_CHAT ? "GEMINI_API_KEY_CHAT" : "GEMINI_API_KEY",
    });

    return {
        provider: "google-ai-studio",
        model: assistantModel,
        label: assistantLabel,
        reply: typeof parsed.reply === "string" ? parsed.reply.trim() : "",
        mcqs: Array.isArray(parsed.mcqs)
            ? parsed.mcqs
                .map((mcq) => ({
                    question: String(mcq?.question || "").trim(),
                    options: Array.isArray(mcq?.options)
                        ? mcq.options
                            .map((option) => String(option || "").trim())
                            .filter(Boolean)
                            .slice(0, 4)
                        : [],
                    correctAnswer:
                        typeof mcq?.correctAnswer === "number"
                            ? mcq.correctAnswer
                            : 0,
                    explanation: String(mcq?.explanation || "").trim(),
                }))
                .filter((mcq) => mcq.question && mcq.options.length >= 2)
                .slice(0, 4)
            : [],
    };
};

export const generateAdaptiveQuestionBank = async ({
    courseTitle,
    moduleTitle,
    lectureTitle,
    lectureText,
    transcriptText,
    difficulty = "medium",
    count = 5,
}) => {
    console.log(`[AI Service] Generating ${difficulty} question bank (${count} questions)...`);
    const parsed = await generateJson(`You are an adaptive educational assessment assistant.
    
Course: ${courseTitle}
Module: ${moduleTitle}
Lecture: ${lectureTitle}

Grounding context:
Lecture text:
${lectureText || "N/A"}

Transcript:
${transcriptText || "N/A"}

Return strict JSON with this shape only:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Full answer option 1", "Full answer option 2", "Full answer option 3", "Full answer option 4"],
      "correctAnswer": 0,
      "explanation": "Why it is correct",
      "difficulty": "${difficulty}",
      "concept": "Specific concept name",
      "learningObjective": "What this question checks"
    }
  ]
}

Rules:
- Generate exactly ${count} questions.
- Every question must be of difficulty: ${difficulty}.
- Cover 2 to 3 distinct concepts from the lecture.
- Keep questions grounded in the context only.
- Each question must have exactly 4 options.
- Options must be complete, descriptive answer choices.
- correctAnswer must be 0, 1, 2 or 3.
- Keep explanations concise and clear.
- Do not include markdown.
- Return valid JSON only.`, {
        type: "object",
        properties: {
            questions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        question: { type: "string" },
                        options: {
                            type: "array",
                            items: { type: "string" },
                        },
                        correctAnswer: { type: "number" },
                        explanation: { type: "string" },
                        difficulty: { type: "string" },
                        concept: { type: "string" },
                        learningObjective: { type: "string" },
                    },
                    required: [
                        "question",
                        "options",
                        "correctAnswer",
                        "explanation",
                        "difficulty",
                        "concept",
                        "learningObjective",
                    ],
                },
            },
        },
        required: ["questions"],
    }, {
        apiKey: process.env.GEMINI_API_KEY_QUIZ || process.env.GEMINI_API_KEY,
        keyName: process.env.GEMINI_API_KEY_QUIZ ? "GEMINI_API_KEY_QUIZ" : "GEMINI_API_KEY",
    });

    const difficulties = ["easy", "medium", "hard"];
    const normalized = Array.isArray(parsed.questions)
        ? parsed.questions
            .map((question) => ({
                question: String(question?.question || "").trim(),
                options: Array.isArray(question?.options)
                    ? question.options
                        .map((option) => String(option || "").trim())
                        .filter(Boolean)
                        .slice(0, 4)
                    : [],
                correctAnswer:
                    typeof question?.correctAnswer === "number"
                        ? Math.max(0, Math.min(3, Math.trunc(question.correctAnswer)))
                        : 0,
                explanation: String(question?.explanation || "").trim(),
                difficulty: difficulties.includes(
                    String(question?.difficulty || "").toLowerCase()
                )
                    ? String(question.difficulty).toLowerCase()
                    : difficulty,
                concept:
                    String(question?.concept || "").trim() || "Core concept",
                learningObjective: String(
                    question?.learningObjective || ""
                ).trim(),
            }))
            .filter(
                (question) =>
                    question.question &&
                    question.options.length === 4 &&
                    question.options.every(
                        (option) =>
                            option.length > 1 &&
                            !/^[abcd]$/i.test(option) &&
                            !/^option\s*\d+$/i.test(option) &&
                            !/^choice\s*\d+$/i.test(option)
                    )
            )
            .slice(0, count)
        : [];

    if (normalized.length === 0) {
        throw new Error(`AI did not return any valid adaptive questions for ${difficulty}`);
    }

    return normalized;
};
