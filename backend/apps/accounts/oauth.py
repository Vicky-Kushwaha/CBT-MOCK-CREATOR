import base64
import hashlib
import json
import secrets
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.signing import Signer, BadSignature
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import AccessToken

signer = Signer()
User = get_user_model()

def _verify_pkce(code_verifier: str | None, code_challenge: str | None, method: str | None) -> bool:
    if not code_challenge:
        return True
    if not code_verifier:
        return False
    if (method or "S256").upper() == "PLAIN":
        return code_verifier == code_challenge
    digest = hashlib.sha256(code_verifier.encode()).digest()
    computed = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return computed == code_challenge

def authorize_page(request):
    if request.method == "GET":
        sig = request.GET.get("sig")
        redirect_uri = request.GET.get("redirect_uri")
        state = request.GET.get("state", "")
        code_challenge = request.GET.get("code_challenge", "")
        code_challenge_method = request.GET.get("code_challenge_method", "S256")
        
        try:
            username = signer.unsign(sig)
        except BadSignature:
            return HttpResponse("Invalid signature", status=400)
            
        html = f"""
        <!doctype html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Authorize Claude MCP</title>
          <style>
            body {{ font-family: -apple-system, sans-serif; background: #f8fafc; display: flex;
                   align-items: center; justify-content: center; height: 100vh; margin: 0; }}
            .card {{ background: white; padding: 32px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    width: 100%; max-width: 360px; text-align: center; }}
            h1 {{ font-size: 18px; margin: 0 0 12px; color: #0f172a; }}
            p.sub {{ color: #64748b; font-size: 14px; margin: 0 0 24px; }}
            button {{ width: 100%; background: #0f172a; color: white; border: none; padding: 12px;
                     border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; }}
          </style>
        </head>
        <body>
          <form class="card" method="post">
            <h1>Connect to Claude</h1>
            <p class="sub">Authorize Claude Desktop to access your question bank and manage mocks as <b>{username}</b>.</p>
            <input type="hidden" name="sig" value="{sig}">
            <input type="hidden" name="redirect_uri" value="{redirect_uri}">
            <input type="hidden" name="state" value="{state}">
            <input type="hidden" name="code_challenge" value="{code_challenge}">
            <input type="hidden" name="code_challenge_method" value="{code_challenge_method}">
            <button type="submit">Authorize</button>
          </form>
        </body>
        </html>
        """
        return HttpResponse(html)

    elif request.method == "POST":
        sig = request.POST.get("sig")
        redirect_uri = request.POST.get("redirect_uri")
        state = request.POST.get("state")
        code_challenge = request.POST.get("code_challenge")
        code_challenge_method = request.POST.get("code_challenge_method")
        
        try:
            username = signer.unsign(sig)
        except BadSignature:
            return HttpResponse("Invalid signature", status=400)
            
        code = secrets.token_urlsafe(32)
        cache.set(f"oauth_code_{code}", {
            "username": username,
            "redirect_uri": redirect_uri,
            "code_challenge": code_challenge,
            "code_challenge_method": code_challenge_method,
        }, timeout=300)
        
        query = f"code={code}"
        if state:
            query += f"&state={state}"
            
        return HttpResponseRedirect(f"{redirect_uri}?{query}")

@csrf_exempt
def token_exchange(request):
    if request.method == "POST":
        if request.content_type == "application/json":
            body = json.loads(request.body)
        else:
            body = request.POST
            
        code = body.get("code")
        redirect_uri = body.get("redirect_uri")
        code_verifier = body.get("code_verifier")
        
        data = cache.get(f"oauth_code_{code}")
        if not data:
            return JsonResponse({"error": "invalid_grant"}, status=400)
            
        if data["redirect_uri"] != redirect_uri:
            return JsonResponse({"error": "invalid_grant"}, status=400)
            
        if not _verify_pkce(code_verifier, data["code_challenge"], data["code_challenge_method"]):
            return JsonResponse({"error": "invalid_grant"}, status=400)
            
        cache.delete(f"oauth_code_{code}")
        
        user = User.objects.filter(username=data["username"]).first()
        if not user:
            return JsonResponse({"error": "invalid_grant"}, status=400)
            
        token = AccessToken.for_user(user)
        
        return JsonResponse({
            "access_token": str(token),
            "token_type": "Bearer",
            "expires_in": 3600,
        })
