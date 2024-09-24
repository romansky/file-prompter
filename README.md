<h1 align="center">
    <img width="100" height="100" src="file-prompter.svg" alt="CoPa Logo"><br>
    File Prompter
</h1>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

# File Prompter

File Prompter is a Visual Studio Code extension that helps you craft and curate reusable prompts that include files and folders from your project. It's designed to streamline the process of creating AI prompts that reference your project structure and file contents, making it easier to provide context-rich information to AI assistants.

## Features

- Create `.prompt` files with a special syntax for including file and folder contents
- Auto-complete suggestions for file and folder paths in your project
- Generate final prompts by expanding file and folder references
- Syntax highlighting for `.prompt` files
- Preview generated prompts without modifying the original file

## Installation

1. Open Visual Studio Code
2. Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
3. Search for "File Prompter"
4. Click "Install" to install the extension
5. Reload Visual Studio Code when prompted

## Usage

1. Create a new file with the `.prompt` extension in your project.
2. In the `.prompt` file, use the following syntax to include file or folder contents:
   ```
   {{@path/to/file/or/folder}}
   ```
3. Use the `@` symbol to trigger auto-complete suggestions for file and folder paths.
4. When you're ready to generate the final prompt, you have two options:
   - Right-click in the editor and select "Generate Prompt" from the context menu
   - Use the command palette (Ctrl+Shift+P or Cmd+Shift+P) and search for "File Prompter: Generate Prompt"
5. The generated prompt will open in a new editor tab, allowing you to review and copy the content.

## Output Format

The generated prompt will include file and folder contents in the following format:

```markdown
===== filename =====
File contents here

===== foldername/file1 =====
File1 contents here

===== foldername/file2 =====
File2 contents here
```

This format clearly separates different files and folders, making it easy to understand the structure of the included content.

## Commands

File Prompter provides the following command:

- **File Prompter: Generate Prompt**: Generates the final prompt by expanding file and folder references in the current `.prompt` file.

You can access this command through the command palette or by right-clicking in a `.prompt` file.

## Example

Here's an example of a `.prompt` file:

```
We are working on a UI feature for our web application. Here are the relevant types and interfaces:

{{@src/types.ts}}

These are the current React components we're working with:

{{@src/components}}

The task:

Implement a new `UserProfile` component that displays the user's name, email, and avatar. Use the `User` interface from the types file and integrate it with the existing `Avatar` component. Ensure the new component is responsive and follows our current styling conventions.

Please provide the implementation for the `UserProfile` component and any necessary updates to existing files.
```

When you generate the prompt, the placeholders will be replaced with the actual contents of the specified files or folders, creating a comprehensive prompt for an AI assistant.

## Development

If you want to contribute to File Prompter or run it locally for development:

1. Clone the repository:
   ```
   git clone https://github.com/romansky/file-prompter.git
   ```
2. Navigate to the project directory:
   ```
   cd file-prompter
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Open the project in Visual Studio Code:
   ```
   code .
   ```
5. Press F5 to start debugging and run the extension in a new Extension Development Host window.

## Requirements

This extension requires Visual Studio Code version 1.93.0 or higher.

