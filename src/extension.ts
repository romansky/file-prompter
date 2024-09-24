import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    console.log('File Prompter extension is now active!');

    // Register .prompt files as a new language
    vscode.languages.setLanguageConfiguration('prompt', {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    });

    // Register a content provider for the prompt scheme
    const promptScheme = 'prompt';
    const promptProvider = vscode.workspace.registerTextDocumentContentProvider(promptScheme, new PromptContentProvider());

    // Register the completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'prompt' },
        new PromptCompletionProvider(),
        '@' // Trigger character
    );

    // Register the generate prompt command
    const generatePromptCommand = vscode.commands.registerCommand('file-prompter.generatePrompt', generatePrompt);

    // Add to subscriptions
    context.subscriptions.push(promptProvider, completionProvider, generatePromptCommand);
}

class PromptContentProvider implements vscode.TextDocumentContentProvider {
    provideTextDocumentContent(uri: vscode.Uri): string {
        return ''; // Return empty content, as we'll be using regular file system for .prompt files
    }
}

class PromptCompletionProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        if (!linePrefix.endsWith('@')) {
            return undefined;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return undefined;
        }

        const items: vscode.CompletionItem[] = [];
        const rootPath = workspaceFolder.uri.fsPath;

        function addCompletionItems(dirPath: string, relativePath: string = '') {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const relPath = path.join(relativePath, entry.name);
                if (entry.isDirectory()) {
                    items.push(new vscode.CompletionItem(relPath + '/', vscode.CompletionItemKind.Folder));
                    addCompletionItems(fullPath, relPath);
                } else {
                    items.push(new vscode.CompletionItem(relPath, vscode.CompletionItemKind.File));
                }
            }
        }

        addCompletionItems(rootPath);
        return items;
    }
}

async function generatePrompt() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || path.extname(editor.document.fileName) !== '.prompt') {
        vscode.window.showErrorMessage('Please open a .prompt file to generate the prompt.');
        return;
    }

    const text = editor.document.getText();
    const generatedPrompt = await processPromptTemplate(text);

    const newFile = await vscode.workspace.openTextDocument({ content: generatedPrompt, language: 'markdown' });
    await vscode.window.showTextDocument(newFile, { preview: false });
}

async function processPromptTemplate(template: string): Promise<string> {
    const regex = /{{@(.*?)}}/g;
    let match;
    let result = template;

    while ((match = regex.exec(template)) !== null) {
        const placeholder = match[0];
        const filePath = match[1];
        const content = await readFileOrFolder(filePath);
        result = result.replace(placeholder, content);
    }

    return result;
}

async function findProjectRoot(startPath: string): Promise<string | null> {
    let currentPath = startPath;
    while (currentPath !== path.dirname(currentPath)) {
        const packageJsonPath = path.join(currentPath, 'package.json');
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(packageJsonPath));
            return currentPath;
        } catch {
            currentPath = path.dirname(currentPath);
        }
    }
    return null;
}

async function readFileOrFolder(filePath: string): Promise<string> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return 'Error: No workspace folder found';
    }

    const projectRoot = await findProjectRoot(workspaceFolder.uri.fsPath);
    if (!projectRoot) {
        return 'Error: Unable to find project root (package.json)';
    }

    const fullPath = path.join(projectRoot, filePath);
    const relativeToRoot = path.relative(projectRoot, fullPath);

    try {
        const stats = await vscode.workspace.fs.stat(vscode.Uri.file(fullPath));
        if (stats.type === vscode.FileType.Directory) {
            return await readDirectoryRecursively(fullPath, projectRoot, relativeToRoot);
        } else {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(fullPath));
            return formatFileContent(relativeToRoot, Buffer.from(content).toString('utf8'));
        }
    } catch (error) {
        return `Error reading ${filePath}: ${error}`;
    }
}

async function readDirectoryRecursively(dirPath: string, projectRoot: string, relativePath: string): Promise<string> {
    let result = '';
    const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));

    for (const [name, type] of entries) {
        const fullPath = path.join(dirPath, name);
        const relPath = path.join(relativePath, name);

        if (type === vscode.FileType.Directory) {
            result += `===== ${relPath}/ =====\n`;
            result += await readDirectoryRecursively(fullPath, projectRoot, relPath);
        } else {
            const content = await vscode.workspace.fs.readFile(vscode.Uri.file(fullPath));
            result += formatFileContent(relPath, Buffer.from(content).toString('utf8'));
        }
    }

    return result;
}

function formatFileContent(relativePath: string, content: string): string {
    return `===== ${relativePath} =====\n${content}\n\n`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
