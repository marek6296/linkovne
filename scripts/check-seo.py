#!/usr/bin/env python3
"""Read-only smoke checks for built or production marketing HTML."""
import sys, json, urllib.request, urllib.error
from html.parser import HTMLParser
from xml.etree import ElementTree

base = (sys.argv[1] if len(sys.argv) > 1 else 'https://linkovne.com').rstrip('/')
origin = 'https://linkovne.com'
paths = ['/', '/about', '/guides', '/guides/link-in-bio-for-models', '/guides/agency-link-in-bio', '/guides/custom-domain-link-in-bio', '/vs/linktree', '/vs/beacons', '/privacy', '/terms']

class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.canonical=[]; self.meta={}; self.h1=0; self.schema=[]; self.script=None; self.buffer=''
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='link' and a.get('rel')=='canonical': self.canonical.append(a.get('href'))
        if tag=='meta': self.meta[a.get('name') or a.get('property')]=a.get('content','')
        if tag=='h1': self.h1+=1
        if tag=='script': self.script=a.get('type'); self.buffer=''
    def handle_data(self,data):
        if self.script=='application/ld+json': self.buffer+=data
    def handle_endtag(self,tag):
        if tag=='script':
            if self.script=='application/ld+json': self.schema.append(json.loads(self.buffer))
            self.script=None

def fetch(path,agent=None):
    req=urllib.request.Request(base+path,headers={'User-Agent':agent or 'Linkovne-SEO-check/1.0'})
    with urllib.request.urlopen(req,timeout=30) as response: return response.read().decode(),response.headers

for path in paths:
    text,headers=fetch(path); page=Page(); page.feed(text)
    expected=origin+('' if path=='/' else path)
    assert len(page.canonical)==1 and page.canonical[0].rstrip('/')==expected, (path,page.canonical)
    assert page.meta.get('og:url','').rstrip('/')==expected, (path,page.meta.get('og:url'))
    assert 'noindex' not in page.meta.get('robots',''), path
    assert page.h1==1, (path,page.h1)
    assert page.meta.get('description'), path
    assert 'noindex' not in headers.get('X-Robots-Tag',''),path
    if path=='/': assert page.meta.get('msvalidate.01'), 'Bing verification missing'
    if path.startswith('/guides/') or path=='/': assert page.schema, path
    print('PASS HTML',path)

text,_=fetch('/sitemap.xml'); root=ElementTree.fromstring(text)
urls=[loc.text for loc in root.findall('.//{*}loc')]
for path in paths:
    assert (origin+('' if path=='/' else path)) in urls,(path,'missing from sitemap')
print('PASS sitemap',len(urls),'URLs')
text,headers=fetch('/llms.txt'); assert 'text/plain' in headers.get('Content-Type','') and '/guides/agency-link-in-bio' in text
print('PASS llms.txt')
text,_=fetch('/robots.txt'); assert 'Sitemap: '+origin+'/sitemap.xml' in text and 'Disallow: /\n' not in text
print('PASS robots.txt')
for agent in ['Googlebot','bingbot','OAI-SearchBot','ChatGPT-User']:
    text,_=fetch('/guides/agency-link-in-bio',agent); assert 'Link-in-bio management for creator agencies' in text
    print('PASS crawler access',agent)
try: fetch('/guides/does-not-exist')
except urllib.error.HTTPError as error: assert error.code==404
else: raise AssertionError('Unknown guide must be a real 404')
print('PASS unknown guide 404')
