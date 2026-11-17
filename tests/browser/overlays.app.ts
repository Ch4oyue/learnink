import {test,expect} from '@playwright/test';
import {installApp,USER_ID} from './support/app';
for(const [size,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]] as const){
 for(const theme of ['light','dark']){
  test.describe(`${size}-${theme}`,()=>{test.use({viewport});
   test.beforeEach(async({page})=>{await page.addInitScript(t=>localStorage.setItem('theme',t),theme);});
   test('notification popover: keyboard opens, Escape returns focus, outside dismisses',async({page})=>{
    const app=await installApp(page,{db:{notifications:[{id:'n1',user_id:USER_ID,title:'Request approved',message:'Ready to learn',type:'success',is_read:false,created_at:'2026-11-17T00:00:00Z'}]}});
    await page.goto('/dashboard');const trigger=page.getByRole('button',{name:'Notifications',exact:true});
    await trigger.focus();await trigger.press('Enter');const dialog=page.getByRole('dialog',{name:'Notifications'});
    await expect(dialog).toBeVisible();await expect(dialog.getByText('Request approved')).toBeVisible();
    await page.waitForTimeout(350);
    await expect(dialog).toBeVisible();
    const box=await dialog.boundingBox();expect(box&&box.x>=0&&box.x+box.width<=viewport.width).toBe(true);
    await page.waitForTimeout(350);
    await page.screenshot({path:`/downloads/overlay-popover-${size}-${theme}.png`});
    await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(trigger).toBeFocused();await page.waitForTimeout(350);await expect(trigger).toBeFocused();
    await trigger.click();await dialog.getByRole('button',{name:/Request approved/}).click();
    await expect.poll(()=>app.db.notifications[0].is_read).toBe(true);
    await page.mouse.click(5,viewport.height-5);await expect(dialog).toHaveCount(0);
   });
   test('module menu: keyboard navigation, Escape focus and action',async({page})=>{
    await installApp(page,{role:'tutor',db:{modules:[{id:'m1',title:'CSS Layout',summary:'Layouts',created_by:USER_ID,category:'general',level:'beginner',is_published:true,created_at:'2026-11-01T00:00:00Z'}]}});
    await page.goto('/dashboard/modules');const trigger=page.getByRole('button',{name:'Module Options'});
    await trigger.focus();await trigger.press('ArrowDown');const menu=page.getByRole('menu');await expect(menu).toBeVisible();
    await expect(page.getByRole('menuitem',{name:'View'})).toBeFocused();
    await page.screenshot({path:`/downloads/overlay-menu-${size}-${theme}.png`,animations:'disabled'});
    await page.keyboard.press('Escape');await expect(menu).toHaveCount(0);await expect(trigger).toBeFocused();await page.waitForTimeout(350);await expect(trigger).toBeFocused();
    await trigger.click();await page.getByRole('menuitem',{name:'Edit'}).click();await expect(page).toHaveURL(/\/dashboard\/modules\/edit\/m1$/);
   });
   if(size==='desktop')test('account menu preserves router links and tooltip focus is accessible',async({page})=>{
    await installApp(page,{db:{modules:[{id:'m1',title:'CSS Layout',summary:'Layouts',content:'# CSS Layout\n\nLayouts',is_published:true,category:'general',level:'beginner'}]}});await page.goto('/dashboard');const trigger=page.locator('[data-sidebar="menu-button"]').filter({hasText:'Test Learner'});
    await trigger.click();await expect(page.getByRole('menu')).toBeVisible();await page.getByRole('menuitem',{name:'My Notes'}).click();await expect(page).toHaveURL(/\/dashboard\/profile\?tab=notes$/);
    await page.goto('/learn/m1');const settings=page.getByRole('button',{name:'Settings',exact:true});await settings.focus();await expect(page.getByRole('tooltip')).toContainText('Settings');await page.keyboard.press('Escape');await expect(page.getByRole('tooltip')).toHaveCount(0);
   });
  });
 }
}
