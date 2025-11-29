import {
  FilePlus,
  FileEdit,
  Eye,
  Trash2,
  ArrowRightLeft,
  Wrench,
  Undo,
  type LucideIcon
} from 'lucide-react';

export interface ToolLabelInfo {
  label: string;
  icon: LucideIcon;
}

/**
 * Extract filename from a file path
 * Examples:
 * - "/components/Counter.jsx" → "Counter.jsx"
 * - "/App.jsx" → "App.jsx"
 * - "/" → "root"
 */
function getFilename(path: string): string {
  if (!path || path === '/') return 'root';
  const parts = path.split('/');
  return parts[parts.length - 1] || 'root';
}

/**
 * Truncate filename if it exceeds max length
 */
function truncateFilename(filename: string, maxLength: number = 40): string {
  if (filename.length <= maxLength) return filename;

  // Try to preserve the file extension
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex > 0 && lastDotIndex > maxLength - 10) {
    const extension = filename.substring(lastDotIndex);
    const nameWithoutExt = filename.substring(0, lastDotIndex);
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);
    return `${truncatedName}...${extension}`;
  }

  return `${filename.substring(0, maxLength - 3)}...`;
}

/**
 * Format label for str_replace_editor tool
 */
function formatStrReplaceLabel(input: any): ToolLabelInfo {
  const command = input?.command;
  const path = input?.path;

  if (!command) {
    return { label: 'File operation', icon: Wrench };
  }

  const filename = path ? truncateFilename(getFilename(path)) : '';

  switch (command) {
    case 'view':
      return {
        label: filename ? `Viewing ${filename}` : 'Viewing file',
        icon: Eye,
      };

    case 'create':
      return {
        label: filename ? `Creating ${filename}` : 'Creating file',
        icon: FilePlus,
      };

    case 'str_replace':
    case 'insert':
      return {
        label: filename ? `Editing ${filename}` : 'Editing file',
        icon: FileEdit,
      };

    case 'undo_edit':
      return {
        label: 'Undoing changes',
        icon: Undo,
      };

    default:
      return {
        label: filename ? `Processing ${filename}` : 'File operation',
        icon: Wrench,
      };
  }
}

/**
 * Format label for file_manager tool
 */
function formatFileManagerLabel(input: any): ToolLabelInfo {
  const command = input?.command;
  const path = input?.path;
  const newPath = input?.new_path;

  if (!command) {
    return { label: 'File operation', icon: Wrench };
  }

  switch (command) {
    case 'delete':
      const deleteFilename = path ? truncateFilename(getFilename(path)) : '';
      return {
        label: deleteFilename ? `Deleting ${deleteFilename}` : 'Deleting file',
        icon: Trash2,
      };

    case 'rename':
      const oldFilename = path ? truncateFilename(getFilename(path)) : '';
      const newFilename = newPath ? truncateFilename(getFilename(newPath)) : '';

      if (oldFilename && newFilename) {
        return {
          label: `Renaming ${oldFilename} → ${newFilename}`,
          icon: ArrowRightLeft,
        };
      } else if (oldFilename) {
        return {
          label: `Renaming ${oldFilename}`,
          icon: ArrowRightLeft,
        };
      } else {
        return {
          label: 'Renaming file',
          icon: ArrowRightLeft,
        };
      }

    default:
      return {
        label: 'File operation',
        icon: Wrench,
      };
  }
}

/**
 * Get user-friendly label and icon for a tool call
 *
 * @param part - ToolUIPart from AI SDK containing tool call information
 * @returns ToolLabelInfo with human-readable label and corresponding icon
 */
export function getToolLabel(part: any): ToolLabelInfo {
  // Extract tool type from the part.type field
  // Example: "tool-str_replace_editor" → "str_replace_editor"
  const toolType = part.type?.replace('tool-', '') || 'unknown';

  // Get the input object containing tool arguments
  const input = part.input || {};

  // Route to appropriate formatter based on tool type
  switch (toolType) {
    case 'str_replace_editor':
      return formatStrReplaceLabel(input);

    case 'file_manager':
      return formatFileManagerLabel(input);

    default:
      // Fallback for unknown tools
      return {
        label: toolType,
        icon: Wrench,
      };
  }
}
