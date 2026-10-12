import importlib.util
import pathlib
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("secret_guard", pathlib.Path(__file__).parents[1] / "tools/check-secrets.py")
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


class SecretGuardTests(unittest.TestCase):
    def test_values_never_appear_in_findings(self):
        value = b"ghp_" + b"A" * 36
        result = guard.findings(b"credential=" + value, "example.txt")
        self.assertEqual(result, [{"path": "example.txt", "kind": "github-token"}])
        self.assertNotIn(value.decode(), str(result))

    def test_runtime_warning_and_log_paths_are_blocked(self):
        self.assertTrue(guard.findings(b"codex_core_plugins" + b"::manager", "evidence.txt"))
        self.assertTrue(guard.findings(b"ordinary content", "review.log"))
        self.assertTrue(guard.findings(b"ordinary content", ".env.local"))

    def test_safe_source_and_binary_pass(self):
        self.assertEqual(guard.findings(b"export const title = 'Ramsider';", "safe.ts"), [])
        self.assertEqual(guard.findings(b"\x00\xff\x80", "art.png"), [])

    def test_url_safe_token_ending_and_messages(self):
        value = b"123456789:" + b"A" * 34 + b"-"
        self.assertEqual(guard.findings(value, "message", check_paths=False)[0]["kind"], "telegram-token")
        value = b"ghp_" + b"A" * 36
        self.assertTrue(guard.findings(b"tree deadbeef\n\n" + value, "commit:example", check_paths=False))

    def test_history_checks_each_path_including_newlines(self):
        with tempfile.TemporaryDirectory() as directory:
            def git(*args):
                return subprocess.check_output(["git", "-C", directory, *args], stderr=subprocess.PIPE)
            git("init", "--quiet")
            git("config", "user.name", "Guard test")
            git("config", "user.email", "guard@example.invalid")
            for name in ["safe.txt", "alias.log", "line\nbreak.log", ".env.local", "alias.pem"]:
                pathlib.Path(directory, name).write_text("same safe text")
            git("add", ".")
            git("commit", "-qm", "Synthetic fixture")
            result = subprocess.run(["python3", str(pathlib.Path(guard.__file__)), "--history"], cwd=directory, capture_output=True)
            self.assertEqual(result.returncode, 1)
            for name in ["alias.log", "line\\nbreak.log", ".env.local", "alias.pem"]:
                self.assertIn(name, result.stdout.decode())

    def test_pre_push_checks_unreferenced_outgoing_commit(self):
        with tempfile.TemporaryDirectory() as directory:
            def git(*args):
                return subprocess.check_output(["git", "-C", directory, *args], stderr=subprocess.PIPE)
            git("init", "--quiet")
            git("config", "user.name", "Guard test")
            git("config", "user.email", "guard@example.invalid")
            pathlib.Path(directory, "safe.txt").write_text("safe")
            git("add", ".")
            git("commit", "-qm", "Safe fixture")
            clean = git("rev-parse", "HEAD").decode().strip()
            pathlib.Path(directory, "safe.txt").write_bytes(b"ghp_" + b"A" * 36)
            git("add", ".")
            git("commit", "-qm", "Synthetic fixture")
            outgoing = git("rev-parse", "HEAD").decode().strip()
            git("reset", "--hard", clean)
            result = subprocess.run(["python3", str(pathlib.Path(guard.__file__)), "--pre-push"], cwd=directory, input=f"HEAD {outgoing} refs/heads/main {'0' * 40}\n".encode(), capture_output=True)
            self.assertEqual(result.returncode, 1)
            self.assertNotIn((b"ghp_" + b"A" * 36), result.stdout)

    def test_nested_annotated_tree_tag_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            def git(*args):
                return subprocess.check_output(["git", "-C", directory, *args], stderr=subprocess.PIPE)
            git("init", "--quiet")
            git("config", "user.name", "Guard test")
            git("config", "user.email", "guard@example.invalid")
            pathlib.Path(directory, "alias.log").write_text("safe text")
            git("add", ".")
            tree = git("write-tree").decode().strip()
            git("tag", "-a", "tree-target", tree, "-m", "Tree fixture")
            git("tag", "-a", "nested-target", "tree-target", "-m", "Nested fixture")
            git("tag", "-d", "tree-target")
            result = subprocess.run(["python3", str(pathlib.Path(guard.__file__)), "--history"], cwd=directory, capture_output=True)
            self.assertEqual(result.returncode, 1)
            self.assertIn("alias.log", result.stdout.decode())


if __name__ == "__main__":
    unittest.main()
