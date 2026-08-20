#!/usr/bin/env python3
"""Generate the single-file index.ts that the Supabase dashboard deploys.

The dashboard editor deploys whatever files you have created in it, and it is
easy to paste one file, hit Deploy, and get "Module not found" for the other.
So the deployed function is one file with no relative imports at all.

autoreply.ts stays the source of truth: it is pure, Node can run it, and the
tests import from it. This script concatenates it with the handler. A test
asserts the copy inside index.ts still matches, so they cannot drift.

    python3 supabase/functions/notify-lead/build-index.py
"""
import pathlib, re

here = pathlib.Path(__file__).parent
helper = (here / "autoreply.ts").read_text()
handler = (here / "handler.part.ts").read_text()

banner = """// GENERATED FILE - do not edit this directly.
//
// Built by build-index.py from autoreply.ts + handler.part.ts, so that the
// function deploys as a single file with no relative imports. The dashboard
// editor makes it easy to deploy one file and miss the other, and a missing
// import takes the lead notification down with it.
//
// Edit autoreply.ts or handler.part.ts, then re-run:
//     python3 supabase/functions/notify-lead/build-index.py

"""

# the helper's own header comment is redundant once merged
# Imports have to sit at the top of the module, so lift them out of the handler
# rather than leaving them stranded in the middle of the concatenated file.
imports = re.findall(r'^import .*$', handler, re.M)
handler_body = re.sub(r'^import .*$\n?', "", handler, flags=re.M).lstrip()

out = (
    banner
    + "\n".join(imports)
    + "\n\n"
    + helper.rstrip()
    + "\n\n"
    + handler_body
)
(here / "index.ts").write_text(out)
print(f"index.ts written: {len(out)} bytes, {out.count(chr(10))} lines")

leftover = re.findall(r'^import .*from "\./.*$', out, re.M)
print("relative imports remaining:", leftover or "none")
