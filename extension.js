const vscode = require('vscode');

/**
 * 解析当前类名
 * @param {string} text 当前文件的文本内容
 * @param {number} currentLine 当前光标所在行号
 * @returns {string|null} 返回最近的类名
 */
function findClassName(text, currentLine) {
    const lines = text.split('\n');
    const classPattern = /class (\w+)\(/;

    for (let i = currentLine; i >= 0; i--) {
        const match = classPattern.exec(lines[i]);
        if (match) {
            return match[1]; // 返回类名
        }
    }
    return null;
}


function runManimScene() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('No active editor!');
        return;
    }
    

    const document = editor.document;
    const filePath = document.fileName;
    const position = editor.selection.active;
    const text = document.getText();

    // 获取当前类名和光标所在行
    const className = findClassName(text, position.line);
    if (!className) {
        vscode.window.showErrorMessage('No class found near the cursor!');
        return;
    }

    // 构造运行命令
    const command = `manimgl ${filePath} ${className} -se ${position.line + 1}`;
    vscode.window.showInformationMessage(`Running command: ${command}`);

    // 在终端中运行
    const terminal = vscode.window.activeTerminal || vscode.window.createTerminal('Manim Terminal');
    terminal.show();
    terminal.sendText(command);
}

async function checkpointPaste(argStr = '') {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }


    const document = editor.document;
    const selection = editor.selection;

    // 获取选中的内容或当前行的文本
    const selectedText = selection.isEmpty
        ? document.lineAt(selection.active.line).text
        : document.getText(selection);

    // 将选中的内容复制到剪贴板
    await vscode.env.clipboard.writeText(selectedText);
    vscode.window.showInformationMessage('Selected text copied to clipboard.');

    // 处理选中的文本
    const lines = selectedText.split('\n');
    const firstLine = lines[0].trim();
    const startsWithComment = firstLine.startsWith('#');

    let command;
    if (lines.length === 1 && !startsWithComment) {
        // 单行且不是注释
        command = selectedText.trim();
    } else {
        // 多行或注释
        const comment = startsWithComment ? firstLine : '#';
        command = "checkpoint_paste(" + argStr + ") " + comment + " (" + lines.length + " lines)";

    }

    // 将命令发送到终端
    const terminal = vscode.window.activeTerminal || vscode.window.createTerminal('Manim Terminal');
    terminal.show(true);
    terminal.sendText(command);
}

/**
 * Exits the terminal running Manim or cleans up.
 */
function manimExit() {
    // 构造运行命令
    const command = "exit()";
  
    // 检查是否有活跃终端
    const terminal = vscode.window.activeTerminal;
    if (!terminal) {
      vscode.window.showWarningMessage("No active terminal found. Please open a terminal first.");
      return;
    }
  
    // 提示即将运行的命令
    vscode.window.showInformationMessage(`Running command: ${command}`);
  
    // 在终端中运行命令
    terminal.show(true); // 确保终端窗口显示
    terminal.sendText(command); // 发送退出命令
  }
  
  



/**
 * 扩展的激活函数
 */
function activate(context) {
    const runManimSceneCommand = vscode.commands.registerCommand('manimRunner.runManimScene', () => {
        runManimScene();
    });


    const checkpointPasteCommand = vscode.commands.registerCommand('manimRunner.checkpointPaste', () => {
        checkpointPaste();
    });

    const recordedCheckpointPasteCommand = vscode.commands.registerCommand('manimRunner.recordedCheckpointPaste', () => {
        checkpointPaste('record=True');
    });

    const skippedCheckpointPasteCommand = vscode.commands.registerCommand('manimRunner.skippedCheckpointPaste', () => {
        checkpointPaste('skip=True');
    });



    const exitCommand = vscode.commands.registerCommand('manimRunner.exit', () => {
        manimExit();
    });



    context.subscriptions.push(
        runManimSceneCommand,
        checkpointPasteCommand,
        recordedCheckpointPasteCommand,
        skippedCheckpointPasteCommand,
        exitCommand
    );



    
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
