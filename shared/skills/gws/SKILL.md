---
name: gws
description: "Google Workspace CLI for AI agents. Use when the user wants to interact with Gmail, Google Drive, Calendar, Sheets, Docs, Chat, Meet, Tasks, Forms, or any Google Workspace API. Triggers for email operations (send, read, search), file management (upload, download, share), calendar events, spreadsheet data, document editing, and cross-service workflows. Even if the user doesn't explicitly mention 'gws' or 'Google Workspace', use this skill for any Google productivity tool operations."
---

# gws — Google Workspace CLI for AI Agents

One CLI for all Google Workspace APIs. Zero boilerplate, structured JSON output.

## Installation

```bash
npm install -g @googleworkspace/cli
```

Or with Homebrew: `brew install googleworkspace-cli`

## Authentication

```bash
# Interactive setup (requires gcloud CLI)
gws auth setup

# Or manual OAuth login
gws auth login

# Service account / headless
export GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE=/path/to/key.json

# Pre-existing token (e.g., from gcloud)
export GOOGLE_WORKSPACE_CLI_TOKEN=$(gcloud auth print-access-token)
```

## Core Syntax

```bash
gws <service> <resource> [sub-resource] <method> [flags]
```

| Flag | Description |
|------|-------------|
| `--params '<JSON>'` | URL/query parameters (e.g., `id`, `q`, `pageSize`) |
| `--json '<JSON>'` | Request body for POST/PUT/PATCH |
| `--fields '<MASK>'` | Limit response fields (CRITICAL for context window efficiency) |
| `--page-all` | Auto-paginate, output as NDJSON |
| `--dry-run` | Preview request without executing |
| `--upload <PATH>` | Upload file content (multipart) |
| `--output <PATH>` | Save binary responses to file |
| `--sanitize <TEMPLATE>` | Screen responses through Model Armor |

## Available Services

| Service | Description | Key Resources |
|---------|-------------|---------------|
| `gmail` | Email operations | `users.messages`, `users.drafts`, `users.labels`, `users.threads` |
| `drive` | File storage | `files`, `drives`, `permissions`, `comments` |
| `sheets` | Spreadsheets | `spreadsheets`, `spreadsheets.values` |
| `calendar` | Events & calendars | `events`, `calendars`, `calendarList` |
| `docs` | Documents | `documents` |
| `slides` | Presentations | `presentations` |
| `chat` | Google Chat | `spaces`, `spaces.messages` |
| `meet` | Video meetings | `conferences`, `records` |
| `tasks` | Task management | `tasklists`, `tasks` |
| `forms` | Forms & responses | `forms`, `forms.responses` |
| `people` | Contacts | `people`, `contactGroups` |
| `classroom` | Education | `courses`, `courseWork`, `students` |
| `admin` | Admin SDK | `users`, `groups`, `reports` |
| `modelarmor` | Content safety | `templates`, `sanitize` |

## Helper Commands (Shortcuts)

Helper commands are prefixed with `+` and provide simplified interfaces for common operations:

### Gmail Helpers
```bash
gws gmail +send --to user@example.com --subject "Subject" --body "Message"
gws gmail +reply --message-id MSG_ID --body "Reply text"
gws gmail +reply-all --message-id MSG_ID --body "Reply all"
gws gmail +forward --message-id MSG_ID --to recipient@example.com
gws gmail +triage                    # Show unread inbox summary
gws gmail +watch                     # Stream new emails as NDJSON
```

### Drive Helpers
```bash
gws drive +upload ./file.pdf --name "Document Name"
```

### Sheets Helpers
```bash
gws sheets +read --spreadsheet ID --range "Sheet1!A1:D10"
gws sheets +append --spreadsheet ID --values "Alice,95,Pass"
```

### Calendar Helpers
```bash
gws calendar +insert --summary "Meeting" --start "2024-01-15T10:00:00" --end "2024-01-15T11:00:00"
gws calendar +agenda                 # Show upcoming events (uses account timezone)
gws calendar +agenda --today --timezone America/New_York
```

### Docs Helpers
```bash
gws docs +write --document-id DOC_ID --text "Content to append"
```

### Chat Helpers
```bash
gws chat +send --space spaces/XXXXX --text "Hello team"
```

### Workflow Helpers (Cross-service)
```bash
gws workflow +standup-report         # Today's meetings + open tasks
gws workflow +meeting-prep           # Next meeting: agenda, attendees, docs
gws workflow +email-to-task --message-id MSG_ID
gws workflow +weekly-digest          # Weekly summary
gws workflow +file-announce --file-id FILE_ID --space spaces/XXXXX
```

