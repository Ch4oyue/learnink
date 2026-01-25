from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to test page...")
        page.goto("http://localhost:8080/test-sidebar")

        # Wait for hydration
        page.wait_for_selector("text=Test Sidebar")

        print("Page loaded.")

        # Find the sidebar element to check state
        # The Sidebar component renders a div with data-state="expanded" or "collapsed"
        sidebar_div = page.locator("[data-sidebar='sidebar']").first

        # Initial state should be expanded (default) or whatever the cookie was (if any)
        # We assume clean state -> expanded
        print(f"Initial state: {sidebar_div.get_attribute('data-state')}")

        # Find trigger button
        trigger = page.locator("[data-sidebar='trigger']")

        # Click to collapse
        print("Clicking toggle...")
        trigger.click()

        # Wait for state change
        page.wait_for_timeout(500) # Wait for animation/state update
        print(f"State after toggle: {sidebar_div.get_attribute('data-state')}")

        # Assert it is collapsed
        # Note: Implementation detail: data-state might be on a parent or the element itself.
        # In sidebar.tsx:
        # <div data-state={state} ... >
        # Wait, the Sidebar component renders:
        # <div data-state={state} data-collapsible=... >

        # Let's target the element with data-state
        sidebar_root = page.locator("div[data-state]")
        expect(sidebar_root).to_have_attribute("data-state", "collapsed")

        print("Sidebar collapsed successfully.")

        # Reload page
        print("Reloading page...")
        page.reload()

        # Wait for load
        page.wait_for_selector("[data-sidebar='trigger']")

        # Check state again
        sidebar_root_after = page.locator("div[data-state]")
        state_after = sidebar_root_after.get_attribute("data-state")
        print(f"State after reload: {state_after}")

        expect(sidebar_root_after).to_have_attribute("data-state", "collapsed")
        print("PERSISTENCE VERIFIED: Sidebar remained collapsed.")

        # Take screenshot
        page.screenshot(path="verification/sidebar_persistence.png")
        print("Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    run()
