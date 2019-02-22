var Crawler = require("crawler");
var $ = require('cheerio');
var fs = require('fs');

var c = new Crawler({
  maxConnections: 10,
  // This will be called for each crawled page
  callback: function (error, res, done) {
    if (error) {
      console.log(error);
    } else {
      deal(res.body);
    }
    done();
  }
});

// 全部信息
let infos = [];

// 所有用qq注册的用户
let validInfo = [];

deal = (res) => {
  const title = $('.search-list-con', res);
  title.children().map((index, item) => {
    const info = {};
    info.title = $('.limit_width', item).children().first().text().trim();
    info.author = $('.author a', item).text().trim();
    info.link = `https://blog.csdn.net/${info.author}?orderby=UpdateTime`;

    const haveIndex = infos.findIndex(item => item.author === info.author);
    if (haveIndex === -1) {
      infos.push(info);
      user(info);
    }
  });
};

user = (info) => {
  c.queue([{
    uri: info.link,
    jQuery: true,
    callback: function (error, res, done) {
      if (error) {
        console.log(error);
      } else {
        dealUser(res.body, info);
        // fs.writeFile('./test.html', res.body, { 'flag': 'a' }, function (err) { });
      }
      done();
    }
  }]);
}

dealUser = (res, info) => {
  const title = $('.data-info.d-flex.item-tiling', res);
  delete info.title;
  info.name = $('.name.csdn-tracking-statistics.tracking-click', res).text().trim();

  title.children().map((index, item) => {
    const desc = $('dt', item).text();
    info[desc] = $('dd', item).text().trim();
  });

  const record = $('.grade-box.clearfix', res);
  record.children().map((index, item) => {
    const desc = $('dt', item).text().trim();
    if (desc === '访问：' || desc === '积分：') {
      info[desc] = $('dd', item).attr('title');
    } else if (desc === '排名：') {
      info[desc] = $(item).attr('title');
    } else if (desc === '等级：') {
      const level = $('a', item).attr('title').split(',');
      info[desc] = level[0];
    }
  });

  const range = $('.aside-content ul', res);
  // 总的分类数
  info.range = range.children().filter((index, item) => {
    return $('span', item).attr('class') === 'title oneline';
  }).length;

  const dateInfo = $('.article-list', res);
  const date = $('.date', dateInfo.children()[1]).text();

  // 最近一次更新时间
  info.date = date;

  validInfo.push(info);
  console.log('test-', info);
}

// user({ link: 'https://blog.csdn.net/qq_14989227?orderby=UpdateTime' });

for (let i = 1; i <= 20; i++) {
  c.queue(`https://so.csdn.net/so/search/s.do?p=${i}&q=java&t=blog&domain=&o=&s=&u=&l=&f=&rbg=0`);
}
