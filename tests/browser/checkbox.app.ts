import {test,expect} from '@playwright/test';
import {installApp} from './support/app';
for(const [name,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]] as const){
 test.describe(name,()=>{test.use({viewport});
  test('HeroUI checkbox supports associated label and keyboard Space',async({page})=>{
   await installApp(page);await page.addInitScript(()=>localStorage.removeItem('sb-placeholder-auth-token'));await page.goto('/auth');
   const checkbox=page.getByRole('checkbox',{name:'Remember me for 30 days'});
   await expect(checkbox).not.toBeChecked();await page.locator('label[for="remember"]').click();await expect(checkbox).toBeChecked();
   await checkbox.focus();await checkbox.press('Space');await expect(checkbox).not.toBeChecked();
   await page.screenshot({path:`/downloads/checkbox-${name}.png`,animations:'disabled'});
  });
 });
}
