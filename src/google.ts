import { chromium } from 'playwright';

async function main() {
    // Launch the browser
    const browser = await chromium.launch({ headless: false });
    
    // Create a new context and page
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to Google
    await page.goto('https://www.google.com');
    
    // Keep the browser open for 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Close the browser
    await browser.close();
}

main().catch(console.error); 