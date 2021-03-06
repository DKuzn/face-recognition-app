// src/App.js
//
// Copyright (C) 2021-2022  Дмитрий Кузнецов
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import React from "react";
import Webcam from "react-webcam";
import {drawImage, loadImage, sendImage, getPerson} from './utils.js';
import strings from "./locals.js";
import './App.css';
import './loading.css';


class Capture extends React.Component {
  renderLoader() {
    return <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>;
  }
  
  renderInfo(i) {
    return (
        <div key={i}>
          <img className="imageOutput" src={this.state.images[i]} alt={strings.notAvailable}/>
          <img className="imageOutput" src={this.state.persons[i].image} alt={strings.notAvailable}/>
          <p className="textCommon">{strings.name}: {this.state.persons[i].name}</p>
          <p className="textCommon">{strings.surname}: {this.state.persons[i].surname}</p>
        </div>
    );
  }

  renderOutput() {
    return (
      <div id="output">
          <p className="textCommon">{strings.result}:</p>
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
      let imgData = new Image();
      imgData.src = sourceFrame;
      let responseImage = await sendImage(sourceFrame);
      let persons = [];
      let images = new Array(responseImage.length);
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
      this.setState({
        status: null,
        sourceFrame: sourceFrame,
        persons: persons,
        images: images,
      })
    } else {
      this.setState({status: null, sourceFrame: "", persons: [], images: [],});
    }
  }
}

class WebcamCapture extends Capture {
  constructor(props) {
    super(props);
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
      status: null
    };
    this.webcamRef = React.createRef();
  }

  changeCamera = () => {
    this.setState({status: null});
    this.facingMode = !this.facingMode;
    this.setState({sourceFrame: "", persons: [], images: [], videoConstraints: {
      width: this.width,
      height: this.height, 
      facingMode: this.facingMode ? "user" : "environment"
    }});
  }

  takePicture = () => {
    this.setState({status: this.renderLoader(), sourceFrame: "", persons: [], images: [],});
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
          <div>
           {this.state.status}
          </div>
          <Webcam
            ref={this.webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={this.state.videoConstraints}
            onUserMedia={this.onGetUserMedia}
          />
          <button className="myButton" id="buttonChange" onClick={this.changeCamera} disabled={this.state.buttonDisabled}>{strings.buttonChange}</button>
          <button className="myButton" id="buttonTakePhoto" onClick={this.takePicture} disabled={this.state.buttonDisabled}>{strings.buttonTakePhoto}</button>
        </div>
        <div>
          <p className="textCommon">{strings.sourceFrame}:</p>
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
      status: null,
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
    this.setState({status: null, persons: [], images: [],});
    let fileChooser = document.getElementById("fileChooser");
    fileChooser.click();
  }

  onButtonSendImageClick = () => {
    this.setState({status: this.renderLoader(), persons: [], images: [],});
    let sourceFrame = document.getElementById("imageFile").src;
    this.recognizeFaces(sourceFrame);
  }

  render() {
    return (
      <div className="App-header">
        <div className="App">
          <div>
           {this.state.status}
          </div>
          <input type="file" id="fileChooser" accept="image/jpeg,image/png" onChange={this.onFileChange}></input>
          <img id="imageFile" width={this.width}/>
          <button className="myButton" id="buttonChooseFIle" onClick={this.onButtonChooseFileClick} disabled={this.buttonDisabled}>{strings.buttonChooseFile}</button>
          <button className="myButton" id="buttonSendFile" onClick={this.onButtonSendImageClick} disabled={this.buttonDisabled}>{strings.buttonSendFile}</button>
        </div>
        {this.renderOutput()}
      </div>
    );
  }
}

class MainView extends React.Component {
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
          <button className="myButton" id="buttonOpenFIleCapture" onClick={this.onButtonOpenFIleCaptureClick}>{strings.recognizeFromFile}</button>
          <button className="myButton" id="buttonOpenWebcamCapture" onClick={this.onButtonOpenWebcamCaptureClick}>{strings.recognizeFromCamera}</button>
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
  onSelectLangChange = () => {
    let lang = document.getElementById("lang");
    strings.setLanguage(lang.value);
    this.setState({lang: lang.value});
  }

  renderSelectLang = () => {
    let options = [];
    let langs = strings.getAvailableLanguages()
    for (let i = 0; i < langs.length; i++) {
      options.push(<option key={i} value={langs[i]}>{langs[i]}</option>);
    }

    return (
      <select id="lang" className="myButton" onChange={this.onSelectLangChange}>
        {options}
      </select>
    )
  }

  render() {
    return (
        <div className="App">
          <header className="App-header">
            <div className="title">
              <p className="titleMain">{strings.mainTitle}</p>
              {this.renderSelectLang()}
            </div>
            <MainView/>
          </header>
        </div>
    );
  }
}

export default App;
