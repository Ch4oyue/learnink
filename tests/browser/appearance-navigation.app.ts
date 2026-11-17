import { test, expect } from '@playwright/test';
import { installApp, isDark } from './support/app';
for (const viewport of [{width:1280,height:800},{width:390,height:844}]) {
for (const role of ['user','tutor','admin','superadmin'] as const) {
 test(`appearance navigation remains personal for ${role} at ${viewport.width}`, async ({page}) => {
  await page.setViewportSize(viewport);
  await installApp(page,{role});
  const adminReads:string[]=[];
  page.on('request',req=>{if(/module_categories|module_levels/.test(req.url()))adminReads.push(req.url());});
  await page.goto('/dashboard/profile?tab=settings');
  await page.getByRole('link',{name:'Open settings',exact:true}).click();
  await expect(page).toHaveURL(/\/dashboard\/settings$/);
  await expect(page.getByText('Manage your preferences',{exact:true})).toBeVisible();
  await expect(page.getByText('Add New Category',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:/^Dark/}).click();
  await expect.poll(()=>isDark(page)).toBe(true);
  await expect(page.getByRole('button',{name:'Dark',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'Light',exact:true})).toHaveAttribute('aria-pressed','false');
  await expect(page.getByRole('button',{name:'System',exact:true})).toHaveAttribute('aria-pressed','false');
  await page.screenshot({path:`/downloads/appearance-${role}-${viewport.width}-1812.png`,fullPage:true});
  if (viewport.width===390) {
   const toggle=page.getByRole('button',{name:/^(Enabled|Disabled)$/});
   await toggle.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
   await page.waitForTimeout(300);
   await toggle.click();
   await expect(toggle).toHaveText('Enabled');
   await toggle.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
   await page.waitForTimeout(200);
   await page.screenshot({path:`/downloads/appearance-mobile-controls-${role}-1815.png`});
  } else {
   await page.getByRole('button',{name:'Light',exact:true}).focus();
   await page.keyboard.press('Tab');
   await page.keyboard.press('Tab');
   await page.waitForTimeout(200);
   await expect(page.getByRole('button',{name:'System',exact:true})).toBeFocused();
   await page.screenshot({path:`/downloads/appearance-focus-${role}-1815.png`});
  }
  expect(adminReads).toHaveLength(0);
  await page.goto('/dashboard/admin/settings');
  if(role==='admin'||role==='superadmin') {
   await expect(page.getByRole('heading',{name:'Admin Settings',exact:true})).toBeVisible();
   await expect(page.getByText('Add New Category',{exact:true})).toBeVisible();
   await page.screenshot({path:`/downloads/admin-settings-${role}-${viewport.width}-1812.png`,fullPage:true});
  } else {
   await expect(page).toHaveURL(/\/dashboard\/settings$/);
   await expect(page.getByText('Add New Category',{exact:true})).toHaveCount(0);
  }
 });
}
}
