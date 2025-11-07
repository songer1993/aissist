import { Command } from 'commander';
import { join } from 'path';
import { input, select, checkbox } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { getStoragePath, appendToMarkdown } from '../utils/storage.js';
import { getCurrentDate, getCurrentTime } from '../utils/date.js';
import { parseTimeframe } from '../utils/timeframe-parser.js';
import { loadProposalData, hasData, getDataSummary } from '../utils/data-aggregator.js';
import { buildProposalPrompt } from '../prompts/proposal-prompt.js';
import { checkClaudeCodeSession, executeClaudeCodeWithTools } from '../llm/claude.js';
import { success, error, info, warn } from '../utils/cli.js';
import { linkToGoal } from '../utils/goal-matcher.js';
import { renderMarkdown } from '../utils/markdown.js';

const proposeCommand = new Command('propose');

proposeCommand
  .description('Generate AI-powered action proposals based on your goals and history')
  .argument('[timeframe]', 'Timeframe for proposals (e.g., "today", "this week", "next quarter", "2026 Q1")', 'today')
  .option('--reflect', 'Prompt for a quick reflection before generating proposals')
  .option('--debug', 'Display debug information (prompt, data summary)')
  .option('--context', 'Include context files in the analysis')
  .option('--tag <tag>', 'Filter by specific tag (e.g., "work", "fitness")')
  .option('-g, --goal [keyword]', 'Link proposals to a goal (optional keyword for matching)')
  .option('--raw', 'Output raw Markdown (for piping or AI consumption)')
  .action(async (timeframe: string, options) => {
    try {
      const storagePath = await getStoragePath();

      // Parse timeframe
      let parsedTimeframe;
      try {
        parsedTimeframe = parseTimeframe(timeframe);
      } catch (err) {
        error((err as Error).message);
        return;
      }

      // Handle --reflect flag
      if (options.reflect) {
        info('Quick reflection before generating proposals...\n');

        const reflection = await input({
          message: 'What\'s on your mind? (brief reflection)',
        });

        if (reflection.trim()) {
          const date = getCurrentDate();
          const time = getCurrentTime();
          const filePath = join(storagePath, 'reflections', `${date}.md`);
          const entry = `## Quick Reflection at ${time}\n\n${reflection}`;
          await appendToMarkdown(filePath, entry);
          success('Reflection saved!\n');
        }
      }

      // Check Claude Code availability
      const sessionStatus = await checkClaudeCodeSession();
      if (!sessionStatus.available || !sessionStatus.authenticated) {
        error(sessionStatus.error || 'Claude Code not available');
        console.log(chalk.dim('\nThe propose command requires Claude Code to be installed and authenticated.'));
        console.log(chalk.dim('Install from: https://claude.ai/download'));
        console.log(chalk.dim('Then run: claude login'));
        return;
      }

      // Load data
      const spinner = ora('Loading your data...').start();
      const data = await loadProposalData(storagePath, {
        lookbackDays: 30,
        includeContext: options.context,
        tag: options.tag,
      });

      spinner.stop();

      // Check if we have any data
      if (!hasData(data)) {
        warn('No data found to generate proposals from.');
        console.log(chalk.dim('\nTry adding some goals, history, or reflections first:'));
        console.log(chalk.dim('  aissist goal add "Your goal"'));
        console.log(chalk.dim('  aissist history add "What you did today"'));
        console.log(chalk.dim('  aissist reflect'));
        return;
      }

      // Debug mode: show data summary
      if (options.debug) {
        console.log(chalk.cyan('\n=== Debug Information ==='));
        console.log(chalk.dim(`Timeframe: ${parsedTimeframe.label}`));
        console.log(chalk.dim(`Data: ${getDataSummary(data)}`));
        if (options.tag) {
          console.log(chalk.dim(`Tag filter: #${options.tag}`));
        }
        console.log();
      }

      // Build prompt
      const prompt = buildProposalPrompt({
        timeframe: parsedTimeframe,
        data,
        storagePath,
        tag: options.tag,
      });

      // Debug mode: show raw prompt
      if (options.debug) {
        console.log(chalk.cyan('=== Prompt for Claude ==='));
        console.log(chalk.dim(prompt));
        console.log(chalk.cyan('========================\n'));
      }

      // Handle goal linking if --goal flag is present
      const goalLinkResult = await linkToGoal({
        goalKeyword: options.goal,
        storagePath,
      });

      if (goalLinkResult.codename) {
        info(`Proposals will be linked to goal: ${goalLinkResult.codename}`);
      } else if (options.goal && goalLinkResult.message !== 'No goal linking requested') {
        info(goalLinkResult.message);
      }

      // Generate proposals with Claude Code
      spinner.start(`Claude is analyzing your data for ${parsedTimeframe.label}...`);

      try {
        const response = await executeClaudeCodeWithTools(prompt, storagePath, ['Grep', 'Read', 'Glob']);
        spinner.succeed('Proposals generated!');

        // Display the response (rendered or raw based on --raw flag)
        const output = renderMarkdown(response, options.raw);
        console.log('\n' + output);
        console.log(chalk.dim('\n\nPowered by Claude Code'));

        // Offer post-proposal actions
        console.log();
        const action = await select({
          message: 'What would you like to do with these proposals?',
          choices: [
            { name: 'Create TODOs (recommended)', value: 'todo' },
            { name: 'Save as goals', value: 'goal' },
            { name: 'Save as Markdown', value: 'markdown' },
            { name: 'Skip', value: 'skip' },
          ],
          default: 'todo',
        });

        if (action === 'todo') {
          await saveProposalsAsTodos(response, storagePath, goalLinkResult.codename);
        } else if (action === 'goal') {
          await saveProposalsAsGoals(response, storagePath, goalLinkResult.codename);
        } else if (action === 'markdown') {
          await saveProposalAsMarkdown(response, storagePath, parsedTimeframe.label, options.tag, goalLinkResult.codename);
        } else {
          info('Proposals not saved');
        }

      } catch (claudeError) {
        spinner.fail('Failed to generate proposals');
        error((claudeError as Error).message);
        return;
      }

    } catch (err) {
      if ((err as Error).name === 'ExitPromptError') {
        info('\nCancelled.');
        return;
      }
      error(`Failed to generate proposals: ${(err as Error).message}`);
      throw err;
    }
  });

