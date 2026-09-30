# Matrix Debug Drill

This repository contains the solution for the matrix debugging drill, resolving cross-platform and runtime version failures across Linux and Windows environments and configuring experimental runtime handling.

## Matrix Architecture

The GitHub Actions workflow runs the following combinations:

| OS | Node Version | Production Supported | Experimental | Status | Fix Applied |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ubuntu-latest` | 18 | Yes | No | Passing | Baseline environment; uses POSIX paths, LF line endings, and legacy crypto APIs |
| `ubuntu-latest` | 20 | Yes | No | Passing | Baseline developer environment |
| `ubuntu-latest` | 22 | Yes | No | Fixed | Replaced deprecated `crypto.createCipher` with `crypto.createCipheriv` |
| `windows-latest` | 18 | Yes | No | Fixed | Cross-platform `path.join` and normalized CRLF line endings |
| `windows-latest` | 20 | Yes | No | Fixed | Cross-platform `path.join` and normalized CRLF line endings |
| `windows-latest` | 22 | Yes | No | Fixed | Cross-platform `path.join`, normalized CRLF line endings, and `crypto.createCipheriv` |
| `ubuntu-latest` | 24 | No | Yes | Experimental | Added with `continue-on-error: true` and passes with modern APIs |

## Changes Made

- **`MATRIX-AUDIT.md`**: Detailed failure logs, classifications, and resolution plans for all combinations.
- **`src/fileUtils.js`**: Replaced literal forward-slash string concatenation with `path.join` for cross-platform compatibility.
- **`src/fileUtils.test.js`**: Normalized `\r\n` line endings to `\n` before asserting file content.
- **`src/cryptoUtils.js`**: Migrated `createCipher`/`createDecipher` to `createCipheriv`/`createDecipheriv` with key derivation (`crypto.scryptSync`) and initialization vector prepending.
- **`.github/workflows/ci.yml`**: Configured `fail-fast: false`, added Node 24 experimental runtime with `continue-on-error`.
