import json
import tempfile
import time
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from tools.remix_harness_server import RemixHarness, create_app, parse_model_payload, sanitize_slug


SAMPLE_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Source</title></head>
<body data-printer-artifact="fake-game-library" data-game-page="source-game">
<div class="phone-shell"></div>
<script>
window.__PRINTER_ARTIFACT__ = {"game":{"id":"source-game","title":"Source Game","kind":"动作","source_game":"test"}};
window.render_game_to_text = () => "{}";
window.advanceTime = () => {};
</script>
</body></html>"""


GENERATED_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Neon Queue</title></head>
<body data-printer-artifact="fake-game-library" data-game-page="neon-queue">
<div class="phone-shell">remix</div>
<script>
window.__PRINTER_ARTIFACT__ = {"parent_file":"source-game.html","remix_prompt":"make it neon","agent_description_file":"source-game-neon-queue.remix.json"};
window.render_game_to_text = () => JSON.stringify({mode:"remix"});
window.advanceTime = () => {};
</script>
</body></html>"""


RAW_PAYLOAD_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Raw Neon</title></head>
<body data-printer-artifact="fake-game-library" data-game-page="raw-neon">
<div class="phone-shell">raw remix</div>
<script>
window.__PRINTER_ARTIFACT__ = {"parent_file":"source-game.html","remix_prompt":"make it raw","agent_description_file":"raw-neon.remix.json"};
window.render_game_to_text = () => JSON.stringify({mode:"raw"});
window.advanceTime = () => {};
</script>
</body></html>"""


GENERATED_FAKE_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>Drawer Storm</title></head>
<body data-printer-artifact="fake-game-library" data-game-page="drawer-storm">
<div class="phone-shell">fake from scratch</div>
<script>
window.__PRINTER_ARTIFACT__ = {"game":{"id":"drawer-storm","title":"Drawer Storm","kind":"Fake"}};
window.render_game_to_text = () => JSON.stringify({mode:"fake"});
window.advanceTime = () => {};
</script>
</body></html>"""


class FakeGenerator:
    def generate_remix(self, context):
        return {
            "title": "Source Game · Neon Queue",
            "slug_suggestion": "source-game-neon-queue",
            "html": GENERATED_HTML,
            "agent_description": {
                "one_liner": "A neon queue remix.",
                "core_loop": "Tap, bump, and hold a lane for 20 seconds.",
                "controls": "Touch drag or arrow keys.",
                "mechanics": ["lane pressure", "queue combo"],
                "visual_language": "Neon black with cyan pulses.",
                "state_model": "score, combo, timer, fail state",
                "share_hook": "Queue rank card.",
                "known_constraints": ["离线单文件", "移动竖屏", "无外链"],
                "next_evolution_hooks": ["add boss rush"],
            },
        }


class FakeFromScratchGenerator:
    def generate_fake_game(self, context):
        return {
            "title": "Drawer Storm",
            "slug_suggestion": "drawer-storm",
            "kind": "Fake",
            "accent": "#ffcf33",
            "glyph": "造",
            "html": GENERATED_FAKE_HTML,
            "agent_description": {
                "one_liner": "A from-scratch drawer sorting fake game.",
                "core_loop": "Drag loose items into matching drawers before the desk overflows.",
                "controls": "Touch drag or click.",
                "mechanics": ["sorting", "overflow timer"],
                "visual_language": "Warm desk lights with punchy item pops.",
                "state_model": "score, streak, desk clutter, timer",
                "share_hook": "Desk cleanliness rank card.",
                "known_constraints": ["离线单文件", "移动竖屏", "无外链"],
                "next_evolution_hooks": ["add rare item events"],
            },
        }


class FakeTranscriber:
    def transcribe(self, file_path):
        return "make it neon from voice"


class RemixHarnessTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.output_dir = Path(self.tmp.name)
        (self.output_dir / "source-game.html").write_text(SAMPLE_HTML, encoding="utf-8")
        (self.output_dir / "fake_manifest.json").write_text(
            json.dumps(
                {
                    "games": [
                        {
                            "id": "source-game",
                            "file": "source-game.html",
                            "title": "Source Game",
                            "kind": "动作",
                            "source_game": "test",
                        }
                    ]
                }
            ),
            encoding="utf-8",
        )

    def tearDown(self):
        self.tmp.cleanup()

    def test_sanitize_slug_blocks_path_traversal(self):
        self.assertEqual(sanitize_slug(" My Remix!! "), "my-remix")
        with self.assertRaises(ValueError):
            sanitize_slug("../escape")
        with self.assertRaises(ValueError):
            sanitize_slug("...")

    def test_parse_model_payload_accepts_meta_block_and_raw_html(self):
        raw = (
            '<remix_meta>{"title":"Raw Neon","slug_suggestion":"raw-neon",'
            '"agent_description":{"one_liner":"Raw output remix."}}</remix_meta>\n'
            + RAW_PAYLOAD_HTML
        )

        parsed = parse_model_payload(raw)

        self.assertEqual(parsed["title"], "Raw Neon")
        self.assertEqual(parsed["slug_suggestion"], "raw-neon")
        self.assertTrue(parsed["html"].startswith("<!DOCTYPE html>"))
        self.assertEqual(parsed["agent_description"]["one_liner"], "Raw output remix.")

    def test_publish_draft_writes_html_description_and_manifest(self):
        harness = RemixHarness(self.output_dir, generator=FakeGenerator(), transcriber=FakeTranscriber())

        draft = harness.create_draft(
            source_file="source-game.html",
            prompt_text="make it neon",
            voice_transcript="",
        )
        published = harness.publish_draft(
            draft_id=draft["draft_id"],
            slug="renamed-remix",
            title="Source Game · Neon Queue",
            agent_description=draft["agent_description"],
        )

        self.assertEqual(published["file"], "renamed-remix.html")
        published_html = (self.output_dir / "renamed-remix.html")
        self.assertTrue(published_html.exists())
        self.assertIn("renamed-remix.remix.json", published_html.read_text(encoding="utf-8"))
        description_path = self.output_dir / "renamed-remix.remix.json"
        self.assertTrue(description_path.exists())
        description = json.loads(description_path.read_text(encoding="utf-8"))
        self.assertEqual(description["schema_version"], 1)
        self.assertEqual(description["source_file"], "source-game.html")
        self.assertEqual(description["files"]["html"], "renamed-remix.html")
        self.assertEqual(description["agent_description"]["one_liner"], "A neon queue remix.")
        manifest = json.loads((self.output_dir / "remix_manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(len(manifest["remixes"]), 1)
        self.assertIn("window.__PRINTER_REMIX_MANIFEST__", (self.output_dir / "remix_manifest.js").read_text(encoding="utf-8"))

        with self.assertRaises(FileExistsError):
            harness.publish_draft(
                draft_id=draft["draft_id"],
                slug="renamed-remix",
                title="Duplicate",
                agent_description=draft["agent_description"],
            )

    def test_create_fake_draft_publishes_as_fake_manifest_entry(self):
        harness = RemixHarness(self.output_dir, fake_generator=FakeFromScratchGenerator())

        draft = harness.create_fake_draft(
            prompt_text="fake a drawer sorting game from zero",
            voice_transcript="",
        )
        published = harness.publish_draft(
            draft_id=draft["draft_id"],
            slug="drawer-storm",
            title=draft["title"],
            agent_description=draft["agent_description"],
        )

        self.assertEqual(published["file"], "drawer-storm.html")
        html = (self.output_dir / "drawer-storm.html").read_text(encoding="utf-8")
        self.assertIn('"creation_mode": "scratch"', html)
        self.assertIn('"parent_file": "__scratch__.html"', html)
        description = json.loads((self.output_dir / "drawer-storm.remix.json").read_text(encoding="utf-8"))
        self.assertEqual(description["origin"], "scratch")
        self.assertEqual(description["source_file"], "__scratch__.html")
        manifest = json.loads((self.output_dir / "remix_manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["remixes"][0]["kind"], "Fake")
        self.assertEqual(manifest["remixes"][0]["glyph"], "造")

    def test_api_draft_publish_and_transcribe_with_fake_clients(self):
        harness = RemixHarness(self.output_dir, generator=FakeGenerator(), transcriber=FakeTranscriber())
        client = TestClient(create_app(harness))

        sources = client.get("/api/remix/sources")
        self.assertEqual(sources.status_code, 200)
        self.assertEqual(sources.json()["sources"][0]["file"], "source-game.html")

        transcript = client.post(
            "/api/remix/transcribe",
            files={"file": ("voice.webm", b"voice-bytes", "audio/webm")},
        )
        self.assertEqual(transcript.status_code, 200)
        self.assertEqual(transcript.json()["transcript"], "make it neon from voice")

        draft = client.post(
            "/api/remix/draft",
            json={"source_file": "source-game.html", "prompt_text": "make it neon", "voice_transcript": ""},
        )
        self.assertEqual(draft.status_code, 200)
        draft_body = draft.json()
        self.assertTrue(draft_body["preview_url"].endswith("/index.html"))

        publish = client.post(
            "/api/remix/publish",
            json={
                "draft_id": draft_body["draft_id"],
                "slug": "source-game-neon-queue",
                "title": draft_body["title"],
                "agent_description": draft_body["agent_description"],
            },
        )
        self.assertEqual(publish.status_code, 200)
        self.assertEqual(publish.json()["description_file"], "source-game-neon-queue.remix.json")

    def test_api_draft_job_reports_progress_and_completes(self):
        harness = RemixHarness(self.output_dir, generator=FakeGenerator(), transcriber=FakeTranscriber())
        client = TestClient(create_app(harness))

        created = client.post(
            "/api/remix/draft-jobs",
            json={"source_file": "source-game.html", "prompt_text": "make it neon", "voice_transcript": ""},
        )
        self.assertEqual(created.status_code, 200)
        job_id = created.json()["job_id"]

        status = client.get(f"/api/remix/draft-jobs/{job_id}")
        for _ in range(20):
            body = status.json()
            if body["status"] == "done":
                break
            time.sleep(0.02)
            status = client.get(f"/api/remix/draft-jobs/{job_id}")

        body = status.json()
        self.assertEqual(body["status"], "done")
        self.assertEqual(body["percent"], 100)
        self.assertIn("draft", body)
        self.assertTrue(body["draft"]["preview_url"].endswith("/index.html"))

    def test_api_fake_draft_job_reports_progress_and_completes(self):
        harness = RemixHarness(self.output_dir, fake_generator=FakeFromScratchGenerator())
        client = TestClient(create_app(harness))

        created = client.post(
            "/api/fake/draft-jobs",
            json={"prompt_text": "fake a drawer sorting game from zero", "voice_transcript": ""},
        )
        self.assertEqual(created.status_code, 200)
        job_id = created.json()["job_id"]

        status = client.get(f"/api/fake/draft-jobs/{job_id}")
        for _ in range(20):
            body = status.json()
            if body["status"] == "done":
                break
            time.sleep(0.02)
            status = client.get(f"/api/fake/draft-jobs/{job_id}")

        body = status.json()
        self.assertEqual(body["status"], "done")
        self.assertEqual(body["percent"], 100)
        self.assertIn("draft", body)
        self.assertEqual(body["draft"]["title"], "Drawer Storm")


if __name__ == "__main__":
    unittest.main()
