let userAgent, session;

const connectBtn = document.getElementById('connectBtn');
const callBtn    = document.getElementById('callBtn');
const hangupBtn  = document.getElementById('hangupBtn');
const statusDiv  = document.getElementById('status');
const remoteAudio= document.getElementById('remoteAudio');

connectBtn.addEventListener('click', () => {
  const server = document.getElementById('sipServer').value.trim();
  const user   = document.getElementById('sipUser').value.trim();
  const pass   = document.getElementById('sipPass').value;
  const fakeId = document.getElementById('callerId').value.trim();
  if (!server || !user || !pass || !fakeId) {
    statusDiv.textContent = 'Compila tutti i campi!';
    return;
  }

  userAgent = new SIP.UA({
    uri: `sip:${user}@${server.replace(/^wss?:\/\//,'')}`,
    transportOptions: { wsServers: [server] },
    authorizationUser: user,
    password: pass,
    userAgentString: 'VoIP-CallerID-WebApp',
    sessionDescriptionHandlerFactoryOptions: {
      constraints: { audio: true, video: false }
    },
    extraHeaders: [
      `From: <sip:${fakeId}@${server.replace(/^wss?:\/\//,'')}>`
    ]
  });

  userAgent.on('registered', () => {
    statusDiv.textContent = 'Registrato su ' + server;
    callBtn.disabled = false;
  });
  userAgent.on('registrationFailed', e => {
    statusDiv.textContent = 'Errore registrazione: ' + e.cause;
  });

  userAgent.start();
});

callBtn.addEventListener('click', () => {
  const target = document.getElementById('target').value.trim();
  if (!target) {
    statusDiv.textContent = 'Inserisci un numero/interno!';
    return;
  }
  const wsUrl = document.getElementById('sipServer').value.trim();
  session = userAgent.invite(
    `sip:${target}@${wsUrl.replace(/^wss?:\/\//,'')}`,
    { sessionDescriptionHandlerOptions: { constraints: { audio: true, video: false } } }
  );
  session.on('accepted', () => {
    statusDiv.textContent = 'Chiamata connessa';
    hangupBtn.disabled = false;
  });
  session.on('bye', () => {
    statusDiv.textContent = 'Chiamata terminata';
    hangupBtn.disabled = true;
  });
  session.sessionDescriptionHandler.on('addTrack', () => {
    const pc = session.sessionDescriptionHandler.peerConnection;
    const remoteStream = new MediaStream();
    pc.getReceivers().forEach(r => {
      if (r.track.kind === 'audio') remoteStream.addTrack(r.track);
    });
    remoteAudio.srcObject = remoteStream;
  });
});

hangupBtn.addEventListener('click', () => {
  if (session) session.bye();
  hangupBtn.disabled = true;
  statusDiv.textContent = 'Riagganciato';
});
