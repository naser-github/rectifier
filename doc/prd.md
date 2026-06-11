# Rectifier Product Requirements Document

## 1. Product Overview

Rectifier is a free, browser-based JSON tool.

It uses a familiar JSON formatter workflow while keeping Rectifier's own
branding, paper-style design, and interaction model.

It helps users:

- Find JSON syntax errors.
- Understand where and why JSON is broken.
- Safely repair clear syntax mistakes.
- Choose between safe repair options when the intended syntax is ambiguous.
- Beautify or minify valid JSON.
- Convert valid JSON to YAML, XML, or CSV.
- Inspect JSON using code, tree, or object views.
- Copy or download the result.

Rectifier works fully inside the user's browser. It does not require an account,
a backend, or AI.

All v1 features are free and available without signing in.

## 2. Product Goals

- Make JSON errors easy to find and understand.
- Keep the original JSON unchanged.
- Never silently guess or change user data.
- Give users control when multiple syntax repairs are possible.
- Keep the interface responsive for JSON files up to 10 MB.
- Provide formatting, conversion, schema checking, and inspection in one tool.
- Keep user JSON private inside the browser.

## 3. Target Users

Rectifier is designed for:

- Developers
- Testers
- Data analysts
- Students
- Support teams
- Non-technical users who need help fixing JSON

## 4. Product Principles

### 4.1 Original Input Is Protected

- The left editor always contains the user's original JSON.
- Product actions must not silently replace the original input.
- Repaired, formatted, or converted output appears in the result panel.

### 4.2 Automatic Validation

- Rectifier validates input automatically after paste, upload, or editing.
- There is no separate **Validate JSON** button.
- Validation must not block typing.

### 4.3 Safe Repair

- Rectifier may automatically propose a repair only when one safe meaning exists.
- Rectifier must show the proposed syntax changes before applying them.
- The user must accept or reject the repair.
- Rectifier must not add, remove, replace, reorder, or guess user data.

### 4.4 User-Guided Ambiguous Repair

- Rectifier must never automatically choose between multiple valid meanings.
- When Rectifier can generate multiple deterministic syntax-only solutions, it
  may show those solutions as choices.
- Each choice must preserve the original data tokens and clearly show how the
  resulting JSON structure differs.
- The user must select a choice and review its preview before applying it.
- Rectifier must always provide an **Edit manually** option.
- When reliable choices cannot be generated, Rectifier must only highlight the
  problem and ask the user to edit it manually.
- Rectifier will not accept free-text repair instructions.

### 4.5 Privacy

- JSON, schemas, repairs, and results stay inside the user's browser.
- Rectifier must not send user data to a server.

## 5. Main User Experience

### 5.1 Desktop Layout

The desktop workspace has three main sections:

1. **Input panel:** Original JSON and input actions.
2. **Action dock:** Formatting, conversion, and repair actions.
3. **Result panel:** Generated result, result views, and result actions.

A status tray stays below the main workspace. It shows checking and valid
states, then becomes an error tray when errors are present.

The optional Schema Check feature opens from a separate control near the upper
portion of the workspace. It is not mixed with the main action dock.

### 5.2 Mobile Layout

- Input and result remain easy to access on small screens.
- Users can switch between input and result without losing their work.
- Main actions remain reachable without horizontal page scrolling.
- Error details and repair choices remain readable and usable.

### 5.3 Visual Direction

The first release uses a light design only.

- Main colors:
  - Black: `#000000`
  - Red accent: `#EA4242`
  - Paper background: `#F6F4F1`
  - White: `#FFFFFF`
- The interface uses a subtle clean paper texture.
- UI text uses the Prompt typeface.
- JSON content uses a readable monospace typeface.
- Panels and buttons use thin borders and small, sharper corner radiuses.
- Red is used for errors, focused error locations, repair emphasis, and primary
  attention states.
- Small, useful motion may be used for hover, drawer, error-focus, and result
  transitions.
- Motion must respect the user's reduced-motion preference.

### 5.4 Approved UI Blueprint

The approved UI prototype is:

`ui/rectifier-light-v1.html`

The prototype is a visual and interaction reference. Prototype-only controls,
such as the **TEST STATE** selector and **interactive prototype** label, must
not appear in the product.

#### Source Priority and Prototype Exceptions

When the BRD, PRD, and prototype differ:

1. The BRD controls business, privacy, and repair-safety rules.
2. This PRD controls detailed product behavior.
3. The prototype controls visual layout and interaction direction.

