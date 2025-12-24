# TODO

## Basic working

- [ ] _CI_: Should look into automated versioning and tagging.
- [ ] _Bug_: The `manda see` navigation skips to existing note when going backward (h), but walks through all the dates when going forward(l).
- [ ] _Bug_: The `manda see` preview is miscalculating the window height. The scroll area is significantly larger than the actual window height.

## Lazy Mode

- [ ] As a user, I'll have the sub-command `lazy` available, such that, when I invoke the command `manda lazy`, a TUI like lazygit.
- [ ] The TUI should have a main pane which shows the contents and a side pane which lists the dates of available notes
- [ ] Navigating across the panes should be through numbers. 0 - main pane, 1 for dates list pane.
- [ ] Navigation inside a pane should follow vim motions.
- [ ] When user enters the key `e`, if the active content is today's, the editor should open. Otherwise a toast notification saying cannot edit older notes should be shown.
