import { chromium } from 'playwright';

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

    // Launch the browser
    const browser = await chromium.launch({ headless: false });
    
    try {
        // Create a new context and page
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Navigate to the provided URL
        await page.goto(url);
        
        // Keep the browser open for 30 seconds
        await new Promise(resolve => setTimeout(resolve, 30000));
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Close the browser
        await browser.close();
    }
}

main().catch(console.error); 