The following prototype behaviors must not be copied:

- Accepting a repair must place repaired JSON in the Result panel. It must not
  replace the original Input JSON.
- Results must be editable in Code view.
- The production Input editor must include line numbers and code folding.
- The production Schema drawer must include Schema upload.
- Disabled explanations must work for keyboard focus, not only mouse hover.
- Production validation must show all reliably located errors. The prototype's
  simple validation behavior is only a demonstration.
- Production repair must follow all safe-repair rules in this PRD. The
  prototype demonstrates only a small repair example.
- The prototype does not show the complete guided ambiguous-choice screen.
  Production must implement it from the Repair Dialog and Ambiguous Repair
  requirements in this PRD.
- The prototype does not prove 10 MB performance. Production must meet the
  performance requirements in this PRD.

#### Typography

- **Prompt** is the required font for the application interface.
- Prompt is used for headings, labels, buttons, tooltips, status messages,
  dialogs, and error explanations.
- JSON, schemas, YAML, XML, CSV, code previews, and line numbers use a readable
  monospace font.
- The fallback UI font order is:
  `Prompt, Trebuchet MS, system-ui, sans-serif`.
- The fallback code font order is:
  `ui-monospace, SFMono-Regular, Consolas, monospace`.

#### Header

- The header shows the Rectifier logo and product name on the left.
- The logo uses a red square containing a `{ }` mark.
- The header shows the privacy message
  **Your JSON stays in this browser** with a privacy lock icon on the right.
- The privacy message is an accessible button that opens a small Browser
  storage popover.
- The Browser storage popover explains that only the latest workspace is saved
  locally and contains **Clear saved workspace**.
- Clearing the saved workspace requires confirmation and removes persisted
  work without clearing the currently open workspace.
- The header does not contain light/dark theme controls.
- The first-visit sample does not require a permanent **Load example** button
  in the header.

#### Desktop Workspace

- On wide screens, a dark neutral page background and black outer frame may
  surround the light paper workspace, as shown in the approved prototype. This
  is presentation framing, not dark mode.
- The main workspace uses three columns:
  - Wide Input panel on the left.
  - Narrow Action dock in the center.
  - Wide Result panel on the right.
- The Input and Result panels should have similar widths.
- The workspace must use the approved paper background, thin borders, and
  small sharp corner radiuses.

#### Input Panel

- The Input panel header shows:
  - **Input JSON** title.
  - Current automatic-validation status.
  - Upload icon button.
  - Clear icon button.
- Upload and Clear appear on the upper-right side of the Input panel.
- The JSON editor fills the remaining Input panel space.
- On a user's first visit with no saved workspace, the editor contains a small
  nested sample and clearly identifies it as example JSON.

#### Action Dock

- The Action dock header shows **Actions** and the current input state.
- Beautify, Minify, Convert, and Repair JSON use an icon with a visible text
  label.
- Actions appear vertically in this exact order:
  1. **Beautify**
  2. **Minify**
  3. **Convert**
  4. **Repair JSON**
- Convert opens a small menu containing:
  1. **Convert to YAML**
  2. **Convert to XML**
  3. **Convert to CSV**
- **Repair JSON** stays separated at the bottom of the Action dock.
- **Repair JSON** uses the red accent when available.
- The Action dock footer explains that validation runs automatically.

#### Result Panel

- The Result panel header shows:
  - **Result** title.
  - Current result status.
  - **Code**, **Tree**, and **Object** view controls.
  - Copy icon button.
  - Download icon button.
- Result view controls appear before Copy and Download.
- Before a result exists, the panel shows a centered empty state explaining how
  to create a result.
- Converted YAML, XML, and CSV results hide or disable Tree and Object views.

#### Schema Drawer

- A vertical **SCHEMA** tab is attached to the right edge of the workspace.
- Selecting it opens a drawer from the right side.
- The drawer contains:
  - JSON Schema editor.
  - Schema upload action.
  - Clear action.
  - Check Schema action.
  - Schema result message.
- Schema Check must not appear in the main Action dock.

#### Status and Error Tray

- The tray stays below the three-column workspace.
- It shows:
  - Checking, valid, or error state.
  - Main error message.
  - Short explanation.
  - **Go to error** action when an error exists.
- Selecting **Go to error** moves the editor to the error and shows the red
  caret.

#### Repair Dialog

