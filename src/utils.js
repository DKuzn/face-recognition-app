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
