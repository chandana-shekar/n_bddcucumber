const codeGen = `
import axios , {AxiosError} from "axios";
import * as fs from "fs";
import * as path from "path";
import * as xlsx from "xlsx";
import { chromium } from "playwright";
import * as os from "os";
import dotenv from 'dotenv';

import { generateBDDPrompt } from './prompt/bddFeatureGenPrompt';
import { stepDefinitionCodeGenPrompt } from './prompt/stepDefinitionCodeGenPrompt';

dotenv.config();

// Access arguments passed to the script (after the script name)
const args = process.argv.slice(2); // Skip the first two elements (node and script path)

// Ensure we have exactly two arguments: URL and file path
if (args.length !== 2) {
    console.error('Please provide both a URL and a file path.');
    process.exit(1); // Exit with an error code
}

const [websiteURL, xlsxFilePath] = args; // Destructure the URL and file path

const API_KEY = process.env.OPENAI_API_KEY;
const API_URL = process.env.OPENAI_API_ENDPOINT;

if (!API_URL || !API_KEY) {
    throw new Error("Missing OpenAI API URL or API Key in the .env file.");
}
let api_url : string = API_URL;
let api_key = API_KEY;

function readUseCasesFromExcel(
  filePath: string
): { useCase: string; testData?: string[] }[] {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const data: any[] = xlsx.utils.sheet_to_json(worksheet);
  const useCasesWithTestData: { useCase: string; testData?: string[] }[] = [];

  // Create a map to group test data by use case
  const useCaseMap: { [key: string]: string[] } = {};

  data.forEach((row) => {
    if (row.UseCase) {
      // If there's a use case, start a new entry in the map if it doesn't exist
      if (!useCaseMap[row.UseCase]) {
        useCaseMap[row.UseCase] = [];
      }
    }
    // Collect test data entries, assuming each row with test data does not have a use case
    if (row.TestData) {
      // Add the test data to the last recorded use case
      const lastUseCase = Object.keys(useCaseMap).pop();
      if (lastUseCase) {
        useCaseMap[lastUseCase].push(row.TestData);
      }
    }
  });

  // Convert the map into the desired output format
  for (const [useCase, testData] of Object.entries(useCaseMap)) {
    useCasesWithTestData.push({
      useCase,
      testData: testData.length > 0 ? testData : undefined, // Include only if there are test data entries
    });
  }

  return useCasesWithTestData;
}

// Function to fetch HTML content from the page
async function getHtmlFromPage(): Promise<string> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(websiteURL); // Replace with your URL
  const htmlContent = await page.content();
  await browser.close();
  return htmlContent;
}

async function getGPTResponse(systemPrompt : string , userPrompt: string) {
    try {
      const response = await axios.post(
        api_url,  
        {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": api_key,
            "Region" : "eastus2"
          }
        }
      );
  
      return response.data.choices[0].message.content.trim();
  
    }catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("Error while calling OpenAI API:", error.response ? error.response.data : error.message);
        } else {
          console.error("General error:", error instanceof Error ? error.message : 'Unknown error');
        }
      
        throw error; 
      }
  }

  async function generateUseCasePrompt(useCasesWithTestData: { useCase: string; testData?: string[] }[]): Promise<string[]> {
    const useCasePrompts = useCasesWithTestData.map(({ useCase, testData }) => {
      if (testData && testData.length > 0) {
        return useCase\nExample Test Data:\ntestData.join("\n")};
      } else {
        return useCase; 
      }
    });
    return useCasePrompts;  
  }

// Function to save content to files
function saveToFile(fileName: string, content: string) {
  const downloadDir = path.join(os.homedir(), "Downloads");
  const outputPath = path.join(downloadDir, fileName);
  fs.writeFileSync(outputPath, content);
  console.log("fileName saved to Downloads folder at outputPath");
}

// Main function
async function main() {
  try {
    const useCasesWithTestData = readUseCasesFromExcel(xlsxFilePath);
    const useCasePrompt = await generateUseCasePrompt(useCasesWithTestData);
    const { systemPrompt, userPrompt } = generateBDDPrompt(useCasePrompt);
    const bddSteps = await getGPTResponse(systemPrompt, userPrompt);
    const htmlContent = await getHtmlFromPage();
    const {stepDefinitionSystemPrompt, stepDefinitionUserPrompt} = stepDefinitionCodeGenPrompt(bddSteps,htmlContent);
    const stepDefinitionFile = await getGPTResponse(stepDefinitionSystemPrompt, stepDefinitionUserPrompt);

    saveToFile("output1.feature", bddSteps);
    saveToFile("output1.ts", stepDefinitionFile);
  } catch (error) {
    console.error("Failed to generate and save files:", error);
  }
}

main();
`;

const envData =`
OPENAI_API_KEY=
OPENAI_API_ENDPOINT=`;

module.exports = {
    codeGen,
    envData
}