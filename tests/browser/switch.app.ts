import { test, expect } from '@playwright/test';
import { installApp } from './support/app';
for (const [label, viewport] of [['desktop', {width:1440,height:900}], ['mobile',{width:390,height:844}]] as const) {
  test.describe(label, () => {
    test.use({viewport});
    test('HeroUI switch: named input, pointer label, keyboard and focus ring',async({page})=>{
      const app=await installApp(page,{role:'superadmin',db:{system_settings:[{key:'maintenance_mode',value:'false'}]}});
      await page.goto('/dashboard/admin/system');
      const input=page.getByRole('switch',{name:'Maintenance mode',exact:true});
      await expect(input).toHaveCount(1);
      await expect(input).not.toBeChecked();
      const control=page.locator('label').filter({has:input});
      await expect(control).toBeVisible();
      const box=await control.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      await control.click();
      await expect(input).toBeChecked();
      await input.focus();
      await input.press('Space');
      await expect(input).not.toBeChecked();
      await expect(control).toHaveAttribute('data-focus-visible','true');
      await page.screenshot({path:`/downloads/switch-${label}.png`,fullPage:true});
    });
  });
}
