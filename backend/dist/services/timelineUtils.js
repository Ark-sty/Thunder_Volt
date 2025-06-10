"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reassignIncompleteSteps = reassignIncompleteSteps;
exports.validateAndFormatDate = validateAndFormatDate;
exports.calculateDaysBetween = calculateDaysBetween;
exports.distributeStepsEvenly = distributeStepsEvenly;
const dayjs_1 = __importDefault(require("dayjs"));
const isSameOrBefore_1 = __importDefault(require("dayjs/plugin/isSameOrBefore"));
const isSameOrAfter_1 = __importDefault(require("dayjs/plugin/isSameOrAfter"));
dayjs_1.default.extend(isSameOrBefore_1.default);
dayjs_1.default.extend(isSameOrAfter_1.default);
/**
 * Reassigns incomplete steps to the next available date
 * @param steps Array of steps with their assigned dates
 * @param dueDate The final due date for the assignment
 * @returns Updated array of steps with new assigned dates
 */
function reassignIncompleteSteps(steps, dueDate) {
    const today = (0, dayjs_1.default)();
    const finalDueDate = (0, dayjs_1.default)(dueDate);
    // Sort steps by their current assigned date
    const sortedSteps = [...steps].sort((a, b) => (0, dayjs_1.default)(a.assignedDate).unix() - (0, dayjs_1.default)(b.assignedDate).unix());
    // Create a map of dates to track available slots
    const dateSlots = new Map();
    let currentDate = today;
    while (currentDate.isSameOrBefore(finalDueDate)) {
        dateSlots.set(currentDate.format('YYYY-MM-DD'), 0);
        currentDate = currentDate.add(1, 'day');
    }
    // Process each step
    return sortedSteps.map(step => {
        // If step is completed, keep its current date
        if (step.completed) {
            return {
                ...step,
                status: 'completed'
            };
        }
        const stepDate = (0, dayjs_1.default)(step.assignedDate);
        // If step is from a past date, find the next available slot
        if (stepDate.isBefore(today)) {
            // Find the next available date
            let nextDate = today;
            while (nextDate.isSameOrBefore(finalDueDate)) {
                const dateKey = nextDate.format('YYYY-MM-DD');
                const currentSlots = dateSlots.get(dateKey) || 0;
                // If we haven't reached the maximum slots for this date
                if (currentSlots < 3) { // Limit 3 steps per day
                    dateSlots.set(dateKey, currentSlots + 1);
                    return {
                        ...step,
                        assignedDate: dateKey,
                        status: 'pending'
                    };
                }
                nextDate = nextDate.add(1, 'day');
            }
            // If no slots are available before due date, mark as overdue
            return {
                ...step,
                status: 'overdue'
            };
        }
        // If step is in the future, keep its current date
        return {
            ...step,
            status: 'pending'
        };
    });
}
/**
 * Validates and formats a date string
 * @param date Date string to validate
 * @returns Formatted date string or null if invalid
 */
function validateAndFormatDate(date) {
    const parsedDate = (0, dayjs_1.default)(date);
    if (!parsedDate.isValid()) {
        return null;
    }
    return parsedDate.format('YYYY-MM-DD');
}
/**
 * Calculates the number of days between two dates
 * @param startDate Start date
 * @param endDate End date
 * @returns Number of days between dates
 */
function calculateDaysBetween(startDate, endDate) {
    return (0, dayjs_1.default)(endDate).diff((0, dayjs_1.default)(startDate), 'day');
}
/**
 * Distributes steps evenly across available dates
 * @param steps Array of steps to distribute
 * @param startDate Start date for distribution
 * @param dueDate Due date for the assignment
 * @returns Array of steps with assigned dates
 */
function distributeStepsEvenly(steps, startDate, dueDate) {
    const daysAvailable = calculateDaysBetween(startDate, dueDate);
    if (daysAvailable <= 0) {
        return steps.map(step => ({
            ...step,
            assignedDate: startDate,
            status: 'pending'
        }));
    }
    const stepsPerDay = Math.ceil(steps.length / daysAvailable);
    let currentDate = (0, dayjs_1.default)(startDate);
    let stepIndex = 0;
    return steps.map(step => {
        if (stepIndex >= stepsPerDay) {
            currentDate = currentDate.add(1, 'day');
            stepIndex = 0;
        }
        stepIndex++;
        return {
            ...step,
            assignedDate: currentDate.format('YYYY-MM-DD'),
            status: 'pending'
        };
    });
}
