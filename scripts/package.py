#!/usr/bin/env python3
"""Build a static site and a complete ZIP, without external dependencies."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'dist'
SITE = OUTPUT / 'site'
EXTENSIONS = {'.html', '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.woff', '.woff2', '.ttf'}
EXCLUDED = {'dist', 'scripts', 'node_modules', '__pycache__'}


def build():
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    SITE.mkdir(parents=True)
    files = sorted(path for path in ROOT.rglob('*')
                   if path.is_file() and not path.is_symlink()
                   and path.suffix.lower() in EXTENSIONS
                   and not any(part.startswith('.') or part in EXCLUDED
                               for part in path.relative_to(ROOT).parts))
    if ROOT / 'index.html' not in files:
        raise RuntimeError('Missing index.html')
    for path in files:
        target = SITE / path.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
    shutil.copy2(ROOT / 'README.md', SITE / 'README.md')
    archive = OUTPUT / 'szczesliwy-los.zip'
    with ZipFile(archive, 'w', ZIP_DEFLATED) as bundle:
        for path in sorted(SITE.rglob('*')):
            if path.is_file():
                bundle.write(path, Path('szczesliwy-los') / path.relative_to(SITE))
        if bundle.testzip() is not None:
            raise RuntimeError('Invalid archive')
    print(f'Packaged {len(files)} application files: {archive}')


if __name__ == '__main__':
    build()
