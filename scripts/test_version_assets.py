import tempfile
from pathlib import Path
import unittest

from version_assets import CSS_FILES, asset_updates


class AssetVersionTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.root = Path(self.folder.name)
        (self.root / 'js/charts').mkdir(parents=True)
        (self.root / 'css').mkdir()
        (self.root / 'index.html').write_text(
            '<link href="css/style.css?v=old"><script src="js/main.js?v=old"></script>')
        (self.root / 'css/style.css').write_text('')
        for name in CSS_FILES:
            (self.root / 'css' / name).write_text('body { color: black; }\n')
        (self.root / 'js/main.js').write_text("import('./app.js?v=old');\n")
        (self.root / 'js/app.js').write_text("import { draw } from './charts/map.js?v=old';\n")
        (self.root / 'js/charts/map.js').write_text('export const draw = () => {};\n')

    def apply_versions(self):
        updates = asset_updates(self.root)
        for path, text in updates.items():
            path.write_text(text)
        return updates

    def test_versioning_is_stable_after_applying(self):
        self.assertTrue(self.apply_versions())
        self.assertEqual(asset_updates(self.root), {})

    def test_css_changes_refresh_entries_and_transitive_imports(self):
        self.apply_versions()
        (self.root / 'css/theme.css').write_text('body { color: blue; }\n')
        updates = asset_updates(self.root)
        for relative in ('index.html', 'css/style.css', 'js/main.js', 'js/app.js'):
            self.assertIn(self.root / relative, updates)

    def test_inspecting_updates_does_not_write_files(self):
        before = (self.root / 'index.html').read_text()
        asset_updates(self.root)
        self.assertEqual((self.root / 'index.html').read_text(), before)


if __name__ == '__main__':
    unittest.main()
