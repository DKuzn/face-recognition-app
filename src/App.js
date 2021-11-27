/**
 * Copyright (c) 2021 Дмитрий Кузнецов
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React from "react";
import axios from "axios";
import './App.css';


class WebcamCapture extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sourceFrame: "",
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
          <img className="imageOutput" src={this.state.images[i]} alt="Not available."/>
          <img className="imageOutput" src={this.state.persons[i].image} alt="Not available."/>
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

    const stopMediaTracks = (stream) => {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }

    const drawImage = (response, imgData) => {
      let tempCanvas = document.createElement("canvas");
      let tempContext = tempCanvas.getContext("2d");
      let bbox = response.bbox;
      tempCanvas.width = bbox[2] - bbox[0];
      tempCanvas.height = bbox[3] - bbox[1];
      tempContext.drawImage(imgData, bbox[0], bbox[1], bbox[2] - bbox[0], bbox[3] - bbox[1], 0, 0, tempCanvas.width, tempCanvas.height);
      return tempCanvas.toDataURL("image/jpeg");
    }

    const loadImage = (url) => new Promise((resolve, reject) => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.addEventListener('error', (err) => reject(err));
      img.src = url;
      return img;
    });

    const takePicture = async () => {
      this.setState({sourceFrame: "", persons: [], images: [],});
      let context = this.canvas.getContext("2d");
      if (this.width && this.height) {
        this.status = "Image processing...";
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        context.drawImage(this.video, 0, 0, this.width, this.height);

        let data = this.canvas.toDataURL("image/jpeg");
        let sourceFrame = data;
        let imgData = new Image();
        imgData.src = data;
        this.status = "Image sending...";
        this.status = "Result waiting...";
        let responseImage = await sendImage(data);
        let persons = [];
        let images = new Array(responseImage.length);
        this.status = "Result processing...";
        for (let i = 0; i < responseImage.length; i++) {
          let person = await getPerson(responseImage[i].id);
          let referenceImage;
          if (person.image === '') {
            referenceImage = new Image();
          }
          else {
            referenceImage = await loadImage("data:image/jpeg;base64," + person.image);
          }
          person.image = drawImage(person, referenceImage);
          persons.push(person);
          data = drawImage(responseImage[i], imgData);
          images[i] = data;
        }
        this.status = "Result output";
        this.setState({
          sourceFrame: sourceFrame,
          persons: persons,
          images: images,
        })
      } else {
        this.setState({sourceFrame: "", persons: [], images: [],});
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
          <div>
            <p>Source frame:</p>
            <img src={this.state.sourceFrame} alt=""></img>
          </div>
          <div id="output">
            <p>Result:</p>
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
  return postData('/features/', data);
}

const getPerson = async (id) => {
  if (id == null) {
    let person = {
      image: '',
      bbox: [0, 0, 0, 0],
      name: '',
      surname: ''
    };
    return person;
  }
  else {
    return getData('/person/', id);
  }
}

const postData = async (url = '', data = {}) => {
  const response = await axios.post(url, data);
  return response.data;
}

const getData = async (url = '', id) => {
  const response = await axios.get(url + id);
  return response.data;
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
