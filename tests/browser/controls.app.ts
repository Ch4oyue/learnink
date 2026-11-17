import { test, expect } from '@playwright/test';
import { installApp, USER_ID } from './support/app';
for (const [name,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]] as const) {
  test.describe(name,()=>{
    test.use({viewport});
    test('HeroUI tabs: linked panel, pointer selection, keyboard navigation and focus',async({page})=>{
      await installApp(page,{role:'tutor',db:{modules:[{id:'m1',created_by:USER_ID,title:'CSS Layout',summary:'Grid and flex',level:'beginner',category:'general',is_published:true,content:'# Layout'}]}});
      await page.goto('/dashboard/modules');
      const mine=page.getByRole('tab',{name:'My Modules',exact:true});
      const all=page.getByRole('tab',{name:'All Modules',exact:true});
      await expect(mine).toHaveAttribute('aria-selected','true');
      await all.click();
      await expect(all).toHaveAttribute('aria-selected','true');
      await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby',await all.getAttribute('id') || 'missing');
      await all.press('Home');
      await expect(mine).toBeFocused();
      await expect(mine).toHaveAttribute('aria-selected','true');
      await page.screenshot({path:`/downloads/tabs-${name}.png`,fullPage:true});
      await page.evaluate(() => { localStorage.setItem('theme','dark'); });
      await page.reload();
      await expect(mine).toBeVisible();
      await page.screenshot({path:`/downloads/tabs-dark-${name}.png`,fullPage:true, animations:'disabled'});
    });
    test('HeroUI progress reflects course completion accessibly',async({page})=>{
      await installApp(page,{db:{tracks:[{id:'t1',name:'Frontend Foundations',is_active:true}],modules:[{id:'m1',track_id:'t1',title:'Semantic HTML',is_published:true},{id:'m2',track_id:'t1',title:'CSS Layout',is_published:true}],user_tracks:[{user_id:USER_ID,track_id:'t1'}],user_progress:[{user_id:USER_ID,module_id:'m1',progress_percent:100,is_completed:true}]}});
      await page.goto('/dashboard/course/t1');
      const bar=page.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow','50');
      await expect(bar).toHaveAttribute('aria-valuemax','100');
      await expect(bar).toHaveAccessibleName('Progress');
      await page.screenshot({path:`/downloads/progress-${name}.png`,fullPage:true});
    });
  });
}
