#!/usr/bin/env python3
"""Register an already validated immutable HLS asset and truthful audio labels."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('receipt', 'validation', 'labels', 'registry'):
        parser.add_argument('--' + name, type=Path, required=True)
    parser.add_argument('--archive-path', required=True)
    parser.add_argument('--directory', required=True, help='Relative to public/films')
    parser.add_argument('--repository', required=True, help='Public GitHub owner/repo')
    args = parser.parse_args()
    receipt = json.loads(args.receipt.read_text())
    validation = json.loads(args.validation.read_text())
    digest = hashlib.sha256(args.receipt.read_bytes()).hexdigest()
    if validation.get('status') != 'PASS' or validation.get('receiptSHA256') != digest:
        parser.error('Validation must pass and bind to this exact receipt')
    for value in (args.archive_path, args.directory):
        if PurePosixPath(value).is_absolute() or any(p in ('..', '.', '') for p in value.split('/')):
            parser.error('Use safe relative package paths')
    labels = json.loads(args.labels.read_text())
    locales = ['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']
    if any(not isinstance(labels.get(locale), str) or not labels[locale].strip() for locale in locales):
        parser.error('Supply truthful audio labels for all site interface locales')
    registry = json.loads(args.registry.read_text()) if args.registry.exists() else {'schema':1, 'repository':args.repository, 'uiLocales':locales, 'assets':[]}
    if registry['repository'] != args.repository:
        parser.error('Do not silently change the artifact repository')
    asset = {k:receipt[k] for k in ('id','audioLocale','version','width','height','duration','sourceSHA256','files')}
    asset.update(active=True, directory=args.directory, audioLabels=labels, archive={'path':args.archive_path, **receipt['archive']})
    for existing in registry['assets']:
        same_identity = all(existing[k] == asset[k] for k in ('id','audioLocale','version'))
        if not same_identity and existing['directory'] == asset['directory']:
            parser.error('Delivery directory already belongs to another immutable asset')
        if not same_identity and existing['archive']['path'] == asset['archive']['path']:
            parser.error('Use a distinct archive path for each immutable asset')
    for existing in registry['assets']:
        if existing['id'] == asset['id'] and existing['audioLocale'] == asset['audioLocale']:
            if existing['version'] == asset['version']:
                if existing == asset:
                    print('Asset already registered without changes'); return
                parser.error('Never mutate an already registered immutable asset version')
            existing['active'] = False
    registry['uiLocales'] = locales
    registry['assets'].append(asset)
    args.registry.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.registry.with_suffix('.tmp')
    temporary.write_text(json.dumps(registry, indent=2) + '\n')
    temporary.replace(args.registry)
    print(f"Registered {asset['id']}/{asset['audioLocale']}/{asset['version']}")


if __name__ == '__main__':
    main()
