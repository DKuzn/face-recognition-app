import React from "react";
import './App.css';


class WebcamCapture extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      persons: [],
      images: [],
    };
    this.status = "";
    this.buttonDisabled = true;
    this.video = null;
    this.canvas = null;
    let isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
    if (isMobile) {
      this.width = window.screen.width;
      this.height = 0;
    } else {
      this.width = 500;
      this.height = 0;
    }
    this.streaming = false;
    this.facingMode = true;
    this.currentStream = null;
  }

  renderInfo(i) {
    return (
        <div key={i}>
          <img src={this.state.images[i]} alt="Not available."/>
          <p>Name: {this.state.persons[i].name}</p>
          <p>Surname: {this.state.persons[i].surname}</p>
        </div>
    );
  }

  render() {
    const startUp = async () => {
      this.video = document.getElementById("cameraVideo");
      this.canvas = document.getElementById("canvas");
      let mode;
      if (this.facingMode) {
        mode = "user";
      } else {
        mode = "environment";
      }

      navigator.mediaDevices
          .getUserMedia({video: {facingMode: mode}, audio: false})
          .then((stream) => {
            this.currentStream = stream;
            this.video.srcObject = stream;
            this.video.play();
            this.buttonDisabled = false;
            this.forceUpdate();
          })
          .catch((err) => {
            this.video.outerHTML = "<div id='cameraVideo'>" +
                "<p>Video stream is not available</p>" +
                "</div>";
            console.log("An error occurred: " + err);
          })

      this.video.addEventListener("canplay", () => {
        if (!this.streaming) {
          this.height = this.video.videoHeight / (this.video.videoWidth / this.width);

          this.video.setAttribute("width", this.width);
          this.video.setAttribute("height", this.height);
          this.canvas.setAttribute("width", this.width);
          this.canvas.setAttribute("height", this.height);
          this.streaming = true;
        }
      }, false);
    }

    const changeCamera = async () => {
      this.status = "";
      this.setState({persons: [], images: [],});
      if (typeof this.currentStream !== 'undefined') {
        stopMediaTracks(this.currentStream);
      }
      this.facingMode = !this.facingMode;
      await startUp();
    }

    function stopMediaTracks(stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }

    const takePicture = async () => {
      this.setState({persons: [], images: [],});
      let context = this.canvas.getContext("2d");
      if (this.width && this.height) {
        this.status = "Image processing...";
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        context.drawImage(this.video, 0, 0, this.width, this.height);

        let data = this.canvas.toDataURL("image/jpeg");
        let imgData = new Image(this.width, this.height);
        imgData.src = data;
        this.status = "Image sending...";
        this.status = "Result waiting...";
        let response = await sendImage(data);
        let images = new Array(response.length);
        this.status = "Result processing...";
        for (let i = 0; i < response.length; i++) {
          let tempCanvas = document.createElement("canvas");
          let tempContext = tempCanvas.getContext("2d");
          let bbox = response[i].bbox;
          tempCanvas.width = bbox[2] - bbox[0];
          tempCanvas.height = bbox[3] - bbox[1];
          tempContext.drawImage(imgData, bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1], 0, 0, bbox[2] - bbox[0], bbox[3] - bbox[1])
          data = tempCanvas.toDataURL("image/jpeg");
          images[i] = data;
        }
        this.status = "Result output";
        this.setState({
          persons: response,
          images: images,
        })
      } else {
        this.setState({persons: [], images: [],});
      }
    }

    window.addEventListener("load", startUp, false);

    return (
        <div className="App-header">
          <div className="App">
            <p>{this.status}</p>
            <video id="cameraVideo"/>
            <button className="myButton" id="buttonChange" onClick={changeCamera} disabled={this.buttonDisabled}>Change camera</button>
            <button className="myButton" id="buttonTakePhoto" onClick={takePicture} disabled={this.buttonDisabled}>Take photo</button>
          </div>
          <div id="output">
              {
                this.state.persons.map((value, index) => {
                  return this.renderInfo(index);
                })
              }
          </div>
          <canvas id="canvas">
          </canvas>
        </div>
    );
  }
}

const sendImage = async (imgString) => {
  let data = {image: imgString.split(",")[1]};
  return postData("https://face-recognition-microservice.herokuapp.com/", data)
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
