(async()=>{
  const base="http://localhost:8000/api/v1";
  const ts=Date.now();
  const email=`g_${ts}@test.com`;
  const username=`g_${ts}`;
  const password="123456";

  const postJson = async (path, body, extraHeaders={}) => {
    const res = await fetch(base+path, {method:'POST', headers:{'Content-Type':'application/json', ...extraHeaders}, body: JSON.stringify(body)});
    const text = await res.text();
    let data; try{data=JSON.parse(text)}catch{data=text}
    return {status: res.status, headers: res.headers, data};
  };

  await postJson('/auth/register', {email, username, password});
  const login = await postJson('/auth/login', {email, password});
  const cookie = login.headers.get('set-cookie')?.split(';')[0];

  const created = await postJson('/rooms', {codeLength: 4}, {Cookie: cookie});
  const roomCode = created.data.data.room.code;
  const hostPlayerId = created.data.data.hostPlayer.id;

  const joined = await postJson(`/rooms/${roomCode}/join`, {nickname: 'guest1'});
  const guestPlayerId = joined.data.data.player.id;

  // set secrets
  await postJson(`/rooms/${roomCode}/players/${hostPlayerId}/secret`, {secretCode: '1234'});
  await postJson(`/rooms/${roomCode}/players/${guestPlayerId}/secret`, {secretCode: '5678'});

  // host guess opponent secret (should be guest's secret)
  const guess1 = await postJson(`/rooms/${roomCode}/players/${hostPlayerId}/guess`, {guessValue: '5670'});
  console.log('guess1', guess1.status, guess1.data);

  // guest guess host secret
  const guess2 = await postJson(`/rooms/${roomCode}/players/${guestPlayerId}/guess`, {guessValue: '1234'});
  console.log('guess2', guess2.status);
  console.log(JSON.stringify(guess2.data, null, 2));
})();
