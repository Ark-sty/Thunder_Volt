"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const llmService_1 = require("../services/llmService");
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage(); // Use memory storage instead of disk storage
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});
// Helper function to get assignments by email
const getAssignmentsByEmail = (email) => {
    const userDir = path_1.default.join(__dirname, '../../data', email);
    const assignmentsFile = path_1.default.join(userDir, 'assignments.json');
    // If assignments.json doesn't exist, try to create it from existing JSON files
    if (!fs_1.default.existsSync(assignmentsFile)) {
        const existingFiles = fs_1.default.readdirSync(userDir)
            .filter(file => file.endsWith('.json') && file !== 'assignments.json');
        if (existingFiles.length > 0) {
            const assignments = [];
            const processedTitles = new Set();
            existingFiles.forEach(file => {
                const filePath = path_1.default.join(userDir, file);
                const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
                // Skip if we've already processed this title
                if (processedTitles.has(data.title)) {
                    return;
                }
                processedTitles.add(data.title);
                assignments.push({
                    id: file.replace('.json', ''),
                    text: data.text || '',
                    dueDate: data.dueDate || new Date().toISOString(),
                    analysis: {
                        title: data.title || file.replace('.json', ''),
                        summary: data.summary || '',
                        difficulty: data.difficulty || '보통',
                        estimatedTime: data.estimatedTime || '1시간',
                        dueDate: data.dueDate || new Date().toISOString(),
                        steps: data.steps || []
                    },
                    createdAt: data.createdAt || new Date().toISOString(),
                    updatedAt: data.updatedAt || new Date().toISOString()
                });
            });
            // Save to assignments.json
            fs_1.default.writeFileSync(assignmentsFile, JSON.stringify(assignments, null, 2));
            console.log(`Created assignments.json with ${assignments.length} assignments`);
            return assignments;
        }
    }
    // If assignments.json exists, read from it
    if (fs_1.default.existsSync(assignmentsFile)) {
        const data = fs_1.default.readFileSync(assignmentsFile, 'utf-8');
        const assignments = JSON.parse(data);
        // Check if we need to update the assignments with any new files
        const existingFiles = fs_1.default.readdirSync(userDir)
            .filter(file => file.endsWith('.json') && file !== 'assignments.json');
        const existingIds = new Set(assignments.map((a) => a.id));
        const existingTitles = new Set(assignments.map((a) => a.analysis.title));
        const newAssignments = existingFiles
            .filter(file => !existingIds.has(file.replace('.json', '')))
            .map(file => {
            const filePath = path_1.default.join(userDir, file);
            const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
            // Skip if we already have an assignment with this title
            if (existingTitles.has(data.title)) {
                return null;
            }
            return {
                id: file.replace('.json', ''),
                text: data.text || '',
                dueDate: data.dueDate || new Date().toISOString(),
                analysis: {
                    title: data.title || file.replace('.json', ''),
                    summary: data.summary || '',
                    difficulty: data.difficulty || '보통',
                    estimatedTime: data.estimatedTime || '1시간',
                    dueDate: data.dueDate || new Date().toISOString(),
                    steps: data.steps || []
                },
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString()
            };
        })
            .filter((assignment) => assignment !== null);
        if (newAssignments.length > 0) {
            const updatedAssignments = [...assignments, ...newAssignments];
            fs_1.default.writeFileSync(assignmentsFile, JSON.stringify(updatedAssignments, null, 2));
            console.log(`Updated assignments.json with ${newAssignments.length} new assignments`);
            return updatedAssignments;
        }
        return assignments;
    }
    return [];
};
// Helper function to save assignments
const saveAssignments = (email, assignments) => {
    const userDir = path_1.default.join(__dirname, '../../data', email);
    const assignmentsFile = path_1.default.join(userDir, 'assignments.json');
    if (!fs_1.default.existsSync(userDir)) {
        fs_1.default.mkdirSync(userDir, { recursive: true });
    }
    // Remove duplicates based on title
    const uniqueAssignments = assignments.reduce((acc, current) => {
        const exists = acc.some(item => item.analysis.title === current.analysis.title);
        if (!exists) {
            acc.push(current);
        }
        return acc;
    }, []);
    fs_1.default.writeFileSync(assignmentsFile, JSON.stringify(uniqueAssignments, null, 2));
};
// Get assignments by email
router.get('/assignments/:email', (req, res) => {
    try {
        const { email } = req.params;
        console.log('Getting assignments for:', email);
        const assignments = getAssignmentsByEmail(email);
        console.log('Found assignments:', assignments);
        res.json(assignments);
    }
    catch (error) {
        console.error('Error getting assignments:', error);
        res.status(500).json({ error: 'Failed to get assignments' });
    }
});
// Update assignment step status
router.put('/assignments/:email/:assignmentId', (req, res) => {
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
router.delete('/assignments/:email/:assignmentId', (req, res) => {
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
router.post('/analyze', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { dueDate } = req.body;
        const username = req.query.username;
        if (!dueDate || !username) {
            return res.status(400).json({ error: 'Due date and username are required' });
        }
        console.log('File received:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });
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
exports.default = router;