/**
 * Extract numbered proposal items from response text
 */
function parseProposalItems(response: string): string[] {
  const lines = response.split('\n');
  const proposals: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*\d+\.\s+(.+)/);
    if (match) {
      proposals.push(match[1].trim());
    }
  }

  return proposals;
}

/**
 * Parse and save proposal items as todos
 */
async function saveProposalsAsTodos(response: string, storagePath: string, linkedGoalCodename: string | null = null): Promise<void> {
  try {
    // Extract numbered items from the response
    const proposals = parseProposalItems(response);

    if (proposals.length === 0) {
      warn('No numbered proposals found to save');
      return;
    }

    // Show interactive selection with all items checked by default
    const choices = proposals.map((text, index) => ({
      name: text,
      value: index,
      checked: true,
    }));

    const selectedIndices = await checkbox({
      message: 'Select proposals to create as todos (Space to toggle, Enter to confirm):',
      choices,
    });

    if (selectedIndices.length === 0) {
      info('No items selected');
      return;
    }

    // Save selected proposals as todos
    const spinner = ora('Saving proposals as todos...').start();
    const date = getCurrentDate();
    const time = getCurrentTime();
    const filePath = join(storagePath, 'todos', `${date}.md`);
    const goalSuffix = linkedGoalCodename ? ` (Goal: ${linkedGoalCodename})` : '';

    for (const index of selectedIndices) {
      const proposal = proposals[index];
      const entry = `## ${time}\n\n- [ ] ${proposal}${goalSuffix}`;
      await appendToMarkdown(filePath, entry);
    }

    spinner.succeed(`Saved ${selectedIndices.length} proposal(s) as todos!`);
  } catch (err) {
    if ((err as Error).name === 'ExitPromptError') {
      info('Selection cancelled');
      return;
    }
    error(`Failed to save proposals as todos: ${(err as Error).message}`);
  }
}

/**
 * Parse and save proposal items as goals
 */
async function saveProposalsAsGoals(response: string, storagePath: string, linkedGoalCodename: string | null = null): Promise<void> {
  try {
    // Extract numbered items from the response
    const proposals = parseProposalItems(response);

    if (proposals.length === 0) {
      warn('No numbered proposals found to save');
      return;
    }

    // Show interactive selection with all items checked by default
    const choices = proposals.map((text, index) => ({
      name: text,
      value: index,
      checked: true,
    }));

    const selectedIndices = await checkbox({
      message: 'Select proposals to save as goals (Space to toggle, Enter to confirm):',
      choices,
    });

    if (selectedIndices.length === 0) {
      info('No items selected');
      return;
    }

    // Save selected proposals as goals
    const spinner = ora('Saving proposals as goals...').start();
    const date = getCurrentDate();
    const time = getCurrentTime();
    const filePath = join(storagePath, 'goals', `${date}.md`);

    // Build goals text from selected items
    const selectedProposals = selectedIndices.map(i => proposals[i]);
    const goalsText = selectedProposals.map((p, i) => `${i + 1}. ${p}`).join('\n');
    let entry = `## Proposed Goals (${time})\n\n${goalsText}`;

    // Add goal metadata if a goal was linked
    if (linkedGoalCodename) {
      entry += `\n\nGoal: ${linkedGoalCodename}`;
    }

    await appendToMarkdown(filePath, entry);

    spinner.succeed(`Saved ${selectedIndices.length} proposal(s) as goals!`);
  } catch (err) {
    if ((err as Error).name === 'ExitPromptError') {
      info('Selection cancelled');
      return;
    }
    error(`Failed to save proposals as goals: ${(err as Error).message}`);
  }
}

/**
 * Save full proposal as Markdown file
 */
async function saveProposalAsMarkdown(
  response: string,
  storagePath: string,
  timeframe: string,
  tag: string | undefined,
  linkedGoalCodename: string | null
): Promise<void> {
  try {
    const spinner = ora('Saving proposal as Markdown...').start();
    const date = getCurrentDate();
    const time = getCurrentTime();
    const filePath = join(storagePath, 'proposals', `${date}.md`);

    // Build metadata header
    let metadata = `**Timeframe:** ${timeframe}`;
    if (tag) {
      metadata += `\n**Tag:** #${tag}`;
    }
    if (linkedGoalCodename) {
      metadata += `\n**Goal:** ${linkedGoalCodename}`;
    }

    // Format entry with horizontal rule separator if appending
    const entry = `## Proposal at ${time}\n\n${metadata}\n\n${response}\n\n---`;

    await appendToMarkdown(filePath, entry);

    spinner.succeed(`Proposal saved to proposals/${date}.md`);
  } catch (err) {
    if ((err as Error).name === 'ExitPromptError') {
      info('Cancelled');
      return;
    }
    error(`Failed to save proposal as Markdown: ${(err as Error).message}`);
  }
}

export { proposeCommand };
