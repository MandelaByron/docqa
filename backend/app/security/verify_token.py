#app/security/verify_token.py

import httpx
from datetime import timedelta
from app.config import settings
import jwt
from jwt.algorithms import RSAAlgorithm
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey
from typing import Any, Dict, cast
from .types import VerifyTokenOptions, TokenVerificationError, TokenVerificationErrorReason
from .cache import Cache
import re
__jwkcache = Cache()
 
def verify_token(token: str, options: VerifyTokenOptions) -> Dict[str, Any]:    
    return _verify_session_token(token, options)

def _verify_session_token(token: str, options: VerifyTokenOptions) -> Dict[str, Any]:
    """ Verifies a Clerk-generated token signature. Networkless if the options.jwt_key is provided.
        Otherwise, performs a network call to retrieve the JWKS from Clerk's Backend API.

        Args:
            token (str): The token to verify.
            options (VerifyTokenOptions): Options to configure the verification.
        """
    if options.jwt_key is not None:
        jwt_key = re.sub(r'(\r\n|\n|\r)', '', options.jwt_key)

    elif options.secret_key is not None:
        jwt_key = _get_remote_jwt_key(token, options)

    else:
        raise TokenVerificationError(TokenVerificationErrorReason.SECRET_KEY_MISSING)

    try:
        return _decode_token(token, jwt_key, options)

    except jwt.InvalidKeyError as e:
        raise TokenVerificationError(TokenVerificationErrorReason.JWK_FAILED_TO_RESOLVE) from e
    except jwt.ExpiredSignatureError as e:
        raise TokenVerificationError(TokenVerificationErrorReason.TOKEN_EXPIRED) from e
    except jwt.InvalidAudienceError as e:
        raise TokenVerificationError(TokenVerificationErrorReason.TOKEN_INVALID_AUDIENCE) from e
    except jwt.InvalidSignatureError as e:
        if options.jwt_key is not None:
            raise TokenVerificationError(TokenVerificationErrorReason.TOKEN_INVALID_SIGNATURE) from e

        # Key rotation: evict stale cached key, re-fetch, and retry once
        kid = jwt.get_unverified_header(token).get('kid')
        __jwkcache.delete(kid)
        jwt_key = _get_remote_jwt_key(token, options)

        try:
            return _decode_token(token, jwt_key, options)
        except jwt.InvalidSignatureError:
            raise TokenVerificationError(TokenVerificationErrorReason.TOKEN_INVALID_SIGNATURE) from e
    except jwt.InvalidIssuedAtError as e:
        raise TokenVerificationError(TokenVerificationErrorReason.TOKEN_IAT_IN_THE_FUTURE) from e
    except jwt.ImmatureSignatureError as e:
        raise TokenVerificationError(TokenVerificationErrorReason.TOKEN_NOT_ACTIVE_YET) from e
    except jwt.InvalidTokenError as e:
        raise TokenVerificationError(TokenVerificationErrorReason.TOKEN_INVALID) from e

def  _fetch_jwks(options: VerifyTokenOptions):
    """ Fetch JWKS from Clerk's Backend API."""
    transport = httpx.HTTPTransport(retries=10) # handles ConnectError and ConnectTimeout
    with httpx.Client(transport=transport) as client:
        http_res = None

        for _ in range(10):
            try:
                http_res = client.get(settings.CLERK_JWKS_URL, headers={
                    'Accept': 'application/json', 'Authorization': f'Bearer {options.secret_key}'
                })
            except httpx.TimeoutException:
                continue
            break

        if http_res is None or http_res.status_code != 200:
            raise TokenVerificationError(TokenVerificationErrorReason.JWK_FAILED_TO_LOAD)
 

        try:
            return http_res.json()
        except Exception as e:
            raise TokenVerificationError(TokenVerificationErrorReason.JWK_FAILED_TO_LOAD) from e  


def _get_remote_jwt_key(token: str, options: VerifyTokenOptions) -> str:
    """ Retrieve JWT Public Key from Clerk's Backend API

    Args:
        token (str): The token from which to extract the public key.
    """

    try:
        kid = jwt.get_unverified_header(token).get('kid')
    except jwt.InvalidTokenError as e:
        raise TokenVerificationError(TokenVerificationErrorReason.TOKEN_INVALID) from e
      

    decoded_pem = __jwkcache.get(kid)
    if decoded_pem is not None:
        return decoded_pem

    jwks = _fetch_jwks(options).get('keys')
    if jwks is None:
 
        raise TokenVerificationError(TokenVerificationErrorReason.JWK_REMOTE_INVALID)

    for key in jwks:
        if key.get('kid') == kid:
            public_key = RSAAlgorithm.from_jwk(key)
            if isinstance(public_key, RSAPublicKey):
                public_key = cast(RSAPublicKey, public_key)
                pem = public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                )
                decoded_pem = pem.decode('utf-8')
                __jwkcache.set(kid, decoded_pem)
                return decoded_pem

    raise TokenVerificationError(TokenVerificationErrorReason.JWK_KID_MISMATCH)
    

def _decode_token(token: str, jwt_key: str, options: VerifyTokenOptions) -> Dict[str, Any]:
    """Decode a JWT and validate authorized parties."""
    payload = jwt.decode(
        token,
        jwt_key,
        algorithms=['RS256'],
        audience=options.audience,
        issuer=options.issuer,
        options={'verify_iss': True, 'verify_aud': options.audience is not None},
        leeway=timedelta(milliseconds=float(options.clock_skew_in_ms))
    )

    if options.authorized_parties is not None:
        azp = payload.get("azp")
        if azp is None or azp not in options.authorized_parties:
            raise TokenVerificationError(TokenVerificationErrorReason.TOKEN_INVALID_AUTHORIZED_PARTIES)

    return payload


