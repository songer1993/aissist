import { confirm, input } from '@inquirer/prompts';
import { isTTY } from './tty.js';

/**
 * Prompt user to provide an optional description for the aissist instance
 *
 * @returns The description string, or empty string if skipped
 * @throws Error if user cancels with Ctrl+C (handled by caller)
 */
export async function promptForDescription(): Promise<string> {
  // Skip prompt if not in TTY environment
  if (!isTTY()) {
    return '';
  }

  try {
    const description = await input({
      message: 'What is this aissist instance for? (optional, press Enter to skip)',
    });

    return description.trim();
  } catch (err) {
    // User cancelled with Ctrl+C - let the caller handle it
    throw err;
  }
}

/**
 * Prompt user to create their first goal after initialization
 *
 * @returns true if user accepts, false if declined
 * @throws Error if user cancels with Ctrl+C (handled by caller)
 */
export async function promptForFirstGoal(): Promise<boolean> {
  // Skip prompt if not in TTY environment
  if (!isTTY()) {
    return false;
  }

  try {
    const shouldCreateGoal = await confirm({
      message: 'Would you like to set your first goal?',
      default: true,
    });

    return shouldCreateGoal;
  } catch (err) {
    // User cancelled with Ctrl+C - let the caller handle it
    throw err;
  }
}

/**
 * Prompt user to create a todo and link it to a goal after goal creation
 *
 * @param _goalCodename - The codename of the goal to link to (used for context, not in function body)
 * @returns true if user accepts, false if declined
 * @throws Error if user cancels with Ctrl+C (handled by caller)
 */
export async function promptForFirstTodo(_goalCodename: string): Promise<boolean> {
  // Skip prompt if not in TTY environment
  if (!isTTY()) {
    return false;
  }

  try {
    const shouldCreateTodo = await confirm({
      message: 'Would you like to add a todo and link it to this goal?',
      default: true,
    });

    return shouldCreateTodo;
  } catch (err) {
    // User cancelled with Ctrl+C - let the caller handle it
    throw err;
  }
}
