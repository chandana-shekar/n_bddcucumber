import axios from "axios";
import * as fs from "fs";
import * as xlsx from "xlsx";
import { chromium } from "playwright";
import { generateBDDPrompt } from "./prompt/bddFeatureGenPrompt";
import { stepDefinitionCodeGenPrompt } from "./prompt/stepDefinitionCodeGenPrompt";
import { encode, decode } from "gpt-3-encoder"; 

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface Config {
  apiUrl: string;
  apiKey: string;
  xlsxFilePath: string;
  websiteURL: string;
}

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

async function getHtmlFromPage(websiteURL: string): Promise<string> {
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

async function getGPTResponse(apiUrl: string, apiKey: string, systemPrompt: string, userPrompt: string) {
  let retryCount = 4;

  while (true) {
    try {
      const currentConversation = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

      await sleep(100000);
      const allContent = currentConversation.map(item => item.content).join("\n");

      const tokenLength = countTokens(allContent);
      console.log("Token length of currentConversation --->>>", tokenLength);

      const response = await axios.post(
        apiUrl,
        {
          messages: currentConversation,
          temperature: 0.3,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": `${apiKey}`,
            "Region": "eastus2",
          },
        }
      );

      const assistantMessage = response.data.choices[0].message.content.trim();
      console.log(assistantMessage);
      return assistantMessage;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 429) {
          console.log("Retrying request...");
          console.error("Error while calling OpenAI API:", error.response ? error.response.data : error.message);
          retryCount--;
          if (retryCount === 0) {
            console.error("Max retries exceeded.");
            break;
          }
        } else {
          console.error("Error while calling OpenAI API:", error.response ? error.response.data : error.message);
          break;
        }
      } else {
        console.error("General error:", error instanceof Error ? error.message : "Unknown error");
        break;
      }
    }
  }
}

function saveToFile(filename: string, content: string) {
  fs.writeFileSync(filename, content, "utf8");
  console.log(`File saved: ${filename}`);
}

function countTokens(text: string): number {
  return encode(text).length;
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

  async function chunkContent(content: string, maxTokens: number): Promise<string[]> {
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

async function generateChunkedCode(apiUrl: string, apiKey: string, systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  let stepDefinitionFile = '';
  const chunkedPrompts = await chunkContent(userPrompt, maxTokens);
    let i = 1;
  for (let chunk of chunkedPrompts) {
    stepDefinitionFile = '';
    console.log(`Generating chunk with ${countTokens(chunk)} tokens...`);
    console.log(`Request ${i++} out of ${chunkedPrompts.length}`);
    const chunkWithLabel = `This is chunk ${i}:\n\n${chunk}`;
    const response = await getGPTResponse(apiUrl, apiKey, systemPrompt, chunkWithLabel);
    stepDefinitionFile += response;
  }

  return stepDefinitionFile;
}

export async function generateTestFiles(config: Config) {
  try {
    const useCasesWithTestData = readUseCasesFromExcel(config.xlsxFilePath);
    const useCasePrompt = await generateUseCasePrompt(useCasesWithTestData);
    const { systemPrompt, userPrompt } = generateBDDPrompt(useCasePrompt);
    const bddSteps = await getGPTResponse(config.apiUrl, config.apiKey, systemPrompt, userPrompt);
    const htmlContent = await getHtmlFromPage(config.websiteURL);
    const { stepDefinitionSystemPrompt, stepDefinitionUserPrompt } = stepDefinitionCodeGenPrompt(bddSteps, htmlContent);

    const maxTokens = 20000;
    const stepDefinitionFile = await generateChunkedCode(config.apiUrl, config.apiKey, stepDefinitionSystemPrompt, stepDefinitionUserPrompt, maxTokens);

    saveToFile("output1.feature", bddSteps);
    saveToFile("output1.ts", stepDefinitionFile);
  } catch (error) {
    console.error("Failed to generate and save files:", error);
  }
}