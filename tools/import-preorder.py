"""Import trusted v2.1 markup as semantic React data; never execute source scripts."""
from pathlib import Path
from html.parser import HTMLParser
import json, hashlib, re
SOURCE=Path('design/references/пакет_сайт_v2.1')
OUT=Path('lib/preorder')
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Parser(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True); self.root={'tag':'root','attrs':{},'children':[]}; self.stack=[self.root]
 def handle_starttag(self,tag,attrs):
  node={'tag':tag,'attrs':dict(attrs),'children':[]};self.stack[-1]['children'].append(node)
  if tag not in VOID:self.stack.append(node)
 def handle_startendtag(self,tag,attrs):
  self.handle_starttag(tag,attrs)
  if tag not in VOID:self.handle_endtag(tag)
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i]['tag']==tag:self.stack=self.stack[:i];break
 def handle_data(self,data):self.stack[-1]['children'].append(data)
def find(node,tag):
 if isinstance(node,str):return None
 if node['tag']==tag:return node
 for child in node['children']:
  result=find(child,tag)
  if result:return result

documents={}; manifest={}
for name in ['reserve','pro','gold','compare','terms','returns','privacy','privacy-ru','product-card']:
 path=SOURCE/(name+'.html'); raw=path.read_text();p=Parser();p.feed(raw);body=find(p.root,'body')
 def clean(node):
  if isinstance(node,str):return node
  if node['tag'] in {'script','noscript','style'}:return None
  attrs=node['attrs']
  if 'class' in attrs:attrs['class']=' '.join('up-'+c for c in attrs['class'].split())
  node['children']=[v for c in node['children'] if (v:=clean(c)) is not None]
  return node
 route='product-info' if name=='product-card' else name
 documents[route]={'bodyClass':' '.join('up-'+c for c in body['attrs'].get('class','').split()),'children':[v for c in body['children'] if (v:=clean(c)) is not None]}
 manifest[name]={'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'route':route}
 (OUT/(route+'.source.css')).write_text('\n'.join(re.findall(r'<style>([\s\S]*?)</style>',raw)))
OUT.joinpath('documents.json').write_text(json.dumps(documents,ensure_ascii=False,separators=(',',':'))+'\n')
Path('docs/evidence/preorder/source-map.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Imported',len(documents),'trusted templates; source scripts excluded')
