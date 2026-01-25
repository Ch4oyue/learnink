from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        try:
            print("Navigating to test page...")
            page.goto("http://localhost:8080/test-sidebar")
            page.wait_for_timeout(3000)

        except Exception as e:
            print(e)
        finally:
            browser.close()

if __name__ == "__main__":
    run()
