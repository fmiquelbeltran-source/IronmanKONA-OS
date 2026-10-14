import http.server, threading, functools
from playwright.sync_api import sync_playwright
from pathlib import Path
root=Path(__file__).resolve().parents[1]
handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root))
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server','--proxy-bypass-list=*','--allow-file-access-from-files'])
 for width in [1440,390]:
  page=browser.new_page(viewport={'width':width,'height':900})
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script("""
   const rawFetch=window.fetch;
   window.fetch=(url, opts)=>{
      if(String(url).includes('23571/api/snapshot')){
        return Promise.resolve(new Response(JSON.stringify({ok:true,domestique_port:22400,activities:[
        {id:'12345',date:'2026-11-08',name:'Rodaje fácil',sport:'Ride',duration_min:90,tss:50,avg_hr:124},
        {id:'98765',date:'2026-11-08',name:'Carrera fácil',sport:'Run',duration_min:30,avg_hr:135},
        {id:'2468',date:'2026-11-07',name:'Natación suave',sport:'Swim',duration_min:25}
        ],wellness:[{date:'2026-11-08',hrv:60,rhr:52,sleep_h:7.5}],warnings:[]} ),{status:200,headers:{'Content-Type':'application/json'}}));
      }
      return rawFetch(url,opts)
   };
  """)
  page.goto(root.joinpath('index.html').as_uri(),wait_until='domcontentloaded')
  page.wait_for_timeout(1550)
  page.locator('.sidebar [data-nav="imports"]').click()
  page.get_by_text('Conectado · 3 actividades nuevas').wait_for(timeout=4000)
  assert page.get_by_text('Rodaje fácil').count()==1
  assert page.get_by_text('Natación suave').count()==1
  page.locator('[data-domestique-sync]').click()
  page.get_by_text('Conectado · 0 actividades nuevas').wait_for(timeout=4000)
  assert page.get_by_text('Rodaje fácil').count()==1
  page.locator('.sidebar [data-nav="review"]').click()
  assert page.get_by_text('Revisión',exact=False).count()>=1
  assert not errors,errors
  print('SMOKE OK',width,'scrollWidth',page.evaluate('document.documentElement.scrollWidth'),'clientWidth',page.evaluate('document.documentElement.clientWidth'))
  page.close()
 browser.close()
server.shutdown()
