"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const assignment_1 = __importDefault(require("./routes/assignment"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const llmService_1 = require("./services/llmService");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// CORS configuration
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
// Body parser middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const email = req.body.username;
        const userDir = path_1.default.join(__dirname, '../data', email);
        if (!fs_1.default.existsSync(userDir)) {
            fs_1.default.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = (0, multer_1.default)({ storage });
// Helper function to get assignments by email
const getAssignmentsByEmail = (email) => {
    const userDir = path_1.default.join(__dirname, '../data', email);
    const assignmentsFile = path_1.default.join(userDir, 'assignments.json');
    if (!fs_1.default.existsSync(assignmentsFile)) {
        return [];
    }
    const data = fs_1.default.readFileSync(assignmentsFile, 'utf-8');
    return JSON.parse(data);
};
// Helper function to save assignments
const saveAssignments = (email, assignments) => {
    const userDir = path_1.default.join(__dirname, '../data', email);
    const assignmentsFile = path_1.default.join(userDir, 'assignments.json');
    if (!fs_1.default.existsSync(userDir)) {
        fs_1.default.mkdirSync(userDir, { recursive: true });
    }
    fs_1.default.writeFileSync(assignmentsFile, JSON.stringify(assignments, null, 2));
};
// Routes
app.use('/api', assignment_1.default);
// Get assignments by email
app.get('/api/assignments/:email', (req, res) => {
    try {
        const { email } = req.params;
        const assignments = getAssignmentsByEmail(email);
        res.json(assignments);
    }
    catch (error) {
        console.error('Error getting assignments:', error);
        res.status(500).json({ error: 'Failed to get assignments' });
    }
});
// Update assignment step status
app.put('/api/assignments/:email/:assignmentId', (req, res) => {
    try {
        const { email, assignmentId } = req.params;
        const { stepTitle, completed } = req.body;
        const assignments = getAssignmentsByEmail(email);
        const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
        if (assignmentIndex === -1) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        const assignment = assignments[assignmentIndex];
        assignment.analysis.steps = assignment.analysis.steps.map(step => {
            if (step.title === stepTitle) {
                return {
                    ...step,
                    completed,
                    status: completed ? 'completed' : 'pending'
                };
            }
            return step;
        });
        saveAssignments(email, assignments);
        res.json(assignment);
    }
    catch (error) {
        console.error('Error updating assignment:', error);
        res.status(500).json({ error: 'Failed to update assignment' });
    }
});
// Delete assignment
app.delete('/api/assignments/:email/:assignmentId', (req, res) => {
    try {
        const { email, assignmentId } = req.params;
        const assignments = getAssignmentsByEmail(email);
        const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
        saveAssignments(email, updatedAssignments);
        res.json({ message: 'Assignment deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting assignment:', error);
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
});
// Analyze assignment
app.post('/api/analyze', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { dueDate, username } = req.body;
        if (!dueDate || !username) {
            return res.status(400).json({ error: 'Due date and username are required' });
        }
        const analysis = await (0, llmService_1.analyzeAssignment)(req.file.buffer, dueDate, username);
        const assignment = {
            id: Date.now().toString(),
            text: analysis.text,
            dueDate,
            analysis: analysis.analysis,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const assignments = getAssignmentsByEmail(username);
        assignments.push(assignment);
        saveAssignments(username, assignments);
        res.json(assignment);
    }
    catch (error) {
        console.error('Error analyzing assignment:', error);
        res.status(500).json({ error: 'Failed to analyze assignment' });
    }
});
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});
// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
