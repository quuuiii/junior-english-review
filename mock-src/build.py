import re, json, glob, sys, collections

def parse(path):
    lines = open(path, encoding='utf-8').read().split('\n')
    head = lines[0]
    m = re.match(r'=SET (\d+)\|([^|]*)\|(.*)', head)
    s = {'n': int(m[1]), 'kind': m[2], 'scope': m[3], 'singles': [], 'groups': []}
    mode = None; g = None; q = None; cur = None; buf = []
    def flush_q():
        nonlocal q
        if q:
            assert len(q['o']) == 4, (path, q['n'], 'options', len(q['o']))
            assert q.get('a') in 'ABCD' and q.get('a'), (path, q['n'], 'answer')
            (s['singles'] if mode == 'single' else g['qs']).append(q)
        q = None
    for ln in lines[1:]:
        if ln.startswith('## SINGLE'):
            flush_q(); mode = 'single'; continue
        m = re.match(r'## GROUP (\d+)-(\d+)\|([^|]*)\|(.*)', ln)
        if m:
            flush_q(); mode = 'group'
            g = {'from': int(m[1]), 'to': int(m[2]), 'type': m[3], 'title': m[4], 'text': [], 'qs': []}
            s['groups'].append(g); continue
        if not ln.strip():
            continue
        mq = re.match(r'^(\d{1,2})\.\s?(.*)$', ln)
        mo = re.match(r'^([ABCD])\.\s?(.*)$', ln)
        ma = re.match(r'^=([ABCD])\s?(.*)$', ln)
        inrange = mq and ((mode == 'single' and 1 <= int(mq[1]) <= 19) or (mode == 'group' and g['from'] <= int(mq[1]) <= g['to']))
        if mq and inrange and (q is None or q.get('a')):
            flush_q(); q = {'n': int(mq[1]), 'q': mq[2].strip(), 'o': [], 'a': None, 'e': ''}; continue
        if mo and q is not None and q['a'] is None:
            q['o'].append(mo[2].strip()); continue
        if ma and q is not None:
            q['a'] = ma[1]; q['e'] = ma[2].strip(); continue
        if q is not None and not q['o'] and mode:
            q['q'] += ' ' + ln.strip(); continue
        if mode == 'group' and q is None:
            g['text'].append(ln); continue
        raise Exception(f'{path}: unparsed line: {ln[:60]}')
    flush_q()
    for g in s['groups']:
        g['text'] = '\n'.join(g['text'])
    return s

import random
def balance(s):
    rnd = random.Random(1000 + s['n'])
    allq = s['singles'] + [q for g in s['groups'] for q in g['qs']]
    def fixed(q):
        txt = ' '.join(q['o']).lower()
        if any(k in txt for k in ['both', 'neither', 'above', 'all of', 'none of']): return True
        if all(re.match(r'^[\$\d]', o) for o in q['o']): return True
        return False
    targets = list('ABCD') * 11
    rnd.shuffle(targets)
    k = 0
    for q in allq:
        if fixed(q): continue
        t = targets[k]; k += 1
        correct = q['o']['ABCD'.index(q['a'])]
        others = [o for i, o in enumerate(q['o']) if i != 'ABCD'.index(q['a'])]
        rnd.shuffle(others)
        new = others[:]
        new.insert('ABCD'.index(t), correct)
        q['o'] = new; q['a'] = t

def validate(s):
    errs = []
    if [q['n'] for q in s['singles']] != list(range(1, 20)):
        errs.append('singles numbering')
    nums = [q['n'] for g in s['groups'] for q in g['qs']]
    if nums != list(range(20, 44)):
        errs.append(f'group numbering {nums}')
    for g in s['groups']:
        if [q['n'] for q in g['qs']] != list(range(g['from'], g['to'] + 1)):
            errs.append(f"group {g['from']}-{g['to']} mismatch")
        if g['from'] >= 38 and g['to'] == 43:
            for k in range(g['from'], g['to'] + 1):
                if f'__{k}__' not in g['text']:
                    errs.append(f'cloze blank {k} missing')
    allq = s['singles'] + [q for g in s['groups'] for q in g['qs']]
    for q in allq:
        opts = [o.lower() for o in q['o']]
        if len(set(opts)) != 4:
            errs.append(f"Q{q['n']} duplicate options")
    dist = collections.Counter(q['a'] for q in allq)
    return errs, dist

if __name__ == '__main__':
    files = sorted(glob.glob('/home/claude/mock/set*.txt'))
    out = []
    for f in files:
        s = parse(f)
        balance(s)
        errs, dist = validate(s)
        print(f.split('/')[-1], 'singles', len(s['singles']), 'groupQs', sum(len(g['qs']) for g in s['groups']), dict(sorted(dist.items())), errs or 'OK')
        out.append(s)
    json.dump(out, open('/home/claude/mock/all.json', 'w'), ensure_ascii=False)
