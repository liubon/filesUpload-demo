'use strict';
const path = require('path');
const fs = require('fs');
const pump = require('mz-modules/pump');
const sendToWormhole = require('stream-wormhole');
const Controller = require('egg').Controller;

class UploaderController extends Controller {
  async upload() {
    const ctx = this.ctx;
    const parts = ctx.multipart();
    let part;
    // parts() 返回 promise 对象
    const host = 'http://127.0.0.1:7001';
    const filePath = path.join(__dirname, '../public/upload/');
    const files = [];
    while ((part = await parts()) != null) {
      if (part.length) {
        // 这是 busboy 的字段
        console.log('field: ' + part[0]);
        console.log('value: ' + part[1]);
        console.log('valueTruncated: ' + part[2]);
        console.log('fieldnameTruncated: ' + part[3]);
      } else {
        if (!part.filename) {
          return;
        }
        try {
          const filename = (new Date()).getTime() + Math.random().toString(36).substr(2) + path.extname(part.filename).toLocaleLowerCase();
          const target = filePath + filename;
          files.push({
            fileName: filename,
            filePath: host + '/public/upload/' + filename,
          });
          const writeStream = fs.createWriteStream(target);
          await pump(part, writeStream);
        } catch (err) {
          // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
          await sendToWormhole(part);
          throw err;
        }
        // console.log(result);
      }
    }
    ctx.body = files;
  }
}

module.exports = UploaderController;
