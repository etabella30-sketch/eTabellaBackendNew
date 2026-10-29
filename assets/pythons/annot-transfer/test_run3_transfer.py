"""Regression: run3 Mark transfer (publish) — matching, orphan rules and batched writes.

Day - 02 (eBundle Demo Case, published 2026-10-29) took ~100 s for 244 Marks: every
Mark rebuilt a 7,288-line time index, made 2 UPDATE + 2 COMMIT round trips and
rewrote the whole results JSON / SQL replay files. It also orphaned "(10.00 am)",
which the reporter re-stamped 546 s earlier but left word for word at 1:1.

Run: python -m unittest test_run3_transfer  (from this folder).
Optional real-data check: set RUN3_FIXTURES to a folder holding day2-final.txt +
marks-771f9684.json and day1-final.txt + marks-8899cba6.json (rows exported from
FactDetail/DocDetail after publish: id, k, c=jCordinates, tc=jTCordinates, st).
"""
import json
import os
import random
import sys
import types
import unittest
from datetime import datetime
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.modules.setdefault('sqlconfig', types.SimpleNamespace(execute_query=None, execute_single_query=None))
import run3  # noqa: E402
from common import find_nearest_index  # noqa: E402


def ts(secs):
    return f'{secs // 3600:02d}:{secs % 3600 // 60:02d}:{secs % 60:02d}'


def transcript(lines_per_page=25, pages=4, start=10 * 3600, step=3):
    rows, t = [], start
    for p in range(1, pages + 1):
        for n in range(1, lines_per_page + 1):
            rows.append(f'{n:2d}  {ts(t)}    Speaker words on page {p} line {n} unique{p}x{n}')
            t += step
        rows.append(f'                                      {p}')
    return '\f'.join('\n'.join(rows[i * 26:(i + 1) * 26]) for i in range(pages))


