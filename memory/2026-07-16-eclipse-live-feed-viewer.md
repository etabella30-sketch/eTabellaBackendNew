# Debug report — Eclipse capture live-feed viewer

- **Symptom:** `http://localhost:8090/` returned only `eclipse-capture rig up`, while TCP bytes were visible only in the server terminal and capture files.
- **Root cause:** The capture rig had no browser-facing feed endpoint or viewer. A stale browser page also kept sending HTTP requests to raw TCP port `5555`, making non-Eclipse traffic look like active feed connections.
- **Fix:** Added a read-only live viewer at `/`, a bounded JSON event endpoint at `/api/feed`, active TCP/WebSocket connection status, pause/clear/auto-scroll controls, and `/health`. HTTP-shaped traffic received on the TCP port is still captured for forensic completeness but is excluded from the live transcript and connection count.
- **Evidence:** `node tools/eclipse-capture/smoke-test.js` passes. Live browser verification showed one Eclipse connection from `192.168.1.7`, updating chunk/byte counters, and incoming transcript text. The server terminal continued recording the same TCP stream.
- **Regression test:** `tools/eclipse-capture/smoke-test.js` verifies HTML delivery, JSON feed data, transcript visibility, browser-probe filtering, forensic retention, WebSocket/TCP byte identity, and shutdown flushing.
- **Related:** Capture file semantics remain unchanged: `frames.ndjson` and `payload.bin` still contain raw incoming bytes, including HTTP probes and credentials.
- **Status:** DONE

## Duplicate rows after Eclipse refresh

- **Symptom:** Corrected transcript segments appeared more than once, sometimes with the same displayed second and different line/format metadata.
- **Root cause:** Eclipse sent multiple complete `R ... E` snapshots with the same valid start time but the undocumented invalid end marker `54 1F 17 13`. Between consecutive captured snapshots, 40â€“57 canonical `(page, N, T)` keys changed. The viewer's invalid-end fallback removed only exact replacement keys, so rows from the prior snapshot survived when `N` or `T` moved.
- **Fix:** Matched Bridge Mobile's implementation: convert the four `R` boundary bytes directly to a scalar without clock validation, remove the half-open `[start, end)` range, and insert the buffered replacement atomically at `E`. Eclipse's `54 1F 17 13` end bytes therefore act as an end-of-document sentinel.
- **Evidence:** The raw command-only capture analysis found repeated sentinel-end snapshots and large key-set changes. Inspection of the installed Bridge Mobile GWT code confirmed its separate `refreshlines` buffer and scalar range replacement. The browser regression reproduced 6 rows instead of 3 before the fix and passed after it, including stale-tail removal and post-`E` realtime delivery.
- **Regression test:** `tools/eclipse-capture/viewer-refresh-test.js` (`npm run test:viewer-refresh`).
- **Status:** DONE
