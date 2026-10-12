#!/usr/bin/env python3
"""Reject credential patterns and raw runtime logs without printing values."""
import argparse
import json
from pathlib import Path
import re
import subprocess
import sys

PATTERNS = {
    "github-token": rb"(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{50,})",
    "api-key": rb"sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}",
    "aws-access-key": rb"(?:AKIA|ASIA)[A-Z0-9]{16}",
    "private-key": rb"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----",
    "telegram-token": rb"(?<![A-Za-z0-9_-])[0-9]{8,12}:[A-Za-z0-9_-]{35}(?![A-Za-z0-9_-])",
    "vercel-token": rb"\b(?:vcp|vercel)_[A-Za-z0-9_]{24,}",
    "jwt": rb"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{15,}",
    "runtime-catalog-log": rb"codex_core_plugins" + rb"::manager|backend-api/ps/" + rb"plugins/list",
}
PATTERNS = {kind: re.compile(pattern) for kind, pattern in PATTERNS.items()}


def findings(data, path, check_paths=True):
    result = []
    if check_paths and (path.endswith(".log") or path.rsplit("/", 1)[-1].startswith(".env") or path.endswith(".pem")):
        result.append({"path": path, "kind": "private-or-raw-log-file"})
    # Raster/binary files are checked by path; credential patterns target text.
    if b"\0" in data[:8192]:
        return result
    for kind, pattern in PATTERNS.items():
        if pattern.search(data):
            result.append({"path": path, "kind": kind})
    return result


def git(*args):
    # Capture Git errors; never echo content from a secret-bearing object.
    return subprocess.check_output(["git", *args], stderr=subprocess.PIPE)


def scan(staged, outgoing=()):
    baseline_path = Path(__file__).with_name("secret-log-baseline.json")
    baseline = set(tuple(item) for item in json.loads(baseline_path.read_text()))
    if staged:
        entries = []
        for record in git("ls-files", "--stage", "-z").split(b"\0"):
            if record:
                metadata, path = record.split(b"\t", 1)
                entries.append((metadata.split()[1].decode(), path.decode("utf-8", "surrogateescape")))
    else:
        roots = "".join(oid + "\n" for oid in outgoing).encode()
        def traversal(*args):
            return subprocess.check_output(["git", "rev-list", *args, "--all", "--stdin"], input=roots, stderr=subprocess.PIPE)
        # Object enumeration has no paths: one object can exist at many paths.
        entries = [(oid.decode(), "object:" + oid.decode()) for oid in traversal("--objects", "--no-object-names").splitlines()]
        trees = set(traversal("--format=%T", "--no-commit-header").decode().splitlines())
        for oid in git("for-each-ref", "--format=%(objectname)").decode().splitlines():
            # Peel nested annotated tags too; tags can reference trees or blobs.
            target = subprocess.run(["git", "rev-parse", "--verify", oid + "^{tree}"], capture_output=True)
            if target.returncode == 0:
                trees.add(target.stdout.decode().strip())
        for oid in outgoing:
            trees.add(git("rev-parse", oid + "^{tree}").decode().strip())
        # NUL-delimited tree entries preserve newlines and every blob/path pair.
        identities = set()
        for tree in trees:
            for record in git("ls-tree", "-r", "-z", tree).split(b"\0"):
                if record:
                    metadata, path = record.split(b"\t", 1)
                    identities.add((metadata.split()[2].decode(), path.decode("utf-8", "surrogateescape")))
    result = []
    if not staged:
        for oid, path in identities:
            known_log = path.endswith(".log") and (oid, path) in baseline
            result.extend(findings(b"", path, check_paths=not known_log))
    process = subprocess.Popen(["git", "cat-file", "--batch"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        for oid, path in entries:
            process.stdin.write((oid + "\n").encode())
            process.stdin.flush()
            header = process.stdout.readline().split()
            if len(header) != 3:
                raise RuntimeError("Object unavailable")
            data = process.stdout.read(int(header[2]))
            process.stdout.read(1)
            if header[1] == b"blob":
                result.extend(findings(data, path, check_paths=staged))
            elif header[1] in (b"commit", b"tag"):
                result.extend(findings(data, f"{header[1].decode()}:{oid}", check_paths=False))
    finally:
        process.stdin.close()
        process.stdout.close()
        process.wait()
    if process.returncode:
        raise RuntimeError("Object scan failed")
    return result, len(entries)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--history", action="store_true", help="Scan every reachable local ref instead of the index")
    parser.add_argument("--message", type=Path, help="Scan a pending commit message")
    parser.add_argument("--pre-push", action="store_true", help="Include outgoing object IDs supplied by Git on stdin")
    args = parser.parse_args()
    try:
        if args.message:
            result, count = findings(args.message.read_bytes(), "commit-message", check_paths=False), 1
        else:
            outgoing = []
            if args.pre_push:
                for line in sys.stdin:
                    fields = line.split()
                    if len(fields) != 4 or not re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", fields[1]):
                        raise ValueError("Invalid outgoing object")
                    if set(fields[1]) != {"0"}:
                        outgoing.append(fields[1])
            result, count = scan(not (args.history or args.pre_push), outgoing)
    except (subprocess.SubprocessError, RuntimeError, OSError, ValueError):
        print("Secret check failed; scan could not complete.", file=sys.stderr)
        return 2
    print(json.dumps({"scope": "message" if args.message else "history" if args.history or args.pre_push else "index", "objects_checked": count, "findings": result}))
    return 1 if result else 0


if __name__ == "__main__":
    sys.exit(main())
