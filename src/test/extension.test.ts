import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import * as myExtension from '../extension';

// Create a wrapper for vscode.workspace.fs
const fsWrapper = {
    readFile: vscode.workspace.fs.readFile.bind(vscode.workspace.fs),
    stat: vscode.workspace.fs.stat.bind(vscode.workspace.fs),
};

// Replace vscode.workspace.fs with our wrapper in the extension
(myExtension as any).vscodeFs = fsWrapper;

suite('File Prompter Extension Test Suite', () => {
    let context: vscode.ExtensionContext;

    suiteSetup(async () => {
        vscode.window.showInformationMessage('Start all tests.');
        context = {
            subscriptions: [],
        } as any;
        await myExtension.activate(context);
    });

    test('Activation should register the generatePrompt command', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('file-prompter.generatePrompt'));
    });

    test('Activation should register the completion provider', async () => {
        const registerCompletionProviderSpy = sinon.spy(vscode.languages, 'registerCompletionItemProvider');
        
        // Re-activate the extension to trigger the registration
        await myExtension.activate(context);

        assert.ok(registerCompletionProviderSpy.calledOnce);
        const selector = registerCompletionProviderSpy.firstCall.args[0] as { scheme: string; language: string };
        assert.strictEqual(selector.scheme, 'file');
        assert.strictEqual(selector.language, 'prompt');
        assert.strictEqual(registerCompletionProviderSpy.firstCall.args[2], '@');

        registerCompletionProviderSpy.restore();
    });

    test('generatePrompt command should be executable', async () => {
        // Mock the necessary VS Code API functions
        const showTextDocumentStub = sinon.stub(vscode.window, 'showTextDocument').resolves();
        const openTextDocumentStub = sinon.stub(vscode.workspace, 'openTextDocument').resolves({} as any);
        const activeEditorStub = sinon.stub(vscode.window, 'activeTextEditor').value({
            document: {
                fileName: 'test.prompt',
                getText: () => '{{@test.txt}}'
            }
        } as any);
        const workspaceFoldersStub = sinon.stub(vscode.workspace, 'workspaceFolders').value([
            { uri: vscode.Uri.file(__dirname), name: 'test', index: 0 }
        ]);

        // Mock the file system operations
        const mockFileSystem = new Map<string, Uint8Array>();
        mockFileSystem.set('test.txt', new TextEncoder().encode('Test content'));

        // Mock specific methods of fsWrapper
        const readFileStub = sinon.stub(fsWrapper, 'readFile').callsFake(async (uri: vscode.Uri): Promise<Uint8Array> => {
            const content = mockFileSystem.get(uri.fsPath);
            if (!content) {
                throw vscode.FileSystemError.FileNotFound(uri);
            }
            return content;
        });

        const statStub = sinon.stub(fsWrapper, 'stat').resolves({ type: vscode.FileType.File, ctime: 0, mtime: 0, size: 0 });

        // Execute the command
        await vscode.commands.executeCommand('file-prompter.generatePrompt');

        // Assert that the expected functions were called
        assert.ok(openTextDocumentStub.calledOnce);
        assert.ok(showTextDocumentStub.calledOnce);
        assert.ok(readFileStub.calledOnce);
        assert.ok(statStub.calledOnce);

        // Clean up
        showTextDocumentStub.restore();
        openTextDocumentStub.restore();
        activeEditorStub.restore();
        workspaceFoldersStub.restore();
        readFileStub.restore();
        statStub.restore();
    });
});
