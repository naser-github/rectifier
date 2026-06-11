# Rectifier Business Requirements Document

## 1. Product Summary

Rectifier is a free JSON formatter and syntax repair tool.

It helps anyone work with JSON without needing an account. Users can paste or
upload JSON, find errors, safely repair clear syntax mistakes, format data,
convert data, view data in different ways, and download the result.

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
- Show all syntax errors that Rectifier can locate reliably.
- Help non-technical users work with JSON.
- Keep all JSON processing inside the user's browser.
- Repair clear JSON syntax errors without changing the user's data.
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
- Safe JSON syntax repair
- JSON conversion to CSV, XML, and YAML
- Code, tree, and object views
- Editing, copying, and downloading results
- Desktop and mobile layouts
- Saving the latest work in the user's browser

## 7. Business Requirements

### 7.1 JSON Input

- Users can paste JSON into the left panel.
- Users can upload a `.json` file.
- New users with no saved workspace will see a small example JSON document.
- The example must never replace saved or user-provided JSON.
- The maximum input size is 10 MB.
- Rectifier will support valid JSON with an object, array, string, number,
  boolean, or null value at the top level.
- The left panel will keep and show the user's original JSON.

### 7.2 JSON Validation

- Rectifier will validate JSON automatically after the user pastes, uploads, or
  edits it.
- Rectifier will find and show all syntax errors that it can locate reliably.
- Rectifier will not show uncertain follow-on errors as confirmed errors.
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
- Rectifier will show all reliably located syntax errors and highlight the error
  lines.

### 7.5 Minify JSON

- Users can minify valid JSON.
- Minified JSON will appear in the right panel.
- If the JSON is invalid, Rectifier will not create a result.
- Rectifier will show all reliably located syntax errors and highlight the error
  lines.

### 7.6 Repair JSON

- Users can click **Repair JSON** to repair invalid JSON.
- Repair JSON will only repair invalid JSON.
- Rectifier may automatically propose a repair only when there is one clear,
  safe syntax repair.
- Safe repairs may insert or remove valid JSON syntax characters such as `"`,
  `,`, `:`, `{`, `}`, `[`, and `]`.
- Safe repairs may replace invalid delimiter characters with valid JSON
  delimiters only when the enclosed key or value stays exactly the same.
- A repair must preserve every key, value, number, text character, boolean,
  null value, data type, and their original order.
- A repair must not add, remove, replace, reorder, or guess user data.
- Rectifier must refuse a proposed repair when it cannot verify that the user's
  data remains unchanged.
- Rectifier must not automatically select a repair when multiple valid meanings
  are possible.
- When Rectifier can generate reliable syntax-only choices without inventing
  data, it may show those choices and let the user select the intended result.
- When Rectifier cannot generate reliable choices, it will highlight the error,
  explain the problem, and ask the user to edit it manually.
- Rectifier will show a preview of every proposed syntax change before the user
  accepts it.
- Users can accept or reject the proposed repair.
- The original JSON will stay unchanged in the left panel.
- The repaired JSON will appear in the right panel after the user accepts the
  proposed changes.
- The repaired JSON will be editable.
- Rectifier will validate the complete repaired JSON before showing it as a
  successful repair.
- Rectifier will support safe repair for input up to 10 MB.
- For example, Rectifier may safely add the missing comma between two complete
  object properties.
- For example, Rectifier may replace the single-quote delimiters in
  `{'name': 'jhon'}` with valid JSON double-quote delimiters because the key and
  value stay unchanged.
- For example, Rectifier must not propose a repair for `{'jhon'}` because the
  intended JSON value or structure is unclear.

### 7.7 Convert JSON

- Users can convert valid JSON to:
  - CSV
  - XML
  - YAML
- Converted data will appear in the right panel.
- If the JSON is invalid, Rectifier will not create a result.
- Rectifier will show all reliably located syntax errors and highlight the error
  lines.
- Rectifier will convert JSON to CSV only when it can create a useful CSV.
- Rectifier will automatically flatten nested objects into CSV columns.
- A top-level object will create one CSV row.
- A non-empty top-level array of objects will create one CSV row per object.
- Nested object paths will become column names.
- Nested arrays will stay in one cell as compact JSON. Rectifier will not
  create extra rows from nested arrays.
