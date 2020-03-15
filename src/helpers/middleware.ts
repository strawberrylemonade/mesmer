import { JWK, JWS } from 'node-jose';
import got from 'got';
import { Request, Response, NextFunction } from 'express';

import { NotAuthorisedError } from './errors';
import log from './log';

let jwtTokenStore: JWK.KeyStore;

async function getTokenStore() {
  if(jwtTokenStore) return jwtTokenStore;
  
  const wellknownRes = await got(process.env.OPENID_CONFIG_URL || '');
  const openIdConnectConfiguration = JSON.parse(wellknownRes.body);
  
  const tokenStoreUrl = openIdConnectConfiguration['jwks_uri'];
  const tokenRes = await got(tokenStoreUrl);
  const tokenStoreJson = await JSON.parse(tokenRes.body);

  jwtTokenStore = await JWK.asKeyStore(tokenStoreJson);
  return jwtTokenStore;
}

export function verifyAuth(req: any, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    const error = new NotAuthorisedError('No "Authorization" header found.');
    log(error);
    res.status(error.code);
    res.json(error.toJSON());
    return;
  }

  const [prefix, token] = authHeader.split(' ');

  if(prefix !== 'Bearer'){
    const error = new NotAuthorisedError('Authentication is configured incorrectly.');
    log(error);
    res.status(error.code);
    res.json(error.toJSON());
    return;
  }


  // Express middleware seems to be allergic to async await so vanilla promises will have to do
  getTokenStore()
    .then((keyStore) => JWS.createVerify(keyStore).verify(token))
    .then((key: JWS.VerificationResult) => {
      req.token = key.payload.toString();
      let token = JSON.parse(req.token);
      if (token.exp < Math.round((new Date).getTime() / 1000)) {
        const error = new NotAuthorisedError('JWT token has expired.');
        log(error);
        res.status(error.code);
        res.json(error.toJSON());
        return;
      }

      if (token.aud !== process.env['OPENID_AUDIENCE']) {
        const error = new NotAuthorisedError('JWT token has an invalid audience.');
        log(error);
        res.status(error.code);
        res.json(error.toJSON());
        return;
      }
      next();
    })
    .catch(() => {
      const error = new NotAuthorisedError('JWT token is invalid.');
      log(error);
      res.status(error.code);
      res.json(error.toJSON());
      return;
    });
}
