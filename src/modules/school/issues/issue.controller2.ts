import asyncHandler from "@/lib/handlers/asyncHandler";
import { Issues , Reply} from "./issue.model";
import { User } from "@/modules/auth/users/user.model";

export const getIssues = asyncHandler(async (req, res) => {
  const user = req.user as User;
const userId = user._id.toString();
  try {
    const issues = await Issues.find()
      .populate('replies') // Assuming you want to include replies in the fetched data
      .populate('seenBy') // Optionally, if you need detailed info about the users who have seen the issue
      .populate('author', 'name email') // Adjust according to your needs
      .exec();

    // Enhance issues with a 'isNew' property for the current user
    const enhancedIssues = issues.map((issue) => {
      // Convert each seenBy ObjectId to string for comparison
      const isSeenByUser = issue.seenBy.some(
        (seenUserId) => seenUserId.toString() === userId,
      );
      return {
        ...issue.toObject(),
        isNew: !isSeenByUser,
      };
    });

    res.json(enhancedIssues);
  } catch (error:any) {
    console.error('Error fetching issues:', error);
    res
      .status(500)
      .json({ message: 'Failed to fetch issues', error: error.toString() });
  }
});
