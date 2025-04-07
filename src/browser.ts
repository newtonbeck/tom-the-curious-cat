import { chromium, Page } from 'playwright';
import * as dotenv from 'dotenv';
import { analyzeImage } from './openai';

// Load environment variables from .env file
dotenv.config();

interface CommandLineArgs {
    url: string;
    prompt: string;
}

function parseCommandLineArgs(): CommandLineArgs {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error('Usage: npm start -- <url> "<prompt>"');
        console.error('Example: npm start -- https://www.google.com "Search for cats"');
        process.exit(1);
    }

    return {
        url: args[0],
        prompt: args[1]
    };
}

async function main() {
    const { url, prompt } = parseCommandLineArgs();
    
    console.log(`Opening URL: ${url}`);
    console.log(`With prompt: ${prompt}`);

    // Get browser configuration from environment variables
    const headless = process.env.BROWSER_HEADLESS === 'true';
    const timeout = parseInt(process.env.BROWSER_TIMEOUT || '30000', 10);
    const maxAttempts = parseInt(process.env.MAX_ATTEMPTS || '10', 10);
    
    console.log(`Browser configuration: headless=${headless}, timeout=${timeout}ms, maxAttempts=${maxAttempts}`);

    // Launch the browser
    const browser = await chromium.launch({ headless });
    
    try {
        // Create a new context and page
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Navigate to the provided URL
        await page.goto(url);

        let attempts = 0;
        let solution = null;
        
        // Continue until we find a solution or reach max attempts
        while (attempts < maxAttempts && !solution) {
            attempts++;
            console.log(`\n--- Attempt ${attempts}/${maxAttempts} ---`);
            
            // Take a screenshot and convert it to base64
            const screenshotBuffer = await page.screenshot({ fullPage: true });
            const base64Screenshot = screenshotBuffer.toString('base64');
            console.log('Screenshot taken and converted to base64');
            
            // Analyze the screenshot using OpenAI
            console.log('Analyzing screenshot with OpenAI...');
            const result = await analyzeImage(base64Screenshot, prompt);
            
            // Handle the result based on its type
            if (result.type === 'action') {
                console.log('Next action to take:');
                console.log(JSON.stringify(result.data, null, 2));
                
                // Execute the action
                try {
                    await executeAction(page, result.data);
                    console.log(`Action executed: ${result.data.action}`);
                    
                    // Wait a moment for the page to update
                    await page.waitForTimeout(2000);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`Error executing action: ${errorMessage}`);
                    // If we can't execute the action, we might need to try a different approach
                    // or wait a bit longer before the next attempt
                    await page.waitForTimeout(5000);
                }
            } else if (result.type === 'solution') {
                console.log('Solution found:');
                console.log(JSON.stringify(result.data, null, 2));
                solution = result.data;
                break;
            }
        }
        
        if (!solution) {
            console.log(`\nNo solution found after ${attempts} attempts.`);
        }
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Close the browser
        await browser.close();
    }
}

/**
 * Execute an action on the page
 * @param page The Playwright page object
 * @param actionData The action data from OpenAI
 */
async function executeAction(page: Page, actionData: { action: string; target: string; value?: string }): Promise<void> {
    const { action, target, value } = actionData;
    
    switch (action) {
        case 'click':
            try {
                // Get all elements with the matching text
                const elements = await page.getByText(target).all();
                
                if (elements.length === 0) {
                    throw new Error(`No elements found with text "${target}"`);
                }
                
                // Click on the first matching element
                console.log(`Found ${elements.length} elements with text "${target}", clicking the first one`);
                await elements[0].click();
            } catch (error) {
                console.error(`Failed to click on element with text "${target}":`, error);
                throw error;
            }
            break;
        default:
            throw new Error(`Unknown action type: ${action}`);
    }
}

main().catch(console.error); 