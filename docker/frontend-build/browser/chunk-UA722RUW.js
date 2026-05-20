// src/environments/environment.ts
var environment = {
  production: true,
  name: "localdocker",
  als: "D",
  secretCrypto: "LDock@Dev#2f3a4b5c6d7e8f9a0b1c2d3e",
  cloudUrl: `${location.origin}`,
  cloudUrl2: `${location.origin}`,
  authservice: "/authapi",
  coreservice: "/coreapi",
  batchfileservice: `${location.origin}/indexapi`,
  indexservice: `${location.origin}/indexapi`,
  socketservice: "",
  uploadservice: `${location.origin}/uploadapi`,
  realtimeserive: "/realtimeapi",
  realtimelocal: `${location.origin}/realtimelocal`,
  realtimesocket: `${location.origin}`,
  paginationservice: `${location.origin}/pagination`,
  exportservice: `${location.origin}/export`,
  downloadservice: `${location.origin}/download`,
  downloadapiservice: `${location.origin}/download`,
  hyperlinkservice: `${location.origin}/hyperlink`,
  presentationservice: `${location.origin}/presentation`,
  elasticSearchService: `${location.origin}/elasticsearch`,
  sfuservice: `${location.origin}/sfu`,
  firebase: {
    apiKey: "AIzaSyByk5mzEb8tzpnkO2KTy6L2gfqj5UA86DA",
    authDomain: "etabellav2.firebaseapp.com",
    projectId: "etabellav2",
    storageBucket: "etabellav2.appspot.com",
    messagingSenderId: "542362434410",
    appId: "1:542362434410:web:8b3bfd5abe5edc08630313",
    measurementId: "G-2WHX26GV9F"
  },
  vapidKey: "BJl8XC2jcxSw7CqjToX0s7tLPazCBzcdcEEQif9Y_zP8mnZlIGs8BBfDMwx7aC_SVZA9-GT_zRpCiXbfo2sSqhQ",
  iconpath_doc: "./assets/icons/doc-icons/",
  downloadpath: "/docs/",
  pdfloadpath: `:3443/`,
  // documentStorage: `${location.origin}:9000/etabella/`,
  // documentStorage: `${location.origin}:${location.protocol.includes('https:') ? '9443' : '9000'}/etabella/`,
  // ↑ Direct-to-MinIO via host port — fails on HTTPS because :9443 isn't exposed
  //   (docker-compose.yml comment: "HTTPS on :9443 will be added in a later phase").
  //   Use the nginx /pdfdocs/ proxy instead — works on both HTTP and HTTPS.
  documentStorage: `${location.origin}/pdfdocs/`,
  nonPdfStorage: `https://etabella.sgp1.cdn.digitaloceanspaces.com/`,
  // documentStorage: 'https://etabella.sgp1.cdn.digitaloceanspaces.com/',
  reportDownload: `${location.origin}.${location.host}`,
  userProfilePath: "profile/",
  helpcenterPath: "helpcenter/",
  ticketPath: "ticket/",
  connectivityCheckUrl: "https://httpbin.org/get",
  cacheExpiryMs: 60 * 60 * 1e3
};

export {
  environment
};
//# sourceMappingURL=chunk-UA722RUW.js.map
