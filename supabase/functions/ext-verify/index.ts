import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface VerifyBody {
  challengeId: string;
  signature: string;
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ verified: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ verified: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body: VerifyBody = await req.json();
  const { challengeId, signature } = body;

  if (!challengeId || !signature) {
    return new Response(JSON.stringify({ verified: false }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: challenge, error: challengeError } = await supabase
    .from("extension_challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("user_id", user.id)
    .single();

  if (challengeError || !challenge) {
    return new Response(JSON.stringify({ verified: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const expired = new Date(challenge.expires_at).getTime() < Date.now();
  if (expired || challenge.used) {
    return new Response(JSON.stringify({ verified: false }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const secret = Deno.env.get("EXTENSION_SECRET")!;
  const expectedSignature = await hmacSign(secret, challenge.nonce);
  const valid = timingSafeEqual(expectedSignature, signature);

  // Mark used regardless of outcome — single use only
  await supabase
    .from("extension_challenges")
    .update({ used: true })
    .eq("id", challengeId);

  if (valid) {
    await supabase.from("extension_verifications").upsert({
      user_id: user.id,
      verified_at: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify({ verified: valid }), {
    headers: { "Content-Type": "application/json" },
  });
});