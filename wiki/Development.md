# Development & Testing

This document contains information relevant to developers contributing to the Star Citizen bot.

## Dependencies and Technologies

*   **Runtime:** Node.js (v18+ recommended)
*   **Language:** TypeScript
*   **Discord Library:** `discord.js` (v14)
*   **Database:** PostgreSQL (`pg`)
*   **ORM:** Sequelize
*   **Scheduling:** `node-cron`
*   **HTTP Client:** `axios`
*   **Environment Variables:** `dotenv`

## Project Structure

*   `src/`: Main source code directory.
    *   `commands/`: Slash command definitions and logic.
    *   `models/`: Sequelize database models representing tables (`Contract.ts`, `Location.ts`, `Material.ts`).
    *   `utils/`: Shared helper functions (e.g., `config.ts` for validation).
    *   `cron.ts`: Setup for automated tasks.
    *   `database.ts`: Sequelize connection initialization.
    *   `index.ts`: The main entry point for the Discord bot, handling client creation, event listening, and command registration.
    *   `initDb.ts`: Script for syncing database models.
    *   `interactions.ts`: Centralized logic for handling button interactions.
    *   `syncUexData.ts`: Logic for fetching data from the UEXCorp API.
*   `tests/`: Unit tests for the application.

## Testing

The project uses the built-in Node.js test runner (`node:test`) and assertions (`node:assert`) for unit testing. This requires Node.js v18 or newer.

To run tests directly from TypeScript files, you can use `tsx` or standard `node --experimental-strip-types`:

### Running Tests (Node.js 22+)

```bash
# Run a specific test file
node --experimental-strip-types tests/example.test.ts

# Run all tests
node --experimental-strip-types --test tests/*.test.ts
```

*Note: You may need to temporarily adjust import extensions from `.js` to `.ts` within test files to resolve modules correctly when using `node --experimental-strip-types`.*

### Running Tests (using tsx)

```bash
npx tsx tests/example.test.ts
```

Or run all tests:

```bash
npx tsx --test tests/*.test.ts
```

Ensure required environment variables like `DATABASE_URL` are set when running tests.

```bash
DATABASE_URL=postgres://user:pass@localhost:5432/dbname npx tsx --test tests/*.test.ts
```

### Mocking in Tests

When mocking methods in tests using `node:test`, prefer using `t.mock.method(object, "methodName")`. This ensures automatic restoration of original implementations and maintains test isolation.

## Code Quality

The project includes `eslint` and `prettier` for maintaining code quality and formatting. Ensure your code passes linting checks before submitting a pull request.

## Pull Request Conventions

Pull request titles and descriptions should follow specific conventions based on the type of change:

*   **Testing Improvements:**
    *   Title: `🧪 [description]`
    *   Description Sections: `🎯 What`, `📊 Coverage`, `✨ Result`
*   **Security Fixes:**
    *   Title: `🔒 [security fix description]`
    *   Description Sections: `🎯 What`, `⚠️ Risk`, `🛡️ Solution`
*   **Performance Improvements:**
    *   Title: `⚡ [description]`
    *   Description Sections: `💡 What`, `🎯 Why`, `📊 Measured Improvement`
*   **Code Health Improvements:**
    *   Title: `🧹 [description]`
    *   Description Sections: `🎯 What`, `💡 Why`, `✅ Verification`, `✨ Result`

## Important Guidelines

*   **TypeScript Imports:** Imports within the repository must use the `.js` extension (or be extensionless if supported) to comply with the ES modules (ESM) configuration.
*   **Type Imports:** The TypeScript configuration has `verbatimModuleSyntax` enabled. This means types must be imported using a type-only import (e.g., `import type { Interaction } from "discord.js";`).
*   **Logging:** Avoid using `console.error` with raw error objects. Instead, use the `logError` utility (if available in `src/utils/logger.ts`) to format and redact stack traces for security.
*   **Data Validation:** Always validate numeric IDs (e.g., `contractId`) extracted from Discord interaction `customId` with `isNaN()` before executing database queries like `findByPk`.
*   **Model Associations:** Sequelize models should explicitly define associated properties (e.g., `public readonly Material?: Material;`) for improved type safety. Verify attribute types in tests using `.type.constructor.name` instead of `.type.toString()`.
