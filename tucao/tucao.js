
/**
 * tucao.cc
 */
var monkey_tucao = {

  url: '',
  title: '',
  playerId: '',
  key: '',
  timestamp: '',
  vid: '',
  type: '',
  vids: [],
  pos: 0,
  videos: [],
  format: '标清',
  redirect: false,
  types: {
    sina: 'sina',
    tudou: false,  // redirect to original url
    youku: false,  // redirect to original url
  },

  run: function() {
    console.log('run()');
    this.getVid();
  },

  /**
   * Get video id
   */
  getVid: function() {
    console.log('getVid() -- ');
    var playerCode = document.querySelectorAll(
          'ul#player_code li');

    if (playerCode && playerCode.length === 2) {
      this.vids = playerCode[0].firstChild.nodeValue.split('**');
      if (this.vids[this.vids.length - 1] == '') {
        // remove empty vid
        this.vids.pop();
      }
      this.playerId = playerCode[1].innerHTML;
      this.getTitle();
    }
  },

  /**
   * Get video title
   */
  getTitle: function() {
    console.log('getTitle()');
    var params;

    if (this.vids.length === 1 || location.hash === '') {
      this.pos = 0;
      this.url = location.href;
    } else {
      // hash starts with 1, not 0
      this.pos = parseInt(location.hash.replace('#', '')) - 1;
      this.url = location.href.replace(location.hash, '');
    }
    params = getQueryVariable(this.vids[this.pos].split('|')[0]);
    this.vid = params.vid;
    this.type = params.type;
    if (this.vids.length === 1) {
      this.title = document.title.substr(0, document.title.length - 16);
    } else {
      this.title = this.vids[this.pos].split('|')[1];
    }
    this.getUrl();
  },

  /**
   * Get original url
   */
  getUrl: function(type) {
    console.log('getUrl()');
    var url,
        params,
        that = this;

    if (this.types[this.type] === false) {
      this.redirectTo();
      return;
    }

    this.calcKey();
    url = [
      'http://www.tucao.cc/api/playurl.php',
      '?type=',
      this.type,
      '&vid=',
      this.vid,
      '&key=', this.key,
      '&r=', this.timestamp
      ].join('');

    console.log('url: ', url);
    GM_xmlhttpRequest({
      method: 'GET',
      url: url,
      onload: function(response) {
        console.log(response);
        var xml = parseXML(response.responseText),
            durls = xml.querySelectorAll('durl'),
            durl,
            url,
            i;

        for (i = 0; durl = durls[i]; i += 1) {
          url = durl.querySelector('url'); 
          that.videos.push(
            url.innerHTML.replace('<![CDATA[', '').replace(']]>', ''));
        }

        that.createUI();
      },
    });
  },

  /**
   * 计算这个请求的授权key.
   * 算法来自于: http://www.cnbeining.com/2014/05/serious-businesstucao-cc-c-video-resolution/
   * @return [key, timestamp]
   */
  calcKey: function() {
    console.log('calcKey () --');
    var time = new Date().getTime();

    this.timestamp = Math.round(time / 1000);
    var local3 = this.timestamp ^ 2774181285;
    var local4 = parseInt(this.vid, 10);
    var local5 = local3 + local4;
    local5 = (local5 < 0) ? (-(local5) >> 0) : (local5 >> 0);
    this.key = 'tucao' + local5.toString(16) + '.cc';
  },

  /**
   * Redirect to original url
   */
  redirectTo: function() {
    console.log('redirectTo() --');
    console.log(this);
    var urls = {
          tudou: function(vid) {
            return 'http://www.tudou.com/programs/view/' + vid + '/';
          },
          youku: function(vid) {
            return 'http://v.youku.com/v_show/id_' + vid + '.html';
          },
        };

    this.redirect = true;
    this.videos.push(urls[this.type](this.vid));
    this.formats.push('原始地址');
    this.createUI();
  },

  /**
   * Construct ui widgets
   */
  createUI: function() {
    console.log('createUI() -- ');
    console.log(this);
    var videos = {
          title: this.title,
          formats: [],
          links: [],
          ok: true,
          msg: '',
        },
        video,
        i;

    videos.links.push(this.videos);
    videos.formats.push(this.format);
    multiFiles.run(videos);
  },

}


monkey.extend('www.tucao.cc', [
  'http://www.tucao.cc/play/',
], monkey_tucao);
