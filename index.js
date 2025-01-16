const fs = require('fs');
const path = require('path');
const srcfile = require('./codeGen.js');
const promptfile = require('./prompt.js');
const gitIgnorefile = require('./gitignore.js');

function generateProjectStructure(projectName) {
    const projectPath = path.join(process.cwd(), projectName);
  
    // Check if the project directory exists, if not, create it
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath);
    }

    // Define paths for subdirectories and files
    const srcPath = path.join(projectPath, 'src');
    const promptPath = path.join(projectPath, 'src/prompt');
    const workflowsDir = path.join(projectPath, '.github/workflows');  // Missing workflowsDir definition
    const packageJsonPath = path.join(projectPath, 'package.json');
    const readMePath = path.join(projectPath, 'README.md');
    const gitIgnorePath = path.join(projectPath, '.gitignore');
    const envPath = path.join(projectPath, '.env');
    const playwrightConfigPath = path.join(projectPath, 'playwright.config.ts');

    // Create the required directories
    fs.mkdirSync(srcPath, { recursive: true });
    fs.mkdirSync(promptPath, { recursive: true });
    fs.mkdirSync(workflowsDir, { recursive: true });
  
    // Create a basic package.json structure
    const playwrightTest = '@playwright/test';
    const tsNode = 'ts-node';
    const cucumber = '@cucumber/cucumber';

    const packageJson = {
        name: projectName,
        version: '0.0.0',
        description: 'This project uses AI (GPT-4) to automatically generate BDD .feature files and corresponding step definition files.',
        scripts: {
          "test": "echo \"Error: no test specified\" && exit 1",
          "code": "ts-node src/BDDAndStepDefinitionGenerator.ts"
        },
        dependencies: {
            [cucumber]: "^10.0.1",
            [playwrightTest]: "^1.32.2",
            axios: "^1.7.9",
            dotenv: "^16.4.7",
            fs: "^0.0.1-security",
            path: "^0.12.7",
            playwright: "^1.49.1",
            xlsx: "^0.18.5"
        },
        devDependencies: {
            [tsNode]: "^10.9.2"
        }
    };

    // Write the package.json to the project path
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Write the TypeScript and prompt files to the 'src' and 'src/prompt' directories
    const srcScript = srcfile.codeGen;
    fs.writeFileSync(path.join(srcPath, 'BDDAndStepDefinitionGenerator.ts'), srcScript);

    const bddPromptScript = promptfile.bddPrompt;
    fs.writeFileSync(path.join(promptPath, 'bddFeatureGenPrompt'), bddPromptScript);

    const sdPromptScript = promptfile.stepDefinitionPrompt;
    fs.writeFileSync(path.join(promptPath, 'stepDefinitionCodeGenPrompt'), sdPromptScript);

    // Write .env and .gitignore files
    const envScript = srcfile.envData;
    fs.writeFileSync(envPath, envScript);

    const gitIgnoreScript = gitIgnorefile.gitIgnore;
    fs.writeFileSync(gitIgnorePath, gitIgnoreScript);

    // Optionally, you can also create a README.md and a playwright.config.ts if needed
    fs.writeFileSync(readMePath, '# Project Readme');
    fs.writeFileSync(playwrightConfigPath, 'module.exports = { /* Playwright config */ };');
};

// Initialize the project structure with the given name
generateProjectStructure('n_bddcucumber');

// Log the success message with the project name
console.log(`Initialized project: n_bddcucumber`);