- Safe repair opens a centered review dialog.
- The dialog shows original input and proposed result side by side.
- Changed syntax characters are highlighted in red.
- The user can accept or reject the repair.
- Ambiguous repair uses the same visual style but shows selectable choices and
  an **Edit manually** action.

#### Tooltips and Disabled Actions

- Upload, Clear, Copy, and Download use icon-only buttons with tooltips.
- Enabled icons explain their action.
- Disabled controls explain why they are disabled.
- Disabled explanations must work using mouse hover and keyboard focus.

#### Feedback Messages

- Short successful actions, such as Copy and Download, show a brief toast
  message.
- Errors and repair decisions must not be shown only as temporary toast
  messages. They remain visible in the relevant panel, tray, or dialog.

#### Mobile Workspace

- On mobile, the three-column workspace becomes a single-column layout.
- Users can switch between Input and Result.
- Action buttons remain reachable in a compact horizontal or wrapped layout.
- Schema, error details, repair dialogs, Copy, and Download remain usable.

## 6. Input Requirements

### 6.1 Paste and Edit

- The Input panel accepts JSON only. YAML, XML, and CSV are output formats, not
  input formats.
- Users can paste or type JSON in the input editor.
- Valid top-level JSON may be an object, array, string, number, boolean, or
  null.
- The input editor supports JSON syntax highlighting.
- The input editor supports line numbers.
- The input editor supports code folding for objects and arrays.
- The input editor supports files up to 10 MB.

### 6.2 Upload

- Users can upload a `.json` file.
- Upload is shown as an icon button with a tooltip.
- Files larger than 10 MB are rejected before processing.
- The rejection message clearly explains the 10 MB limit.

### 6.3 Clear

- Users can clear the input using an icon button with a tooltip.
- Clearing input also clears validation errors and generated results.
- Clearing input must not automatically reload the first-visit sample.

### 6.4 First-Visit Sample

- When no saved workspace exists, Rectifier loads this small example:

```json
{
  "name": "John",
  "active": true,
  "contact": {
    "city": "Dhaka",
    "email": "john@example.com"
  },
  "roles": ["editor", "viewer"]
}
```

- The Input panel status clearly says **Example JSON** until the user edits,
  uploads, or clears it.
- The sample behaves like normal valid JSON and can be beautified, minified,
  converted, and inspected.
- CSV conversion demonstrates nested-object flattening with columns such as
  `contact.city` and keeps `roles` as compact JSON in one cell.
- The sample must never replace a saved workspace, pasted JSON, uploaded JSON,
  or edited JSON.

## 7. Validation Requirements

### 7.1 Automatic Validation Behavior

- Validation runs automatically after the user stops editing briefly.
- Validation runs immediately after a file upload.
- Older validation jobs must not overwrite newer input results.
- Validation reports all syntax errors that can be located reliably.
- Uncertain follow-on errors must not be shown as confirmed errors.

### 7.2 Error Presentation

Each reliable syntax error must show:

- A simple human-readable message.
- Line and column when known.
- A highlighted error line or range in the input editor.
- A short explanation of what is wrong.
- Whether a safe repair or guided choice is available.

Examples:

- `Missing comma at line 3.`
- `Expected a colon after "name".`
- `This object is missing a closing brace.`

### 7.3 Error Focus

- When an error is found, Rectifier focuses the first reliable error.
- Clicking another error focuses that error.
- The editor scrolls the error into view.
- The cursor or caret at the focused error is red.
- The focused error selection uses a visible red highlight.
- Users can move between reliable errors.

## 8. Repair Requirements

### 8.1 Repair JSON Action

- **Repair JSON** appears at the end of the action dock.
- It is available only when invalid JSON has at least one supported repair path.
- It does not run automatically.
- Automatic validation may return repair-eligibility metadata only to decide
  whether the button is available. This metadata check must not generate,
  select, preview, or apply a repair candidate.
- Full repair candidate analysis begins only after the user clicks
  **Repair JSON**.
- It must never directly change the original input.
- Repair analysis and safe repair support input up to 10 MB.

### 8.2 Single Safe Repair

When one clear repair exists:

1. The user clicks **Repair JSON**.
2. Rectifier shows a before-and-after preview.
3. Every changed syntax character is highlighted.
4. Rectifier explains the repair in simple language.
5. The user accepts or rejects the repair.
6. After acceptance, Rectifier validates the complete repaired JSON.
7. Valid repaired JSON appears in the result panel.

