const srcfile = require('./codeGen.js')
const promptfile = require('./prompt.js')
const gitIgnorefile = require('./gitignore.js')

function generateProjectStructure(projectName) {
    const projectPath = path.join(process.cwd(), projectName);
  
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath);
    }

    const srcPathPath = path.join(projectPath, 'src');
    const promptPath = path.join(projectPath, 'src/prompt');
    const packageJsonPath = path.join(projectPath, 'package.json');
    const readMePath = path.join(projectPath, 'README.md');
    const gitIgnorePath = path.join(projectPath, '.gitignore');
    const envPath = path.join(projectPath, '.env');

    fs.mkdirSync(srcPathPath);
    fs.mkdirSync(promptPath);
    fs.mkdirSync(packageJsonPath);
    fs.mkdirSync(playwrightConfigPath);
    fs.mkdirSync(readMePath);
    fs.mkdirSync(gitIgnorePath);
    fs.mkdirSync(envPath);
    fs.mkdirSync(workflowsDir);

    const playwrightTest = '@playwright/test'
    const tsNode = 'ts-node'
    const cucumber = '@cucumber/cucumber'

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

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    const srcScript = `${srcfile.codeGen}`;
    fs.writeFileSync(path.join(srcPathPath, 'BDDAndStepDefinitionGenerator.ts'), srcScript);

    const bddPromptScript = `${promptfile.bddPrompt}`;
    fs.writeFileSync(path.join(promptPath, 'bddFeatureGenPrompt'), bddPromptScript);

    const sdPromptScript = `${promptfile.stepDefinitionPrompt}`;
    fs.writeFileSync(path.join(promptPath, 'stepDefinitionCodeGenPrompt'), sdPromptScript);

    const envScript = `${srcfile.envData}`;
    fs.writeFileSync(envPath, envScript);

    const gitIgnoreScript = `${gitIgnorefile.gitIgnore}`;
    fs.writeFileSync(gitIgnoreScript,gitIgnorePath);

};

generateProjectStructure('n_bddcucumber');

console.log(`Initialized project: ${projectName}`);