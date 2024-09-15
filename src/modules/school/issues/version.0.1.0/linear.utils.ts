import { Types } from 'mongoose';
import type { LinearIssue } from './linear.model';

const MAX_SEEN_BY_ENTRIES = 100; // Set a limit to prevent bloating

const addToIsSeenBy = (issue: LinearIssue, userId: string): LinearIssue => {
    if (!issue.isSeenBy) {
        issue.isSeenBy = [];
    }

    const id = new Types.ObjectId(userId);
    const seenBySet = new Set(issue.isSeenBy.map((objId) => objId.toString()));

    // Avoid duplicate entries
    if (!seenBySet.has(id.toString())) {
        issue.isSeenBy.push(id);
    }

    // Ensure the array does not exceed the maximum allowed entries
    if (issue.isSeenBy.length > MAX_SEEN_BY_ENTRIES) {
        issue.isSeenBy = issue.isSeenBy.slice(-MAX_SEEN_BY_ENTRIES);
    }

    return issue;
};

export default addToIsSeenBy;
