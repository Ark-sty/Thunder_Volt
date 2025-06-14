"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const assignment_1 = __importDefault(require("./routes/assignment"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
/* ──────────────────────────────────────────────────
   1. CORS : PUT / DELETE / OPTIONS 허용
   ────────────────────────────────────────────────── */
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
/* OPTIONS 프리플라이트에 즉시 200 + CORS 헤더 응답 */
app.options('*', (0, cors_1.default)());
/* ──────────────────────────────────────────────────
   2. Body-parser  (CORS 이후, 라우터 이전)
   ────────────────────────────────────────────────── */
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
/* ───── 이하 나머지 기존 코드 유지 ───── */
/* Helper 함수 getAssignmentsByEmail / saveAssignments … (생략) */
/* 라우터 연결 */
app.use('/api', assignment_1.default);
/* 개별 GET · PUT · DELETE · POST /analyze 엔드포인트 (생략: 기존 그대로) */
/* Health check */
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));
/* 공통 에러 핸들러 */
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});
/* 서버 시작 */
app.listen(port, () => console.log(`Server running on port ${port}`));
