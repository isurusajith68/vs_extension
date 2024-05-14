const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("Congratulations, your extension is active!");

  let disposable = vscode.commands.registerCommand(
    "try.folderScanner",
    function () {
      vscode.window.showInformationMessage("Hello World from try!");
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
