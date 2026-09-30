// Import necessary Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

// Firebase project configuration
const firebaseConfig = {

    apiKey: "AIzaSyByk5mzEb8tzpnkO2KTy6L2gfqj5UA86DA",
    authDomain: "etabellav2.firebaseapp.com",
    projectId: "etabellav2",
    storageBucket: "etabellav2.appspot.com",
    messagingSenderId: "542362434410",
    appId: "1:542362434410:web:8b3bfd5abe5edc08630313",
    measurementId: "G-2WHX26GV9F",
    // apiKey: "your-api-key",
    // authDomain: "your-auth-domain",
    // projectId: "your-project-id",
    // storageBucket: "your-storage-bucket",
    // messagingSenderId: "your-messaging-sender-id",
    // appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging and handle background messages
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png',
        data: { url: payload.data.click_action } // Optional: add data to handle click action
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.');

    event.notification.close();

    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(clients.matchAll({
        type: "window"
    }).then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
            var client = clientList[i];
            if (client.url === event.notification.data.url && 'focus' in client) {
                return client.focus();
            }
        }
        if (clients.openWindow) {
            return clients.openWindow(event.notification.data.url);
        }
    }));
});



// if ('serviceWorker' in navigator && 'PushManager' in window) {
//     navigator.serviceWorker.register('/firebase-messaging-sw.js')
//         .then(function (swReg) {
//             console.log('Service Worker is registered', swReg);


//             navigator.serviceWorker.ready.then(function (registration) {
//                 // Do the subscription logic here
//                 const pushManager = registration.pushManager;
//                 pushManager.subscribe({
//                     userVisibleOnly: true,
//                     applicationServerKey: 'BJl8XC2jcxSw7CqjToX0s7tLPazCBzcdcEEQif9Y_zP8mnZlIGs8BBfDMwx7aC_SVZA9-GT_zRpCiXbfo2sSqhQ'
//                 }).then(function (subscription) {
//                     console.log('User is subscribed:', subscription);
//                 }).catch(function (err) {
//                     console.log('Failed to subscribe the user: ', err);
//                 });
//             });

//         })
//         .catch(function (error) {
//             console.error('Service Worker Error', error);
//         });
// } else {
//     console.warn('Push messaging is not supported');
// }

