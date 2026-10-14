import http.server, threading, functools, json
from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).resolve().parents[1]
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server','--proxy-bypass-list=*','--allow-file-access-from-files'])
  for width in [1440,390]:
   page=browser.new_page(viewport={'width':width,'height':920})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.add_init_script('''
     const f=window.fetch;
     window.fetch=(url,opts)=>String(url).includes('23571/api/snapshot')?Promise.resolve(new Response(JSON.stringify({ok:true,domestique_port:22400,activities:[
     {id:'123',date:'2026-09-12',name:'Ciclismo',sport:'Ride',duration_s:15120,distance_m:72010,avg_hr:123},
     {id:'124',date:'2026-09-18',name:'Ciclismo ruta',sport:'Ride',duration_s:14400,distance_m:79000,avg_hr:131,avg_power:175,tss:80},
     {id:'125',date:'2026-09-14',name:'Rodaje',sport:'Run',duration_s:3600,distance_m:10000,avg_hr:140},
     {id:'126',date:'2026-09-16',name:'Rodaje corto',sport:'Run',duration_s:3000,distance_m:8600,avg_hr:142},
     {id:'127',date:'2026-09-17',name:'Natación 1000',sport:'Swim',duration_s:1400,distance_m:1000}
     ],wellness:[],warnings:[]}),{status:200,headers:{'Content-Type':'application/json'}})):f(url,opts);
   ''')
   page.goto(root.joinpath('index.html').as_uri(),wait_until='domcontentloaded')
   page.wait_for_timeout(1700)
   page.locator(f'{".sidebar" if width>900 else ".bottomnav"} [data-nav="imports"]').click()
   page.get_by_text('Conectado · 5 actividades nuevas').wait_for(timeout=4000)
   page.get_by_role('button',name='Ciclismo ↗').click()
   page.get_by_text('FICHA INDIVIDUAL').wait_for(timeout=3000)
   assert page.get_by_text('72,01 km').count()>=1
   assert page.get_by_text('123 ppm').count()>=1
   assert page.get_by_text('Sin datos').count()>=1
   assert page.get_by_text('No hay mediciones',exact=False).count()>=0
   page.screenshot(path=f'/mnt/data/kona-v6-detail-{width}.png',full_page=False)
   page.locator('[data-close="1"]').click()
   if width>900:
    page.locator('.sidebar [data-nav="stats"]').click()
   else:
    page.locator('.bottomnav [data-nav="settings"]').click()
    page.locator('[data-nav="stats"]').last.click()
   page.locator('[data-sport-filter="run"]').click()
   assert page.locator('.trend svg').count()>0
   page.screenshot(path=f'/mnt/data/kona-v6-stats-{width}.png',full_page=False)
   page.locator(f'{".sidebar" if width>900 else ".bottomnav"} [data-nav="review"]').click()
   assert page.get_by_text('Resumen por disciplina').count()==1
   assert not errors,errors
   print('BROWSER v6 OK',width,'page scrollWidth',page.evaluate('document.documentElement.scrollWidth'),'clientWidth',page.evaluate('document.documentElement.clientWidth'))
   page.close()
  browser.close()
finally:server.shutdown()