### 8.3 Ambiguous Repair Choices

When multiple supported syntax-only interpretations exist:

1. Rectifier focuses and highlights the ambiguous location.
2. Rectifier explains that it cannot safely choose the intended meaning.
3. Rectifier shows the supported options as separate selectable choices.
4. Each choice shows:
   - A short label.
   - The resulting JSON structure.
   - A before-and-after preview.
   - The exact syntax characters that will change.
5. The user selects one option or chooses **Edit manually**.
6. Rectifier applies a selected option only after confirmation.
7. Rectifier validates the complete result before showing success.

Rectifier must not show a choice if that choice requires guessed or invented
data.

### 8.4 Unsupported Repair

When Rectifier cannot create a safe repair or reliable choices:

- It highlights the problem.
- It explains why automatic repair is unavailable.
- It asks the user to edit the input manually.
- **Repair JSON** remains disabled and explains why on hover.

### 8.5 Supported Repair Rules

Supported repairs may include:

- Adding a missing comma between complete values or properties.
- Removing a trailing comma.
- Adding a missing colon when the key and value are clear.
- Adding or correcting an unambiguous closing bracket or brace.
- Replacing single-quote delimiters with double-quote delimiters when the
  enclosed key or value remains unchanged.
- Correcting other syntax characters only when data tokens remain unchanged.

Examples:

- `{"name":"John" "active":true}` may receive a missing-comma proposal.
- `{'name':'jhon'}` may receive a quote-delimiter proposal.
- `"name" "John"` may show guided choices such as an object property or an
  array of two strings because both choices preserve the original data tokens.
- `{'jhon'}` must require manual editing because the intended structure is
  unclear.

## 9. Formatting Requirements

### 9.1 Beautify

- Users can beautify valid JSON.
- The result uses readable indentation.
- The result appears in the result panel.

### 9.2 Minify

- Users can minify valid JSON.
- The result removes unnecessary whitespace.
- The result appears in the result panel.

### 9.3 Invalid Input

- Beautify and Minify are disabled for invalid or empty input.
- Hovering a disabled action explains why it is unavailable.

## 10. Conversion Requirements

### 10.1 Supported Formats

Users can convert valid JSON to:

- YAML
- XML
- CSV

### 10.2 Conversion Rules

- Conversion is disabled for invalid or empty input.
- YAML and XML conversion support any valid JSON value that can be represented
  by the selected format.
- CSV conversion is available for a top-level object or a non-empty top-level
  array of objects.
- Rectifier automatically flattens nested objects into CSV columns.
- Selecting **Convert to CSV** performs flattening automatically and shows the
  CSV in the Result panel. It does not require a separate confirmation dialog.
- CSV conversion never changes the original Input JSON.
- Nested object paths use dot-separated column names. For example,
  `{"user":{"address":{"city":"Dhaka"}}}` creates the column
  `user.address.city`.
- Dots and backslashes already present in JSON keys are escaped in CSV column
  names so different JSON paths cannot silently become the same column.
- If Rectifier cannot create unique column paths, it refuses conversion and
  explains the conflict instead of merging data.
- A top-level object creates one CSV row.
- A top-level array of objects creates one CSV row per object.
- CSV columns are the union of all discovered object paths and keep
  first-seen order.
- A missing field creates an empty CSV cell.
- A JSON `null` value is written as `null` so it is different from a missing
  field.
- Nested arrays stay in one cell as compact JSON. Rectifier does not expand
  nested arrays into extra rows or columns.
- Top-level primitives, empty arrays, and arrays containing non-object rows
  cannot create useful CSV and must show a clear explanation.
- A disabled conversion option explains why it is unavailable on hover.
- Converted output appears in the result panel.
- The output filename and extension match the selected format.

## 11. JSON Schema Requirements

- Schema Check is optional.
- Users can open and close a separate Schema drawer.
- Users can paste, edit, or upload a JSON Schema.
- Schema checking is available only when the input JSON is valid.
- Schema errors use simple messages and show the related data path.
- Schema Check does not change the input or result.
- When unavailable, Schema Check explains why on hover.

## 12. Result Requirements

### 12.1 Result Panel

- The result panel starts empty.
- It shows guidance until an action creates a result.
- When invalid input has no result, the empty state directs the user to the
  Status and Error tray for details.
- Results are editable in code view.
- Creating a new result replaces the previous result.

### 12.2 Result Views

JSON results support:

