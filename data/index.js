let colorPicker;
let connection;
let ws_queue;
let ws_cooldown_timer;
let prevent_send_color = false;

function openWebsocketConnection() {
  const ws_uri =  'ws://' + (location.hostname ? location.hostname : 'localhost') + ':81/';
  connection = new WebSocket(ws_uri, ['arduino']);
  connection.binaryType = 'arraybuffer';
  connection.onopen = function (e) {
    document.getElementById('navbarTitle').innerHTML = "FastLEDHub";
    displayConnectedState(true);
  };
  connection.onerror = function (e) {
    console.log('WebSocket Error', e);
  };
  connection.onclose = function (e) {
    document.getElementById('navbarTitle').innerHTML = "Disconnected...";
    displayConnectedState(false);
  };
  connection.onmessage = function (e) {
    console.log('Received: ', e.data);
    handleJsonData(JSON.parse(e.data));
  };
}

function displayConnectedState(connected) {
  document.getElementById('settingsButton').style.display = connected ? "block" : "none";
  document.getElementById('controlsWrapper').style.display = connected ? "block" : "none";
  document.getElementById('refreshButton').style.display = connected ? "none" : "block";
}

function handleJsonData(data) {
  if (data.hasOwnProperty('animations')) {
    let buffer = '';
    const template = document.getElementById("animationButtonTemplate").innerHTML;
    data.animations.forEach((animation, idx) => {
      alarmAnimation.add(new Option(animation));
      postAlarmAnimation.add(new Option(animation));
      sunsetAnimation.add(new Option(animation));
      startupAnimation.add(new Option(animation));

      buffer += eval('`' + template + '`')
    });
    animationButtons = document.getElementById('animationButtons')
    animationButtons.innerHTML = buffer + animationButtons.innerHTML;
  }
  if (data.hasOwnProperty('sliders')) {
    let buffer = '';
    const template = document.getElementById("sliderTemplate").innerHTML;
    data.sliders.forEach((slider, idx) => {
      buffer += eval('`' + template + '`')
    });
    slidersWrapper = document.getElementById('slidersWrapper')
    slidersWrapper.innerHTML = buffer;
  }
  if (data.hasOwnProperty('alarmAnimation'))
    alarmAnimation.value = data.alarmAnimation;
  if (data.hasOwnProperty('postAlarmAnimation'))
    postAlarmAnimation.value = data.postAlarmAnimation;
  if (data.hasOwnProperty('sunsetAnimation'))
    sunsetAnimation.value = data.sunsetAnimation;
  if (data.hasOwnProperty('startupAnimation')) {
    startupAnimation.value = data.startupAnimation;
    useStartupAnimation.checked = data.startupAnimation != '';
    if (data.startupAnimation != '')
      new bootstrap.Collapse(document.getElementById("useStartupAnimationCollapse"), {toggle: false}).show();
  }
  if (data.hasOwnProperty('timeZone'))
    timeZone.value = data.timeZone;
  if (data.hasOwnProperty('summerTime'))
    summerTime.checked = data.summerTime;
  if (data.hasOwnProperty('longitude'))
    longitude.value = data.longitude;
  if (data.hasOwnProperty('latitude'))
    latitude.value = data.latitude;
  if (data.hasOwnProperty('alarmEnabled'))
  {
    alarmEnabled.checked = data.alarmEnabled;
    if (data.alarmEnabled)
      new bootstrap.Collapse(document.getElementById("alarmEnabledCollapse"), {toggle: false}).show();
  }
  if (data.hasOwnProperty('alarmDuration'))
    alarmDuration.value = data.alarmDuration;
  if (data.hasOwnProperty('alarmHour') && data.hasOwnProperty('alarmMinute'))
    alarmTime.value = (data.alarmHour < 10 ? '0' + data.alarmHour.toString() : data.alarmHour) + ':' + (data.alarmMinute < 10 ? '0' + data.alarmMinute.toString() : data.alarmMinute);
  if (data.hasOwnProperty('sunsetEnabled'))
  {
    sunsetEnabled.checked = data.sunsetEnabled;
    if (data.sunsetEnabled)
      new bootstrap.Collapse(document.getElementById("sunsetEnabledCollapse"), {toggle: false}).show();
  }
  if (data.hasOwnProperty('sunsetDuration'))
    sunsetDuration.value = data.sunsetDuration;
  if (data.hasOwnProperty('sunsetOffset'))
    sunsetOffset.value = data.sunsetOffset;
  if (data.hasOwnProperty('color')) {
    colorButton.style.backgroundColor = data.color;
    prevent_send_color = true;
    colorPicker.color.hexString = data.color;
  }
  if (data.hasOwnProperty('status') && data.hasOwnProperty('currentAnimation'))
    updateAnimationButtons(data.status, data.currentAnimation);
}

