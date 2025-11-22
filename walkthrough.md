# Walkthrough - Add Search/Replace and Pinning Features to Clipboard Hub

I have added two new features to **Clipboard Hub** to enhance its utility as a temporary workspace.

## Changes

### `js/tools/clipboard-hub.js`

-   **Pinning Feature**:
    -   **UI**: Added a "Pin" button (thumbtack icon) to the header of all items.
    -   **Logic**:
        -   Clicking the pin button toggles the `isPinned` state of the item.
        -   Pinned items are visually distinguished by a yellow icon.
        -   The "Clear All" function now **only deletes unpinned items**. Pinned items remain on the board.
-   **Search and Replace Feature**:
    -   **UI**: Added a "Search/Replace" button (magnifying glass icon) to the header of **text items**.
    -   **Search Bar**: Clicking the button toggles a search bar inside the item, containing "Find" and "Replace" inputs and a "Replace All" button.
    -   **Logic**:
        -   Users can enter text to find and text to replace it with.
        -   Clicking "Replace All" performs a global replacement within that specific text item.
        -   Changes are saved to IndexedDB and the character/line counters are updated automatically.

## Verification Results

### Automated Tests
-   N/A (UI features requiring manual interaction).

### Manual Verification
-   **Pinning**:
    1.  Create multiple items (text, image, URL).
    2.  Pin one or two items (verify icon turns yellow).
    3.  Click "Clear All" (verify confirmation message mentions "unpinned items").
    4.  Confirm that pinned items remain while others are deleted.
    5.  Reload the page to verify pinned state persists.
-   **Search/Replace**:
    1.  Create a text item with content like "apple apple orange".
    2.  Open the Search/Replace bar.
    3.  Find: "apple", Replace: "grape".
    4.  Click "Replace All".
    5.  Verify content updates to "grape grape orange".
    6.  Verify character counts update.
