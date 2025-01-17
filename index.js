#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const srcfile = require('./codeGen.js');
const promptfile = require('./prompt.js');
const gitIgnorefile = require('./gitignore.js');

function generateProjectStructure(projectName) {
    const projectPath = path.join(process.cwd(), projectName);
  
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath);
    }

    const srcPath = path.join(projectPath, 'src');
    const promptPath = path.join(projectPath, 'src/prompt');
    // const workflowsDir = path.join(projectPath, '.github/workflows');
    const packageJsonPath = path.join(projectPath, 'package.json');
    const readMePath = path.join(projectPath, 'README.md');
    const gitIgnorePath = path.join(projectPath, '.gitignore');
    const envPath = path.join(projectPath, '.env');

    fs.mkdirSync(srcPath);
    fs.mkdirSync(promptPath);
    // fs.mkdirSync(workflowsDir);
  
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
            dotenv: "^16.4.7",
            path: "^0.12.7",
            playwright: "^1.49.1",
            xlsx: "^0.18.5"
        },
        devDependencies: {
            [tsNode]: "^10.9.2"
        }
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    const srcScript = srcfile.codeGen;
    fs.writeFileSync(path.join(srcPath, 'BDDAndStepDefinitionGenerator.ts'), srcScript);

    const bddPromptScript = promptfile.bddPrompt;
    fs.writeFileSync(path.join(promptPath, 'bddFeatureGenPrompt.ts'), bddPromptScript);

    const sdPromptScript = promptfile.stepDefinitionPrompt;
    fs.writeFileSync(path.join(promptPath, 'stepDefinitionCodeGenPrompt.ts'), sdPromptScript);

    const envScript = srcfile.envData;
    fs.writeFileSync(envPath, envScript);

    const gitIgnoreScript = gitIgnorefile.gitIgnore;
    fs.writeFileSync(gitIgnorePath, gitIgnoreScript);
};

generateProjectStructure('n_bddcucumber');
console.log(`Initialized project: n_bddcucumber`);
