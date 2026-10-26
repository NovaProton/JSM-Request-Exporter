# JSM Request Exporter

A small browser-console script that exports a **Jira Service Management customer-portal request** — all fields, every public comment and every attachment (including images pasted inline) — into a folder on your machine, in one go.

The JSM customer portal has no export button, and the agent-side *Export → Word / Printable* options aren't available to portal users. This script uses the same customer REST API the portal itself calls, authenticated by your existing browser session, so there's no API token to create and nothing to install.

## Features

- Exports request details, status, SLAs, request type and participants
- Exports every public comment, with rendered HTML bodies
- Downloads every attachment, including screenshots pasted into comments
- Handles paginated comments and attachments (100 per page)
- Renames duplicate filenames (e.g. multiple `image.png` pastes) instead of overwriting them
- Writes straight to a folder you choose — no per-file *Save As* prompts
- Detects the request key from the page URL

## Requirements

- **Chrome, Edge or another Chromium browser.** The script uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker) (`showDirectoryPicker`), which Firefox and Safari don't support.
- A customer-portal login with access to the request.

## Usage

1. Open the request in the customer portal, e.g.
   `https://<site>.atlassian.net/servicedesk/customer/portal/1/ABC-123`
2. Open DevTools (`F12` or `Ctrl`/`Cmd` + `Shift` + `I`) and go to the **Console** tab.
3. Paste the contents of [`export-jsm-request.js`](export-jsm-request.js) and press **Enter**.
   - Chrome may ask you to type `allow pasting` first — do so, then paste again.
4. **Click anywhere on the page.** Chrome only allows the folder picker after a real click.
5. Choose a destination folder and grant write access.

The console prints a summary when it finishes.

## Output

```
<chosen folder>/
└── ABC-123/
    ├── ABC-123.json      # request, comments and attachment metadata
    ├── image.png
    ├── image_1.png       # duplicate name, renamed
    └── logs.zip
```

`ABC-123.json` has three top-level keys:

| Key           | Contents                                                                |
|---------------|-------------------------------------------------------------------------|
| `request`     | Request fields, current status, SLAs, request type, participants        |
| `comments`    | All public comments, each with `body` and `renderedBody.html`            |
| `attachments` | Attachment metadata (filename, size, author, created date, links)       |

## Limitations

- **Public comments only.** Internal agent notes aren't exposed to portal customers.
- The attachment endpoint is marked *experimental* by Atlassian, hence the `X-ExperimentalApi: opt-in` header. It may change.
- Inline images in `renderedBody.html` still point at Atlassian URLs; match them to the saved files by filename.
- One request per run. Re-run on another request page to export that one.

## API endpoints used

| Endpoint                                              | Purpose                    |
|-------------------------------------------------------|----------------------------|
| `GET /rest/servicedeskapi/request/{key}`              | Request details            |
| `GET /rest/servicedeskapi/request/{key}/comment`      | Comments (paginated)       |
| `GET /rest/servicedeskapi/request/{key}/attachment`   | Attachments (paginated)    |
| `GET {attachment._links.content}`                     | Attachment file contents   |

See the [JSM Cloud REST API docs](https://developer.atlassian.com/cloud/jira/service-desk/rest/) for details.

## Security note

Only paste code you've read into the DevTools console — it runs with your full session. This script makes read-only `GET` requests to your own Atlassian site and writes only to the folder you pick.

## Licence

MIT
