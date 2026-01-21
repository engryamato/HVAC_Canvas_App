
import { test, expect } from '@playwright/test';
import { openCanvas } from './utils/test-utils';

test('Debug: Equipment Type Selector Visibility', async ({ page }) => {
  // Capture browser console logs
  page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
  
  console.log('--- Starting Debug Test ---');
  
  await openCanvas(page, 'Debug Selector Project');
  console.log('Canvas opened');

  await page.keyboard.press('e');
  console.log('Pressed "e"');
  
  // Wait a moment for render
  await page.waitForTimeout(1000);
  
  // Check tool state
  const toolBtn = page.getByTestId('tool-equipment');
  const pressed = await toolBtn.getAttribute('aria-pressed');
  console.log(`Tool button aria-pressed: ${pressed}`);
  
  // Check selector
  const selector = page.getByTestId('equipment-type-selector');
  const count = await selector.count();
  console.log(`Selector count: ${count}`);
  
  if (count > 0) {
    const visible = await selector.isVisible();
    console.log(`Selector visible: ${visible}`);
    const html = await selector.innerHTML();
    console.log(`Selector HTML: ${html}`);
    
    const rtuBtn = page.getByTestId('equipment-type-rtu');
    const rtuVisible = await rtuBtn.isVisible();
    console.log(`RTU Button visible: ${rtuVisible}`);
  } else {
    console.log('Selector NOT found');
    // Dump toolbar HTML
    const toolbar = page.getByTestId('toolbar');
    console.log('Toolbar HTML:', await toolbar.innerHTML());
  }
  
  expect(count).toBeGreaterThan(0);

  // Debug Entity Creation
  console.log('--- Debugging Entity Creation ---');
  await page.getByTestId('equipment-type-rtu').click();
  console.log('Selected RTU type');
  
  // Click on canvas to place (using Bounding Box logic like E2E)
  const canvas = page.locator('[data-testid="canvas-area"] canvas');
  const box = await canvas.boundingBox();
  if (box) {
      console.log(`Canvas Box: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      console.log('Clicked canvas at center');
  } else {
      console.log('Canvas box not found, clicking 300,300 fallback');
      await page.mouse.click(300, 300);
  }
  
  // Wait for potential async state
  await page.waitForTimeout(1000);
  
  // Check stores via evaluate
  const storeState = await page.evaluate(() => {
    // @ts-ignore - Assuming stores are exposed or accessible via window/hooks if possible
    // Since we can't access hooks directly outside components, we check the DOM for effects
    // But we CAN access the window if we exposed the store there.
    // If not exposed, we rely on DOM.
    return {
       statusBarText: document.querySelector('[data-testid="status-bar"]')?.textContent,
       propertiesText: document.querySelector('[data-testid="properties-panel"]')?.textContent,
    };
  });
  
  console.log('Store Evidence:', storeState);
});