function updateAnimationButtons(status, animation) {
  animationButtons = document.querySelectorAll('#animationButtons button');
  animationButtons.forEach((btn, idx) => {
    buttonIcon = btn.querySelector('div i')
    buttonContent = btn.querySelector('div span').innerHTML
    if (animation == buttonContent) {
      if (status == 2) {
        buttonIcon.classList = 'bi bi-play-fill'
      }
      else if (status == 1) {
        buttonIcon.classList = 'bi bi-pause'
      }
    }
    else if (idx == animationButtons.length - 1 && status == 0) {
      buttonIcon.classList = 'bi bi-stop-fill'
    }
    else {
      buttonIcon.classList = 'bi'
    }
  });
}

function sendConfig() {
  const time = alarmTime.value.split(':');
  const json = JSON.stringify({
    alarmHour: time[0],
    alarmMinute: time[1],
    alarmEnabled: alarmEnabled.checked,
    alarmDuration: alarmDuration.value,
    alarmAnimation: alarmAnimation.value,
    postAlarmAnimation: postAlarmAnimation.value,
    timeZone: timeZone.value,
    summerTime: summerTime.checked,
    longitude: longitude.value,
    latitude: latitude.value,
    sunsetEnabled: sunsetEnabled.checked,
    sunsetDuration: sunsetDuration.value,
    sunsetOffset: sunsetOffset.value,
    sunsetAnimation: sunsetAnimation.value,
    startupAnimation: useStartupAnimation.checked ? startupAnimation.value : '',
    color: colorPicker.color.hex
  }, null, 2);
  sendText(json);
}

function sendBytes(bytes) {
  ws_queue = bytes;

  if (ws_cooldown_timer)
    return;

  sendBytesQueue()
  ws_cooldown_timer = setTimeout(() => {
    ws_cooldown_timer = null;
    sendBytesQueue();
  }, 15);
}

function sendBytesQueue() {
  if (!ws_queue || connection.readyState != 1)
    return;

  const data = Uint8Array.from(ws_queue);
  connection.send(data.buffer);
  console.log('Sent bytes: ' + data);

  ws_queue = null;
}

function sendText(text) {
  if (connection.readyState != 1) {
    console.log('Not connected. Text not sent!');
    return;
  }

  connection.send(text);
  console.log('Sent text: ' + text);
}

window.onload = () => {
  openWebsocketConnection();

  settingsOffcanvas.addEventListener('hidden.bs.offcanvas', function () {
    sendConfig();
  });

  colorPicker = new iro.ColorPicker('#colorPicker', {
    width: 250,
    display: "inline-block",
    layout: [
      {
        component: iro.ui.Wheel,
        options: {}
      }
    ]
  });
  colorPicker.on('color:change', function(color) {
    colorButton.style.backgroundColor = color.hexString;
    if (prevent_send_color)
    {
      prevent_send_color = false;
      return;
    }
    sendBytes([0, color.red, color.green, color.blue]);
  });

  $('#alarmDuration').TouchSpin({ min: 1, max: 1439, postfix: 'minutes' });
  $('#timeZone').TouchSpin({ min: -23, max: 23, prefix: 'GMT+' });
  $('#sunsetDuration').TouchSpin({ min: 1, max: 1439, postfix: 'minutes' });
  $('#sunsetOffset').TouchSpin({ min: -1439, max: 1439, postfix: 'minutes' });
};