- If useful CSV conversion is not possible, Rectifier will show a clear,
  human-readable error.

### 7.8 Data Views

Users can view supported JSON data in:

- **Code view:** Shows JSON as formatted code.
- **Tree view:** Shows JSON as an expandable tree.
- **Object view:** Shows JSON objects as cards with keys and values.

Text view is not included.

### 7.9 Result Actions

- The right panel will show the result or relevant error guidance.
- A status and error tray below the workspace will show checking, valid, and
  error information.
- Users can edit results in the right panel.
- Users can copy the result.
- Users can download the result.
- The downloaded file format must match the result shown in the right panel.

### 7.10 Browser Storage

- Rectifier will save only the user's latest workspace in the browser,
  including the input, result, and schema when used.
- Saving new work will replace the previously saved work.
- Rectifier will not provide a history of older work.
- Core features will continue to work when browser storage is unavailable.

### 7.11 Data Processing and Privacy

- Rectifier will be a fully client-side product.
- All JSON processing and storage will work inside the user's browser.
- Rectifier will not send the user's JSON outside the browser.

## 8. User Experience Requirements

### 8.1 Desktop

- Rectifier will use a two-panel layout with a narrow action dock between the
  panels.
- The left panel will show the user's original JSON.
- The right panel will show the result or relevant error guidance.
- A status and error tray below the workspace will show validation information.

Main actions will include:

- Upload JSON
- Schema Check
- Beautify JSON
- Minify JSON
- Repair JSON
- Convert to CSV, XML, or YAML
- Copy Result
- Download Result

### 8.2 Mobile

- Rectifier will support mobile devices.
- Users can easily switch between the input and result on mobile devices.

### 8.3 Design

- The product must be simple to understand.
- Important actions must be easy to find.
- Error messages must avoid difficult technical wording where possible.
- Every disabled action must explain why it is unavailable when hovered or
  focused.
- The design must be unique to Rectifier.

## 9. Main Business Rules

- Only JSON input is supported.
- Input must not be larger than 10 MB.
- Invalid JSON cannot be beautified, minified, or converted.
- Invalid JSON errors must be shown in clear language.
- Uncertain follow-on errors must not be shown as confirmed errors.
- Repair JSON only runs after the user clicks the button.
- Repair JSON only repairs invalid JSON.
- Rectifier may automatically propose only clear syntax repairs with one safe
  meaning.
- Rectifier may show reliable choices for ambiguous syntax, but it must never
  select a choice automatically.
- Repair JSON must never change or guess the user's data.
- Unclear repairs require user selection from reliable choices or manual user
  editing.
- Users must preview and accept or reject proposed repairs.
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
- Server-side JSON processing or storage
- Cloud synchronization or collaborative editing
- Automatic selection of an ambiguous repair
- Free-text repair instructions
- Changes to keys, values, data types, or data order during repair

## 11. Success Criteria

Rectifier will be successful when:

- Users can paste or upload JSON up to 10 MB.
- New users can immediately try the product using a small example JSON
  document.
- Users can understand where invalid JSON is broken.
- Users receive simple messages for all reliably located syntax errors.
- Users can safely repair clear JSON syntax errors.
- Users can process and safely repair supported JSON input up to 10 MB without
  the interface becoming unusable.
- Unclear errors are highlighted without Rectifier guessing the intended data.
- Ambiguous repair choices require an explicit user selection.
- Repair JSON never changes or guesses keys, values, data types, or data order.
- The original JSON remains unchanged while the repaired result is shown
  separately.
- Users can beautify and minify valid JSON.
- Users can convert valid JSON to CSV, XML, and YAML when conversion is
  possible.
- Users can convert supported nested JSON objects to flattened CSV.
- Users can inspect JSON using code, tree, and object views.
- Users can edit, copy, and download results.
- All features work without sending JSON outside the browser.
- Core features work when browser storage is unavailable.
- The product works on desktop and mobile devices.

## 12. Next Document

A separate Product Requirements Document (PRD) will be created from this BRD.
The PRD will define detailed behavior, screen layouts, button actions, error
handling, edge cases, and acceptance criteria.