### Events Helpers (Webhooks)
```bash
gws events +subscribe --target https://example.com/webhook
gws events +renew --subscription SUBSCRIPTION_ID
```

### ModelArmor Helpers
```bash
gws modelarmor +create-template --template-id my-template
gws modelarmor +sanitize-prompt --template projects/P/locations/L/templates/T --text "User input"
gws modelarmor +sanitize-response --template projects/P/locations/L/templates/T --text "Model output"
```

## Common Patterns

### Reading Data (GET/LIST)

Always use `--fields` to minimize context window usage:

```bash
# List recent Drive files
gws drive files list --params '{"pageSize": 10}' --fields "files(id,name,mimeType)"

# Search Gmail
gws gmail users messages list --params '{"userId": "me", "q": "from:boss@example.com"}' --fields "messages(id,threadId)"

# Get message details
gws gmail users messages get --params '{"userId": "me", "id": "MSG_ID"}' --fields "id,snippet,payload(headers,to,from,subject)"

# Read spreadsheet range
gws sheets spreadsheets values get --params '{"spreadsheetId": "ID", "range": "Sheet1!A1:C10"}'

# List calendar events
gws calendar events list --params '{"calendarId": "primary", "maxResults": 10}' --fields "items(id,summary,start,end)"
```

### Writing Data (POST/PUT/PATCH)

Use `--json` for request body:

```bash
# Send email (raw RFC 2822 base64url encoded)
gws gmail users messages send --params '{"userId": "me"}' --json '{"raw": "BASE64_ENCODED_MESSAGE"}'

# Create spreadsheet
gws sheets spreadsheets create --json '{"properties": {"title": "New Spreadsheet"}}'

# Create calendar event
gws calendar events insert --params '{"calendarId": "primary"}' --json '{"summary": "Meeting", "start": {"dateTime": "2024-01-15T10:00:00"}, "end": {"dateTime": "2024-01-15T11:00:00"}}'

# Create Drive folder
gws drive files create --json '{"name": "New Folder", "mimeType": "application/vnd.google-apps.folder"}'
```

### File Uploads

```bash
# Upload file to Drive
gws drive files create --json '{"name": "report.pdf"}' --upload ./report.pdf

# Upload with parent folder
gws drive files create --json '{"name": "doc.pdf", "parents": ["FOLDER_ID"]}' --upload ./doc.pdf
```

### File Downloads

```bash
# Download file content
gws drive files get --params '{"fileId": "FILE_ID", "alt": "media"}' --output ./downloaded.pdf

# Export Google Doc as PDF
gws drive files export --params '{"fileId": "DOC_ID", "mimeType": "application/pdf"}' --output ./exported.pdf
```

### Pagination

Use `--page-all` for large collections:

```bash
# Stream all files (NDJSON output)
gws drive files list --params '{"pageSize": 100}' --page-all

# Process with jq
gws drive files list --page-all | jq -r '.files[].name'
```

### Schema Introspection

Before calling unfamiliar APIs, check the schema:

```bash
gws schema drive.files.list
gws schema sheets.spreadsheets.create
gws schema gmail.users.messages.send
```

## Security Rules

1. **Always** use `--dry-run` for mutating operations before executing
2. **Always** confirm with user before executing write/delete commands
3. **Always** use `--fields` to limit response size and protect context window
4. **Never** output secrets (API keys, tokens) directly
5. Use `--sanitize` when processing untrusted user content

## Shell Escaping Tips

- **JSON in shell**: Wrap `--params` and `--json` in single quotes:
  ```bash
  gws drive files list --params '{"pageSize": 5}'
  ```

- **Sheet ranges with `!`**: In zsh, use double quotes:
  ```bash
  gws sheets +read --spreadsheet ID --range "Sheet1!A1:D10"
  ```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | API error (4xx/5xx) |
| 2 | Auth error |
| 3 | Validation error |
| 4 | Discovery error |
| 5 | Internal error |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_WORKSPACE_CLI_TOKEN` | Pre-obtained OAuth token (highest priority) |
| `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE` | Path to credentials JSON |
| `GOOGLE_WORKSPACE_CLI_CONFIG_DIR` | Config directory (default: `~/.config/gws`) |
| `GOOGLE_WORKSPACE_CLI_LOG` | Log level (e.g., `gws=debug`) |
| `GOOGLE_WORKSPACE_PROJECT_ID` | GCP project for quota/billing |

## Getting Help

```bash
gws --help                          # General help
gws <service> --help                # Service help (shows all resources & helpers)
gws <service> <resource> --help     # Resource help
gws schema <service>.<resource>.<method>  # Method schema
```

## Repository

- GitHub: https://github.com/googleworkspace/cli
- Issues: https://github.com/googleworkspace/cli/issues
