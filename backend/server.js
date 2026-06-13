// // google-login-simple.js (Simple but working)
// const { chromium } = require('playwright');
// const fs = require('fs');
// const path = require('path');

// (async () => {
//   const userDataDir = 'C:\\Users\\hp\\AppData\\Local\\Google\\Chrome\\User Data';
//   const profileDirectory = 'Profile 5';
  
//   console.log('🚀 Opening Chrome with your profile...');
  
//   // Launch with your real Chrome profile
//   const context = await chromium.launchPersistentContext(
//     path.join(userDataDir, profileDirectory),
//     {
//       headless: false,
//       channel: 'chrome',
//       executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//       args: [
//         '--disable-blink-features=AutomationControlled',
//         '--start-maximized'
//       ],
//       viewport: null,
//     }
//   );
  
//   const page = await context.newPage();
  
//   // Google open karein
//   await page.goto('https://www.google.com');
  
//   console.log('✅ Google opened in your Chrome profile');
//   console.log('💡 Agar aap already logged in ho to direct access mil jayega');
//   console.log('💡 Agar nahi ho to manually login kar lo');
//   console.log('📌 Browser will stay open. Press Ctrl+C to close');
  
//   // Wait for manual Ctrl+C
//   await new Promise(() => {});
  
// })();













const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const profilePath = path.join(
    __dirname,
    'profiles',
    'user_1'
  );

  if (!fs.existsSync(profilePath)) {
    fs.mkdirSync(profilePath, { recursive: true });
  }

  const context = await chromium.launchPersistentContext(
    profilePath,
    {
      headless: false,
      channel: 'chrome',
      executablePath:
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      viewport: null,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled'
      ]
    }
  );

  const page = context.pages()[0] || await context.newPage();

  // await page.goto('https://google.com');


  await page.goto('https://google.com', {
  waitUntil: 'domcontentloaded',
  timeout: 60000
});


  console.log(
    'Login manually once. Profile will be saved automatically.'
  );

  console.log(process.argv);

})();





