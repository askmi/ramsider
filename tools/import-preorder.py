"""Import the current trusted R6.9j templates as semantic server data; never run source scripts."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,re
SOURCE=Path('design/комплект_для_Александра_r6.9j/site')
OUT=Path('lib/preorder');OUT.mkdir(exist_ok=True)
EVIDENCE=Path('docs/evidence/r69j');EVIDENCE.mkdir(exist_ok=True)
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Parser(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.root={'tag':'root','attrs':{},'children':[]};self.stack=[self.root]
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
def walk(node):
 if isinstance(node,str):return
 yield node
 for child in node['children']:yield from walk(child)
def clean(node):
 if isinstance(node,str):return node
 if node['tag'] in {'script','style','link','meta'}:return None
 attrs=node['attrs'];attrs.pop('data-whatsapp-url',None)
 for key in list(attrs):
  if key.startswith('on'):del attrs[key]
 if 'class' in attrs:attrs['class']=' '.join('up-'+c for c in attrs['class'].split())
 if 'data-site-age-gate' in attrs:attrs.pop('hidden',None)
 if node['tag']=='img':
  if attrs.get('src')=='certificates/ecas-mark.svg':attrs['src']='/art/ecas-mark.svg'
 node['children']=[value for child in node['children'] if(value:=clean(child))is not None]
 if node['tag'] in {'table','thead','tbody','tfoot','tr','colgroup'}:node['children']=[child for child in node['children'] if not(isinstance(child,str)and not child.strip())]
 return node
names=['reserve','pro','gold','compare','product-card','capsules','terms','returns','privacy','delivery-policy','terms-of-sale','contact','age-gate']
documents={};manifest={};css={}
for name in names:
 path=SOURCE/(name+'.html');raw=path.read_text();p=Parser();p.feed(raw)
 nodes=list(walk(p.root));body=next(n for n in nodes if n['tag']=='body');head=next(n for n in nodes if n['tag']=='head');title=next(n for n in nodes if n['tag']=='title')
 route='product-info'if name=='product-card'else name
 styles=[]
 for node in head['children']:
  if isinstance(node,str):continue
  if node['tag']=='style':styles.append({'inline':''.join(node['children'])})
  elif node['tag']=='link'and node['attrs'].get('rel')=='stylesheet':styles.append({'file':node['attrs']['href']})
 css[route]=styles
 documents[route]={'bodyClass':' '.join('up-'+c for c in body['attrs'].get('class','').split()),'page':body['attrs'].get('data-page',name),'titleKey':title['attrs'].get('data-i18n'),'title':''.join(title['children']),'children':[value for child in body['children'] if(value:=clean(child))is not None]}
 manifest[name]={'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'route':route,'styles':[v.get('file','inline')for v in styles]}
OUT.joinpath('documents.json').write_text(json.dumps(documents,ensure_ascii=False,separators=(',',':'))+'\n')
editorial=json.loads((OUT/'editorial-overrides.json').read_text())
for lang in ['en','ar']:
 data=json.loads((SOURCE/'locales'/(lang+'.json')).read_text());data.pop('_meta',None)
 assert set(editorial[lang])<=set(data),'Editorial keys must exist in supplied schema'
 data.update(editorial[lang])
 OUT.joinpath(lang+'.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
for name in ['options.json','faq.json']:OUT.joinpath(name).write_bytes((SOURCE/name).read_bytes())
OUT.joinpath('source-styles.json').write_text(json.dumps(css,separators=(',',':'))+'\n')
Path('public/art/ecas-mark.svg').write_bytes((SOURCE/'certificates/ecas-mark.svg').read_bytes())
EVIDENCE.joinpath('source-map.json').write_text(json.dumps({'source':'R6.9j/site byteexact currentruntime mirror','documents':manifest,'fonts':'all5SHAexact existingpublic/fonts','sanitization':'scripts/styles/eventattrs excluded from AST; unconfirmeddata-whatsapp-url removed; originalbundle keptlocal'},indent=2)+'\n')
print('Imported',len(documents),'current R6.9j semantic templates; source scripts/private contact excluded')
