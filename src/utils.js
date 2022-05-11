// src/utils.js
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

import axios from "axios";

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

export {drawImage, loadImage, sendImage, getPerson}
