import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { analyzeAssignment } from '../services/llmService';
import { Assignment } from '../types/assignment';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage instead of disk storage

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Helper function to get assignments by email
const getAssignmentsByEmail = (email: string): Assignment[] => {
    const userDir = path.join(__dirname, '../../data', email);
    const assignmentsFile = path.join(userDir, 'assignments.json');

    // If assignments.json doesn't exist, try to create it from existing JSON files
    if (!fs.existsSync(assignmentsFile)) {
        const existingFiles = fs.readdirSync(userDir)
            .filter(file => file.endsWith('.json') && file !== 'assignments.json');

        if (existingFiles.length > 0) {
            const assignments: Assignment[] = [];
            const processedTitles = new Set<string>();

            existingFiles.forEach(file => {
                const filePath = path.join(userDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

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
            fs.writeFileSync(assignmentsFile, JSON.stringify(assignments, null, 2));
            console.log(`Created assignments.json with ${assignments.length} assignments`);
            return assignments;
        }
    }

    // If assignments.json exists, read from it
    if (fs.existsSync(assignmentsFile)) {
        const data = fs.readFileSync(assignmentsFile, 'utf-8');
        const assignments = JSON.parse(data);

        // Check if we need to update the assignments with any new files
        const existingFiles = fs.readdirSync(userDir)
            .filter(file => file.endsWith('.json') && file !== 'assignments.json');

        const existingIds = new Set(assignments.map((a: Assignment) => a.id));
        const existingTitles = new Set(assignments.map((a: Assignment) => a.analysis.title));

        const newAssignments = existingFiles
            .filter(file => !existingIds.has(file.replace('.json', '')))
            .map(file => {
                const filePath = path.join(userDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

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
            .filter((assignment): assignment is Assignment => assignment !== null);

        if (newAssignments.length > 0) {
            const updatedAssignments = [...assignments, ...newAssignments];
            fs.writeFileSync(assignmentsFile, JSON.stringify(updatedAssignments, null, 2));
            console.log(`Updated assignments.json with ${newAssignments.length} new assignments`);
            return updatedAssignments;
        }

        return assignments;
    }

    return [];
};

// Helper function to save assignments
const saveAssignments = (email: string, assignments: Assignment[]): void => {
    const userDir = path.join(__dirname, '../../data', email);
    const assignmentsFile = path.join(userDir, 'assignments.json');

    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    // Remove duplicates based on title
    const uniqueAssignments = assignments.reduce((acc: Assignment[], current) => {
        const exists = acc.some(item => item.analysis.title === current.analysis.title);
        if (!exists) {
            acc.push(current);
        }
        return acc;
    }, []);

    fs.writeFileSync(assignmentsFile, JSON.stringify(uniqueAssignments, null, 2));
};

// Get assignments by email
router.get('/assignments/:email', (req, res) => {
    try {
        const { email } = req.params;
        console.log('Getting assignments for:', email);
        const assignments = getAssignmentsByEmail(email);
        console.log('Found assignments:', assignments);
        res.json(assignments);
    } catch (error) {
        console.error('Error getting assignments:', error);
        res.status(500).json({ error: 'Failed to get assignments' });
    }
});

// Update assignment step status
router.put('/assignments/:email/:assignmentId', (req, res) => {
    try {
        const { email, assignmentId } = req.params;
        const { stepTitle, completed } = req.body;

        console.log('Updating step status:', { email, assignmentId, stepTitle, completed });

        const assignments = getAssignmentsByEmail(email);
        const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);

        if (assignmentIndex === -1) {
            console.error('Assignment not found:', assignmentId);
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const assignment = assignments[assignmentIndex];
        const stepIndex = assignment.analysis.steps.findIndex(step => step.title === stepTitle);

        if (stepIndex === -1) {
            console.error('Step not found:', stepTitle);
            return res.status(404).json({ error: 'Step not found' });
        }

        // Update the step status
        assignment.analysis.steps[stepIndex] = {
            ...assignment.analysis.steps[stepIndex],
            completed,
            status: completed ? 'completed' : 'pending'
        };

        // Update the assignment's updatedAt timestamp
        assignment.updatedAt = new Date().toISOString();

        // Save the updated assignments
        saveAssignments(email, assignments);

        console.log('Step status updated successfully:', {
            assignmentId,
            stepTitle,
            completed,
            status: assignment.analysis.steps[stepIndex].status
        });

        res.json(assignment);
    } catch (error) {
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
    } catch (error) {
        console.error('Error deleting assignment:', error);
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
});

// Analyze assignment
// routes/assignment.ts  (기존 코드 하단에 추가)
router.post('/assignments/:email', (req, res) => {
    try {
        const { email } = req.params;
        const assignment = req.body as Assignment;

        if (!assignment || !assignment.analysis?.title) {
            return res.status(400).json({ error: 'Invalid assignment payload' });
        }

        const assignments = getAssignmentsByEmail(email);
        assignments.push({
            ...assignment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        saveAssignments(email, assignments);
        res.status(201).json(assignment);
    } catch (err) {
        console.error('Error adding assignment:', err);
        res.status(500).json({ error: 'Failed to add assignment' });
    }
});

router.post('/analyze', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { dueDate } = req.body;
        const username = req.query.username as string;

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
            updatedAt: new Date().toISOString(),
        };

        const assignments = getAssignmentsByEmail(username);
        assignments.push(assignment);
        saveAssignments(username, assignments);

        return res.status(201).json(assignment);
    } catch (err) {
        console.error('Error analyzing assignment:', err);
        return res.status(500).json({ error: 'Failed to analyze assignment' });
    }
});


export default router; 