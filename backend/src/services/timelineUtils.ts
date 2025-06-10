import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export interface Step {
    title: string;
    description: string;
    tip: string;
    completed?: boolean;
    dueDate?: string;
    status?: 'pending' | 'completed' | 'overdue';
}

export interface AssignmentStep extends Step {
    assignedDate: string;
}

/**
 * Reassigns incomplete steps to the next available date
 * @param steps Array of steps with their assigned dates
 * @param dueDate The final due date for the assignment
 * @returns Updated array of steps with new assigned dates
 */
export function reassignIncompleteSteps(
    steps: AssignmentStep[],
    dueDate: string
): AssignmentStep[] {
    const today = dayjs();
    const finalDueDate = dayjs(dueDate);

    // Sort steps by their current assigned date
    const sortedSteps = [...steps].sort((a, b) =>
        dayjs(a.assignedDate).unix() - dayjs(b.assignedDate).unix()
    );

    // Create a map of dates to track available slots
    const dateSlots = new Map<string, number>();
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

        const stepDate = dayjs(step.assignedDate);

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
export function validateAndFormatDate(date: string): string | null {
    const parsedDate = dayjs(date);
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
export function calculateDaysBetween(startDate: string, endDate: string): number {
    return dayjs(endDate).diff(dayjs(startDate), 'day');
}

/**
 * Distributes steps evenly across available dates
 * @param steps Array of steps to distribute
 * @param startDate Start date for distribution
 * @param dueDate Due date for the assignment
 * @returns Array of steps with assigned dates
 */
export function distributeStepsEvenly(
    steps: Step[],
    startDate: string,
    dueDate: string
): AssignmentStep[] {
    const daysAvailable = calculateDaysBetween(startDate, dueDate);
    if (daysAvailable <= 0) {
        return steps.map(step => ({
            ...step,
            assignedDate: startDate,
            status: 'pending'
        }));
    }

    const stepsPerDay = Math.ceil(steps.length / daysAvailable);
    let currentDate = dayjs(startDate);
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
