/**
 * Copyright (c) 2022 Дмитрий Кузнецов
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
import Webcam from "react-webcam";
import {drawImage, loadImage, sendImage, getPerson} from './utils.js';
import './App.css';


class WebcamCapture extends React.Component {
  constructor(props) {
    super(props);
    this.status = "";
    let isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
    if (isMobile) {
      this.width = null;
      this.height = window.screen.width;
    } else {
      this.width = 500;
      this.height = null;
    }
    this.facingMode = true;
    this.state = {
      sourceFrame: "",
      persons: [],
      images: [],
      videoConstraints: {
        width: this.width,
        height: this.height, 
        facingMode: "user"
      },
      buttonDisabled: true,
    };
    this.webcamRef = React.createRef();
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

  changeCamera = async () => {
    this.status = "";
    this.facingMode = !this.facingMode;
    this.setState({sourceFrame: "", persons: [], images: [], videoConstraints: {
      width: this.width,
      height: this.height, 
      facingMode: this.facingMode ? "user" : "environment"
    }});
  }

  takePicture = async () => {
    this.setState({sourceFrame: "", persons: [], images: [],});
    let sourceFrame = this.webcamRef.current.getScreenshot();
    if (sourceFrame !== null) {
      this.status = "Image processing...";
      let imgData = new Image();
      imgData.src = sourceFrame;
      this.status = "Image sending...";
      this.status = "Result waiting...";
      let responseImage = await sendImage(sourceFrame);
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
        let data = drawImage(responseImage[i], imgData);
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

  onGetUserMedia = () => {
    this.setState({buttonDisabled: false});
  }

  render() {
    return (
      <div className="App-header">
        <div className="App">
          <p>{this.status}</p>
          <Webcam
            ref={this.webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={this.state.videoConstraints}
            onUserMedia={this.onGetUserMedia}
          />
          <button className="myButton" id="buttonChange" onClick={this.changeCamera} disabled={this.state.buttonDisabled}>Change camera</button>
          <button className="myButton" id="buttonTakePhoto" onClick={this.takePicture} disabled={this.state.buttonDisabled}>Take photo</button>
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
      </div>
    );
  }
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
