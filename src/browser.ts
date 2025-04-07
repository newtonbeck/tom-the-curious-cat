import { chromium } from 'playwright';
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
    
    console.log(`Browser configuration: headless=${headless}, timeout=${timeout}ms`);

    // Launch the browser
    const browser = await chromium.launch({ headless });
    
    try {
        // Create a new context and page
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Navigate to the provided URL
        await page.goto(url);

        // Take a screenshot and convert it to base64
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        const base64Screenshot = screenshotBuffer.toString('base64');
        console.log('Screenshot taken and converted to base64');
        
        // Analyze the screenshot using OpenAI
        console.log('Analyzing screenshot with OpenAI...');
        const analysis = await analyzeImage(base64Screenshot, prompt);
        console.log('Analysis result:');
        console.log(analysis);
        
        // Keep the browser open for the configured timeout
        await new Promise(resolve => setTimeout(resolve, timeout));
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Close the browser
        await browser.close();
    }
}

main().catch(console.error); 