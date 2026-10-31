/**
 * Meta Threads Graph API client for automated posting.
 */

interface ThreadsPostOptions {
  text: string;
  mediaUrl?: string | null;
  userId?: string;
  accessToken?: string;
}

interface ThreadsResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export async function publishToThreads({
  text,
  mediaUrl,
  userId = process.env.THREADS_USER_ID,
  accessToken = process.env.THREADS_ACCESS_TOKEN,
}: ThreadsPostOptions): Promise<ThreadsResult> {
  if (!userId || !accessToken) {
    return {
      success: false,
      error: 'THREADS_USER_ID or THREADS_ACCESS_TOKEN is not configured in environment variables.',
    };
  }

  // Ensure text complies with Threads 500-char limit
  const sanitizedText = text.length > 500 ? text.slice(0, 497) + '...' : text;

  try {
    const isImage = Boolean(mediaUrl && mediaUrl.trim() !== '');

    // 1. Create Media Container
    const createParams = new URLSearchParams({
      access_token: accessToken,
      text: sanitizedText,
      media_type: isImage ? 'IMAGE' : 'TEXT',
    });

    if (isImage && mediaUrl) {
      createParams.append('image_url', mediaUrl);
    }

    const createRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: createParams.toString(),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.id) {
      const errorMsg = createData?.error?.message || 'Failed to create Threads container.';
      throw new Error(errorMsg);
    }

    const containerId = createData.id;

    // 2. Wait for Container processing if it contains an image
    if (isImage) {
      let isReady = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isReady && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const statusRes = await fetch(
          `https://graph.threads.net/v1.0/${containerId}?fields=status,error_message&access_token=${accessToken}`
        );
        const statusData = await statusRes.json();

        if (statusData.status === 'FINISHED') {
          isReady = true;
        } else if (statusData.status === 'ERROR') {
          throw new Error(statusData.error_message || 'Threads image processing failed.');
        }
      }

      if (!isReady) {
        throw new Error('Threads container processing timed out.');
      }
    }

    // 3. Publish Container
    const publishParams = new URLSearchParams({
      access_token: accessToken,
      creation_id: containerId,
    });

    const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishParams.toString(),
    });

    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      const errorMsg = publishData?.error?.message || 'Failed to publish to Threads.';
      throw new Error(errorMsg);
    }

    return {
      success: true,
      postId: String(publishData.id),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Threads Publish Error]:', message);
    return {
      success: false,
      error: message,
    };
  }
}
