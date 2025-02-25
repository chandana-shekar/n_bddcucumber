// Function to generate system and user prompts with dynamic content
export function stepDefinitionCodeGenPrompt(bddSteps: string, htmlContent: string): { stepDefinitionSystemPrompt: string, stepDefinitionUserPrompt: string } {
  
  const stepDefinitionSystemPrompt = `You are an automation coding expert specializing in Playwright with TypeScript. HTML content will be sent in chunks, Please remember to keep all the HTML content in memory.`;

  const stepDefinitionUserPrompt = `
  Here is the HTML content for the page: ${htmlContent}
  Please keep all this in memory sincde you will be asked to generate the code, As it is being sent in chunkes. 

  Please convert the following BDD steps into a Playwright Step Definition File in TypeScript. 
  The BDD steps: 
  ${bddSteps}
  
  The step definition file should:
  - Use Playwright with TypeScript to generate the automation code for each BDD step.
  - Import and initialize the Playwright "page" context properly.
  - Use Playwright's "expect" API for assertions.
  - Include "beforeAll" and "afterAll" hooks to initialize and close the browser context for Playwright tests.
  - Be independent of the provided HTML content, ensuring the generated code can work with any page content.
  - Include clear and concise automation code with Playwright steps.
  - Ensure the generated code works with the generated BDD steps without relying on specific test data or the HTML provided.
  - Format the output exactly as it will appear in the feature file, as it will be written directly to a file without human intervention.
  - Do not include any extra lines at the beginning or end of your response.
  - Avoid any additional comments, explanations, or instructions in your response.
  - HTML content will be sent in chunks. Please do not generate the code until you receive the message to generate the code.
  - Only generate code for the BDD steps provided and DO NOT generate code until you receive the explicit instruction to generate the code.
  - The response should only contain code as it will be compiled directly.

  "Now you can generate the code"
  Thank you.`;

  return { stepDefinitionSystemPrompt, stepDefinitionUserPrompt };
}