var CACHE="crimsound-v10";
var CORE=["./","index.html"];
var MORE=["manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];

function add(c,u){
  return fetch(new Request(u,{cache:"reload"})).then(function(res){
    if(!res.ok)throw new Error("bad response: "+u);
    return c.put(u,res);
  });
}

self.addEventListener("install",function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(CORE.map(function(u){return add(c,u)})).then(function(){
        return Promise.all(MORE.map(function(u){return add(c,u).catch(function(){})}));
      });
    }).then(function(){return self.skipWaiting()})
  );
});

self.addEventListener("activate",function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
    }).then(function(){return self.clients.claim()})
  );
});

self.addEventListener("fetch",function(e){
  var r=e.request;
  if(r.method!=="GET")return;
  if(new URL(r.url).origin!==self.location.origin)return;
  if(r.mode==="navigate"){
    e.respondWith(
      caches.match("index.html").then(function(hit){
        var net=fetch(r).then(function(res){
          if(res.ok&&!res.redirected&&res.type==="basic"){
            var cp=res.clone();
            caches.open(CACHE).then(function(c){c.put("index.html",cp)});
          }
          return res;
        });
        if(hit){
          e.waitUntil(net.catch(function(){}));
          return hit;
        }
        return net.catch(function(){
          return new Response("Нет подключения. Откройте приложение один раз с интернетом.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
        });
      })
    );
    return;
  }
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(function(hit){return hit||fetch(r)}));
});
