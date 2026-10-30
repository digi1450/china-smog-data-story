"""Keep the static site's JavaScript and CSS on one content-based cache version."""

import argparse
import hashlib
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
CSS_FILES = ('theme.css', 'base.css', 'layout.css', 'explorer.css', 'scenes.css')
MODULE_URL = re.compile(r"(['\"])(\.{1,2}/[^'\"]+\.js)(?:\?v=[^'\"]+)?\1")
ENTRY_URL = re.compile(r'((?:href="css/style\.css|src="js/main\.js))(?:\?v=[^"]+)?"')


def asset_updates(root):
    """Return changed files without writing; ignore existing versions in the hash."""
    sources = {}
    for path in sorted((root / 'js').rglob('*.js')):
        sources[path] = MODULE_URL.sub(lambda m: m[1] + m[2] + m[1], path.read_text(encoding='utf-8'))
    for name in CSS_FILES:
        path = root / 'css' / name
        sources[path] = path.read_text(encoding='utf-8')

    digest = hashlib.sha256()
    for path, content in sorted(sources.items()):
        digest.update(path.relative_to(root).as_posix().encode())
        digest.update(b'\0')
        digest.update(content.encode())
        digest.update(b'\0')
    version = digest.hexdigest()[:12]

    proposed = {
        path: MODULE_URL.sub(lambda m: f'{m[1]}{m[2]}?v={version}{m[1]}', content)
        for path, content in sources.items() if path.suffix == '.js'
    }
    proposed[root / 'css/style.css'] = (
        '/* Generated style entry point. Run python3 scripts/version_assets.py after editing JS or CSS. */\n'
        + ''.join(f'@import url("./{name}?v={version}");\n' for name in CSS_FILES)
    )
    index = root / 'index.html'
    proposed[index] = ENTRY_URL.sub(lambda m: f'{m[1]}?v={version}"', index.read_text(encoding='utf-8'))
    return {path: content for path, content in proposed.items() if path.read_text(encoding='utf-8') != content}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Check versions without changing files.')
    args = parser.parse_args()
    updates = asset_updates(ROOT)
    if args.check:
        if updates:
            parser.exit(1, 'Asset versions need updating: run python3 scripts/version_assets.py\n')
        print('Asset versions are current.')
        return
    for path, content in updates.items():
        path.write_text(content, encoding='utf-8')
    print(f'Updated {len(updates)} asset references/entry files.')


if __name__ == '__main__':
    main()
