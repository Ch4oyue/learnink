from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to test page...")
            page.goto("http://localhost:8080/test-sidebar")
            page.wait_for_timeout(2000)

            print("Body text content:")
            print(page.inner_text("body"))

        except Exception as e:
            print(e)
        finally:
            browser.close()

if __name__ == "__main__":
    run()
