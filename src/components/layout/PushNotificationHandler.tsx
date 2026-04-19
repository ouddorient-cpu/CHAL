"use client";

import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/context/AuthContext";
import { updateUserFCMToken } from "@/services/dataService";

export default function PushNotificationHandler() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user || !Capacitor.isNativePlatform()) return;

        const registerPush = async () => {
            try {
                // 1. Request permission
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.warn("CH7AL: User denied push permissions");
                    return;
                }

                // 2. Register with Apple / Google
                await PushNotifications.register();

                // 3. Handle token registration
                PushNotifications.addListener('registration', async (token) => {
                    console.log('CH7AL: Push registration success, token: ' + token.value);
                    await updateUserFCMToken(user.uid, token.value);
                });

                PushNotifications.addListener('registrationError', (error) => {
                    console.error('CH7AL: Push registration error: ' + JSON.stringify(error));
                });

                // 4. Handle notification received
                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('CH7AL: Push received: ' + JSON.stringify(notification));
                });

                PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('CH7AL: Push action performed: ' + JSON.stringify(notification));
                });

            } catch (err) {
                console.error("CH7AL: Error setting up push notifications", err);
            }
        };

        registerPush();

        // Cleanup listeners
        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };
    }, [user]);

    return null; // This component doesn't render anything
}