class NearestTimeTest(unittest.TestCase):
    def test_matches_linear_scan_including_ties_and_backwards_stamps(self):
        rnd = random.Random(5)
        secs = sorted(rnd.randrange(36000, 36600) for _ in range(300))
        secs[150], secs[151] = secs[151] + 4, secs[150]  # a re-stamped (backwards) pair
        data = [{'timestamp': ts(s), 'text': f'line {i}'} for i, s in enumerate(secs)]
        index = run3.TranscriptIndex(data)
        old = [(i, datetime(1900, 1, 1, s // 3600, s % 3600 // 60, s % 60), e) for i, (s, e) in enumerate(zip(secs, data))]
        for probe in range(35990, 36610):
            want = find_nearest_index(datetime(1900, 1, 1, probe // 3600, probe % 3600 // 60, probe % 60), old)
            self.assertEqual(index.entries[index.nearest(probe)][0], want, probe)

    def test_window_is_cut_in_filtered_space(self):
        # A timestamped line with no text is not in the index. The old code used the
        # global index as a position in the filtered list, so the ±2 window drifted
        # one line per such line and the Mark could land beside its text.
        parsed = run3.parse_text('\n'.join([
            ' 1  10:00:00    alpha one',
            ' 2  10:00:03',
            ' 3  10:00:06',
            ' 4  10:00:09',
            ' 5  10:00:12    bravo two',
            ' 6  10:00:15    charlie three',
            ' 7  10:00:18    delta four',
            ' 8  10:00:21    echo five',
            ' 9  10:00:24    foxtrot six target words here',
            '10  10:00:27    golf seven',
        ]))
        got = run3.transfer_annotation_with_difflib(
            [{'timestamp': '10:00:25', 'text': 'foxtrot six target words here'}], parsed, 'm1')
        self.assertEqual([g['index'] + 1 for g in got], [9])


class OrphanRuleTest(unittest.TestCase):
    def setUp(self):
        self.parsed = run3.parse_text(transcript())

    def test_restamped_line_with_same_words_transfers(self):
        first = self.parsed[0]
        got = run3.transfer_annotation_with_difflib(
            [{'timestamp': '09:20:59', 'text': first['text']}], self.parsed, 'restamped')
        self.assertEqual([(g['pageno'], g['index'] + 1) for g in got], [(1, 1)])

    def test_cut_text_stays_orphan(self):
        got = run3.transfer_annotation_with_difflib(
            [{'timestamp': '08:54:21', 'text': 'testing mic number six'}], self.parsed, 'cut')
        self.assertEqual(got, [])

    def test_short_or_repeated_text_never_jumps(self):
        data = [{'timestamp': ts(36000 + i), 'text': 'Yes.' if i % 2 else f'A long line {i} here'} for i in range(20)]
        index = run3.TranscriptIndex(data)
        self.assertEqual(index.find_exact_text([{'text': 'Yes.'}]), -1)
        repeated = [{'timestamp': ts(36000 + i), 'text': 'the same three words'} for i in range(2)]
        self.assertEqual(run3.TranscriptIndex(repeated).find_exact_text([{'text': 'the same three words'}]), -1)


class BatchedTransferTest(unittest.TestCase):
    def setUp(self):
        self.parsed = run3.parse_text(transcript())
        line = self.parsed[30]
        self.issues = [
            {'annotid': 'f1', 'type': 'F', 'detail': [{'timestamp': line['timestamp'], 'text': line['text']}]},
            {'annotid': 'q1', 'type': 'QF', 'detail': [{'timestamp': line['timestamp'], 'text': line['text']}]},
            {'annotid': 'd1', 'type': 'D', 'detail': [{'timestamp': line['timestamp'], 'text': line['text']}]},
            {'annotid': 'x1', 'type': None, 'detail': [{'timestamp': line['timestamp'], 'text': line['text']}]},
            {'annotid': 'o1', 'type': 'F', 'detail': [{'timestamp': '08:00:00', 'text': 'not in the final copy'}]},
        ]

    def test_rows_go_to_the_marks_own_table_and_orphans_clear_coords(self):
        results, fact_rows, doc_rows = run3.transfer_issues(self.issues, self.parsed)
        self.assertEqual([r[0] for r in fact_rows], ['f1', 'q1', 'x1', 'o1'])
        self.assertEqual([r[0] for r in doc_rows], ['d1', 'x1'])
        f1 = fact_rows[0]
        self.assertEqual((f1[2], f1[3], f1[4]), (2, 6, 'T'))
        self.assertEqual(json.loads(f1[1])[0]['identity'], self.parsed[30]['identity'])
        self.assertEqual(fact_rows[-1], ('o1', None, None, None, 'O'))
        self.assertEqual(results['o1'], [])

    def test_main_writes_once_in_one_transaction(self):
        rows = [(i['annotid'], None, json.dumps([{'t': d['timestamp'], 'text': d['text']} for d in i['detail']]), i['type'] or 'F')
                for i in self.issues]
        saved = []
        with mock.patch.object(run3, 'execute_query', side_effect=lambda fn, _: rows if 'annotation' in fn else []), \
             mock.patch.object(run3, 'read_file', return_value=transcript()), \
             mock.patch.object(run3, 'generate_paths', return_value={k: os.devnull for k in (
                 'raw_issues_file', 'raw_highlights_file', 'output_issues_file', 'sql_issues_file')}), \
             mock.patch.object(run3, 'save_json_file', side_effect=lambda p, d: saved.append(p)), \
             mock.patch.object(run3, 'transform_db_issues', side_effect=lambda r: self.issues), \
             mock.patch.object(run3, 'execute_batch_update', return_value=True) as batch, \
             mock.patch.object(run3, 'execute_single_query') as single:
            run3.main('ses')
        batch.assert_called_once()
        tables = [sql.split('"')[1] for sql, _ in batch.call_args.args[0]]
        self.assertEqual(tables, ['FactDetail', 'DocDetail'])
        single.assert_not_called()
        self.assertEqual(saved.count(os.devnull), 3)  # raw issues, raw highlights, output: once each

    def test_failed_batch_stops_the_publish(self):
        with mock.patch.object(run3, 'execute_query', return_value=[]), \
             mock.patch.object(run3, 'read_file', return_value=transcript()), \
             mock.patch.object(run3, 'generate_paths', return_value={k: os.devnull for k in (
                 'raw_issues_file', 'raw_highlights_file', 'output_issues_file', 'sql_issues_file')}), \
             mock.patch.object(run3, 'save_json_file'), \
             mock.patch.object(run3, 'transform_db_issues', side_effect=lambda r: self.issues), \
             mock.patch.object(run3, 'execute_batch_update', return_value=False):
            with self.assertRaises(SystemExit) as stop:
                run3.main('ses')
        self.assertEqual(stop.exception.code, 1)


@unittest.skipUnless(os.environ.get('RUN3_FIXTURES'), 'set RUN3_FIXTURES to run the Day 1 / Day 2 real-data check')
class RealDataTest(unittest.TestCase):
    """New transfer = the published result, except the one re-stamped line it now keeps."""

    def check(self, txt, marks, now_transferred):
        root = os.environ['RUN3_FIXTURES']
        parsed = run3.parse_text(open(os.path.join(root, txt), encoding='utf-8').read().replace('\r\n', '\n'))
        rows = json.load(open(os.path.join(root, marks), encoding='utf-8'))
        issues = [{'annotid': r['id'], 'type': r['k'],
                   'detail': [{'timestamp': c.get('t'), 'text': (c.get('text') or '').strip()} for c in r['c']]} for r in rows]
        results, _, _ = run3.transfer_issues(issues, parsed)
        for r in rows:
            got = [g['identity'] for g in results[r['id']]]
            want = [str(c['identity']) for c in (r['tc'] or [])]
            if any(r['id'].startswith(prefix) for prefix in now_transferred):
                self.assertEqual((r['st'], bool(got)), ('O', True), r['id'])
            else:
                self.assertEqual(got, want, r['id'])

    def test_day2(self):
        # "(10.00 am)": live 09:20:59, final 1:1 09:11:53
        self.check('day2-final.txt', 'marks-771f9684.json', {'6aa7707b'})

    def test_day1(self):
        self.check('day1-final.txt', 'marks-8899cba6.json', set())


if __name__ == '__main__':
    unittest.main()
