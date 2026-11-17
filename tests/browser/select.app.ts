import { test, expect } from '@playwright/test';
import { installApp } from './support/app';
for (const [name,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]] as const) {
  test.describe(name,()=>{
    test.use({viewport});
    test('HeroUI select has a field name, supports keyboard choice and returns focus on Escape',async({page})=>{
      await installApp(page,{role:'admin'});
      await page.goto('/dashboard/requests');
      const trigger=page.getByRole('button',{name:/Status filter/});
      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(page.getByRole('listbox')).toBeVisible();
      await page.screenshot({path:`/downloads/select-${name}.png`,fullPage:true,animations:"disabled"});
      await page.getByRole('option',{name:'Completed',exact:true}).click();
      await expect(trigger).toContainText('Completed');
      await expect(page.getByRole('listbox')).toHaveCount(0);
      await trigger.press('Space');
      await expect(page.getByRole('option',{name:'Completed',exact:true})).toBeFocused();
      await page.keyboard.press('Home');
      await expect(page.getByRole('option',{name:'All Status',exact:true})).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(trigger).toContainText('All Status');
      await expect(page.getByRole('listbox')).toHaveCount(0);
      await trigger.click();
      await expect(page.getByRole('option',{name:'All Status',exact:true})).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      await expect(page.getByRole('listbox')).toHaveCount(0);
      await page.evaluate(()=>localStorage.setItem('theme','dark'));
      await page.reload();
      await trigger.click();
      await page.screenshot({path:`/downloads/select-dark-${name}.png`,fullPage:true,animations:"disabled"});
    });
  });
}
