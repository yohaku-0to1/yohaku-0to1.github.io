# Implementation Plan - Search/Replace and Pinning Features

I will implement two new features for the Clipboard Hub:
1.  **Search and Replace**: Allows users to find and replace text within a text card.
2.  **Pinning**: Allows users to "pin" items so they persist even when "Clear All" is used.

## User Review Required
> [!NOTE]
> The "Clear All" function will be modified to **only delete unpinned items**. Pinned items will remain on the board.

## Proposed Changes

### `js/tools/clipboard-hub.js`

#### [MODIFY] [clipboard-hub.js](file:///Users/shimodairaikunari/Documents/yohaku-0to1.github.io/js/tools/clipboard-hub.js)

**1. Pinning Feature:**
-   **Data Structure**: Add `isPinned` (boolean) to the item object in IndexedDB.
-   **UI**:
    -   Add a "Pin" button (thumbtack icon) to the item header.
    -   Toggle the button style (filled/active color) based on `isPinned` state.
-   **Logic**:
    -   Update `createItem` and `createUrlItem` to initialize `isPinned: false`.
    -   Update `handleClearAll` to only delete items where `isPinned` is false.
    -   Add event listener to the Pin button to toggle the state and update DB.

**2. Search and Replace Feature:**
-   **UI**:
    -   Add a "Find/Replace" button (magnifying glass or edit icon) to the header of **text items only**.
    -   Create a collapsible "Search Bar" container inside the text item wrapper, above the textarea.
    -   The Search Bar will contain:
        -   Input: "Find" (placeholder: "検索する文字")
        -   Input: "Replace" (placeholder: "置換後の文字")
        -   Button: "Replace All" (action)
-   **Logic**:
    -   Toggle the visibility of the Search Bar when the header button is clicked.
    -   When "Replace All" is clicked:
        -   Get values from inputs.
        -   Perform `text.split(find).join(replace)` (simple global replace) or regex replace. *Decision: Simple global string replace for simplicity and safety, or maybe `replaceAll`.*
        -   Update textarea value, IndexedDB, and adjust height.

## Verification Plan

### Manual Verification
1.  **Pinning**:
    -   Create items.
    -   Pin some items.
    -   Click "Clear All".
    -   Verify pinned items remain and unpinned items are removed.
    -   Reload page to ensure pinned state persists.
2.  **Search/Replace**:
    -   Create a text item with repeated words (e.g., "test test test").
    -   Open Search/Replace bar.
    -   Enter "test" in Find and "passed" in Replace.
    -   Click "Replace All".
    -   Verify text becomes "passed passed passed".
    -   Verify DB is updated.
