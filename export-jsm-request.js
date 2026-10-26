// Export a Jira Service Management customer-portal request (fields, comments, attachments)
// into a local folder using your logged-in browser session.
// Usage: paste into the DevTools console on the request page, press Enter, then click the page.

document.addEventListener('click', async () => {
  const key = (location.pathname.match(/[A-Z][A-Z0-9]+-\d+/) || [])[0]
    || prompt('Request key (e.g. ABC-123):');
  if (!key) return console.warn('No request key found.');

  const base = `/rest/servicedeskapi/request/${key}`;
  const opts = { headers: { Accept: 'application/json', 'X-ExperimentalApi': 'opt-in' } };

  const dir = await showDirectoryPicker({ mode: 'readwrite' });
  const folder = await dir.getDirectoryHandle(key, { create: true });

  const write = async (name, data) => {
    const fh = await folder.getFileHandle(name.replace(/[\\/:*?"<>|]/g, '_'), { create: true });
    const w = await fh.createWritable();
    await w.write(data);
    await w.close();
  };

  const getAll = async (path) => {
    let start = 0, out = [];
    for (;;) {
      const sep = path.includes('?') ? '&' : '?';
      const r = await fetch(`${path}${sep}start=${start}&limit=100`, opts).then(r => r.json());
      out.push(...(r.values || []));
      if (r.isLastPage !== false) break;
      start += r.size;
    }
    return out;
  };

  const request = await fetch(`${base}?expand=participant,status,sla,requestType`, opts).then(r => r.json());
  const comments = await getAll(`${base}/comment?expand=attachment,renderedBody`);
  const attachments = await getAll(`${base}/attachment`);

  await write(`${key}.json`, JSON.stringify({ request, comments, attachments }, null, 2));

  const seen = {};
  for (const att of attachments) {
    let name = att.filename;
    if (seen[name]) name = name.replace(/(\.[^.]*)?$/, `_${seen[name]}$1`);
    seen[att.filename] = (seen[att.filename] || 0) + 1;
    await write(name, await fetch(att._links.content).then(r => r.blob()));
  }
  console.log(`Done: ${comments.length} comments, ${attachments.length} attachments saved to ${key}/`);
}, { once: true });

console.log('Now click anywhere on the page to choose a folder…');
