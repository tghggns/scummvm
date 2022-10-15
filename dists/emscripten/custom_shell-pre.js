/*global Module*/
Module["arguments"] = [];
Module["arguments"].push("--config=/local/scummvm.ini");

// https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API only works in secure contexts and supported browsers. 
// This disables joystick support to avoid a crash when initializing the sdl subsystem without the gamepad API being available.
if (!navigator.getGamepads && !navigator.webkitGetGamepads) {
    Module["arguments"].push("--joystick=-1")
}

// Add all parameters passed via the fragment identifier
if (window.location.hash.length > 0) {
    params = decodeURI(window.location.hash.substring(1)).split(" ")
    params.forEach((param) => {
        Module["arguments"].push(param);
    })
}

var original_fd_write = _fd_write;
_fd_write = function fd_write(fd, iov, iovcnt, pnum) {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var pattern = /\.s[0-9][0-9]$/i;
    var name = stream.node.name;
    original_fd_write(fd, iov, iovcnt, pnum);
    if (name.match(pattern) !== null && name.match(pattern).length > 0){
      if (stream.node.contents !== null){
        var savFileBytes = stream.node.contents;
        var byteSize = stream.node.usedBytes;
        var type = ({}).toString.call(savFileBytes).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        if (type === 'uint'){
          var jsonData = new JSON.constructor();
          jsonData['file'] = name;
          jsonData['data'] = JSON.parse(JSON.stringify(savFileBytes));
          jsonData['byteSize'] = byteSize;
          var xhr = new XMLHttpRequest();
          xhr.open('POST', '', false);
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.send(JSON.stringify(jsonData));
        }
      }
    }
    return;
};