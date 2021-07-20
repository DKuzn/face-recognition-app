import React from "react";
import './App.css';


class WebcamCapture extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      persons: [],
    };
  }

  renderInfo(i) {
    return (
        <div key={i}>
          <p>Name: {this.state.persons[i].name}</p>
          <p>Surname: {this.state.persons[i].surname}</p>
        </div>
    );
  }

  render() {
    let isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
    let width, height;
    if (isMobile) {
      width = window.screen.width;
      height = 0;
    } else {
      width = 500;
      height = 0;
    }

    let streaming = false;

    let video = null;
    let canvas = null;
    let photo = null;
    let facingMode = true;
    let currentStream;

    const startUp = async () => {
      video = document.getElementById("cameraVideo");
      canvas = document.getElementById("canvas");
      photo = document.getElementById("photo");
      let mode;
      if (facingMode) {
        mode = "user";
      } else {
        mode = "environment";
      }

      navigator.mediaDevices
          .getUserMedia({video: {facingMode: mode}, audio: false})
          .then((stream) => {
            currentStream = stream;
            video.srcObject = stream;
            video.play();
          })
          .catch((err) => {
            console.log("An error occurred: " + err);
          })

      video.addEventListener("canplay", () => {
        if (!streaming) {
          height = video.videoHeight / (video.videoWidth / width);

          video.setAttribute("width", width);
          video.setAttribute("height", height);
          canvas.setAttribute("width", width);
          canvas.setAttribute("height", height);
          streaming = true;
        }
      }, false);

      await clearPhoto();
    }

    const changeCamera = async () => {
      if (typeof currentStream !== 'undefined') {
        stopMediaTracks(currentStream);
      }
      facingMode = !facingMode;
      await startUp();
    }

    function stopMediaTracks(stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }

    const clearPhoto = async () => {
      let context = canvas.getContext("2d");
      context.fillStyle = "#282c34";
      context.fillRect(0, 0, canvas.width, canvas.height);

      let data = canvas.toDataURL("image/jpeg");
      photo.setAttribute("src", data);
    }

    const takePicture = async () => {
      let context = canvas.getContext("2d");
      if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);

        let data = canvas.toDataURL("image/jpeg");
        let response = await sendImage(data);
        this.setState({
          persons: response,
        })
        context.strokeStyle = "red";
        for (let i = 0; i < this.state.persons.length; i++) {
          let bbox = this.state.persons[i].bbox;
          context.strokeRect(bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1]);
        }
        data = canvas.toDataURL("image/jpeg");
        photo.setAttribute("src", data);
      } else {
        await clearPhoto();
      }
    }

    window.addEventListener("load", startUp, false);

    return (
        <div className="App-header">
          <div className="App">
            <video id="cameraVideo">Video stream is not available.</video>
            <button className="myButton" id="buttonChange" onClick={changeCamera}>Change camera</button>
            <button className="myButton" id="buttonTakePhoto" onClick={takePicture}>Take photo</button>
          </div>
          <div id="output">
            <img id="photo" alt="not"/>
          </div>
          {
            this.state.persons.map((value, index) => {
              return this.renderInfo(index)
            })
          }
          <canvas id="canvas">
          </canvas>
        </div>
    );
  }
}

const sendImage = async (imgString) => {
  let data = {image: imgString.split(",")[1]};
  return postData("https://face-recognition-microservice.herokuapp.com/", data)//.then((data) => {CropImage(data)})
}

async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
  });
  return await response.json();
}

class App extends React.Component {
  render() {
    return (
        <div className="App">
          <header className="App-header">
            <WebcamCapture/>
          </header>
        </div>
    );
  }
}

export default App;
