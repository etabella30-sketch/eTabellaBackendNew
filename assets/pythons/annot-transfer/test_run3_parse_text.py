"""Regression: run3.parse_text must page a transcript exactly as the published viewer does.

The viewer's pages come from assets/pythons/transcript/file.py parse_transcript_text
(page = form-feed section). Day - 01 (eBundle Demo Case, 2026-10-27) had a page whose
lines 24-25 carry no timestamp; counting 25 timestamped lines per page put every later
mark one page early. Run: python -m unittest test_run3_parse_text  (from this folder).
"""
import importlib.util
import os
import sys
import types
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.modules.setdefault('sqlconfig', types.SimpleNamespace(execute_query=None, execute_single_query=None))
import run3  # noqa: E402


def load_converter():
    spec = importlib.util.spec_from_file_location('transcript_file', os.path.join(HERE, '..', 'transcript', 'file.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def page(n, first_ts_minute, timestamped=25, footer=True):
    rows = []
    for line in range(1, 26):
        if line <= timestamped:
            rows.append(f'{line:2d}  13:{first_ts_minute:02d}:{line:02d}    Words on page {n} line {line}')
        else:
            rows.append(f'{line:2d}')
    if footer:
        rows.append(f'                                      {n}')
    return '\n'.join(rows) + '\n'


def transcript(*pages):
    return '\f'.join(pages)


class ParseTextPaging(unittest.TestCase):
    def test_a_page_without_timestamps_on_its_last_lines_does_not_shift_later_pages(self):
        text = transcript(page(1, 10), page(2, 11, timestamped=23), page(3, 12), page(4, 13))
        parsed = run3.parse_text(text)
        by_text = {p['text']: p for p in parsed}
        self.assertEqual(by_text['Words on page 2 line 23']['pageno'], 2)
        self.assertEqual(by_text['Words on page 3 line 1']['pageno'], 3)
        self.assertEqual(by_text['Words on page 4 line 25']['pageno'], 4)
        self.assertEqual(by_text['Words on page 4 line 25']['index'], 24)

    def test_pages_match_the_published_viewer_line_for_line(self):
        text = transcript(page(1, 10), page(2, 11, timestamped=23), page(3, 12), page(4, 13, timestamped=10), '\n' * 3)
        ours = [(p['pageno'], p['lineno'], p['timestamp']) for p in run3.parse_text(text)]
        viewer = [(p['pageno'], p['lineno'], p['timestamp']) for p in load_converter().parse_transcript_text(text)
                  if p.get('timestamp') and not p.get('isIndex')]
        self.assertEqual(ours, viewer)

    def test_crlf_files_page_the_same(self):
        text = transcript(page(1, 10), page(2, 11, timestamped=23), page(3, 12)).replace('\n', '\r\n')
        pages = {p['text']: p['pageno'] for p in run3.parse_text(text)}
        self.assertEqual(pages['Words on page 3 line 1'], 3)

    def test_identity_runs_across_pages(self):
        parsed = run3.parse_text(transcript(page(1, 10), page(2, 11)))
        self.assertEqual([p['identity'] for p in parsed], [str(i) for i in range(1, 51)])

    def test_a_file_without_form_feeds_keeps_the_25_line_rule(self):
        text = page(1, 10, footer=False) + page(2, 11, footer=False)
        parsed = run3.parse_text(text)
        self.assertEqual(parsed[24]['pageno'], 1)
        self.assertEqual(parsed[25]['pageno'], 2)


if __name__ == '__main__':
    unittest.main()
