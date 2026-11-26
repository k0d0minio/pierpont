# Client requests

This folder belongs to the repo. Each request of the client is one file
`REQ-<slug>-<n>.md`, from `.icm/_system/templates/request.md`, with its capture
`REQ-<slug>-<n>.capture.json` and its screenshot when the request button made it.

The rules are in `.icm/_system/features/requests.md`. The job `icm-check` checks each
request file with `.icm/_system/scripts/check-request.sh`.
