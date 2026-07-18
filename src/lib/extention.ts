import { createClient } from "@supabase/supabase-js";

const EXTENSION_ID = "YOUR_EXTENSION_ID";

// Vite only exposes env vars prefixed with VITE_ to client-side code.
// process.env.SUPABASE_URL will be undefined in the browser bundle.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLIC_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLIC_ANON_KEY env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

interface ChallengeResponse {
    challengeId: string;
    nonce: string;
}

interface VerifyResponse {
    verified: boolean;
}

interface SignChallengeResult {
    type: string;
    signature?: string;
}

// --- Fast, unsigned check for instant UX. Spoofable — never gate real access on this alone. ---
function detectExtensionPresenceFast(timeoutMs = 800): Promise<boolean> {
    return new Promise((resolve) => {
        if (document.getElementById("my-ext-marker")) {
            resolve(true);
            return;
        }
        const onReady = () => {
            cleanup();
            resolve(true);
        };
        document.addEventListener("MY_EXT_READY", onReady);

        const poll = window.setInterval(() => {
            if (document.getElementById("my-ext-marker")) {
                cleanup();
                resolve(true);
            }
        }, 100);

        const timer = window.setTimeout(() => {
            cleanup();
            resolve(false);
        }, timeoutMs);

        function cleanup() {
            document.removeEventListener("MY_EXT_READY", onReady);
            clearInterval(poll);
            clearTimeout(timer);
        }
    });
}

// --- Ask the extension to sign a nonce. Returns null on any failure/timeout. ---
function requestSignedChallenge(nonce: string, timeoutMs: number): Promise<string | null> {
    return new Promise((resolve) => {
        const sendMessage = window.chrome?.runtime?.sendMessage;
        if (!sendMessage) {
            resolve(null);
            return;
        }

        const timer = window.setTimeout(() => resolve(null), timeoutMs);

        try {
            sendMessage(
                EXTENSION_ID,
                { type: "SIGN_CHALLENGE", nonce },
                (response: SignChallengeResult | undefined) => {
                    clearTimeout(timer);
                    if (window.chrome?.runtime?.lastError || response?.type !== "SIGNED") {
                        resolve(null);
                    } else {
                        resolve(response.signature ?? null);
                    }
                },
            );
        } catch {
            clearTimeout(timer);
            resolve(null);
        }
    });
}

// --- Authoritative check: server decides based on a signed nonce. This is the real gate. ---
async function verifyExtensionWithServer(timeoutMs = 1500): Promise<boolean> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session) return false;

    const authHeaders = { Authorization: `Bearer ${session.access_token}` };

    let challenge: ChallengeResponse;
    try {
        const res = await fetch(`${FUNCTIONS_URL}/ext-challenge`, {
            headers: authHeaders,
        });
        if (!res.ok) return false;
        challenge = await res.json();
    } catch {
        return false;
    }

    const signature = await requestSignedChallenge(challenge.nonce, timeoutMs);
    if (!signature) return false;

    try {
        const res = await fetch(`${FUNCTIONS_URL}/ext-verify`, {
            method: "POST",
            headers: { ...authHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ challengeId: challenge.challengeId, signature }),
        });
        if (!res.ok) return false;
        const result: VerifyResponse = await res.json();
        return result.verified;
    } catch {
        return false;
    }
}

export async function gateApp(): Promise<void> {
    const quickCheck = await detectExtensionPresenceFast();
    if (!quickCheck) {
        showInstallPrompt();
        return;
    }

    const verified = await verifyExtensionWithServer();
    if (verified) {
        initApp();
    } else {
        showInstallPrompt();
    }
}

function showInstallPrompt(): void {
    document.getElementById("app")?.classList.add("hidden");
    document.getElementById("install-gate")?.classList.remove("hidden");
}

function initApp(): void {
    document.getElementById("install-gate")?.classList.add("hidden");
    document.getElementById("app")?.classList.remove("hidden");
}

gateApp();
