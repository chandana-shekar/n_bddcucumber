// Function to generate the BDD prompt dynamically
export function generateBDDPrompt(useCasePrompts: string[]): { systemPrompt: string, userPrompt: string } {

    const systemPrompt = `You are an automation coding expert specializing in Playwright with TypeScript.`;
  
    const userPrompt =  `You are a BDD (Behavior-Driven Development) expert. Please convert the following use cases into complete BDD scenarios. Each scenario must include:
    1. A "Given" statement that sets up the context.
    2. A "When" statement that describes the action taken by the user.
    3. A "Then" statement that outlines the expected outcome.
    
    Please format the output as follows:
    - Start with the keyword "Feature:" followed by a brief title that summarizes the feature. Ensure that there is only **one feature** encompassing all scenarios.
    - Each scenario should start with the keyword "Scenario:" followed by a brief title.
    - List the "Given," "When," and "Then" statements without any prefixes:
      Given [context]
      When [action]
      Then [expected result]
    
    After each scenario, include examples in a table format only if the user has provided test data. Please Do not generate any test data on your own.:
    - Use the keyword "Examples:" followed by a table header and multiple rows of data only if test data is present.
    
    Here are the use cases you need to convert:
    
    ${useCasePrompts.join("\n\n")}
    
    Make sure to:
    - Provide complete and logical steps for each scenario.
    - Use clear and concise language.
    - Include multiple test data examples for each scenario, formatted correctly within the Examples section, if available.
    - Format the output exactly as it will appear in the feature file, as it will be written directly to a file without human intervention.
    - Do not include any extra lines at the beginning or end of your response.
    - Avoid any additional comments, explanations, or instructions in your response.
    - Do not use dashes at the start of Given, When, or Then statements.
    
    Thank you!`;
  
    return { systemPrompt, userPrompt };
  }
  