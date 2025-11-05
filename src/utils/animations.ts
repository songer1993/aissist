import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { getStoragePath, loadConfig } from './storage.js';

/**
 * Options for completion animations
 */
export interface AnimationOptions {
  /** Duration of the animation in milliseconds (default: 1500ms) */
  duration?: number;
  /** Number of items completed (for batch operations) */
  count?: number;
}

/**
 * Play a subtle completion animation with success feedback
 *
 * This function displays a brief, terminal-friendly animation to celebrate
 * task completion. It uses ora for spinner effects and chalk for colors,
 * maintaining the Aissist brand aesthetic.
 *
 * @param message - The completion message to display
 * @param options - Optional animation configuration
 *
 * @example
 * await playCompletionAnimation('Task completed');
 * await playCompletionAnimation('3 todos completed', { count: 3 });
 */
export async function playCompletionAnimation(
  message: string,
  options: AnimationOptions = {}
): Promise<void> {
  const { duration = 1500, count } = options;

  // Check if animations are enabled in config
  try {
    const storagePath = await getStoragePath();
    const config = await loadConfig(storagePath);

    // If animations are disabled, show simple success message and return
    if (!config.animations?.enabled) {
      console.log(chalk.green('✓'), message);
      if (count && count > 1) {
        console.log(chalk.cyan(`  ${'✓ '.repeat(Math.min(count, 5))}${count > 5 ? '...' : ''}`));
      }
      return;
    }
  } catch (error) {
    // If we can't read config, default to showing animation
    // This ensures backwards compatibility and graceful degradation
  }

  try {
    // Create spinner with custom frames for completion effect
    const spinner: Ora = ora({
      text: message,
      color: 'cyan',
      spinner: {
        interval: 80,
        frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
      },
    }).start();

    // Animate for a brief period
    const animationDuration = Math.min(duration * 0.6, 900);
    await sleep(animationDuration);

    // Transition to success state with checkmark parade
    spinner.text = chalk.green(`${message}...`);
    await sleep(duration * 0.15);

    // Show sparkle effect
    spinner.text = chalk.green(`✓ ${message} `) + chalk.cyan('✨');
    await sleep(duration * 0.15);

    // Final success state
    spinner.succeed(chalk.green(message));

    // For batch operations, add a subtle celebration
    if (count && count > 1) {
      console.log(chalk.cyan(`  ${'✓ '.repeat(Math.min(count, 5))}${count > 5 ? '...' : ''}`));
    }
  } catch (error) {
    // Graceful degradation: if animation fails, just show success message
    console.log(chalk.green('✓'), message);

    // Log error for debugging but don't throw
    if (process.env.DEBUG) {
      console.error(chalk.gray(`[Animation Error: ${(error as Error).message}]`));
    }
  }
}

/**
 * Simple sleep utility for animation timing
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
