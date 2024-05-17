const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

/**
 * @param {vscode.ExtensionContext} context
 */
const config = vscode.workspace.getConfiguration("try");

const ignoreFolders = config.get("ignore");

function generateFileStructure(directoryPath, depth = 0) {
  let structure = "";

  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !ignoreFolders.includes(file)) {
      structure += `${"  ".repeat(depth)}- ${file}\n`;
      structure += generateFileStructure(filePath, depth + 1);
    } else if (stat.isFile()) {
      structure += `${"  ".repeat(depth)}- ${file}\n`;
    }
  }

  return structure;
}

const getJsxFileArray = (directoryPath) => {
  let jsxFiles = {
    fileName: [],
    filePath: [],
  };
  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !ignoreFolders.includes(file)) {
      const jsxFilesInDirectory = getJsxFileArray(filePath);
      jsxFiles.fileName = [
        ...jsxFiles.fileName,
        ...jsxFilesInDirectory.fileName,
      ];
      jsxFiles.filePath = [
        ...jsxFiles.filePath,
        ...jsxFilesInDirectory.filePath,
      ];
    } else if (stat.isFile() && file.endsWith(".jsx")) {
      jsxFiles.fileName.push(file);
      jsxFiles.filePath.push(filePath);
    } else if (stat.isFile() && file.endsWith(".js")) {
      jsxFiles.fileName.push(file);
      jsxFiles.filePath.push(filePath);
    }
  }

  return jsxFiles;
};

function activate(context) {
  console.log("Congratulations, your extension is active!");

  let disposable = vscode.commands.registerCommand(
    "try.folderScanner",
    function () {
      vscode.window.showInformationMessage("Hello World from try!");

      const workspaceFolders = vscode.workspace.workspaceFolders;

      if (!workspaceFolders) {
        vscode.window.showErrorMessage(
          "No workspace folder is open. Please open a workspace folder to use this extension."
        );
        return;
      }

      const directoryPath = workspaceFolders[0].uri.fsPath;
      const fileStructure = generateFileStructure(directoryPath);

      //write file
      const filePath = path.join(directoryPath, "fileStructure.txt");
      fs.writeFileSync(filePath, fileStructure);

      //jsx and js files
      const jsxFiles = getJsxFileArray(directoryPath);
      console.log(jsxFiles);

      vscode.window.showInformationMessage(
        "File structure has been generated successfully."
      );

      //read ALL files and create object

      let files = [
        {
          filename: "",
          filepath: "",
          imports: [],
          exports: [],
          props: [],
          searchParams: [],
          state: [],
        },
      ];

      console.log(files);

      for (let i = 0; i < jsxFiles.fileName.length; i++) {
        const file = fs.readFileSync(jsxFiles.filePath[i], "utf8");
        const lines = file.split("\n");

        let imports = [];
        let exports = [];
        let props = [];
        let searchParams = [];
        let state = [];

        for (let line of lines) {
          if (line.includes("import")) {
            if (line.includes("from")) {
              const path = line.split("from")[1].replace(/['";]/g, "").trim();
              imports.push(path);
            }
          } else if (line.includes("export")) { 
            if (line.includes("default")) {
              const defaultExport = line
                .split("default")[1]
                .replace(/['";]/g, "")
                .trim();
              exports.push(defaultExport);
            } else if (line.includes("export const")) {
              const regex = /export\s+const\s+(\w+)\s*=/;
              const match = line.match(regex);
              if (match && match.length > 1) {
                const namedExport = match[1];
                exports.push(namedExport);
              }
            } else if (line.includes("export function")) {
              const regex = /export\s+function\s+(\w+)\s*\(.*\)/;
              const match = line.match(regex);
              if (match && match.length > 1) {
                const namedExport = match[1];
                exports.push(namedExport);
              }
            }
          }
        }

        files.push({
          filename: jsxFiles.fileName[i],
          filepath: jsxFiles.filePath[i],
          imports,
          exports,
          props,
          searchParams,
          state,
        });
      }
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
