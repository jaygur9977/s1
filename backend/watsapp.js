

// const { chromium } = require('playwright');
// const path = require('path');
// const fs = require('fs');

// const SESSION_DIR = path.join(__dirname, 'wa-session');

// if (!fs.existsSync(SESSION_DIR)) {
//   fs.mkdirSync(SESSION_DIR);
// }

// async function startWhatsApp() {
//   const context = await chromium.launchPersistentContext(
//     SESSION_DIR,
//     {
//       headless: false, // Browser visible
//       channel: 'chrome',
//       viewport: null,
//       args: ['--start-maximized']
//     }
//   );

//   const page = await context.newPage();

//   await page.goto('https://web.whatsapp.com/');

//   console.log('Waiting for WhatsApp login...');

//   try {
//     // Wait until WhatsApp sidebar appears
//     await page.waitForSelector('#pane-side', {
//       timeout: 120000
//     });

//     console.log('Login successful');

//     // Send welcome message only after login
//     await sendWelcomeMessage(page);

//     console.log('Done');
//   } catch (err) {
//     console.log('Login timeout:', err.message);
//   }
// }

// async function sendWelcomeMessage(page) {
//   const targetNumber = '+919424021296';

//   const searchSelector =
//     'div[aria-label="Search input textbox"]';

//   await page.waitForSelector(searchSelector);

//   await page.click(searchSelector);
//   await page.fill(searchSelector, targetNumber);

//   await page.keyboard.press('Enter');

//   await page.waitForTimeout(3000);

//   const messageBox =
//     'div[contenteditable="true"][role="textbox"]';

//   await page.waitForSelector(messageBox);

//   const message =
//     '🎉 Welcome! WhatsApp login completed successfully.';

//   await page.click(messageBox);
//   await page.keyboard.type(message);

//   await page.keyboard.press('Enter');

//   console.log('Welcome message sent');
// }

// startWhatsApp();