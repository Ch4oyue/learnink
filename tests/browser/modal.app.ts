import {test,expect} from '@playwright/test';
import {installApp} from './support/app';
for(const [name,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]] as const){
  test.describe(name,()=>{
    test.use({viewport});
    test('HeroUI modal traps focus, closes with Escape and returns focus',async({page})=>{
      await installApp(page,{role:'admin'});await page.goto('/dashboard/requests');
      const trigger=page.getByRole('button',{name:'Create New Request'});
      await trigger.click();const dialog=page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(/New Material Request/);
      await expect(dialog).toHaveAttribute('data-slot','modal-dialog');
      for(let i=0;i<12;i++) {await page.keyboard.press('Tab');expect(await dialog.evaluate(e=>e.contains(document.activeElement))).toBe(true);}
      await page.screenshot({path:`/downloads/modal-${name}.png`,fullPage:true,animations:'disabled'});
      await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();
      await page.evaluate(()=>localStorage.setItem('theme','dark'));await page.reload();await trigger.click();
      await page.screenshot({path:`/downloads/modal-dark-${name}.png`,fullPage:true,animations:'disabled'});
      await dialog.getByRole('button',{name:'Close',exact:true}).click();await expect(dialog).toHaveCount(0);
    });
  });
}
