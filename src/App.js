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


class Capture extends React.Component {
  renderInfo(i) {
    return (
        <div key={i}>
          <img className="imageOutput" src={this.state.images[i]} alt="Не доступно."/>
          <img className="imageOutput" src={this.state.persons[i].image} alt="Не доступно."/>
          <p className="textCommon">Имя: {this.state.persons[i].name}</p>
          <p className="textCommon">Фамилия: {this.state.persons[i].surname}</p>
        </div>
    );
  }

  renderOutput() {
    return (
      <div id="output">
          <p className="textCommon">Результат:</p>
            {
              this.state.persons.map((value, index) => {
                return this.renderInfo(index);
              })
            }
        </div>
    );
  }

  isMobile() {
    return window.matchMedia("only screen and (max-width: 760px)").matches;
  }

  async recognizeFaces(sourceFrame) {
    if (sourceFrame !== null) {
      this.status = "Обработка изображения...";
      let imgData = new Image();
      imgData.src = sourceFrame;
      this.status = "Отправка изображения...";
      this.status = "Ожидание результата...";
      let responseImage = await sendImage(sourceFrame);
      let persons = [];
      let images = new Array(responseImage.length);
      this.status = "Обработка результата...";
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
      this.status = "Вывод результата";
      this.setState({
        sourceFrame: sourceFrame,
        persons: persons,
        images: images,
      })
    } else {
      this.setState({sourceFrame: "", persons: [], images: [],});
    }
  }
}

class WebcamCapture extends Capture {
  constructor(props) {
    super(props);
    this.status = "";
    if (this.isMobile()) {
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

  changeCamera = () => {
    this.status = "";
    this.facingMode = !this.facingMode;
    this.setState({sourceFrame: "", persons: [], images: [], videoConstraints: {
      width: this.width,
      height: this.height, 
      facingMode: this.facingMode ? "user" : "environment"
    }});
  }

  takePicture = () => {
    this.setState({sourceFrame: "", persons: [], images: [],});
    let sourceFrame = this.webcamRef.current.getScreenshot();
    this.recognizeFaces(sourceFrame);
  }

  onGetUserMedia = () => {
    this.setState({buttonDisabled: false});
  }

  render() {
    return (
      <div className="App-header">
        <div className="App">
          <p className="textCommon">{this.status}</p>
          <Webcam
            ref={this.webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={this.state.videoConstraints}
            onUserMedia={this.onGetUserMedia}
          />
          <button className="myButton" id="buttonChange" onClick={this.changeCamera} disabled={this.state.buttonDisabled}>Сменить камеру</button>
          <button className="myButton" id="buttonTakePhoto" onClick={this.takePicture} disabled={this.state.buttonDisabled}>Сделать фото</button>
        </div>
        <div>
          <p className="textCommon">Исходный кадр:</p>
          <img src={this.state.sourceFrame} alt=""></img>
        </div>
        {this.renderOutput()}
      </div>
    );
  }
}

class FileCapture extends Capture {
  constructor(props) {
    super(props);
    this.state = {
      sourceFrame: "",
      persons: [],
      images: [],
    };

    if (this.isMobile()) {
      this.width = window.screen.width;
    } else {
      this.width = 500;
    }
  }

  onFileChange = () => {
    let reader = new FileReader();
    let imgPreview = document.getElementById("imageFile");
    let file = document.getElementById("fileChooser").files[0];
    reader.readAsDataURL(file);
    reader.onload = function () {
        imgPreview.src = reader.result;
    };
    reader.onerror = function (error) {
        console.log('Error: ', error);
    };
  }

  onButtonChooseFileClick = () => {
    this.setState({persons: [], images: [],});
    let fileChooser = document.getElementById("fileChooser");
    fileChooser.click();
  }

  onButtonSendImageClick = () => {
    this.setState({persons: [], images: [],});
    let sourceFrame = document.getElementById("imageFile").src;
    this.recognizeFaces(sourceFrame);
  }

  render() {
    return (
      <div className="App-header">
        <div className="App">
          <p className="textCommon">{this.status}</p>
          <input type="file" id="fileChooser" accept="image/jpeg,image/png" onChange={this.onFileChange}></input>
          <img id="imageFile" width={this.width}/>
          <button className="myButton" id="buttonChooseFIle" onClick={this.onButtonChooseFileClick} disabled={this.buttonDisabled}>Выбрать файл</button>
          <button className="myButton" id="buttonSendFile" onClick={this.onButtonSendImageClick} disabled={this.buttonDisabled}>Отправить файл</button>
        </div>
        {this.renderOutput()}
      </div>
    );
  }
}

class MainVIew extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      capture: "main",
    };
  }

  renderCapture = (name) => {
    if (name === "file") {
      return (<FileCapture/>);
    }
    else if (name === "webcam") {
      return (<WebcamCapture/>);
    }
    else {
      return this.renderMain();
    }
  }

  renderMain = () => {
    return (
      <div className="App-header">
        <div className="App">
          <button className="myButton" id="buttonOpenFIleCapture" onClick={this.onButtonOpenFIleCaptureClick}>Распознать из файла</button>
          <button className="myButton" id="buttonOpenWebcamCapture" onClick={this.onButtonOpenWebcamCaptureClick}>Распознать из камеры</button>
        </div>
      </div>
    );
  }

  onButtonOpenFIleCaptureClick = () => {
    this.setState({capture: "file"});
  }

  onButtonOpenWebcamCaptureClick = () => {
    this.setState({capture: "webcam"});
  }

  render() {
    return this.renderCapture(this.state.capture);
  }
}

class App extends React.Component {
  render() {
    return (
        <div className="App">
          <header className="App-header">
            <p className="titleMain">Микросервисная система распознавания лиц</p>
            <MainVIew/>
          </header>
        </div>
    );
  }
}

export default App;