- **Code view:** Editable formatted JSON with code folding.
- **Tree view:** Expandable and collapsible keys, objects, and arrays.
- **Object view:** Expandable and collapsible bordered cards or sections for
  objects, arrays, keys, and values.

For all JSON result views:

- Nested objects can collapse to `{…}`.
- Nested arrays can collapse to `[…]`.
- Large results must not require rendering every nested item at once.

Converted YAML, XML, and CSV results use code view only.

### 12.3 Copy and Download

- Copy and Download appear as icon buttons in the result panel.
- Each icon has a tooltip.
- Both actions are disabled until a result exists.
- Hovering a disabled action explains why it is unavailable.
- Copy places the exact visible result text on the clipboard.
- Download saves the exact visible result text.
- The downloaded extension matches the current result format.

## 13. Disabled Action Requirements

Every disabled button or action must explain why it is disabled when hovered or
focused.

Examples:

- `Paste JSON first.`
- `Requires valid JSON. Fix the syntax error first.`
- `Create a result first using Beautify, Minify, Convert, or Repair JSON.`
- `No safe repair can be proposed. Edit the JSON manually.`
- `CSV requires an object or a non-empty array of objects.`

Disabled explanations must also be available to keyboard and screen-reader
users.

## 14. Browser Storage Requirements

- Rectifier saves only the latest workspace in the browser.
- The saved workspace includes input, result, result format, and schema when
  used.
- New saved work replaces the previous saved workspace.
- Rectifier does not provide workspace history.
- Rectifier continues to work when browser storage is unavailable.
- Users can clear the saved workspace from the Browser storage popover in the
  header.
- Clearing saved workspace removes persisted work without clearing the
  currently open workspace.

## 15. Performance Requirements

- Rectifier supports input up to 10 MB.
- Typing, scrolling, and error navigation must remain usable during processing.
- Expensive validation, repair analysis, formatting, conversion, and schema
  checking must not freeze the main interface.
- Only the newest requested processing job may update the interface.
- Large tree and object views render content as needed instead of rendering the
  complete structure at once.

## 16. Accessibility Requirements

- All actions are usable with a keyboard.
- Icon-only buttons have accessible names.
- Disabled reasons are available on hover and keyboard focus.
- Error state is not communicated by color alone.
- Focus states are visible.
- Text and controls meet readable color-contrast standards.
- Motion respects reduced-motion settings.

## 17. Privacy and Security Requirements

- Rectifier has no backend requirement.
- Rectifier does not upload JSON, schemas, or results.
- Rectifier does not execute code contained in user data.
- Downloaded content is generated locally.
- User content is treated as text and must not be inserted as executable HTML.

## 18. Out of Scope

The first release does not include:

- User accounts
- Paid features
- Backend processing
- AI repair or free-text repair instructions
- Cloud synchronization
- Collaborative editing
- Workspace history
- Text view
- Automatic selection of an ambiguous repair
- Dark mode

## 19. Acceptance Criteria

Rectifier v1 is accepted when:

- Users can paste, edit, upload, and clear JSON up to 10 MB.
- A first-time user with no saved workspace sees the small example JSON.
- Clearing or replacing the sample does not reload it during that workspace.
- Valid top-level objects, arrays, strings, numbers, booleans, and null are
  supported.
- Validation starts automatically and does not require a Validate button.
- Reliable syntax errors are clearly explained and highlighted.
- The first error is focused with a red caret.
- Clear repairs show a preview and require user acceptance.
- Ambiguous repair choices are never selected automatically.
- Users can choose a reliable repair option or edit manually.
- `{'jhon'}` requires manual editing and is never automatically repaired.
- Unsupported repairs clearly explain why manual editing is required.
- Original input stays unchanged after all result actions.
- Valid JSON can be beautified and minified.
- Valid JSON can be converted to YAML and XML.
- Top-level objects and non-empty arrays of objects can be converted to CSV.
- Nested objects are automatically flattened into predictable CSV columns.
- Nested arrays remain compact JSON inside one CSV cell.
- Schema Check works from a separate drawer.
- Code, tree, and object views support collapsing JSON sections.
- Copy and Download work after a result exists.
- Every disabled action explains why it is disabled.
- Core processing remains usable for supported 10 MB input.
- Safe repair remains usable for supported 10 MB input.
- The product works on desktop and mobile layouts.
- Core features continue working when browser storage is unavailable.
- All user data stays inside the browser.
