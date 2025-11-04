import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { linkToGoal, type GoalLinkingOptions, type GoalLinkingResult } from './goal-matcher.js';
import * as storage from './storage.js';
import type { ActiveGoal } from './storage.js';

// Mock the storage module
vi.mock('./storage.js', async () => {
  const actual = await vi.importActual('./storage.js');
  return {
    ...actual,
    getActiveGoals: vi.fn(),
  };
});

// Mock @inquirer/prompts
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
}));

import { select } from '@inquirer/prompts';

describe('goal-matcher', () => {
  const mockStoragePath = '/mock/storage';

  const mockGoals: ActiveGoal[] = [
    { codename: 'fitness-journey', text: 'Complete 30-day fitness challenge', date: '2025-11-01' },
    { codename: 'project-alpha', text: 'Launch project alpha by Q1', date: '2025-11-02' },
    { codename: 'learn-typescript', text: 'Master TypeScript fundamentals', date: '2025-11-03' },
    { codename: 'fitness-streak', text: 'Maintain 100-day workout streak', date: '2025-11-04' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('linkToGoal', () => {
    describe('when goalKeyword is undefined', () => {
      it('should return null with no linking message', async () => {
        vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);

        const result = await linkToGoal({
          storagePath: mockStoragePath,
        });

        expect(result.codename).toBeNull();
        expect(result.message).toBe('No goal linking requested');
        expect(storage.getActiveGoals).not.toHaveBeenCalled();
      });
    });

    describe('when no active goals exist', () => {
      it('should return null with no goals found message', async () => {
        vi.mocked(storage.getActiveGoals).mockResolvedValue([]);

        const result = await linkToGoal({
          goalKeyword: 'fitness',
          storagePath: mockStoragePath,
        });

        expect(result.codename).toBeNull();
        expect(result.message).toBe('No active goals found');
        expect(storage.getActiveGoals).toHaveBeenCalledWith(mockStoragePath);
      });
    });

    describe('when goalKeyword is boolean true', () => {
      it('should show interactive prompt with all goals', async () => {
        vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);
        vi.mocked(select).mockResolvedValue('project-alpha');

        const result = await linkToGoal({
          goalKeyword: true,
          storagePath: mockStoragePath,
        });

        expect(result.codename).toBe('project-alpha');
        expect(result.message).toBe('Selected goal: project-alpha');
        expect(select).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Link to which goal?',
          })
        );
      });

      it('should handle user selecting "None"', async () => {
        vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);
        vi.mocked(select).mockResolvedValue(null);

        const result = await linkToGoal({
          goalKeyword: true,
          storagePath: mockStoragePath,
        });

        expect(result.codename).toBeNull();
        expect(result.message).toBe('No goal selected');
      });

      it('should handle user cancelling prompt', async () => {
        vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);
        const cancelError = new Error('User cancelled');
        cancelError.name = 'ExitPromptError';
        vi.mocked(select).mockRejectedValue(cancelError);

        const result = await linkToGoal({
          goalKeyword: true,
          storagePath: mockStoragePath,
        });

        expect(result.codename).toBeNull();
        expect(result.message).toBe('Goal selection cancelled');
      });
    });

    describe('when goalKeyword is a string', () => {
      describe('single match scenarios', () => {
        it('should return immediate match for unique keyword', async () => {
          vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);

          const result = await linkToGoal({
            goalKeyword: 'alpha',
            storagePath: mockStoragePath,
          });

          expect(result.codename).toBe('project-alpha');
          expect(result.message).toBe('Matched goal: project-alpha');
          expect(select).not.toHaveBeenCalled();
        });

        it('should match case-insensitively on text', async () => {
          vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);

          const result = await linkToGoal({
            goalKeyword: 'TYPESCRIPT',
            storagePath: mockStoragePath,
          });

          expect(result.codename).toBe('learn-typescript');
          expect(result.message).toBe('Matched goal: learn-typescript');
        });

        it('should match on codename', async () => {
          vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);

          const result = await linkToGoal({
            goalKeyword: 'learn-typescript',
            storagePath: mockStoragePath,
          });

          expect(result.codename).toBe('learn-typescript');
          expect(result.message).toBe('Matched goal: learn-typescript');
        });

        it('should match partial strings', async () => {
          vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);

          const result = await linkToGoal({
            goalKeyword: 'Master',
            storagePath: mockStoragePath,
          });

          expect(result.codename).toBe('learn-typescript');
          expect(result.message).toBe('Matched goal: learn-typescript');
        });
      });

      describe('multiple match scenarios', () => {
        it('should show filtered prompt when multiple goals match', async () => {
          vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);
          vi.mocked(select).mockResolvedValue('fitness-streak');

          const result = await linkToGoal({
            goalKeyword: 'fitness',
            storagePath: mockStoragePath,
          });

          expect(result.codename).toBe('fitness-streak');
          expect(select).toHaveBeenCalledWith(
            expect.objectContaining({
              message: 'Multiple goals match "fitness". Select one:',
              choices: expect.arrayContaining([
                expect.objectContaining({ value: null }), // None option
                expect.objectContaining({ value: 'fitness-journey' }),
                expect.objectContaining({ value: 'fitness-streak' }),
              ]),
            })
          );
        });

        it('should include "None" option in filtered prompt', async () => {
          vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);
          vi.mocked(select).mockResolvedValue(null);

          const result = await linkToGoal({
            goalKeyword: 'fitness',
            storagePath: mockStoragePath,
          });

          expect(result.codename).toBeNull();
          expect(result.message).toBe('No goal selected');
        });
      });

      describe('no match scenarios', () => {
        it('should show full prompt with message when no matches found', async () => {
          vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);
          vi.mocked(select).mockResolvedValue('project-alpha');

          const result = await linkToGoal({
            goalKeyword: 'nonexistent',
            storagePath: mockStoragePath,
          });

          expect(result.codename).toBe('project-alpha');
          expect(select).toHaveBeenCalledWith(
            expect.objectContaining({
              message: 'No goals match "nonexistent". Select from all goals or skip:',
            })
          );
        });

        it('should allow skipping when no matches found', async () => {
          vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);
          vi.mocked(select).mockResolvedValue(null);

          const result = await linkToGoal({
            goalKeyword: 'xyz',
            storagePath: mockStoragePath,
          });

          expect(result.codename).toBeNull();
          expect(result.message).toBe('No goal selected');
        });
      });

      describe('choice formatting', () => {
        it('should truncate long goal text in choice names', async () => {
          const longGoal: ActiveGoal = {
            codename: 'long-goal',
            text: 'This is a very long goal text that exceeds sixty characters and should be truncated',
            date: '2025-11-05',
          };

          vi.mocked(storage.getActiveGoals).mockResolvedValue([longGoal]);
          vi.mocked(select).mockResolvedValue('long-goal');

          await linkToGoal({
            goalKeyword: true,
            storagePath: mockStoragePath,
          });

          expect(select).toHaveBeenCalledWith(
            expect.objectContaining({
              choices: expect.arrayContaining([
                expect.objectContaining({
                  name: expect.stringContaining('...'),
                  description: longGoal.text,
                }),
              ]),
            })
          );
        });

        it('should not truncate short goal text', async () => {
          const shortGoal: ActiveGoal = {
            codename: 'short-goal',
            text: 'Short goal',
            date: '2025-11-05',
          };

          vi.mocked(storage.getActiveGoals).mockResolvedValue([shortGoal]);
          vi.mocked(select).mockResolvedValue('short-goal');

          await linkToGoal({
            goalKeyword: true,
            storagePath: mockStoragePath,
          });

          expect(select).toHaveBeenCalledWith(
            expect.objectContaining({
              choices: expect.arrayContaining([
                expect.objectContaining({
                  name: 'short-goal | Short goal',
                }),
              ]),
            })
          );
        });
      });
    });

    describe('error handling', () => {
      it('should propagate non-cancel errors', async () => {
        vi.mocked(storage.getActiveGoals).mockResolvedValue(mockGoals);
        const unexpectedError = new Error('Unexpected error');
        vi.mocked(select).mockRejectedValue(unexpectedError);

        await expect(
          linkToGoal({
            goalKeyword: true,
            storagePath: mockStoragePath,
          })
        ).rejects.toThrow('Unexpected error');
      });
    });
  });
});
