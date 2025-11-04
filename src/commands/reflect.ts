import { Command } from 'commander';
import { join } from 'path';
import { input } from '@inquirer/prompts';
import { getStoragePath, appendToMarkdown, readMarkdown } from '../utils/storage.js';
import { getCurrentDate, getCurrentTime, parseDate } from '../utils/date.js';
import { success, error, info } from '../utils/cli.js';
import { linkToGoal } from '../utils/goal-matcher.js';

const reflectCommand = new Command('reflect');

const REFLECTION_QUESTIONS = [
  'What went well today?',
  'What could have gone better?',
  'What did you learn?',
  'What are you grateful for?',
  'What will you focus on tomorrow?',
];

reflectCommand
  .description('Start a reflection session')
  .option('-g, --goal [keyword]', 'Link this reflection to a goal (optional keyword for matching)')
  .action(async (options: { goal?: string | boolean }) => {
    try {
      const storagePath = await getStoragePath();
      const date = getCurrentDate();
      const time = getCurrentTime();
      const filePath = join(storagePath, 'reflections', `${date}.md`);

      // Handle goal linking if --goal flag is present
      const goalLinkResult = await linkToGoal({
        goalKeyword: options.goal,
        storagePath,
      });

      if (goalLinkResult.codename) {
        info(`Reflection will be linked to goal: ${goalLinkResult.codename}\n`);
      } else if (options.goal && goalLinkResult.message !== 'No goal linking requested') {
        info(goalLinkResult.message + '\n');
      }

      info('Starting reflection session...\n');

      const responses: string[] = [];

      for (const question of REFLECTION_QUESTIONS) {
        const answer = await input({
          message: question,
        });

        if (answer.trim()) {
          responses.push(`### ${question}\n\n${answer}`);
        }
      }

      if (responses.length === 0) {
        info('No reflections recorded.');
        return;
      }

      let entry = `## Reflection at ${time}\n\n${responses.join('\n\n')}`;

      // Add goal metadata if a goal was linked
      if (goalLinkResult.codename) {
        entry += `\n\nGoal: ${goalLinkResult.codename}`;
      }

      await appendToMarkdown(filePath, entry);

      if (goalLinkResult.codename) {
        success(`Reflection saved and linked to goal: ${goalLinkResult.codename}!`);
      } else {
        success('Reflection saved!');
      }
    } catch (err) {
      if ((err as Error).name === 'ExitPromptError') {
        info('\nReflection cancelled.');
        return;
      }
      error(`Failed to save reflection: ${(err as Error).message}`);
      throw err;
    }
  });

reflectCommand
  .command('show')
  .description('Show past reflections')
  .option('-d, --date <date>', 'Show reflections for specific date (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      const storagePath = await getStoragePath();
      const date = options.date || getCurrentDate();

      if (options.date && !parseDate(options.date)) {
        error(`Invalid date format: ${options.date}. Use YYYY-MM-DD format.`);
        return;
      }

      const filePath = join(storagePath, 'reflections', `${date}.md`);
      const content = await readMarkdown(filePath);

      if (!content) {
        info(`No reflections found for ${date}`);
        return;
      }

      console.log(`\nReflections for ${date}:\n`);
      console.log(content);
    } catch (err) {
      error(`Failed to show reflections: ${(err as Error).message}`);
      throw err;
    }
  });

export { reflectCommand };
