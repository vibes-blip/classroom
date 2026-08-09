export async function getLiveKitToken(identity, room) {
  const res = await fetch('/api/livekit/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity, room }),
  });
  return res.json();
}

export async function connectLiveKit(roomName, identity, publishLocalTracks = true) {
  const id = identity || `user-${Date.now()}`;
  const tokenRes = await getLiveKitToken(id, roomName);
  if (tokenRes.error) throw new Error(tokenRes.error);
  const { token, url } = tokenRes;
  const { connect, createLocalVideoTrack, createLocalAudioTrack } = await import('livekit-client');
  const room = await connect(url, token, { autoSubscribe: true });
  let published = {};

  if (publishLocalTracks) {
    const videoTrack = await createLocalVideoTrack();
    const audioTrack = await createLocalAudioTrack();
    await room.localParticipant.publishTrack(videoTrack);
    await room.localParticipant.publishTrack(audioTrack);
    published = { videoTrack, audioTrack };
  }

  return { room, ...published };
}
