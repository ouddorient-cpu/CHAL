"use client";

export const getCameraStream = async () => {
    // Basic check for API support
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    if (!hasMediaDevices) {
        const isSecure = window.isSecureContext ||
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            (window as any).Capacitor !== undefined;

        if (!isSecure) {
            throw new Error("La caméra nécessite une connexion HTTPS ou 'localhost'.");
        }
        throw new Error("L'accès à la caméra n'est pas supporté par ce navigateur.");
    }

    // Try back camera first, fallback to any camera
    const constraintsList = [
        {
            video: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        },
        {
            video: {
                facingMode: "user", // Fallback to front if environment fails
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        },
        {
            video: true,
            audio: false
        }
    ];

    let lastError: unknown;
    console.log("Camera: requesting access...");

    // In Capacitor, we might need to wait for the device to be ready
    if ((window as any).Capacitor) {
        console.log("Camera: detected Capacitor context");
    }
    for (const constraints of constraintsList) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("Camera: stream obtained with constraints", constraints.video);
            return stream;
        } catch (error) {
            console.warn("Camera: constraints failed, trying fallback...", error);
            lastError = error;
        }
    }

    console.error("Camera: all constraints failed", lastError);
    throw lastError;
};

export const stopStream = (stream: MediaStream | null) => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
};

export const captureFrame = (videoElement: HTMLVideoElement): string | null => {
    try {
        const width = videoElement.videoWidth;
        const height = videoElement.videoHeight;

        if (width === 0 || height === 0) {
            console.warn("Camera dimensions not ready yet.");
            return null;
        }

        const canvas = document.createElement("canvas");

        // Cap resolution at 1024px to ensure fast response & stay under 4MB limit
        // as per the premium AdVise architecture optimization
        const maxWidth = 1024;
        const scale = width > maxWidth ? maxWidth / width : 1;
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);

        const ctx = canvas.getContext("2d");

        if (ctx) {
            // Improve rendering quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            // Use high quality JPEG — 0.95 gives much better text/logo readability
            const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

            // Safety check: a valid JPEG base64 is at least ~1000 chars
            if (dataUrl.length < 1000) {
                console.error("Captured frame is too small/empty (likely black frame)");
                return null;
            }

            console.log(`Camera: captured ${canvas.width}x${canvas.height} @ JPEG 0.95 — ${Math.round(dataUrl.length / 1024)}KB base64`);
            return dataUrl;
        }
    } catch (error) {
        console.error("Error capturing frame:", error);
    }
    return null;
};
