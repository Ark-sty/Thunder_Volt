import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import assignmentRoutes from './routes/assignment';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { analyzeAssignment } from './services/llmService';
import { Assignment } from './types/assignment';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

/* ──────────────────────────────────────────────────
   1. CORS : PUT / DELETE / OPTIONS 허용
   ────────────────────────────────────────────────── */
app.use(
    cors({
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

/* OPTIONS 프리플라이트에 즉시 200 + CORS 헤더 응답 */
app.options('*', cors());

/* ──────────────────────────────────────────────────
   2. Body-parser  (CORS 이후, 라우터 이전)
   ────────────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ───── 이하 나머지 기존 코드 유지 ───── */


/* Helper 함수 getAssignmentsByEmail / saveAssignments … (생략) */

/* 라우터 연결 */
app.use('/api', assignmentRoutes);

/* 개별 GET · PUT · DELETE · POST /analyze 엔드포인트 (생략: 기존 그대로) */

/* Health check */
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

/* 공통 에러 핸들러 */
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

/* 서버 시작 */
app.listen(port, () => console.log(`Server running on port ${port}`));
