# Recipe: Certificate Pinning

The app trusts any certificate that the device's trust store accepts, like a
browser does. Pinning goes further: the app accepts a server only if its
certificate chain contains a public key the app knows, so a certificate from
a compromised or user-installed CA (a corporate proxy, a debugging tool)
can't read the traffic. Regulated apps (banking, health) often need it.

It also has a cost: a pinned app that meets a key it doesn't know can't
reach your backend at all, until the user installs an update. Most outages
come from two mistakes, both covered below: **shipping a single pin** and
**pinning a key that rotates without notice**.

This recipe uses
[react-native-ssl-public-key-pinning](https://github.com/frw/react-native-ssl-public-key-pinning),
which pins with OkHttp on Android and TrustKit on iOS. It pins every request
made through `fetch` or `XMLHttpRequest`, so axios and all the app's clients
(`shared/http/httpClient.ts`) are covered; a native SDK with its own network
stack is not.

## Install

```bash
npx expo install react-native-ssl-public-key-pinning
```

It has native code, so it runs in a
[development build](https://docs.expo.dev/develop/development-builds/introduction/)
or a store build, not in Expo Go (the code below skips pinning there). It
needs no config plugin of its own. In an iOS **development** build,
`expo-dev-client`'s network inspector bypasses the pins; to test pinning in
one, turn the inspector off with the `expo-build-properties` config plugin:
`npx expo install expo-build-properties`, add
`['expo-build-properties', { ios: { networkInspector: false } }]` to
`plugins` in `app.config.ts`, and rebuild. Preview and production builds
don't include the inspector.

## Choose the pins

A pin is the base64 SHA-256 hash of a certificate's public key (its Subject
Public Key Info). Pinning the key, not the certificate, means a renewed
certificate with the same key still matches.

Ship **at least two pins per host**: the key in use and a backup. TrustKit
rejects a host with only one, and a backup is what lets you rotate without
an outage. Pick the keys you control the rotation of:

- **Your own server key** (the leaf): pin the current key and a backup key
  pair that you generate now and keep offline. When you renew, either reuse
  the key (`certbot --reuse-key`) or switch to the backup. Don't pin the leaf
  of a certificate your host renews with new keys automatically (many
  managed load balancers and CDNs do): the next renewal locks users out.
- **Your CA's intermediate key**: survives leaf renewals, but the CA can
  switch intermediates. Pin two (the current one and the CA's alternate), or
  one intermediate plus your own backup key.

Get the hash of the key a host serves now:

```bash
openssl s_client -servername api.example.com -connect api.example.com:443 </dev/null 2>/dev/null \
  | openssl x509 -pubkey -noout \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary | openssl enc -base64
```

and of a backup key pair you keep offline:

```bash
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out backup-key.pem
openssl pkey -in backup-key.pem -pubout -outform der \
  | openssl dgst -sha256 -binary | openssl enc -base64
```

For an intermediate, run the first command with `-showcerts` and hash the
second certificate in the chain.

## Pin the app's hosts

Put the pins in one module. It pins the hosts of `EXPO_PUBLIC_API_URL` and
`EXPO_PUBLIC_AUTH_API_URL` when they are in the table, and makes every
request through the app's clients wait until pinning is on. If pinning fails
to start (for example, a host with one pin on iOS), those requests fail
instead of going out unpinned. Pins are public, so they can live in the
code; they are not secrets.

<!-- docs-check: requires react-native-ssl-public-key-pinning -->

```ts
// shared/http/sslPinning.ts
import { Platform } from 'react-native';
import type { AxiosInstance } from 'axios';
import {
  addSslPinningErrorListener,
  initializeSslPinning,
  isSslPinningAvailable,
  type PinningOptions,
} from 'react-native-ssl-public-key-pinning';
import { getConfig } from '@/shared/config/env';
import { api } from '@/shared/http/api';
import { logger } from '@/shared/lib/logger';
import { authClients } from '@/shared/session/authService';

/**
 * Public-key pins (base64 SHA-256 of the SPKI) by host: the key in use and
 * at least one backup each. A host that isn't listed is not pinned.
 */
const PINS: Record<string, string[]> = {
  'api.example.com': ['CURRENT_KEY_HASH_BASE64=', 'BACKUP_KEY_HASH_BASE64='],
  'auth.example.com': ['CURRENT_KEY_HASH_BASE64=', 'BACKUP_KEY_HASH_BASE64='],
};

let ready: Promise<void> = Promise.resolve();

/** Hosts of the configured backends that have pins, with their options. */
function pinningOptions(): PinningOptions {
  const { apiUrl, authApiUrl } = getConfig();
  const options: PinningOptions = {};
  for (const url of [apiUrl, authApiUrl]) {
    const host = new URL(url).hostname;
    const pins = PINS[host];
    if (pins) {
      options[host] = { publicKeyHashes: pins };
    } else if (getConfig().appEnv === 'production') {
      logger.warn('No certificate pins for this host', { host });
    }
  }
  return options;
}

/**
 * Turns pinning on. Call it once, at startup, before any request: the app's
 * HTTP clients wait for it, and fail if it fails.
 */
export function startSslPinning(): void {
  // Browsers don't let a page pin; on the web the browser checks the
  // certificate. Expo Go doesn't have the native module.
  if (Platform.OS === 'web' || !isSslPinningAvailable()) {
    if (Platform.OS !== 'web') {
      logger.warn('Certificate pinning is off: the native module is missing');
    }
    return;
  }
  const options = pinningOptions();
  if (Object.keys(options).length === 0) return;

  ready = initializeSslPinning(options);
  ready.catch(error => logger.error('Certificate pinning failed', error));
  // A rejected handshake reaches the caller as a network error (ApiError
  // code 'network'); this reports which host it was.
  addSslPinningErrorListener(error =>
    logger.error('Certificate pin mismatch', { host: error.serverHostname })
  );

  const waitForPinning = async <T>(config: T): Promise<T> => {
    await ready;
    return config;
  };
  const clients: AxiosInstance[] = [
    api,
    authClients.public,
    authClients.authenticated,
  ];
  for (const client of clients) {
    // Added after httpClient.ts's own interceptor, so it runs first.
    client.interceptors.request.use(waitForPinning);
  }
}
```

Start it first thing in `configureIntegrations()`
(`shared/integrations/setup.ts`), which runs once before the first screen
renders: import `startSslPinning` from `@/shared/http/sslPinning` and call
`startSslPinning();` right after the `configured` check, before the adapters
you register.

`getConfig()` throws when the configuration is invalid;
`configureIntegrations()` already logs that and the app shows its
configuration error screen, so no request goes out unpinned.

Development builds usually talk to `http://localhost` or a LAN address,
which has no certificate to pin: leave those hosts out of `PINS`. Check the
real setup in a preview build against your staging host.

## Check that it fails closed

Pinning that silently does nothing looks exactly like pinning that works.
Before you ship, in a preview build:

1. Replace one host's pins with two made-up hashes and rebuild.
2. Sign in or load data from that host: the request fails with the app's
   network error, and the log shows "Certificate pin mismatch".
3. Put the real pins back. On iOS, quit the app first: TLS sessions are
   cached, so a request on an existing connection isn't checked again.

Repeat it after every pin change.

## Rotate keys

1. Months before a key changes, generate the next backup key and ship an
   app version (or an over-the-air update: the pins are JavaScript, see
   [Plug In a Provider](../plug-in-a-provider.md#ota-updates)) whose pins
   contain the current key, the next key, and the backup.
2. Wait until almost all users have that version (your analytics or store
   console tells you).
3. Switch the server to the next key. Old versions without it can't
   connect, which is why step 2 waits.
4. In the next version, drop the retired key and add a new backup.

To limit the damage of an app version that never updates (a user who turned
off updates), set `expirationDate` (`yyyy-MM-dd`) on a host's options:
after that date the app stops pinning that host instead of failing. It
trades protection for availability; choose it deliberately.

## Web

A web page can't pin certificates: the browser validates them against its
own trust store, and Certificate Transparency and HSTS are what protect the
web build. `startSslPinning()` does nothing there. If the web build talks to
the same backend, pinning on mobile doesn't weaken it.
