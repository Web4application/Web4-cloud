const {
    connect,
    keyStores: { InMemoryKeyStore },
    KeyPair,
} = require('near-api-js');

const fetch = require('node-fetch');
const qs = require('qs');

const MAX_PRELOAD_HOPS = 5;
const IPFS_GATEWAY_URL = (process.env.IPFS_GATEWAY_URL || 'https://cloudflare-ipfs.com').trim();
const NEARFS_GATEWAY_URL = (process.env.NEARFS_GATEWAY_URL || 'https://ipfs.web4.near.page').trim();

const config = require('./config')(process.env.NODE_ENV || 'development')

async function withDebug(ctx, next) {
    ctx.debug = require('debug')(`web4:${ctx.host}${ctx.path}?${qs.stringify(ctx.query)}`);

    await next();
}

async function withNear(ctx, next) {
    // TODO: Why no default keyStore?
    const keyStore = new InMemoryKeyStore();
    const near = await connect({...config, keyStore});

    Object.assign(ctx, { config, keyStore, near });

    try {
        await next();
    } catch (e) {
        switch (e.type) {
            case 'AccountDoesNotExist':
                ctx.throw(404, e.message);
            case 'UntypedError':
            default:
                ctx.throw(400, e.message);
        }
    }
}

async function withAccountId(ctx, next) {
    const accountId = ctx.cookies.get('web4_account_id');
    ctx.accountId = accountId;
    await next();
}

async function requireAccountId(ctx, next) {
    if (!ctx.accountId) {
        ctx.redirect('/web4/login');
        return;
    }
    await next();
}

const Koa = require('koa');
const app = new Koa();

const Router = require('koa-router');
const router = new Router();

const getRawBody = require('raw-body');

const FAST_NEAR_URL = process.env.FAST_NEAR_URL;

