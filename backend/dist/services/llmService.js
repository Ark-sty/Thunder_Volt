"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeAssignment = analyzeAssignment;
const openai_1 = require("openai");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdfjsLib = __importStar(require("pdfjs-dist/legacy/build/pdf"));
// Load environment variables
dotenv_1.default.config();
// Initialize OpenAI
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});
// Disable PDF.js worker in Node.js environment
pdfjsLib.GlobalWorkerOptions.workerSrc = '';
// Helper function to ensure user directory exists
function ensureUserDirectory(username) {
    const userDir = path_1.default.join(__dirname, '../../data', username);
    if (!fs_1.default.existsSync(userDir)) {
        fs_1.default.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
}
// Helper function to sanitize filename
function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
// Helper function to save analysis to file
function saveAnalysis(username, title, analysis) {
    const userDir = ensureUserDirectory(username);
    const filename = sanitizeFilename(title) + '.json';
    const filePath = path_1.default.join(userDir, filename);
    // Save individual analysis file
    fs_1.default.writeFileSync(filePath, JSON.stringify(analysis, null, 2));
    // Update assignments.json
    const assignmentsPath = path_1.default.join(userDir, 'assignments.json');
    let assignments = [];
    if (fs_1.default.existsSync(assignmentsPath)) {
        const content = fs_1.default.readFileSync(assignmentsPath, 'utf-8');
        assignments = JSON.parse(content);
    }
    // Check if assignment with same title already exists
    const existingIndex = assignments.findIndex(a => a.analysis.title === title);
    if (existingIndex !== -1) {
        // Update existing assignment
        assignments[existingIndex] = {
            ...assignments[existingIndex],
            analysis,
            updatedAt: new Date().toISOString()
        };
    }
    else {
        // Add new assignment
        assignments.push({
            id: Date.now().toString(),
            text: '',
            dueDate: analysis.dueDate,
            analysis,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    // Save updated assignments
    fs_1.default.writeFileSync(assignmentsPath, JSON.stringify(assignments, null, 2));
}
// Helper function to extract text from PDF
async function extractTextFromPDF(pdfBuffer) {
    try {
        console.log('Loading PDF document...');
        // Create a Uint8Array from the buffer
        const uint8Array = new Uint8Array(pdfBuffer);
        // Configure PDF.js
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            cMapUrl: 'https://unpkg.com/pdfjs-dist@2.16.105/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@2.16.105/standard_fonts/'
        });
        // Load the PDF document
        const pdfDocument = await loadingTask.promise;
        console.log(`PDF loaded successfully. Number of pages: ${pdfDocument.numPages}`);
        let fullText = '';
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            console.log(`Processing page ${i}...`);
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item) => item.str)
                .join(' ')
                .trim();
            fullText += pageText + '\n\n';
        }
        if (!fullText.trim()) {
            console.log('Warning: No text content extracted from PDF');
            throw new Error('No text content found in PDF');
        }
        console.log('Text extraction completed successfully');
        return fullText;
    }
    catch (error) {
        console.error('Error in extractTextFromPDF:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
    }
}
// Fallback response for when API call fails
function getFallbackResponse(dueDate) {
    return {
        title: 'Assignment Analysis Failed',
        summary: 'Failed to analyze the assignment. Please try again.',
        difficulty: '보통',
        estimatedTime: '1시간',
        dueDate: dueDate,
        steps: [
            {
                title: 'Try Again',
                description: 'Please try uploading the assignment again.',
                tip: 'Make sure the PDF file is not corrupted and contains readable text.',
                date: new Date().toISOString(),
                completed: false,
                status: 'pending'
            }
        ]
    };
}
async function analyzeAssignment(pdfBuffer, dueDate, username) {
    var _a, _b;
    try {
        console.log('Starting PDF text extraction...');
        const text = await extractTextFromPDF(pdfBuffer);
        // Ensure consistent date handling
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        console.log('Text extracted successfully, length:', text.length);
        console.log('Due date:', dueDate);
        console.log('Today:', todayStr);
        const prompt = `아래 과제를 분석하여 구조화된 분석 결과를 제공해주세요:
        Assignment: ${text}
        Due Date: ${dueDate}
        Today's Date: ${todayStr}
        
        다음 내용을 반드시 포함하세요:
        1. 과제의 핵심 주제를 잘 드러내는 간결한 제목 ("title")
        2. 과제의 목적과 요구사항을 요약한 요약문 ("summary")
        3. 난이도 (다섯 단계로 구분: 매우 쉬움, 쉬움, 보통, 어려움, 매우 어려움 중 선택)
        4. 예상 소요 시간 ("estimatedTime")
        5. A series of steps with titles, descriptions, and helpful tips ("steps")
        
        **중요 조건**:
        - 출력은 반드시 **한국어**로 작성해주세요.
        - steps의 개수는 Today's Date와 Due Date의 남은 날짜보다 많지 않아야 합니다.
        - 각 step에는 다음 정보를 포함해야 합니다:
          - title: 단계 제목
          - description: 자세한 설명
          - tip: 이 단계에서 유용한 팁
          - date: 이 단계를 수행해야 할 날짜 (오늘부터 마감일까지 균등 분배)
        - steps는 각 날짜에 하나씩 배정하며, 전체 수행 기간을 고려하여 균등하게 분배해야 합니다.
        - difficulty는 과제의 복잡성과 시간 소요를 고려하여 다섯 단계 중 하나로 지정하세요.
        - 출력은 다음과 같은 JSON 형식으로 정확히 맞춰주세요:
        
        {
          "title": "과제 제목 (한국어)",
          "summary": "과제 요약 (한국어)",
          "difficulty": "매우 쉬움|쉬움|보통|어려움|매우 어려움",
          "estimatedTime": "예상 소요 시간 (예:'12시간')",
          "dueDate": "${dueDate}",
          "steps": [
            {
              "title": "단계 제목",
              "description": "단계에 대한 자세한 설명",
              "tip": "도움이 되는 팁",
              "date": "YYYY-MM-DD",
              "completed": false,
              "status": "pending"
            }
          ]
        }
        
        Please return the output strictly as raw JSON.
        Do NOT wrap it in \`\`\`json or \`\`\` blocks.
        - Ensure each step has a unique title.
        - Do not repeat or duplicate any step.
        - The response must be a valid JSON. Verify before returning.`;
        console.log('Sending request to OpenAI...');
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an academic assistant that helps break down assignments into manageable tasks. You provide clear, actionable steps with helpful tips for each stage of the assignment. Always respond with pure JSON without any markdown formatting or additional text."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 4000,
        });
        const content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!content) {
            throw new Error('No response from OpenAI');
        }
        console.log("GPT Raw Response Content:", content);
        console.log("Attempting to parse JSON response...");
        try {
            // Clean the response content by removing any markdown code block markers
            const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
            const analysis = JSON.parse(cleanedContent);
            console.log("Successfully parsed analysis:", analysis);
            // Save the analysis to a file
            saveAnalysis(username, analysis.title, analysis);
            console.log("Analysis saved successfully");
            return {
                text,
                analysis
            };
        }
        catch (parseError) {
            console.error("Error parsing GPT response:", parseError);
            console.error("Raw content that failed to parse:", content);
            throw new Error('Failed to parse GPT response as JSON');
        }
    }
    catch (error) {
        console.error('Error in analyzeAssignment:', error);
        // Return a fallback response if the API call fails
        const fallback = getFallbackResponse(dueDate);
        saveAnalysis(username, fallback.title, fallback);
        return {
            text: 'Failed to extract text from PDF',
            analysis: fallback
        };
    }
}
