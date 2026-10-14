import json
import sys
import threading
import unittest
from http.client import HTTPConnection
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'puente-windows'))
import puente_domestique as bridge


class FakeDomestique(BaseHTTPRequestHandler):
    def log_message(self, *args): pass
    def do_GET(self):
        if self.path == '/api/activities':
            data = [{"id": "abc", "date": "2026-11-08", "name":"Easy ride", "sport": "Ride", "duration_min": 75, "tss": 31, "avg_hr": 116},
                    {"id":"xyz", "date":"2026-11-07", "sport":"Run", "duration_min":40, "name":"Running", "avg_hr":127}]
        elif self.path.startswith('/api/rides?'):
            data = {"rides": [{"ride_id":"icu_abc", "started_at":"2026-11-08T08:00:00", "sport":"Ride", "duration_s":4500, "avg_power_w":134, "username":"SHOULD_NOT_EXPOSE"}]}
        elif self.path.startswith('/api/wellness?'):
            data = [{"id":"2026-11-08", "hrv":67,"rhr":51,"ctl":38,"token":"SECRET_SHOULD_NOT_EXPOSE"}]
        else:
            self.send_error(404);return
        s=json.dumps(data).encode();self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(s)));self.end_headers();self.wfile.write(s)


class BridgeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.domestique=ThreadingHTTPServer(('127.0.0.1',0),FakeDomestique)
        cls.domestiqueThread=threading.Thread(target=cls.domestique.serve_forever,daemon=True)
        cls.domestiqueThread.start()
        cls.patchPorts=patch.object(bridge,'DOMESTIQUE_PORTS',(cls.domestique.server_address[1],))
        cls.patchPorts.start()
        cls.bridge=ThreadingHTTPServer(('127.0.0.1',0),bridge.Handler)
        cls.patchBridgePort=patch.object(bridge,'BRIDGE_PORT',cls.bridge.server_address[1])
        cls.patchBridgePort.start()
        cls.bridgeThread=threading.Thread(target=cls.bridge.serve_forever,daemon=True)
        cls.bridgeThread.start()

    @classmethod
    def tearDownClass(cls):
        cls.bridge.shutdown();cls.domestique.shutdown();cls.patchBridgePort.stop();cls.patchPorts.stop()

    def request(self,path,origin=None,host='right'):
        c=HTTPConnection('127.0.0.1',self.bridge.server_address[1],timeout=5)
        headers={'Host':f'127.0.0.1:{self.bridge.server_address[1]}' if host=='right' else 'evil.example'}
        if origin:headers['Origin']=origin
        c.request('GET',path,headers=headers)
        r=c.getresponse();data=r.read().decode();headers=dict(r.getheaders());c.close()
        return r.status,json.loads(data),headers

    def test_blocks_wrong_origin_and_missing_origin(self):
        for origin in [None,'https://evil.example','https://fmiquelbeltran-source.github.io.evil.example']:
            code,_,headers=self.request('/api/snapshot',origin)
            self.assertEqual(code,403)
            self.assertNotIn('Access-Control-Allow-Origin',headers)

    def test_blocks_wrong_host(self):
        self.assertEqual(self.request('/api/snapshot',bridge.KONA_ORIGIN,host='wrong')[0],403)

    def test_good_origin_sanitizes(self):
        code,data,headers=self.request('/api/snapshot',bridge.KONA_ORIGIN)
        self.assertEqual(code,200)
        self.assertEqual(len(data['activities']),3)
        self.assertEqual(len(data['wellness']),1)
        self.assertEqual(headers.get('Access-Control-Allow-Origin'),bridge.KONA_ORIGIN)
        self.assertNotIn('SHOULD_NOT_EXPOSE',json.dumps(data))
        self.assertNotIn('SECRET_SHOULD_NOT_EXPOSE',json.dumps(data))

    def test_health(self):
        code,data,_=self.request('/health')
        self.assertEqual(code,200)
        self.assertTrue(data['ok'])

if __name__=='__main__':unittest.main()
