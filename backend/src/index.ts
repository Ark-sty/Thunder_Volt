import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import assignmentRoutes from './routes/assignment';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { analyzeAssignment } from './services/llmService';
import { Assignment } from './types/assignment';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const email = req.body.username;
        const userDir = path.join(__dirname, '../data', email);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Helper function to get assignments by email
const getAssignmentsByEmail = (email: string): Assignment[] => {
    const userDir = path.join(__dirname, '../data', email);
    const assignmentsFile = path.join(userDir, 'assignments.json');

    if (!fs.existsSync(assignmentsFile)) {
        return [];
    }

    const data = fs.readFileSync(assignmentsFile, 'utf-8');
    return JSON.parse(data);
};

// Helper function to save assignments
const saveAssignments = (email: string, assignments: Assignment[]): void => {
    const userDir = path.join(__dirname, '../data', email);
    const assignmentsFile = path.join(userDir, 'assignments.json');

    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    fs.writeFileSync(assignmentsFile, JSON.stringify(assignments, null, 2));
};

// Routes
app.use('/api', assignmentRoutes);

// Get assignments by email
app.get('/api/assignments/:email', (req, res) => {
    try {
        const { email } = req.params;
        const assignments = getAssignmentsByEmail(email);
        res.json(assignments);
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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

        const analysis = await analyzeAssignment(req.file.buffer, dueDate, username);
        const assignment: Assignment = {
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
    } catch (error) {
        console.error('Error analyzing assignment:', error);
        res.status(500).json({ error: 'Failed to analyze assignment' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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