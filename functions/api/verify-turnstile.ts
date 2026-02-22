export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    
    if (!body || !body.token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const secret = context.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server misconfigured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', body.token);

    const ip = context.request.headers.get('CF-Connecting-IP');
    if (ip) formData.append('remoteip', ip);

    const result = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      }
    );

    const outcome = await result.json();

    if (!outcome.success) {
      return new Response(
        JSON.stringify({ success: false, errors: outcome['error-codes'] }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