const callViewFunction = async ({ near }, contractId, methodName, args) => {
    if (FAST_NEAR_URL) {
        const res = await fetch(`${FAST_NEAR_URL}/account/${contractId}/view/${methodName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(args)
        });
        if (!res.ok) {
            throw new Error(await res.text());
        }
        return await res.json();
    }

    const account = await near.account(contractId);
    return await account.viewFunction({ contractId, methodName, args });
}

router.get('/web4/contract/:contractId/:methodName', withNear, async ctx => {
    const {
        params: { contractId, methodName },
        query
    } = ctx;

    const methodParams = Object.keys(query)
        .map(key => key.endsWith('.json')
            ? { [key.replace(/\.json$/, '')]: JSON.parse(query[key]) }
            : { [key] : query[key] })
        .reduce((a, b) => ({...a, ...b}), {});

    ctx.body = await callViewFunction(ctx, contractId, methodName, methodParams);
});

const fs = require('fs/promises');

// TODO: Less hacky templating?
async function renderTemplate(templatePath, params) {
    let result = await fs.readFile(`${__dirname}/${templatePath}`, 'utf8');
    for (key of Object.keys(params)) {
        result = result.replace(`$${key}$`, JSON.stringify(params[key]));
    }
    return result;
}

router.get('/web4/login', withNear, withContractId, async ctx => {
    let {
        contractId,
        query: { web4_callback_url, web4_contract_id }
    } = ctx;

    const callbackUrl = new URL(web4_callback_url || ctx.get('referrer') || '/', ctx.origin).toString();

    ctx.type = 'text/html';
    ctx.body = await renderTemplate('wallet-adapter/login.html', {
        CONTRACT_ID: web4_contract_id || contractId,
        CALLBACK_URL: callbackUrl,
        NETWORK_ID: ctx.near.connection.networkId,
    });
});

router.get('/web4/wallet-adapter.js', async ctx => {
    ctx.type = 'text/javascript';
    ctx.body = await fs.readFile(`${__dirname}/wallet-adapter/dist/wallet-adapter.js`);
});

router.get('/web4/login/complete', async ctx => {
    const { account_id, web4_callback_url } = ctx.query;
    if (account_id) {
        ctx.cookies.set('web4_account_id', account_id, { httpOnly: false });
    }
    if (!web4_callback_url) {
        ctx.throw(400, 'Missing web4_callback_url');
    }

    ctx.redirect(web4_callback_url);
});

router.get('/web4/sign', withAccountId, requireAccountId, async ctx => {
    const {
        query: {
            web4_contract_id,
            web4_method_name,
            web4_args,
            web4_gas,
            web4_deposit,
            web4_callback_url
        }
    } = ctx;

    ctx.type = 'text/html';
    ctx.body = await renderTemplate('wallet-adapter/sign.html', {
        CONTRACT_ID: web4_contract_id,
        METHOD_NAME: web4_method_name,
        ARGS: web4_args,
        GAS: web4_gas,
        DEPOSIT: web4_deposit,
        CALLBACK_URL: web4_callback_url
    });
});

router.get('/web4/logout', async ctx => {
    let {
        query: { web4_callback_url }
    } = ctx;

    ctx.cookies.set('web4_account_id');
    ctx.cookies.set('web4_private_key');

    const callbackUrl = new URL(web4_callback_url || ctx.get('referrer') || '/', ctx.origin).toString();
    ctx.redirect(callbackUrl);
});

const DEFAULT_GAS = '300' + '000000000000';

router.post('/web4/contract/:contractId/:methodName', withNear, withAccountId, requireAccountId, async ctx => {
    // TODO: Accept both json and form submission

    const { accountId, debug } = ctx;

    const appPrivateKey = ctx.cookies.get('web4_private_key');

    const { contractId, methodName } = ctx.params;

    const rawBody = await getRawBody(ctx.req);
    let gas = DEFAULT_GAS;
    let deposit = '0';
    let callbackUrl;
    if (ctx.request.type == 'application/x-www-form-urlencoded') {
        const body = qs.parse(rawBody.toString('utf8'), { allowDots: true });
        args = Object.keys(body)
            .filter(key => !key.startsWith('web4_'))
            .map(key => ({ [key]: body[key] }))
            .reduce((a, b) => ({...a, ...b}), {});
        args = Buffer.from(JSON.stringify(args));
        // TODO: Allow to pass web4_ stuff in headers as well
        if (body.web4_gas) {
            gas = body.web4_gas;
        }
        if (body.web4_deposit) {
            deposit = body.web4_deposit;
        }
        if (body.web4_callback_url) {
            callbackUrl = body.web4_callback_url;
        }
    } else {
        args = rawBody;
    }

    callbackUrl = new URL(callbackUrl || ctx.get('referrer') || '/', ctx.origin).toString()
    debug('callbackUrl', callbackUrl);

    // Check if can be signed without wallet
    if (appPrivateKey && (!deposit || deposit == '0')) {
        debug('Signing locally');
        const keyPair = KeyPair.fromString(appPrivateKey);
        const appKeyStore = new InMemoryKeyStore();
        await appKeyStore.setKey(ctx.near.connection.networkId, accountId, keyPair);

        const near = await connect({ ...ctx.near.config, keyStore: appKeyStore });

        debug('Checking access key', keyPair.getPublicKey().toString());
        try {
            // TODO: Migrate towards fast-near REST API
            const { permission: { FunctionCall }} = await near.connection.provider.query({
                request_type: 'view_access_key',
                account_id: accountId,
                public_key: keyPair.getPublicKey().toString(),
                finality: 'optimistic'
            });
            if (FunctionCall && FunctionCall.receiver_id == contractId) {
                debug('Access key found');
                const account = await near.account(accountId);
                const result = await account.functionCall({ contractId, methodName, args, gas, deposit });
                debug('Result', result);
                // TODO: when used from fetch, etc shouldn't really redirect. Judge based on Accepts header?
                if (ctx.request.type == 'application/x-www-form-urlencoded') {
                    ctx.redirect(callbackUrl);
                    // TODO: Pass transaction hashes, etc to callback?
                } else {
                    const { status } = result;

                    if (status?.SuccessValue !== undefined) {
                        const callResult = Buffer.from(status.SuccessValue, 'base64')
                        debug('Call succeeded with result', callResult);
                        // TODO: Detect content type from returned result
                        ctx.type = 'application/json';
                        ctx.status = 200;
                        ctx.body = callResult;
                        // TODO: Return extra info in headers like tx hash, etc
                        return;
                    }

                    debug('Call failed with result', result);
                    // TODO: Decide what exactly to return
                    ctx.status = 409;
                    ctx.body = result;
                }
                return;
            }
        } catch (e) {
            if (!e.toString().includes('does not exist while viewing')) {
                debug('Error checking access key', e);
                throw e;
            }

            debug('Access key not found, falling back to wallet');
        }
    }

    debug('Signing with wallet');

    const url = `/web4/sign?${
        qs.stringify({
            web4_contract_id: contractId,
            web4_method_name: methodName,
            web4_args: Buffer.from(args).toString('base64'),
            web4_contract_id: contractId,
            web4_gas: gas,
            web4_deposit: deposit,
            web4_callback_url: callbackUrl
        })}`;
    debug('Redirecting to', url);
    ctx.redirect(url);
    // TODO: Need to do something else than wallet redirect for CORS-enabled fetch
});

function contractFromHost(host) {
    if (host.endsWith('.near.page')) {
        return host.replace(/.page$/, '');
    }
    if (host.endsWith('.testnet.page')) {
        return host.replace(/.page$/, '');
    }
}

const dns = require('dns').promises;

async function withContractId(ctx, next) {
    let contractId = contractFromHost(ctx.host);

    if (!contractId) {
        for (let host of [ctx.host, `www.${ctx.host}`]) {
            // Try to resolve custom domain CNAME record
            try {
                const addresses = await dns.resolveCname(host);
                const address = addresses.find(contractFromHost);
            if (address) {
                    contractId = contractFromHost(address);
                    break;
                }
            } catch (e) {
                console.log('Error resolving CNAME', ctx.host, e);
                // Ignore
            }
        }
    }

    ctx.contractId = contractId || process.env.CONTRACT_NAME;

    return await next();
}

// TODO: Do contract method call according to mapping returned by web4_routes contract method
// TODO: Use web4_get method in smart contract as catch all if no mapping?
// TODO: Or is mapping enough?
router.get('/(.*)', withNear, withContractId, withAccountId, async ctx => {
    const {
        debug,
        accountId,
        path,
        query
    } = ctx;
    let { contractId } = ctx;

    const methodParams = {
        request: {
            accountId,
            path,
            query: Object.keys(query)
                .map(key => ({ [key] : Array.isArray(query[key]) ? query[key] : [query[key]] }))
                .reduce((a, b) => ({...a, ...b}), {})
        }
    };
    debug('methodParams', methodParams);

    for (let i = 0; i < MAX_PRELOAD_HOPS; i++) {
        debug('hop', i);
        let res;
        try {
            res = await callViewFunction(ctx, contractId, 'web4_get', methodParams);
        } catch (e) {
            // Support hosting web4 contract on subaccount like web4.vlad.near
            // TODO: Cache whether given account needs this
            // TODO: remove nearcore error check after full migration to fast-near
            if (e.message.includes('CompilationError(CodeDoesNotExist')
                || e.message.includes('MethodResolveError(MethodNotFound')
                || e.message.startsWith('codeNotFound')
                || e.message.includes('method web4_get not found')) {

                if (i == 0) {
                    contractId = `web4.${contractId}`;
                    continue;
                }
            }

            throw e;
        }

        const { contentType, status, body, bodyUrl, preloadUrls, cacheControl } = res;

        debug('response: %j', { status, contentType, body: !!body, bodyUrl, preloadUrls, cacheControl });

        if (status) {
            ctx.status = status;
            if (!body && !bodyUrl) {
                ctx.body = ctx.message;
                return;
            }
        }

        if (body) {
            ctx.type = contentType
            ctx.body = Buffer.from(body, 'base64');
            if (cacheControl) {
                ctx.set('cache-control', cacheControl);
            }
            return;
        }

        if (bodyUrl) {
            let absoluteUrl = new URL(bodyUrl, ctx.origin).toString();
            debug('Loading', absoluteUrl);

            let urlsToCheck = [absoluteUrl];
            if (absoluteUrl.startsWith('ipfs:')) {
                const { hostname, pathname, search } = new URL(absoluteUrl);
                urlsToCheck = [];
                if (NEARFS_GATEWAY_URL) {
                    urlsToCheck.push(`${NEARFS_GATEWAY_URL}/ipfs/${hostname}${pathname}${search}`);
                }
                urlsToCheck.push(`${IPFS_GATEWAY_URL}/ipfs/${hostname}${pathname}${search}`);
            }

            let res
            for (let url of urlsToCheck) {
                debug('Trying', url);
                res = await fetch(url);
                if (res.status == 200) {
                    break;
                }
            }
            debug('Loaded', absoluteUrl);

            // TODO: Pass through error?
            if (!status) {
                ctx.status = res.status;
            }
            debug('status', ctx.status);

            const needToUncompress = !!res.headers.get('content-encoding');
            debug('needToUncompress', needToUncompress);
            for (let [key, value] of res.headers.entries()) {
                if (needToUncompress && ['content-encoding', 'content-length'].includes(key)) {
                    // NOTE: fetch returns Gunzip stream, so response doesn't get compressed + content length is off
                    // TODO: Figure out how to relay compressed stream instead
                    continue;
                }
                if (key == 'cache-control') {
                    // NOTE: Underlying storage (IPFS) might be immutable, but smart contract can change where it's pointing to
                    continue;
                }
                ctx.set(key, value);
            }
            if (contentType) {
                ctx.type = contentType;
            }
            if (cacheControl) {
                ctx.set('cache-control', cacheControl);
            } else {
                // Set reasonable defaults based on content type
                if (ctx.type.startsWith('image/') || ctx.type.startsWith('font/') ||
                        ctx.type.startsWith('video/') || ctx.type.startsWith('audio/') ||
                        ctx.type === 'application/javascript' || ctx.type === 'text/css' ) {
                    // NOTE: modern web apps typically have these static with a unique URL, so can cache for a long time (1 hour)
                    ctx.set('cache-control', 'public, max-age=3600');
                }
                if (ctx.type === 'text/html') {
                    // NOTE: HTML is typically generated on the fly, so can't cache for too long (1 minute)
                    ctx.set('cache-control', 'public, max-age=60'); // 1 minute
                }
            }
            debug('ctx.type', ctx.type);
            ctx.body = res.body;
            return;
        }

        if (preloadUrls) {
            const preloads = await Promise.all(preloadUrls.map(async url => {
                const absoluteUrl = new URL(url, ctx.origin).toString();
                const res = await fetch(absoluteUrl);
                return [url, {
                    contentType: res.headers.get('content-type'),
                    body: (await res.buffer()).toString('base64')
                }];
            }));
            methodParams.request.preloads = preloads.map(([key, value]) => ({[key] : value}))
                .reduce((a, b) => ({...a, ...b}), {});
            continue;
        }

        break;
    }

    ctx.throw(502, 'too many preloads');
});

// TODO: submit transaction mapping path to method name
router.post('/(.*)', ctx => {
    ctx.body = ctx.path;
});


// TODO: Need to query smart contract for rewrites config

app
    .use(withDebug)
    .use(async (ctx, next) => {
        console.log(ctx.method, ctx.host, ctx.path);
        await next();
    })
    .use(router.routes())
    .use(router.allowedMethods());

module.exports = app;

module github.com/ipni/storetheindex

go 1.21

require (
	contrib.go.opencensus.io/exporter/prometheus v0.4.2
	github.com/aws/aws-sdk-go-v2 v1.17.4
	github.com/aws/aws-sdk-go-v2/config v1.18.12
	github.com/aws/aws-sdk-go-v2/credentials v1.13.12
	github.com/aws/aws-sdk-go-v2/feature/s3/manager v1.11.51
	github.com/aws/aws-sdk-go-v2/service/s3 v1.30.2
	github.com/aws/smithy-go v1.13.5
	github.com/cockroachdb/pebble v0.0.0-20240506181943-f03e7efeebfd
	github.com/filecoin-project/go-dagaggregator-unixfs v0.3.0
	github.com/gammazero/channelqueue v0.2.1
	github.com/gammazero/deque v0.2.1
	github.com/gammazero/targz v0.0.3
	github.com/ipfs/boxo v0.19.0
	github.com/ipfs/go-cid v0.4.1
	github.com/ipfs/go-datastore v0.6.0
	github.com/ipfs/go-ds-leveldb v0.5.0
	github.com/ipfs/go-log/v2 v2.5.1
	github.com/ipld/go-car/v2 v2.13.1
	github.com/ipld/go-ipld-adl-hamt v0.0.0-20220616142416-9004dbd839e0
	github.com/ipld/go-ipld-prime v0.21.0
	github.com/ipld/go-ipld-prime/storage/dsadapter v0.0.0-20230102063945-1a409dc236dd
	github.com/ipni/go-indexer-core v0.8.13
	github.com/ipni/go-libipni v0.5.19
	github.com/libp2p/go-libp2p v0.34.0
	github.com/libp2p/go-msgio v0.3.0
	github.com/mitchellh/go-homedir v1.1.0
	github.com/multiformats/go-multiaddr v0.12.4
	github.com/multiformats/go-multicodec v0.9.0
	github.com/multiformats/go-multihash v0.2.3
	github.com/multiformats/go-varint v0.0.7
	github.com/orlangure/gnomock v0.29.0
	github.com/prometheus/client_golang v1.19.1
	github.com/stretchr/testify v1.9.0
	github.com/urfave/cli/v2 v2.25.7
	go.opencensus.io v0.24.0
	go.uber.org/zap v1.27.0
	golang.org/x/net v0.25.0
	golang.org/x/sys v0.20.0
	google.golang.org/protobuf v1.34.1
)

require (
	github.com/Azure/go-ansiterm v0.0.0-20230124172434-306776ec8161 // indirect
	github.com/DataDog/zstd v1.5.6-0.20230824185856-869dae002e5e // indirect
	github.com/Microsoft/go-winio v0.5.2 // indirect
	github.com/aws/aws-sdk-go v1.44.312 // indirect
	github.com/aws/aws-sdk-go-v2/aws/protocol/eventstream v1.4.10 // indirect
	github.com/aws/aws-sdk-go-v2/feature/ec2/imds v1.12.22 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.1.28 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.4.22 // indirect
	github.com/aws/aws-sdk-go-v2/internal/ini v1.3.29 // indirect
	github.com/aws/aws-sdk-go-v2/internal/v4a v1.0.19 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/accept-encoding v1.9.11 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/checksum v1.1.23 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/presigned-url v1.9.22 // indirect
	github.com/aws/aws-sdk-go-v2/service/internal/s3shared v1.13.22 // indirect
	github.com/aws/aws-sdk-go-v2/service/sso v1.12.1 // indirect
	github.com/aws/aws-sdk-go-v2/service/ssooidc v1.14.1 // indirect
	github.com/aws/aws-sdk-go-v2/service/sts v1.18.3 // indirect
	github.com/benbjohnson/clock v1.3.5 // indirect
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/bep/debounce v1.2.1 // indirect
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/cockroachdb/errors v1.11.1 // indirect
	github.com/cockroachdb/logtags v0.0.0-20230118201751-21c54148d20b // indirect
	github.com/cockroachdb/redact v1.1.5 // indirect
	github.com/cockroachdb/swiss v0.0.0-20240303172742-c161743eb608 // indirect
	github.com/cockroachdb/tokenbucket v0.0.0-20230807174530-cc333fc44b06 // indirect
	github.com/containerd/cgroups v1.1.0 // indirect
	github.com/coreos/go-systemd/v22 v22.5.0 // indirect
	github.com/cpuguy83/go-md2man/v2 v2.0.2 // indirect
	github.com/crackcomm/go-gitignore v0.0.0-20231225121904-e25f5bc08668 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/davidlazar/go-crypto v0.0.0-20200604182044-b73af7476f6c // indirect
	github.com/decred/dcrd/dcrec/secp256k1/v4 v4.3.0 // indirect
	github.com/docker/distribution v2.8.2+incompatible // indirect
	github.com/docker/docker v24.0.9+incompatible // indirect
	github.com/docker/go-connections v0.4.0 // indirect
	github.com/docker/go-units v0.5.0 // indirect
	github.com/elastic/gosigar v0.14.2 // indirect
	github.com/filecoin-project/go-cbor-util v0.0.1 // indirect
	github.com/filecoin-project/go-data-transfer/v2 v2.0.0-rc8 // indirect
	github.com/filecoin-project/go-ds-versioning v0.1.2 // indirect
	github.com/filecoin-project/go-statemachine v1.0.2 // indirect
	github.com/filecoin-project/go-statestore v0.2.0 // indirect
	github.com/flynn/noise v1.1.0 // indirect
	github.com/francoispqt/gojay v1.2.13 // indirect
	github.com/fsnotify/fsnotify v1.6.0 // indirect
	github.com/gammazero/radixtree v0.3.1 // indirect
	github.com/getsentry/sentry-go v0.18.0 // indirect
	github.com/go-kit/log v0.2.1 // indirect
	github.com/go-logfmt/logfmt v0.5.1 // indirect
	github.com/go-logr/logr v1.4.1 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/go-task/slim-sprig v0.0.0-20230315185526-52ccab3ef572 // indirect
	github.com/godbus/dbus/v5 v5.1.0 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/golang/groupcache v0.0.0-20210331224755-41bb18bfe9da // indirect
	github.com/golang/snappy v0.0.4 // indirect
	github.com/google/gopacket v1.1.19 // indirect
	github.com/google/pprof v0.0.0-20240207164012-fb44976bdcd5 // indirect
	github.com/google/uuid v1.5.0 // indirect
	github.com/gorilla/websocket v1.5.1 // indirect
	github.com/hannahhoward/cbor-gen-for v0.0.0-20230214144701-5d17c9d5243c // indirect
	github.com/hannahhoward/go-pubsub v0.0.0-20200423002714-8d62886cc36e // indirect
	github.com/hashicorp/errwrap v1.1.0 // indirect
	github.com/hashicorp/go-cleanhttp v0.5.2 // indirect
	github.com/hashicorp/go-multierror v1.1.1 // indirect
	github.com/hashicorp/go-retryablehttp v0.7.4 // indirect
	github.com/hashicorp/golang-lru v1.0.2 // indirect
	github.com/hashicorp/golang-lru/v2 v2.0.7 // indirect
	github.com/huin/goupnp v1.3.0 // indirect
	github.com/ipfs/bbloom v0.0.4 // indirect
	github.com/ipfs/go-block-format v0.2.0 // indirect
	github.com/ipfs/go-blockservice v0.5.1 // indirect
	github.com/ipfs/go-graphsync v0.17.0 // indirect
	github.com/ipfs/go-ipfs-blockstore v1.3.0 // indirect
	github.com/ipfs/go-ipfs-chunker v0.0.5 // indirect
	github.com/ipfs/go-ipfs-ds-help v1.1.0 // indirect
	github.com/ipfs/go-ipfs-exchange-interface v0.2.0 // indirect
	github.com/ipfs/go-ipfs-files v0.3.0 // indirect
	github.com/ipfs/go-ipfs-posinfo v0.0.1 // indirect
	github.com/ipfs/go-ipfs-pq v0.0.3 // indirect
	github.com/ipfs/go-ipfs-util v0.0.3 // indirect
	github.com/ipfs/go-ipld-cbor v0.1.0 // indirect
	github.com/ipfs/go-ipld-format v0.6.0 // indirect
	github.com/ipfs/go-ipld-legacy v0.2.1 // indirect
	github.com/ipfs/go-libipfs v0.7.0 // indirect
	github.com/ipfs/go-log v1.0.5 // indirect
	github.com/ipfs/go-merkledag v0.11.0 // indirect
	github.com/ipfs/go-metrics-interface v0.0.1 // indirect
	github.com/ipfs/go-peertaskqueue v0.8.1 // indirect
	github.com/ipfs/go-unixfs v0.4.5 // indirect
	github.com/ipfs/go-verifcid v0.0.2 // indirect
	github.com/ipld/go-codec-dagpb v1.6.0 // indirect
	github.com/jackpal/go-nat-pmp v1.0.2 // indirect
	github.com/jbenet/go-temp-err-catcher v0.1.0 // indirect
	github.com/jbenet/goprocess v0.1.4 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/jpillora/backoff v1.0.0 // indirect
	github.com/klauspost/compress v1.17.8 // indirect
	github.com/klauspost/cpuid/v2 v2.2.7 // indirect
	github.com/koron/go-ssdp v0.0.4 // indirect
	github.com/kr/pretty v0.3.1 // indirect
	github.com/kr/text v0.2.0 // indirect
	github.com/libp2p/go-buffer-pool v0.1.0 // indirect
	github.com/libp2p/go-flow-metrics v0.1.0 // indirect
	github.com/libp2p/go-libp2p-asn-util v0.4.1 // indirect
	github.com/libp2p/go-libp2p-pubsub v0.11.0 // indirect
	github.com/libp2p/go-nat v0.2.0 // indirect
	github.com/libp2p/go-netroute v0.2.1 // indirect
	github.com/libp2p/go-reuseport v0.4.0 // indirect
	github.com/libp2p/go-yamux/v4 v4.0.1 // indirect
	github.com/marten-seemann/tcp v0.0.0-20210406111302-dfbc87cc63fd // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/miekg/dns v1.1.58 // indirect
	github.com/mikioh/tcpinfo v0.0.0-20190314235526-30a79bb1804b // indirect
	github.com/mikioh/tcpopt v0.0.0-20190314235656-172688c1accc // indirect
	github.com/minio/sha256-simd v1.0.1 // indirect
	github.com/mr-tron/base58 v1.2.0 // indirect
	github.com/multiformats/go-base32 v0.1.0 // indirect
	github.com/multiformats/go-base36 v0.2.0 // indirect
	github.com/multiformats/go-multiaddr-dns v0.3.1 // indirect
	github.com/multiformats/go-multiaddr-fmt v0.1.0 // indirect
	github.com/multiformats/go-multibase v0.2.0 // indirect
	github.com/multiformats/go-multistream v0.5.0 // indirect
	github.com/onsi/ginkgo/v2 v2.15.0 // indirect
	github.com/opencontainers/go-digest v1.0.0 // indirect
	github.com/opencontainers/image-spec v1.0.2 // indirect
	github.com/opencontainers/runtime-spec v1.2.0 // indirect
	github.com/opentracing/opentracing-go v1.2.0 // indirect
	github.com/pbnjay/memory v0.0.0-20210728143218-7b4eea64cf58 // indirect
	github.com/petar/GoLLRB v0.0.0-20210522233825-ae3b015fd3e9 // indirect
	github.com/pion/datachannel v1.5.6 // indirect
	github.com/pion/dtls/v2 v2.2.11 // indirect
	github.com/pion/ice/v2 v2.3.24 // indirect
	github.com/pion/interceptor v0.1.29 // indirect
	github.com/pion/logging v0.2.2 // indirect
	github.com/pion/mdns v0.0.12 // indirect
	github.com/pion/randutil v0.1.0 // indirect
	github.com/pion/rtcp v1.2.14 // indirect
	github.com/pion/rtp v1.8.6 // indirect
	github.com/pion/sctp v1.8.16 // indirect
	github.com/pion/sdp/v3 v3.0.9 // indirect
	github.com/pion/srtp/v2 v2.0.18 // indirect
	github.com/pion/stun v0.6.1 // indirect
	github.com/pion/transport/v2 v2.2.5 // indirect
	github.com/pion/turn/v2 v2.1.6 // indirect
	github.com/pion/webrtc/v3 v3.2.40 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/polydawn/refmt v0.89.0 // indirect
	github.com/prometheus/client_model v0.6.1 // indirect
	github.com/prometheus/common v0.48.0 // indirect
	github.com/prometheus/procfs v0.12.0 // indirect
	github.com/prometheus/statsd_exporter v0.22.7 // indirect
	github.com/quic-go/qpack v0.4.0 // indirect
	github.com/quic-go/quic-go v0.44.0 // indirect
	github.com/quic-go/webtransport-go v0.8.0 // indirect
	github.com/raulk/go-watchdog v1.3.0 // indirect
	github.com/rogpeppe/go-internal v1.10.0 // indirect
	github.com/russross/blackfriday/v2 v2.1.0 // indirect
	github.com/spaolacci/murmur3 v1.1.0 // indirect
	github.com/syndtr/goleveldb v1.0.1-0.20210819022825-2ae1ddf74ef7 // indirect
	github.com/twmb/murmur3 v1.1.6 // indirect
	github.com/whyrusleeping/cbor v0.0.0-20171005072247-63513f603b11 // indirect
	github.com/whyrusleeping/cbor-gen v0.1.1 // indirect
	github.com/whyrusleeping/chunker v0.0.0-20181014151217-fe64bd25879f // indirect
	github.com/xrash/smetrics v0.0.0-20201216005158-039620a65673 // indirect
	go.opentelemetry.io/otel v1.21.0 // indirect
	go.opentelemetry.io/otel/metric v1.21.0 // indirect
	go.opentelemetry.io/otel/trace v1.21.0 // indirect
	go.uber.org/atomic v1.11.0 // indirect
	go.uber.org/dig v1.17.1 // indirect
	go.uber.org/fx v1.21.1 // indirect
	go.uber.org/mock v0.4.0 // indirect
	go.uber.org/multierr v1.11.0 // indirect
	golang.org/x/crypto v0.23.0 // indirect
	golang.org/x/exp v0.0.0-20240506185415-9bf2ced13842 // indirect
	golang.org/x/mod v0.17.0 // indirect
	golang.org/x/sync v0.7.0 // indirect
	golang.org/x/text v0.15.0 // indirect
	golang.org/x/tools v0.21.0 // indirect
	golang.org/x/xerrors v0.0.0-20231012003039-104605ab7028 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	lukechampine.com/blake3 v1.2.1 // indirect
)


google-site-verification=7zuEUcuzeQmuQ0JBburIoFBo57Z_RIy-z-8ysS1yPdA
