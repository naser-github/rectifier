# Rectifier Business Requirements Document

## 1. Product Summary

Rectifier is a free, AI-enhanced JSON formatter and repair tool.

It helps anyone work with JSON without needing an account. Users can paste or
upload JSON, find errors, fix broken JSON, format data, convert data, view data
in different ways, and download the result.

Rectifier is inspired by [jsonformatter.org](https://jsonformatter.org/), but it
will have its own design and user experience.

## 2. Business Problem

JSON errors are often hard to find and understand. Existing tools may show
technical error messages that do not clearly explain the problem. Users may
also need separate tools to format, repair, convert, inspect, and download JSON.

Rectifier will provide these tools in one simple place.

## 3. Product Goals

- Make JSON easy to validate, understand, repair, format, and convert.
- Show clear, human-readable error messages.
- Show all detected errors instead of stopping at the first error.
- Help non-technical users work with JSON.
- Keep normal JSON processing inside the user's browser.
- Provide AI repair only when the user chooses to use it.
- Work well on desktop and mobile devices.

## 4. Target Users

Rectifier is for anyone who needs to work with JSON, including:

- Non-technical users
- Developers
- Testers
- Data analysts
- Students
- Support teams

## 5. Access and Pricing

- Rectifier will be free to use.
- Users will not need an account.
- All product features will be available without signing in.

## 6. Product Scope

Rectifier will support:

- Pasting JSON
- Uploading JSON files
- JSON syntax validation
- Optional JSON Schema validation
- Human-readable error reporting
- JSON beautification
- JSON minification
- JSON repair using AI
- JSON conversion to CSV, XML, and YAML
- Code, tree, and object views
- Editing, copying, and downloading results
- Desktop and mobile layouts
- Saving the latest work in the user's browser

## 7. Business Requirements

### 7.1 JSON Input

- Users can paste JSON into the left panel.
- Users can upload a `.json` file.
- The maximum input size is 5 MB.
- The left panel will keep and show the user's original JSON.

### 7.2 JSON Validation

- Rectifier will validate JSON after the user pastes or uploads it.
- Rectifier will find and show all detected JSON errors.
- Error messages must be simple and human-readable.
- Each error must show its location when the location is known.
- Error lines must be highlighted in the left panel.
- A message should explain the real problem, such as:
  `Missing comma at line 3`.

### 7.3 JSON Schema Validation

- Users can optionally validate JSON against a JSON Schema.
- Users can upload a JSON Schema file.
- Users can paste or edit a JSON Schema in a separate schema editor.
- Schema validation errors must be simple and human-readable.

### 7.4 Beautify JSON

- Users can beautify valid JSON.
- Beautified JSON will appear in the right panel.
- If the JSON is invalid, Rectifier will not create a result.
- Rectifier will show all detected errors and highlight the error lines.

### 7.5 Minify JSON

- Users can minify valid JSON.
- Minified JSON will appear in the right panel.
- If the JSON is invalid, Rectifier will not create a result.
- Rectifier will show all detected errors and highlight the error lines.

### 7.6 Fix JSON With AI

- Users can click **Fix JSON** to repair invalid JSON.
- Fix JSON will only repair invalid JSON.
- Fix JSON will not change valid JSON content.
- Clicking **Fix JSON** gives Rectifier permission to send the current JSON to
  the AI service.
- Rectifier will not show a separate warning before sending the JSON.
- The original JSON will stay in the left panel.
- The fixed JSON will appear in the right panel.
- The fixed JSON will be editable.
- Rectifier will not show an AI explanation or list of AI changes.

### 7.7 Convert JSON

- Users can convert valid JSON to:
  - CSV
  - XML
  - YAML
- Converted data will appear in the right panel.
- If the JSON is invalid, Rectifier will not create a result.
- Rectifier will show all detected errors and highlight the error lines.
- Rectifier will convert JSON to CSV only when it can create a useful CSV.
- If useful CSV conversion is not possible, Rectifier will show a clear,
  human-readable error.

### 7.8 Data Views

Users can view supported JSON data in:

- **Code view:** Shows JSON as formatted code.
- **Tree view:** Shows JSON as an expandable tree.
- **Object view:** Shows JSON objects as cards with keys and values.

Text view is not included.

### 7.9 Result Actions

- The right panel will show the result or relevant error information.
- Users can edit results in the right panel.
- Users can copy the result.
- Users can download the result.
- The downloaded file format must match the result shown in the right panel.

### 7.10 Browser Storage

- Rectifier will save only the user's latest work in the browser.
- Saving new work will replace the previously saved work.
- Rectifier will not provide a history of older work.

### 7.11 Data Processing and Privacy

- Validation, schema validation, beautification, minification, conversion, and
  normal data views will work inside the user's browser.
- These normal features will not send JSON outside the browser.
- JSON will only be sent to an AI service after the user clicks **Fix JSON**.

## 8. User Experience Requirements

### 8.1 Desktop

- Rectifier will use a two-panel layout.
- The left panel will show the user's original JSON.
- The right panel will show the result or error information.
- Main action buttons will be placed between the two panels.

Main actions will include:

- Upload JSON
- Validate JSON
- Validate With Schema
- Beautify JSON
- Minify JSON
- Fix JSON
- Convert to CSV, XML, or YAML
- Copy Result
- Download Result

### 8.2 Mobile

- Rectifier will support mobile devices.
- Users can switch between:
  - A stacked layout with the input above the result
  - Separate **Input** and **Result** tabs

### 8.3 Design

- The product must be simple to understand.
- Important actions must be easy to find.
- Error messages must avoid difficult technical wording where possible.
- The design must be unique to Rectifier.

## 9. Main Business Rules

- Only JSON input is supported.
- Input must not be larger than 5 MB.
- Invalid JSON cannot be beautified, minified, or converted.
- Invalid JSON errors must be shown in clear language.
- Fix JSON is the only feature that uses AI.
- Fix JSON only runs after the user clicks the button.
- Fix JSON only repairs invalid JSON.
- The left panel always keeps the original JSON.
- The right panel contains the editable result.
- Users do not need an account.
- The product is free.

## 10. Out of Scope

The following items are not part of this BRD:

- User accounts
- Paid features
- Saving a history of older work
- Text view
- AI changes to valid JSON
- AI explanations of repairs
- Detailed technical architecture
- Implementation phases

## 11. Success Criteria

Rectifier will be successful when:

- Users can paste or upload JSON up to 5 MB.
- Users can understand where invalid JSON is broken.
- Users receive simple messages for all detected errors.
- Users can repair invalid JSON with AI.
- The original JSON remains unchanged while the fixed result is shown
  separately.
- Users can beautify and minify valid JSON.
- Users can convert valid JSON to CSV, XML, and YAML when conversion is
  possible.
- Users can inspect JSON using code, tree, and object views.
- Users can edit, copy, and download results.
- Normal features work without sending JSON outside the browser.
- The product works on desktop and mobile devices.

## 12. Next Document

A separate Product Requirements Document (PRD) will be created from this BRD.
The PRD will define detailed behavior, screen layouts, button actions, error
handling, edge cases, and acceptance criteria.
