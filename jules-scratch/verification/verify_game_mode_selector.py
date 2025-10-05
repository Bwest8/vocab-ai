from playwright.sync_api import sync_playwright, Page, expect
import traceback

def create_vocab_set(page: Page):
    """
    Creates a new vocabulary set to ensure the games page can load.
    """
    try:
        print("Navigating to http://localhost:3000/create...")
        page.goto("http://localhost:3000/create", timeout=60000)
        print("Navigation to create page complete.")

        print("Loading example data...")
        page.get_by_role("button", name="Load Example").click()
        print("Example data loaded.")

        print("Submitting the new vocab set...")
        page.get_by_role("button", name="Create Set").click()
        print("Vocab set submitted.")

        # Wait for the success message to appear
        success_message = page.locator("text=Success!")
        expect(success_message).to_be_visible(timeout=60000)
        print("Vocab set created successfully.")

    except Exception as e:
        print("An error occurred during vocab set creation:")
        print(traceback.format_exc())
        raise

def test_game_mode_selector_visual(page: Page):
    """
    This test verifies that the redesigned GameModeSelector component
    is rendered correctly on the /games page.
    """
    try:
        print("Navigating to http://localhost:3000/games...")
        page.goto("http://localhost:3000/games", timeout=60000)
        print("Navigation to games page complete.")

        print("Looking for the main heading...")
        heading = page.get_by_role("heading", name="Games Lab")
        expect(heading).to_be_visible(timeout=30000)
        print("Heading found and visible.")

        # Now that a set exists, the selector should be visible.
        print("Looking for the GameModeSelector container...")
        game_mode_selector_container = page.locator("div.grid.grid-cols-2.gap-4")
        expect(game_mode_selector_container).to_be_visible(timeout=30000)
        print("GameModeSelector container found.")

        screenshot_path = "jules-scratch/verification/verification.png"
        print(f"Taking screenshot at {screenshot_path}...")
        page.screenshot(path=screenshot_path)
        print("Screenshot taken successfully.")

    except Exception as e:
        print("An error occurred during Playwright execution on the games page:")
        print(traceback.format_exc())
        raise

def main():
    with sync_playwright() as p:
        try:
            print("Launching browser...")
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            print("Browser launched successfully.")

            # Create a vocab set first
            create_vocab_set(page)

            # Then, verify the games page
            test_game_mode_selector_visual(page)

            browser.close()
        except Exception as e:
            print("An error occurred in the main execution block:")
            print(traceback.format_exc())

if __name__ == "__main__":
    main()