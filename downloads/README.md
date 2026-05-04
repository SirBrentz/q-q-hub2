# Quidget plugin downloads

Every "Download Plugin" button on the site links to:

    /downloads/qualiphy.zip

To ship a new release: drop the new build into this folder as
`qualiphy.zip` (overwriting whatever's there), commit, and push. The
buttons keep working — no link changes needed.

Keep the filename exactly `qualiphy.zip`. Don't rename to a versioned
filename here; the version chip on the site reads from the Qualiphy
roadmap API, not from this folder.
