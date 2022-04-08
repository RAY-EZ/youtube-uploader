import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fsPromise from 'fs/promises';
import Protocol from 'devtools-protocol/types/protocol';
import { Browser, Page } from 'puppeteer/lib/types'

// Login into Google account
// Saving cookies
// 
export interface credential {
  email: string, 
  password: string
};

export class Account {
  readonly email: string;
  readonly password: string;

  constructor(credential: credential){
    this.email = credential.email;
    this.password= credential.password;
  }

  async login(headless: boolean):Promise<{browser:Browser, page: Page}>{
    const browser = await puppeteer
      .use(StealthPlugin())
      .launch({
      headless
    });
    const page = await browser.newPage();
    await page.setViewport({
      width: 1280,
      height: 720
    })
    let session;
    try{
      session = await fsPromise.readFile(`./session/${this.email}_session.json`,{
        encoding:'utf-8'
      });
      session = JSON.parse(session);
      
    } catch(e){
      await page.goto('https://accounts.google.com')
      const emailInputSelector = 'input[type="email"]'
      await page.waitForSelector(emailInputSelector)
      // console.log(await browser.userAgent());
       
      await page.type(emailInputSelector, this.email, { delay: 200 })
      await page.waitForTimeout(3000)
      await page.keyboard.press('Enter');

      const passwordInputSelector = 'input[type="password"]:not([aria-hidden="true"])'
      await page.waitForSelector(passwordInputSelector)
      //
      await page.waitForTimeout(3000)
      await page.type(passwordInputSelector, this.password, { delay: 200 })
      await page.keyboard.press('Enter');
      // if google ask to click 'yes it's me'
      await page.waitForTimeout(4000);
      await page.waitForNavigation()

      await fsPromise.mkdir('./session', { recursive: true})
      await page.goto('https://www.youtube.com/')
      const cookie = await page.cookies();
      await fsPromise.writeFile(`./session/${this.email}_session.json`, JSON.stringify(cookie), { flag: 'w'})
      await page.setCookie(...cookie as Protocol.Network.CookieParam[])
      console.log('session saved')

      return await this.login(headless);
    }

    await page.goto('https://www.google.com/');
    // Setting stored Cookies
    await page.setCookie(...session);
    console.log('Logged In!')
    // await page.goto('https://www.youtube.com/');
    // await page.close();
    /**
     * login successful
     */

    return { browser, page}
  }
}
