"use strict";

console.log(`*** x.0`);

exports.init = malaya=>{
    console.log(`*** x.1`);

    const  plugin = malaya.plugin;
    const {client,
             xml} = require('@xmpp/client');
    const  xml2js = require('xml2js');

    plugin.add('xmpp',class extends plugin.Plugin {
        constructor({disable,service,domain,username,password}) {
            super();
            const pl = this;
            pl.connections = {};
            pl.disable  = !!disable;
            pl.service  = service;
            pl.domain   = domain;
            pl.username = username;
            pl.password = password;
            pl.client   = null;
            pl.parser   = (new xml2js.Parser()).parseStringPromise;
            pl.builder  = (new xml2js.Builder()).buildObject;
        }
        async start(cb) {
            const pl = this;
            try {
                pl.client = client({
                    service:  pl.service,
                    domain:   pl.domain,
                    username: pl.username,
                    password: pl.password});
                pl.client.on('status', status=>pl.update(['status',{status}]));
                pl.client.on('error',  error=>pl.update(['error', {error:error.toString()}]));
                pl.client.on('online', jid=>pl.update(['online', {jid:      jid.toString(),
                                                                  local:    jid.local,
                                                                  domain:   jid.domain,
                                                                  resource: jid.resource}]));
                pl.client.on('offline',()=>pl.update(['offline',{}]));
                pl.client.on('stanza', async stanza=>{
                    const js = await pl.parser(stanza);
                    pl.update(['stanza',js]);
                });
                super.start(cb);
            } catch(e) {
                cb(e);
            }
        }
        async ready() {
            const pl = this;
            if (!pl.disable)
                try {
                    await pl.client.start();
                } catch(e) {
                    console.error(`!!! oops`);
                }
        }
        stop(cb) {
            const pl = this;
            if (!pl.disable)
                pl.client.stop();
            cb();
        }
        out(js,name,addr) {
            const pl = this;
            switch (js[0]) {
            case 'connect':
                throw new Error(`NYI`);
                break;
            case 'stanza': {
                const xml = (new xml2js.Builder()).buildObject(js[1]);
                pl.client.send(xml.split('\n').slice(1));
                break;
            }
            default:
                throw new Error(`SNO`);
            }
        }
    });

    console.log(`*** x.n`);
};
