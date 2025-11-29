import { test, expect, describe } from 'vitest';
import { getToolLabel, type ToolLabelInfo } from '../tool-label-formatter';
import {
  FilePlus,
  FileEdit,
  Eye,
  Trash2,
  ArrowRightLeft,
  Wrench,
  Undo,
} from 'lucide-react';

describe('getToolLabel', () => {
  describe('str_replace_editor tool', () => {
    test('formats view command correctly', () => {
      const part = {
        type: 'tool-str_replace_editor',
        input: { command: 'view', path: '/components/Counter.jsx' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Viewing Counter.jsx');
      expect(result.icon).toBe(Eye);
    });

    test('formats create command correctly', () => {
      const part = {
        type: 'tool-str_replace_editor',
        input: { command: 'create', path: '/App.jsx' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Creating App.jsx');
      expect(result.icon).toBe(FilePlus);
    });

    test('formats str_replace command correctly', () => {
      const part = {
        type: 'tool-str_replace_editor',
        input: { command: 'str_replace', path: '/components/Button.jsx' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Editing Button.jsx');
      expect(result.icon).toBe(FileEdit);
    });

    test('formats insert command correctly', () => {
      const part = {
        type: 'tool-str_replace_editor',
        input: { command: 'insert', path: '/utils/helpers.js' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Editing helpers.js');
      expect(result.icon).toBe(FileEdit);
    });

    test('formats undo_edit command correctly', () => {
      const part = {
        type: 'tool-str_replace_editor',
        input: { command: 'undo_edit', path: '/App.jsx' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Undoing changes');
      expect(result.icon).toBe(Undo);
    });
  });

  describe('file_manager tool', () => {
    test('formats delete command correctly', () => {
      const part = {
        type: 'tool-file_manager',
        input: { command: 'delete', path: '/old/OldComponent.jsx' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Deleting OldComponent.jsx');
      expect(result.icon).toBe(Trash2);
    });

    test('formats rename command correctly with arrow notation', () => {
      const part = {
        type: 'tool-file_manager',
        input: {
          command: 'rename',
          path: '/Old.jsx',
          new_path: '/New.jsx',
        },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Renaming Old.jsx → New.jsx');
      expect(result.icon).toBe(ArrowRightLeft);
    });
  });

  describe('path handling', () => {
    test('extracts filename from nested path', () => {
      const part = {
        type: 'tool-str_replace_editor',
        input: { command: 'create', path: '/components/ui/Button.jsx' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Creating Button.jsx');
    });

    test('handles root path correctly', () => {
      const part = {
        type: 'tool-str_replace_editor',
        input: { command: 'view', path: '/' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Viewing root');
    });

    test('truncates long filenames', () => {
      const longFilename = 'VeryLongComponentNameThatExceedsTheMaximumLengthAllowed.jsx';
      const part = {
        type: 'tool-str_replace_editor',
        input: { command: 'create', path: `/${longFilename}` },
      };

      const result = getToolLabel(part);

      expect(result.label).toContain('Creating');
      expect(result.label).toContain('...');
      expect(result.label).toContain('.jsx');
      expect(result.label.length).toBeLessThanOrEqual(50); // "Creating " + 40 chars
    });
  });

  describe('fallback handling', () => {
    test('handles missing input field', () => {
      const part = {
        type: 'tool-str_replace_editor',
        input: undefined,
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('File operation');
      expect(result.icon).toBe(Wrench);
    });

    test('handles missing command field', () => {
      const part = {
        type: 'tool-str_replace_editor',
        input: { path: '/App.jsx' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('File operation');
      expect(result.icon).toBe(Wrench);
    });

    test('handles missing path field for str_replace_editor', () => {
      const part = {
        type: 'tool-str_replace_editor',
        input: { command: 'create' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Creating file');
      expect(result.icon).toBe(FilePlus);
    });

    test('handles missing path field for file_manager delete', () => {
      const part = {
        type: 'tool-file_manager',
        input: { command: 'delete' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Deleting file');
      expect(result.icon).toBe(Trash2);
    });

    test('handles missing new_path for rename', () => {
      const part = {
        type: 'tool-file_manager',
        input: { command: 'rename', path: '/Old.jsx' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Renaming Old.jsx');
      expect(result.icon).toBe(ArrowRightLeft);
    });

    test('handles unknown tool type', () => {
      const part = {
        type: 'tool-unknown_tool',
        input: {},
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('unknown_tool');
      expect(result.icon).toBe(Wrench);
    });

    test('handles unknown command for str_replace_editor', () => {
      const part = {
        type: 'tool-str_replace_editor',
        input: { command: 'unknown_command', path: '/App.jsx' },
      };

      const result = getToolLabel(part);

      expect(result.label).toBe('Processing App.jsx');
      expect(result.icon).toBe(Wrench);
    });

    test('handles empty part object', () => {
      const part = {};

      const result = getToolLabel(part);

      expect(result.label).toBe('unknown');
      expect(result.icon).toBe(Wrench);
    });
  });

  describe('icon selection', () => {
    test('returns correct icons for each operation type', () => {
      const testCases: Array<{
        input: any;
        expectedIcon: any;
      }> = [
        {
          input: {
            type: 'tool-str_replace_editor',
            input: { command: 'view', path: '/test.js' },
          },
          expectedIcon: Eye,
        },
        {
          input: {
            type: 'tool-str_replace_editor',
            input: { command: 'create', path: '/test.js' },
          },
          expectedIcon: FilePlus,
        },
        {
          input: {
            type: 'tool-str_replace_editor',
            input: { command: 'str_replace', path: '/test.js' },
          },
          expectedIcon: FileEdit,
        },
        {
          input: {
            type: 'tool-file_manager',
            input: { command: 'delete', path: '/test.js' },
          },
          expectedIcon: Trash2,
        },
        {
          input: {
            type: 'tool-file_manager',
            input: { command: 'rename', path: '/old.js', new_path: '/new.js' },
          },
          expectedIcon: ArrowRightLeft,
        },
      ];

      testCases.forEach(({ input, expectedIcon }) => {
        const result = getToolLabel(input);
        expect(result.icon).toBe(expectedIcon);
      });
    });
  });
});
