import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Triggered when a new price contribution is added.
 * Sends a push notification to all users (or could be filtered by neighborhood).
 */
export const onNewPriceAdded = functions.firestore
    .document("prices/{priceId}")
    .onCreate(async (snapshot, context) => {
        const data = snapshot.data();
        if (!data) return;

        const { productId, storeId, price, neighborhood } = data;

        try {
            // 1. Fetch Product and Store details for the notification text
            const productSnap = await admin.firestore().collection("products").doc(productId).get();
            const storeSnap = await admin.firestore().collection("stores").doc(storeId).get();

            const productName = productSnap.exists ? productSnap.data()?.name : "Un produit";
            const storeName = storeSnap.exists ? storeSnap.data()?.name : "un hanout";

            // 2. Fetch all user tokens (In production, you'd filter by neighborhood preference or proximity)
            const usersSnap = await admin.firestore()
                .collection("users")
                .where("fcmToken", "!=", null)
                .get();

            const tokens: string[] = [];
            usersSnap.forEach((doc) => {
                const token = doc.data().fcmToken;
                if (token) tokens.push(token);
            });

            if (tokens.length === 0) {
                console.log("No tokens found to send notifications.");
                return;
            }

            // 3. Prepare the notification
            const message: admin.messaging.MulticastMessage = {
                notification: {
                    title: `📍 Nouveau prix à ${neighborhood || "Meknès"} !`,
                    body: `${productName} est à ${price} DH chez ${storeName}.`,
                },
                data: {
                    productId: productId,
                    click_action: "FLUTTER_NOTIFICATION_CLICK", // For Capacitor/Native compatibility
                },
                tokens: tokens,
            };

            // 4. Send the message
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`Successfully sent ${response.successCount} messages.`);

            // Optionally: Clean up invalid tokens
            if (response.failureCount > 0) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                console.log("Failed tokens:", failedTokens);
            }

        } catch (error) {
            console.error("Error sending push notifications:", error);
        }
    });
