<p align="center">
  <img src="https://raw.githubusercontent.com/chandana-shekar/n_bddcucumber/main/logo/Nilgiri_cucumber.png" alt="Nilgiri BDD Cucumber Logo" width="200"/>
</p>
<h1 align="center">Nilgiri BDD Cucumber Framework</h1>
<p align="center">
    <a href="https://npmjs.com/package/nilgiricucumber">
        <img src="https://img.shields.io/npm/v/nilgiricucumber.svg" alt="npm version">
    </a>
    <a href="https://npmjs.com/package/nilgiricucumber">
        <img src="https://img.shields.io/npm/dm/nilgiricucumber.svg" alt="npm downloads">
    </a>
    <a href="https://npmjs.com/package/nilgiricucumber">
        <img src="https://img.shields.io/npm/l/nilgiricucumber.svg" alt="license">
    </a>
</p>

## **nilgiricucumber**: A Core Component of the Nilgiri Framework

The `nilgiricucumber` module integrates **Cucumber** and **Playwright** to simplify and enhance automated **BDD testing**. It generates **feature files**, **step definitions**, and **test scripts**, making it easier to write structured, reusable test cases.

---

<h1 align="center">How to Setup?</h1>

### Prerequisites

1. Ensure you have **Node.js** and **TypeScript** installed on your machine.
   - Download Node.js from [here](https://nodejs.org/).
   - To install TypeScript globally, run:
     ```bash
     npm install -g typescript
     ```

2. **IDE**: Use an IDE that supports **TypeScript and Node.js**, such as **VSCode** or **WebStorm**.
3. **AI API Key and Endpoint** : Have your **AI API key** and **endpoint** ready for AI-based code generation .

---

## Setup: Install and Run

### **Step 1: Install Nilgiri Cucumber**
```bash
npm install nilgiricucumber@latest --save-dev
```

### **Step 2: Generate BDD Test Files**
To generate feature files and step definitions, use the `generateTestFiles` function.

Example usage:
```typescript
import { generateTestFiles } from 'nilgiricucumber';

const config = {
  apiUrl: 'https://api.openai.com/v1/completions',
  apiKey: 'sk-xxxxxx12345',
  xlsxFilePath: 'path/to/excel.xlsx',
  websiteURL: 'https://example.com'
};

generateTestFiles(config)
  .then(() => console.log('BDD test files generated successfully!'))
  .catch(err => console.error('Error:', err));
```

---

### Parameters

| Parameter          | Type   | Description                                                   | Example                                     |
|--------------------|--------|---------------------------------------------------------------|---------------------------------------------|
| `apiUrl`          | string | The endpoint URL of the AI service .               | `'https://api.openai.com/v1/completions'`   |
| `apiKey`          | string | The API key for authentication .               | `'sk-xxxxxx12345'`                          |
| `xlsxFilePath`    | string | Path to the Excel sheet containing test scenarios.           | `'path/to/excel.xlsx'`                      |
| `websiteURL`      | string | The URL of the system under test.                           | `'https://example.com'`                     |

---

### **Running the Application**
#### **If using TypeScript:**
1. **Compile the TypeScript file:**
   ```bash
   tsc <your-file-name>.ts
   node <your-file-name>.js
   ```

#### **If using ts-node (without compiling separately):**
```bash
npx ts-node <your-file-name>.ts
```

---

<h1 align="center"> Features of Nilgiri Cucumber</h1>

- **Automated BDD test generation** with feature files and step definitions.
- **Integrates with Playwright** for powerful end-to-end testing.
- **Supports AI-driven test case generation** for enhanced automation.
- **Works with TypeScript and JavaScript** seamlessly.

---
<h1 align="center"> Need Help?</h1>

For any support, please create an issue on the [Nilgiri Cucumber GitHub repository](https://github.com/chandana-shekar/n_bddcucumber/issues).

---

<p align="center">
    Copyright (c) 2025 Tricon Infotech
</p>
