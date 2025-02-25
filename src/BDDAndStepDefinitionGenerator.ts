import axios, { AxiosError } from "axios";
import * as fs from "fs";
import * as path from "path";
import * as xlsx from "xlsx";
import { chromium } from "playwright";
import * as os from "os";
import dotenv from "dotenv";
import { generateBDDPrompt } from "./prompt/bddFeatureGenPrompt";
import { stepDefinitionCodeGenPrompt } from "./prompt/stepDefinitionCodeGenPrompt";
import { encode, decode } from "gpt-3-encoder";  // Token encoder

dotenv.config();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Please provide both a URL and a file path.');
  process.exit(1);
}

const [websiteURL, xlsxFilePath] = args;

const API_KEY = process.env.OPENAI_API_KEY;
const API_URL = process.env.OPENAI_API_ENDPOINT;

if (!API_URL || !API_KEY) {
  throw new Error("Missing OpenAI API URL or API Key in the .env file.");
}

let api_url: string = API_URL;
let api_key = API_KEY;

// Initialize conversation history (empty at first)
let conversationHistory: { role: string; content: string }[] = [];

function readUseCasesFromExcel(filePath: string): { useCase: string; testData?: string[] }[] {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data: any[] = xlsx.utils.sheet_to_json(worksheet);
  const useCasesWithTestData: { useCase: string; testData?: string[] }[] = [];

  const useCaseMap: { [key: string]: string[] } = {};

  data.forEach((row) => {
    if (row.UseCase) {
      if (!useCaseMap[row.UseCase]) {
        useCaseMap[row.UseCase] = [];
      }
    }
    if (row.TestData) {
      const lastUseCase = Object.keys(useCaseMap).pop();
      if (lastUseCase) {
        useCaseMap[lastUseCase].push(row.TestData);
      }
    }
  });

  for (const [useCase, testData] of Object.entries(useCaseMap)) {
    useCasesWithTestData.push({ useCase, testData: testData.length > 0 ? testData : undefined });
  }

  return useCasesWithTestData;
}

async function getHtmlFromPage(): Promise<string> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(websiteURL);
  let htmlContent = await page.content();
  htmlContent = htmlContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/\s+/g, ' ').trim()
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n+/g, '\n');

  await browser.close();
  return htmlContent;
}

async function getGPTResponse(systemPrompt: string, userPrompt: string) {
  let retryCount = 4;

  while (true) { // Infinite loop for retry logic
    try {
      const currentConversation = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      await sleep(100000); // Sleep before making the request, if needed
      const allContent = currentConversation.map(item => item.content).join("\n");

      // Get token length of the entire conversation history
      const tokenLength = countTokens(allContent);
      console.log("Token length of currentConversation --->>>", tokenLength);

      const response = await axios.post(
        api_url,
        {
          messages: currentConversation, // Send the full conversation history
          temperature: 0.3,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": `${api_key}`,
            "Region": "eastus2",
          },
        }
      );

      // Add assistant response to the conversation history
      const assistantMessage = response.data.choices[0].message.content.trim();

      console.log(assistantMessage);
      return assistantMessage; // If successful, return the message

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 429) {
          console.log("Retrying request...");
          console.error("Error while calling OpenAI API:", error.response ? error.response.data : error.message);
          retryCount--;
          if (retryCount === 0) {
            console.error("Max retries exceeded.");
            break; // Exit the loop if max retries exceeded
          }
        } else {
          console.error("Error while calling OpenAI API:", error.response ? error.response.data : error.message);
          break; // Exit the loop if it's not a rate limit error
        }
      } else {
        console.error("General error:", error instanceof Error ? error.message : "Unknown error");
        break; // Exit the loop for any non-axios error
      }
    }
  }
}

async function generateUseCasePrompt(useCasesWithTestData: { useCase: string; testData?: string[] }[]): Promise<string[]> {
  const useCasePrompts = useCasesWithTestData.map(({ useCase, testData }) => {
    if (testData && testData.length > 0) {
      return `${useCase}\nExample Test Data:\n${testData.join("\n")}`;
    } else {
      return `${useCase}`;
    }
  });
  return useCasePrompts;
}

// Token counting function
function countTokens(content: string): number {
  return encode(content).length;
}

// Split content into chunks if it exceeds token limit
function chunkContent(content: string, maxTokens: number): string[] {
  const tokens = encode(content);
  console.log('tokens:', tokens.length);
  const chunks: string[] = [];
  let tempChunk: number[] = [];

  for (let i = 0; i < tokens.length; i++) {
    tempChunk.push(tokens[i]);
    if (tempChunk.length >= maxTokens) {
      chunks.push(decode(tempChunk));
      tempChunk = [];
    }
  }

  if (tempChunk.length > 0) {
    chunks.push(decode(tempChunk));
  }
  console.log('tempChunk:', tempChunk.length);
  return chunks;
}

async function generateChunkedCode(systemPrompt: string, userPrompt: string, maxTokens: number) {
  let stepDefinitionFile = '';
  const chunkedPrompts = chunkContent(userPrompt, maxTokens);
    let i = 1;
  for (let chunk of chunkedPrompts) {
    stepDefinitionFile = '';
    console.log(`Generating chunk with ${countTokens(chunk)} tokens...`);
    console.log(`Request ${i++} out of ${chunkedPrompts.length}`);
    const chunkWithLabel = `This is chunk ${i}:\n\n${chunk}`;
    const response = await getGPTResponse(systemPrompt, chunkWithLabel);
    stepDefinitionFile += response;
  }

  return stepDefinitionFile;
}

function saveToFile(fileName: string, content: string) {
  const downloadDir = path.join(os.homedir(), "Downloads");
  const outputPath = path.join(downloadDir, fileName);
  fs.writeFileSync(outputPath, content);
  console.log(`${fileName} saved to Downloads folder at ${outputPath}`);
}

async function main() {
  try {
    const useCasesWithTestData = readUseCasesFromExcel(xlsxFilePath);
    const useCasePrompt = await generateUseCasePrompt(useCasesWithTestData);
    const { systemPrompt, userPrompt } = generateBDDPrompt(useCasePrompt);
    const bddSteps = await getGPTResponse(systemPrompt, userPrompt);
    const htmlContent = await getHtmlFromPage();
    const { stepDefinitionSystemPrompt, stepDefinitionUserPrompt } = stepDefinitionCodeGenPrompt(bddSteps, htmlContent);

    const maxTokens = 20000;
    const stepDefinitionFile = await generateChunkedCode(stepDefinitionSystemPrompt, stepDefinitionUserPrompt, maxTokens);

    saveToFile("output1.feature", bddSteps);
    saveToFile("output1.ts", stepDefinitionFile);
  } catch (error) {
    console.error("Failed to generate and save files:", error);
  }
}

main();