# Stage — Ticket

Language: en

## Purpose
Turn the operator's words into one ticket that a run can start from. This stage writes
no product code, makes no branch and opens no pull request. It does not start the work.

## Inputs
- The operator's message: what is wrong or what is wanted.
- `.icm/_system/rules/ticket.md`.
- `.icm/_system/templates/stub-markdown.md`.
- The names of the folders and files in `.icm/intake/`, to find a duplicate or an epic.
- `.icm/project-rules.md`, only for the names of things.
- `.icm/_system/features/requests.md`, when the words are the client's.

Do not read the product code. One search to confirm a name or a path is permitted.

## Process
1. Find the one unit of work. If the message holds more than one, list the units and
   ask which one to write first. One ticket is one pull request.
2. Choose the lane, and say why in one sentence:
   - `bug`: the product does not do what it did, or what was agreed.
   - `tweak`: a small change that a user sees, with no new behaviour.
   - `chore`: upkeep that no user sees.
   - `hotfix`: production is broken now. Only when the operator says so.
   - `handover`: the record that the client needs to run the repo alone.
   - `knowledge`: one page of the project docs.
   - `spine`: all other work. It needs a spec and the Spec approved gate.
3. Find the questions: only what changes the ticket, three at most. Do not ask them in
   the chat. Write them in the format of `.icm/_system/rules/questions.md`, each with a
   default. The operator answers them on the HUD when the run starts. If the message is
   sufficient, write no question.
4. Write the acceptance criteria. Each one is a result that a person can see and check.
   Two to five criteria. Do not write how to build it. When the words are the client's
   (a mail, a meeting, a call), first write the client request
   (`features/requests.md`), and copy its AC lines: `<id>#AC-<n>: WHEN ...`.
5. Choose the place: `.icm/intake/triage/` for work that stands alone, or the epic
   folder that the operator names.
6. Choose the slug: kebab-case, two to five words, the thing and the change. Stop if a
   stub, a run or an archived run has that slug.
7. Write `.icm/intake/<place>/<slug>.md` from the template: the title, `complexity`,
   `lane`, Problem, Acceptance criteria, Questions. Do not commit it. `new-run.sh` takes the stub
   onto the branch of its run.
8. Stop with the stop report of `.icm/_system/rules/output.md`. Show the title, the lane
   and the criteria. The operator's act: read the stub, then say the start command.
   For a lane: `<lane> <place>/<slug>`. For `spine`: `new <place>/<slug>`.

## Outputs
- One stub file in `.icm/intake/`, not committed.
- No branch, no run folder, no pull request.

## Gates
- None. The start command is the operator's approval of the ticket.
