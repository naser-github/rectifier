# Rectifier Requirements

## 1. Product

Rectifier is a browser-based JSON formatter, validator, converter, viewer, and
safe syntax repair tool.

Rectifier is inspired by [jsonformatter.org](https://jsonformatter.org/), but it
will have its own design and user experience.

## 2. JSON Input

- Users can paste JSON.
- Users can upload `.json` files.
- New users with no saved workspace must see a small example JSON document.
- The example must never replace saved or user-provided JSON.
- Input must not be larger than 10 MB.
- Rectifier must keep the original input unchanged.

## 3. JSON Validation

- Rectifier must automatically validate pasted, uploaded, and edited JSON.
- Rectifier must not require a separate Validate button.
- Rectifier must identify all detected syntax errors.
- Rectifier must highlight the location of each detected error when known.
- Rectifier must show simple, human-readable error messages.
- For example: `Missing comma at line 3`.

## 4. JSON Schema Validation

- Users can optionally validate JSON against a JSON Schema.
- Users can upload a JSON Schema file.
- Users can paste or edit a JSON Schema.
- Rectifier must show simple, human-readable schema validation errors.

## 5. JSON Repair

- Users can click **Repair JSON** to repair invalid JSON.
- Rectifier may propose a repair only when each proposed change has one clear,
  safe meaning.
- A safe repair may insert or remove valid JSON syntax characters such as `"`,
  `,`, `:`, `{`, `}`, `[`, and `]`.
- A safe repair may replace invalid delimiter characters with valid JSON
  delimiters only when the enclosed key or value stays exactly the same.
- A repair must preserve every key, value, number, text character, boolean,
  null value, data type, and their original order.
- Rectifier must not add, remove, replace, reorder, or guess user data.
- Rectifier must show every proposed syntax change before applying the repair.
- Users can accept or reject the proposed repair.
- Rectifier must not change the original input when a repair is accepted or
  rejected.
- Rectifier must validate the complete repaired JSON before showing a successful
  repair.
- Rectifier must never automatically select a repair when the intended JSON is
  unclear.
- Rectifier may show multiple reliable syntax-only choices when each choice can
  be generated without inventing data.
- Users must explicitly select and preview an ambiguous repair choice before it
  is applied.
- When reliable choices cannot be generated, Rectifier must highlight the
  error, explain the problem, and ask the user to edit it manually.
- Rectifier must support safe repair for input up to 10 MB.

Examples:

- Rectifier may add a missing comma between two complete object properties.
- Rectifier may replace single-quote delimiters in `{'name': 'jhon'}` with valid
  JSON double-quote delimiters because the key and value stay unchanged.
- Rectifier must not automatically repair `{'jhon'}` because the intended JSON
  value or structure is unclear.

## 6. JSON Formatting

- Users can beautify valid JSON.
- Users can minify valid JSON.
- Rectifier must show the formatted result in the right panel.
- Rectifier must not format invalid JSON.

## 7. JSON Conversion

- Users can convert valid JSON to CSV, XML, or YAML.
- Rectifier must show the converted result in the right panel.
- Rectifier must not convert invalid JSON.
- Rectifier must automatically flatten nested objects for CSV conversion.
- A top-level object must create one CSV row.
- A non-empty top-level array of objects must create one CSV row per object.
- Nested object paths must become CSV column names.
- Nested arrays must stay in one cell as compact JSON and must not create extra
  CSV rows.

## 8. Data Views

- Users can view valid JSON in code view.
- Users can view valid JSON in tree view.
- Users can view valid JSON in object view.
- Nested objects and arrays must be collapsible in code, tree, and object views.

## 9. Result Actions

- Users can edit the result.
- Users can copy the result.
- Users can download the result.
- The downloaded file must match the result shown in the right panel.
- Copy and download must remain disabled until a result exists.

## 10. Layout

- Rectifier must support desktop and mobile devices.
- The left panel must show the original JSON.
- The right panel must show the result or error information.
- Main actions must include upload, schema check, repair, beautify, minify,
  convert, copy, and download.
- Every disabled action must explain why it is disabled when hovered or focused.

## 11. Browser Storage

- Rectifier must save only the user's latest work in the browser.
- Saving new work must replace the previously saved work.
- Rectifier must not provide a history of older work.

## 12. Privacy

- All JSON processing must happen inside the user's browser.
- Rectifier must not send the user's JSON outside the browser.
