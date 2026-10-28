"""Uploads the test profiles' placeholder photos (uploads.json) to Supabase
storage, signed in as an ON admin, through the local dev server.

    python docs/seed/upload_photos.py <admin-email> <password>
"""
import base64
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "on-partner-pack"))
from cdp import Browser  # noqa: E402

HERE = Path(__file__).parent
EMAIL, PASSWORD = sys.argv[1], sys.argv[2]
uploads = json.loads((HERE / "uploads.json").read_text())

b = Browser(port=9344)
try:
    for _ in range(10):
        b.goto("http://localhost:5180/privacy", wait=4)
        if b.js("location.host") == "localhost:5180":
            break
    print(b.js("import('/src/lib/supabaseClient.js').then(m => (window.__sb = m.supabase).auth.signInWithPassword({ email: %s, password: %s })).then(r => r.error ? r.error.message : 'signed in')" % (json.dumps(EMAIL), json.dumps(PASSWORD))))
    done = 0
    for u in uploads:
        b64 = base64.b64encode((HERE / "photos" / u["local"]).read_bytes()).decode()
        r = b.js(
            "(async () => { const bin = Uint8Array.from(atob(%s), c => c.charCodeAt(0));"
            " const { error } = await window.__sb.storage.from('on-media').upload(%s, new Blob([bin], { type: 'image/jpeg' }), { contentType: 'image/jpeg', upsert: true });"
            " return error ? error.message : 'ok'; })()" % (json.dumps(b64), json.dumps(u["path"]))
        )
        if r != "ok":
            print(u["path"], r)
        else:
            done += 1
    print(f"uploaded {done}/{len(uploads)}")
    b.js("window.__sb.auth.signOut({ scope: 'local' }).then(() => true)")
finally:
    b.close()
