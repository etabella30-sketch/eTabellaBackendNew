"""Regression: run3 Mark transfer (publish) — matching, orphan rules and batched writes.

Day - 02 (eBundle Demo Case, published 2026-10-29) took ~100 s for 244 Marks: every
Mark rebuilt a 7,288-line time index, made 2 UPDATE + 2 COMMIT round trips and
rewrote the whole results JSON / SQL replay files. It also orphaned "(10.00 am)",
which the reporter re-stamped 546 s earlier but left word for word at 1:1.

Run: python -m unittest test_run3_transfer  (from this folder).
Optional real-data check: set RUN3_FIXTURES to a folder holding day2-final.txt +
marks-771f9684.json, day1-final.txt + marks-8899cba6.json and day3-final.txt + marks-cab684ae.json (rows exported from
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


def at(got):
    return [(g['pageno'], g['index'] + 1) for g in got]


class LiveLagTest(unittest.TestCase):
    """Day 3 (2026-10-29) lines. Live text is stamped ~4 s after the final copy, so on
    short lines the nearest-by-time line sits 3-5 lines past the Mark's words."""

    PAGE1 = '\n'.join([
        "13  10:30:05    PRESIDENT:  Very well.  Let's move on right away.",
        '14  10:30:08    MR BURRELL:  Thank you.  There is a housekeeping issue,',
        "15  10:30:10       but it's not a long one, and I'm going to raise it",
        "16  10:30:11       after the conclusion of Mr Thorpe's evidence.  I think",
        "17  10:30:14       it's better to get through that first.",
        '18  10:30:15    PRESIDENT:  Exactly.',
        '19  10:30:16    DR BLANKE:  Just to say I also have a housekeeping issue',
        '20  10:30:18       briefly afterwards.  But again, we can deal with that',
        "21  10:30:22       once we've done Mr Thorpe.",
        '22  10:30:25    MR BURRELL:  Sure.  Thank you.',
    ])

    def test_ordinal_correction_lands_on_its_line(self):
        # "1st" in the live text, "first" in the final: was 1:18-19 (other speakers).
        got = run3.transfer_annotation_with_difflib(
            [{'timestamp': '10:30:18', 'text': 'through that 1st.'}], run3.parse_text(self.PAGE1), 'd3-1ce8f36c')
        self.assertEqual(at(got), [(1, 17)])

    def test_mark_starts_on_the_line_before_the_time_anchor(self):
        got = run3.transfer_annotation_with_difflib(
            [{'timestamp': '10:30:16', 'text': "Mr Thorpe's evidence.  I think it's better to get"}],
            run3.parse_text(self.PAGE1), 'd3-10e71011')
        self.assertEqual(at(got), [(1, 16), (1, 17)])

    def test_exact_line_three_lines_back_across_a_page(self):
        parsed = run3.parse_text('\n'.join([
            '18  15:30:22       been -- or was it evident -- well, I take from what',
            "19  15:30:26       you're telling me, it wasn't evident from the",
            '20  15:30:28       documents that you looked at as to what the context of',
            "21  15:30:33       the expenditure wasn't clear from the context either,",
            '22  15:30:36       was it?',
            "23  15:30:37    A. It depends which category of expenditure you're",
            '24  15:30:39       talking about.',
            '25  15:30:39    Q. Right.',
        ]) + '\f' + '\n'.join([
            ' 1  15:30:40    A. Are we on travel costs now?',
            " 2  15:30:43    Q. Yes.  For example.  Yeah.  Let's look at travel",
            ' 3  15:30:45       losses, for example.',
            " 4  15:30:48    A. I don't have the entire contents of all the documents",
        ]))
        got = run3.transfer_annotation_with_difflib(
            [{'timestamp': '15:30:40', 'text': "A. It depends which category of expenditure you're"}], parsed, 'd3-660395b4')
        self.assertEqual(at(got), [(1, 23)])  # was 1:24 - 2:2

    def test_second_live_line_is_kept(self):
        parsed = run3.parse_text('\n'.join([
            " 1  11:19:25           So I can't actually make an assessment of whether",
            ' 2  11:19:29       these venues were open or not.',
            ' 3  11:19:33    Q. Okay.',
            ' 4  11:19:33           Moving on to wasted costs.',
            " 5  11:19:35           Sorry, finally, briefly, you've seen the letter",
            " 6  11:19:37       that's been referenced by, or that's been adduced",
            ' 7  11:19:41       by -- which the respondent has adduced from FTI, which',
        ]))
        got = run3.transfer_annotation_with_difflib(
            [{'timestamp': '11:19:36', 'text': 'Moving on to wasted costs.  Sorry.'},
             {'timestamp': '11:19:38', 'text': "Finally, briefly, you've seen the letter that was"}], parsed, 'd3-e33228a9')
        self.assertEqual(at(got), [(1, 4), (1, 5)])  # was 38:4 only

    def test_garbled_last_word_keeps_its_line(self):
        # Live "valor and" is the reporter's "Falla and": the line stays in the Mark.
        parsed = run3.parse_text('\n'.join([
            " 4  10:52:55       cannot associate the losses ...\"",
            " 5  10:52:56           But if we go to Mr Zeidan's third witness",
            ' 6  10:53:00       statement, {E3}, page 11, paragraph 43, even he says',
            ' 7  10:53:15       Falla and Grit leaving because of smell issues "could',
            ' 8  10:53:18       be true".',
            ' 9  10:53:18           So even Mr Zeidan opens up the possibility that',
        ]))
        got = run3.transfer_annotation_with_difflib(
            [{'timestamp': '10:53:00', 'text': 'But if we go to Mr Zeidan 3rd witness statement.'},
             {'timestamp': '10:53:08', 'text': '{I3} page 11, paragraph 43.  Even he says valor and'}], parsed, 'd3-4190070f')
        self.assertEqual(at(got), [(1, 5), (1, 6), (1, 7)])

    def test_text_cut_from_the_final_is_not_dropped(self):
        # The live words are not in the final copy near this time; the Mark keeps its
        # time-nearest place as before rather than becoming an orphan.
        got = run3.transfer_annotation_with_difflib(
            [{'timestamp': '10:30:16', 'text': 'Testing the audio for the next session, mic two'}],
            run3.parse_text(self.PAGE1), 'cut-nearby')
        self.assertTrue(got)


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


