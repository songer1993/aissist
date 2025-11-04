import { Command } from 'commander';
import { join } from 'path';
import { getStoragePath, appendToMarkdown, readMarkdown } from '../utils/storage.js';
import { getCurrentDate, getCurrentTime, parseDate } from '../utils/date.js';
import { success, error, info } from '../utils/cli.js';
import { linkToGoal } from '../utils/goal-matcher.js';

const historyCommand = new Command('history');

historyCommand
  .command('log')
  .description('Log a history entry (use --goal to link to a goal)')
  .argument('<text>', 'History entry text')
  .option('-g, --goal [keyword]', 'Link this history entry to a goal (optional keyword for matching)')
  .action(async (text: string, options: { goal?: string | boolean }) => {
    try {
      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const time = getCurrentTime();
      const filePath = join(storagePath, 'history', `${date}.md`);

      let entry = `## ${time}\n\n${text}`;

      // Handle goal linking if --goal flag is present
      const goalLinkResult = await linkToGoal({
        goalKeyword: options.goal,
        storagePath,
      });

      if (goalLinkResult.codename) {
        entry += `\n\nGoal: ${goalLinkResult.codename}`;
      }

      await appendToMarkdown(filePath, entry);

      if (goalLinkResult.codename) {
        success(`History logged and linked to goal: ${goalLinkResult.codename}`);
      } else {
        if (options.goal && goalLinkResult.message !== 'No goal linking requested') {
          info(goalLinkResult.message);
        }
        success(`History logged: "${text}"`);
      }
    } catch (err) {
      error(`Failed to log history: ${(err as Error).message}`);
      throw err;
    }
  });

historyCommand
  .command('show')
  .description('Show history entries')
  .option('-d, --date <date>', 'Show history for specific date (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      const storagePath = await getStoragePath();
      const date = options.date || getCurrentDate();

      if (options.date && !parseDate(options.date)) {
        error(`Invalid date format: ${options.date}. Use YYYY-MM-DD format.`);
        return;
      }

      const filePath = join(storagePath, 'history', `${date}.md`);
      const content = await readMarkdown(filePath);

      if (!content) {
        info(`No history found for ${date}`);
        return;
      }

      console.log(`\nHistory for ${date}:\n`);
      console.log(content);
    } catch (err) {
      error(`Failed to show history: ${(err as Error).message}`);
      throw err;
    }
  });

export { historyCommand };
