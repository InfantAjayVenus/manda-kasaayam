# TODO: README vs Implementation Discrepancies

## Unimplemented Features from docs/README.en.md

These are behaviors described in the README but not yet implemented in the code. Prioritize based on user requirements.

1. **Automatic Addition of Date Header**
   - Description: New notes should start with a `# YYYY-MM-DD` header (e.g., `# 2025-11-29`).
   - Status: Not implemented. Currently, notes are created without this header.
   - Action: Modify `NoteService.generateNoteWithIncompleteTasks` to prepend the date header automatically.

2. **Consistent Previous-Day Link**
   - Description: Every note should include a link to the previous day's note (e.g., `[2025-11-28](2025-11-28.md)`).
   - Status: Partially implemented—only added when carrying incomplete tasks. Missing when no tasks are carried.
   - Action: Update note generation to always include the previous-day link, even without tasks.

3. **Carrying Completed Tasks (Potential Mismatch)**
   - Description: The README example shows completed tasks (`- [x]`) being carried alongside incomplete ones for historical context.
   - Status: Not implemented. Only incomplete tasks are carried.
   - Action: Clarify if this is desired; if yes, extend `NoteService.collectIncompleteTasksFromPreviousNotes` to include completed tasks.

## Notes

- Other features (daily notes, organization, timestamps, TUI, preview, git) are fully implemented and aligned.
- Review and update the README example if these features are not needed.
