# Matrix Audit

This document records the matrix failure audit for the Node.js utility library across operating systems (Ubuntu, Windows) and Node.js versions (18, 20, 22) as required by Task 1.

---

## Matrix Failure Overview

The initial test matrix runs against `ubuntu-latest` and `windows-latest` across Node versions `18`, `20`, and `22`.

| OS | Node Version | Status | Primary Reason |
| :--- | :--- | :--- | :--- |
| `ubuntu-latest` | 18 | PASS | Baseline environment; uses POSIX paths, LF line endings, and legacy crypto APIs available in Node 18 |
| `ubuntu-latest` | 20 | PASS | Baseline environment (original developer environment); POSIX paths, LF line endings, and Node 20 runtime |
| `ubuntu-latest` | 22 | **FAIL** | Deprecated API removal (`crypto.createCipher` removed in Node 22) |
| `windows-latest` | 18 | **FAIL** | OS path separator mismatch (`\` vs `/`) & line endings mismatch (CRLF vs LF) |
| `windows-latest` | 20 | **FAIL** | OS path separator mismatch (`\` vs `/`) & line endings mismatch (CRLF vs LF) |
| `windows-latest` | 22 | **FAIL** | Both OS path/line-ending issues AND Node 22 runtime crypto API removal |

---

## Detailed Audit Entries per Failing Combination

### 1. `ubuntu-latest`, Node 22

- **OS and Node Version:** `ubuntu-latest`, Node `22`
- **Step Name:** `Run npm test`
- **Exact Error Lines from Log:**
  ```text
  FAIL src/cryptoUtils.test.js
    ● encryptValue and decryptValue are inverse operations

      TypeError: crypto.createCipher is not a function

         6 |
         7 | function encryptValue(text, key) {
      >  8 |   const cipher = crypto.createCipher('aes-256-cbc', key);
           |                         ^
         9 |   let encrypted = cipher.update(text, 'utf8', 'hex');
        10 |   encrypted += cipher.final('hex');
        11 |   return encrypted;

        at createCipher (src/cryptoUtils.js:8:25)
        at Object.encryptValue (src/cryptoUtils.test.js:10:21)
  ```
- **Failure Classification:** Runtime version incompatibility
  - `crypto.createCipher` and `crypto.createDecipher` were deprecated in Node 10 and permanently removed in Node 22.
- **Planned Fix:**
  - Update `src/cryptoUtils.js` to use `crypto.createCipheriv` and `crypto.createDecipheriv`.
  - Derive a secure 32-byte key from the provided password using `crypto.scryptSync(key, 'salt', 32)`.
  - Generate an explicit 16-byte initialization vector (`crypto.randomBytes(16)`) and prepend it to the ciphertext (`iv.toString('hex') + ':' + encrypted`) so `decryptValue` can extract the IV and properly decrypt the payload across all Node versions (18, 20, 22, 24).

---

### 2. `windows-latest`, Node 18

- **OS and Node Version:** `windows-latest`, Node `18`
- **Step Name:** `Run npm test`
- **Exact Error Lines from Log:**
  ```text
  FAIL src/fileUtils.test.js
    ● getOutputPath returns correct path

      expect(received).toBe(expected) // Object.is equality

      Expected: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src\\output\\report.txt"
      Received: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src/output/report.txt"

         5 |   const result = getOutputPath('report.txt');
         6 |   expect(result).toContain('report.txt');
      >  7 |   expect(result).toBe(path.join(__dirname, 'output', 'report.txt'));
           |                  ^
         8 | });

    ● readTextFile returns file content with expected line endings

      expect(received).toBe(expected) // Object.is equality

      - Expected  - 3
      + Received  + 3

      - line one
      + line one
      - line two
      + line two
      - line three
      + line three
        ↵

        11 |   const testFile = path.join(__dirname, 'test-data', 'sample.txt');
        12 |   const content = readTextFile(testFile);
      > 13 |   expect(content).toBe('line one\nline two\nline three\n');
           |                   ^
        14 | });
  ```
- **Failure Classification:** OS-specific
  - File path string concatenation with forward slashes (`/`) fails on Windows, where the system path separator is backslash (`\`).
  - Line ending assertion expects UNIX LF (`\n`), but git on Windows checks out text files with CRLF (`\r\n`), causing assertion failure.
- **Planned Fix:**
  - In `src/fileUtils.js`: Import Node's `path` module and replace string concatenations with `path.join(__dirname, 'output', filename)` and `path.join(__dirname, 'configs', configName + '.json')`.
  - In `src/fileUtils.test.js`: Normalize CRLF line endings to LF before assertion using `content.replace(/\r\n/g, '\n')`.

---

### 3. `windows-latest`, Node 20

- **OS and Node Version:** `windows-latest`, Node `20`
- **Step Name:** `Run npm test`
- **Exact Error Lines from Log:**
  ```text
  FAIL src/fileUtils.test.js
    ● getOutputPath returns correct path
      Expected: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src\\output\\report.txt"
      Received: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src/output/report.txt"

    ● readTextFile returns file content with expected line endings
      - Expected: "line one\nline two\nline three\n"
      + Received: "line one\r\nline two\r\nline three\r\n"
  ```
- **Failure Classification:** OS-specific
  - Same OS path concatenation and line-ending mismatches as Windows Node 18.
- **Planned Fix:**
  - Apply `path.join` in `src/fileUtils.js` and line ending normalization in `src/fileUtils.test.js`.

---

### 4. `windows-latest`, Node 22

- **OS and Node Version:** `windows-latest`, Node `22`
- **Step Name:** `Run npm test`
- **Exact Error Lines from Log:**
  ```text
  FAIL src/cryptoUtils.test.js
    ● encryptValue and decryptValue are inverse operations
      TypeError: crypto.createCipher is not a function
         at createCipher (src/cryptoUtils.js:8:25)
         at Object.encryptValue (src/cryptoUtils.test.js:10:21)

  FAIL src/fileUtils.test.js
    ● getOutputPath returns correct path
      Expected: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src\\output\\report.txt"
      Received: "D:\\a\\matrix-debug-drill\\matrix-debug-drill\\src/output/report.txt"

    ● readTextFile returns file content with expected line endings
      - Expected: "line one\nline two\nline three\n"
      + Received: "line one\r\nline two\r\nline three\r\n"
  ```
- **Failure Classification:** OS-specific AND Runtime version incompatibility
  - Combines the Windows-specific path and CRLF line-ending bugs with the Node 22 `crypto.createCipher` API removal bug.
- **Planned Fix:**
  - Apply both cross-platform path/line-ending normalization fixes (`src/fileUtils.js`, `src/fileUtils.test.js`) and the `crypto.createCipheriv` replacement (`src/cryptoUtils.js`).

---

## Strategy and Workflow Adjustments

- In `.github/workflows/ci.yml`:
  - Set `fail-fast: false` on the matrix strategy so that a failure in one matrix cell does not prematurely terminate the remaining jobs, providing full diagnostics across all combinations.
  - Add Node `24` on `ubuntu-latest` via matrix `include:` marked with `experimental: true`.
  - Configure `continue-on-error: ${{ matrix.experimental == true }}` so experimental runtimes do not break the production workflow.
