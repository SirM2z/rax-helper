// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import RaxCompletionItemProvider from './app/RaxCompletionItemProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'rax-helper.restart',
    () => {
      vscode.window.showInformationMessage('Rax-helper is installed.');
    }
  );

  const completion = vscode.languages.registerCompletionItemProvider(
    [
      {
        language: 'javascript',
        scheme: 'file',
        pattern: '**/*js*'
      },
      {
        language: 'javascriptreact',
        scheme: 'file',
        pattern: '**/*js*'
      },
      {
        language: 'typescript',
        scheme: 'file',
        pattern: '**/*ts*'
      },
      {
        language: 'typescriptreact',
        scheme: 'file',
        pattern: '**/*ts*'
      }
    ],
    new RaxCompletionItemProvider(),
    '',
    ' ',
    '<',
    '"',
    "'",
    '/',
    '('
  );

  context.subscriptions.push(disposable, completion);
}

// this method is called when your extension is deactivated
export function deactivate() {}
