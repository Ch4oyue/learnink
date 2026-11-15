from playwright.sync_api import sync_playwright
import sys
import os

def test_auth_page():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

        print("Navigating to http://localhost:8080/auth")
        try:
            page.goto("http://localhost:8080/auth", timeout=30000)

            # Print title
            print(f"Page Title: {page.title()}")

            # Verify inputs exist
            print("Checking inputs...")
            email = page.locator("input[name='email']")

            email.wait_for(state="visible", timeout=5000)

            # Check attributes
            email_auto = email.get_attribute("autocomplete")
            print(f"Email autocomplete: {email_auto}")

            output_path = "auth_verification.png"
            page.screenshot(path=output_path)
            print(f"Screenshot saved to {output_path}")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error.png")
            print("Saved error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    test_auth_page()