# Day 1 Marks the live-lag recheck / edge fit now place better (identities = global line numbers).
# b4d96f71 is the 10-28 mislanding (was 214:16-18, words on 214:14-15).
DAY1_MOVED = {
    '18632c77': ['2', '3'],
    '142c2961': ['4086', '4087', '4088', '4089', '4090', '4091', '4092', '4093'],
    '1630a07b': ['3937', '3938', '3939', '3940', '3941'],
    '6b319d1c': ['3516', '3517', '3518'],
    'b4d96f71': ['5337', '5338'],
}

# Day 3 Marks that now land better, each checked by hand against the final copy (2026-10-30).
DAY3_MOVED = {
    '012c7530': ['1015'],
    '053ffaf3': ['1256'],
    '0954c2e5': ['1163', '1164', '1165'],
    '1064ca0c': ['432', '433', '434', '435', '436'],
    '10e71011': ['16', '17'],
    '13a125c0': ['1040', '1041'],
    '19f85e87': ['1365', '1366'],
    '1ce8f36c': ['17'],
    '21f9652d': ['726', '727', '728'],
    '3b855a7b': ['1074', '1075', '1076', '1077'],
    '3f2e9a2d': ['140'],
    '4134e35d': ['1370', '1371', '1372', '1373', '1374', '1375', '1376'],
    '41854009': ['589', '590'],
    '41a12778': ['1373', '1374', '1375', '1376', '1377', '1378'],
    '457bb77c': ['52'],
    '49d9f839': ['52', '53', '54'],
    '604bfdca': ['1146', '1147', '1148', '1149'],
    '65854ede': ['842', '843'],
    '660395b4': ['3923'],
    '6fbc85ae': ['52', '53', '54'],
    '786f1796': ['1262'],
    '84ea155a': ['33', '34', '35'],
    '8b8595bc': ['1392'],
    '9609b112': ['17'],
    'ae2a0c64': ['725', '726', '727'],
    'af1c1286': ['16', '17'],
    'b6613ce9': ['1074'],
    'd35a86f3': ['1370', '1371', '1372', '1373', '1374', '1375', '1376'],
    'e2aa2abd': ['21', '22', '23'],
    'e33228a9': ['929', '930'],
    'ecebbc79': ['1093'],
    'fb3b815c': ['153'],
    'fc61e52a': ['832', '833', '834'],
}


@unittest.skipUnless(os.environ.get('RUN3_FIXTURES'), 'set RUN3_FIXTURES to run the Day 1 / Day 2 real-data check')
class RealDataTest(unittest.TestCase):
    """New transfer = the published result, except the Marks it now places better."""

    def check(self, txt, marks, now_transferred, moved=()):
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
            elif r['id'][:8] in moved:
                self.assertEqual(got, moved[r['id'][:8]], r['id'])
            else:
                self.assertEqual(got, want, r['id'])

    def test_day2(self):
        # "(10.00 am)": live 09:20:59, final 1:1 09:11:53
        self.check('day2-final.txt', 'marks-771f9684.json', {'6aa7707b'}, {
            '8f366393': ['3804', '3805'],   # was 153:8-12, the lines after the question
            '75541685': ['529', '530', '531', '532'],  # trailing line spoken after the Mark dropped
        })

    def test_day1(self):
        self.check('day1-final.txt', 'marks-8899cba6.json', set(), DAY1_MOVED)

    def test_day3(self):
        # 1,225 Marks; DAY3_MOVED lists the ones that now land better (hand-checked).
        self.check('day3-final.txt', 'marks-cab684ae.json', set(), DAY3_MOVED)


if __name__ == '__main__':
    unittest.main()
