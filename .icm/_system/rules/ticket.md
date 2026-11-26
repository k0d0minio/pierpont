# Ticket rules

The stubs in `.icm/intake/` are the tickets. A stub is a markdown file.

## Rules
1. **The path is the identity.** A ticket is `<epic>/<slug>` or `triage/<slug>`. The slug
   is kebab-case. There are no ticket numbers.
2. **The folder is the status.** An open stub is in its epic folder or in `triage/`. A
   finished stub is in the `_done/` folder beside it. No other file records status.
3. **No stub, no run.** If the operator asks for work that has no stub, write the stub
   first, from `.icm/_system/templates/stub-markdown.md`.
4. **One stub, one run, one branch, one pull request.**
5. **The stub is the requirement.** If a gap changes what gets built, ask the operator.

## The intake folder
```
.icm/intake/
  <epic>/breakdown.md     what the epic is. `## Order` is set by the operator
  <epic>/<slug>.md        one unit of work
  <epic>/_done/           stubs whose pull request merged
  triage/<slug>.md        a lane ticket that belongs to no epic
  triage/_done/
```

- A new stub reaches the default branch in a pull request. It can be the pull request
  of its own run: `new-run.sh` takes an uncommitted stub onto the run's branch.
- The run id is the slug. The branch is the slug, or `triage/<slug>`.
- At the close-out the stub moves to `_done/`. The merge publishes the move.
- Work that the operator drops stays in the folder with a first line `> Dropped: <reason>`.

