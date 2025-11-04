import { select } from '@inquirer/prompts';
import { getActiveGoals, type ActiveGoal } from './storage.js';

export interface GoalLinkingOptions {
  goalKeyword?: string | boolean;  // Value from --goal flag
  storagePath: string;             // Storage path for loading goals
}

export interface GoalLinkingResult {
  codename: string | null;         // Selected goal codename or null
  message: string;                 // Status message for user feedback
}

/**
 * Link to a goal using keyword matching or interactive selection
 *
 * @param options - Goal linking options with optional keyword and storage path
 * @returns Result containing codename and status message
 */
export async function linkToGoal(options: GoalLinkingOptions): Promise<GoalLinkingResult> {
  const { goalKeyword, storagePath } = options;

  // If no goal flag provided, return early
  if (!goalKeyword) {
    return {
      codename: null,
      message: 'No goal linking requested',
    };
  }

  // Load active goals
  const activeGoals = await getActiveGoals(storagePath);

  // If no active goals exist, return early
  if (activeGoals.length === 0) {
    return {
      codename: null,
      message: 'No active goals found',
    };
  }

  // Boolean flag (--goal without value) → Show all goals interactively
  if (goalKeyword === true) {
    return await showInteractivePrompt(activeGoals, 'Link to which goal?');
  }

  // String keyword (--goal "keyword") → Perform keyword matching
  if (typeof goalKeyword === 'string') {
    const matches = performKeywordMatch(activeGoals, goalKeyword);

    // Exactly one match → Return immediately
    if (matches.length === 1) {
      return {
        codename: matches[0].codename,
        message: `Matched goal: ${matches[0].codename}`,
      };
    }

    // Multiple matches → Show filtered prompt
    if (matches.length > 1) {
      return await showInteractivePrompt(
        matches,
        `Multiple goals match "${goalKeyword}". Select one:`
      );
    }

    // No matches → Offer full list with message
    return await showInteractivePrompt(
      activeGoals,
      `No goals match "${goalKeyword}". Select from all goals or skip:`
    );
  }

  // Fallback: should not reach here
  return {
    codename: null,
    message: 'Invalid goal option',
  };
}

/**
 * Perform case-insensitive substring matching on goal text and codename
 *
 * @param goals - List of active goals to search
 * @param keyword - Keyword to match against
 * @returns Array of matching goals
 */
function performKeywordMatch(goals: ActiveGoal[], keyword: string): ActiveGoal[] {
  const lowerKeyword = keyword.toLowerCase();

  return goals.filter(goal => {
    const textMatch = goal.text.toLowerCase().includes(lowerKeyword);
    const codenameMatch = goal.codename.toLowerCase().includes(lowerKeyword);
    return textMatch || codenameMatch;
  });
}

/**
 * Show interactive prompt for goal selection
 *
 * @param goals - List of goals to display
 * @param message - Prompt message
 * @returns Result with selected codename or null
 */
async function showInteractivePrompt(
  goals: ActiveGoal[],
  message: string
): Promise<GoalLinkingResult> {
  try {
    // Create choices for goal selection
    const choices = [
      {
        name: 'None - Don\'t link to a goal',
        value: null,
      },
      ...goals.map(goal => {
        // Truncate long goal text for display
        const displayText = goal.text.length > 60
          ? goal.text.substring(0, 60) + '...'
          : goal.text;

        return {
          name: `${goal.codename} | ${displayText}`,
          value: goal.codename,
          description: goal.text,
        };
      }),
    ];

    // Prompt user to select a goal
    const selectedCodename = await select({
      message,
      choices,
    });

    if (selectedCodename) {
      return {
        codename: selectedCodename,
        message: `Selected goal: ${selectedCodename}`,
      };
    }

    return {
      codename: null,
      message: 'No goal selected',
    };
  } catch (error) {
    // User cancelled prompt (Ctrl+C)
    if ((error as Error).name === 'ExitPromptError') {
      return {
        codename: null,
        message: 'Goal selection cancelled',
      };
    }
    throw error;
  }
}
