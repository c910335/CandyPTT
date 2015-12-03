// Generated by CoffeeScript 1.10.0
(function() {
  var askDelOther, connect, connectSession, delOther, disconnect, fail, failNoLogout, favoriteSession, hideLoading, improvePost, improvePosts, loadPosts, login, loginSession, postsSession, resetHomeButton, showLoading, showPost;

  resetHomeButton = function() {
    $('#home').unbind('click');
    $('#home').children('small').remove();
    return $('#home').children('span').remove();
  };

  disconnect = function() {
    $.ajax({
      url: window.url + '/connect',
      type: 'DELETE',
      data: {
        token: window.token
      },
      success: function(data) {
        return toastr.success(data.status);
      }
    }).always(function() {
      return window.token = null;
    });
    resetHomeButton();
    $('#logout-button').addClass('sr-only');
    localStorage.removeItem('auto-login');
    return connectSession();
  };

  showLoading = function() {
    window.spinner = new Spinner().spin();
    $('#loading').html(window.spinner.el);
    return $('#loading').modal('show');
  };

  hideLoading = function() {
    window.spinner.stop();
    return $('#loading').modal('hide');
  };

  fail = function(xhr, status, data, logout) {
    var errMsg, error;
    if (logout == null) {
      logout = true;
    }
    hideLoading();
    try {
      errMsg = $.parseJSON(xhr.responseText);
      toastr.error(errMsg.error, data);
    } catch (error) {
      toastr.error(data);
    }
    if (logout) {
      return disconnect();
    }
  };

  failNoLogout = function(xhr, status, data) {
    return fail(xhr, status, data, false);
  };

  improvePost = function() {
    var articleMeta;
    $('.article-metaline-right').remove();
    articleMeta = [];
    $('.article-meta-value').each(function() {
      return articleMeta.push($(this).text());
    });
    $('.article-metaline').remove();
    if (articleMeta[2]) {
      $('#main-content').prepend('<div class="article-time">' + articleMeta[2] + '</div>');
    }
    if (articleMeta[0]) {
      $('#main-content').prepend('<div class="article-author">' + articleMeta[0] + '</div>');
    }
    if (articleMeta[1]) {
      $('#main-content').prepend('<div class="article-title">' + articleMeta[1] + '</div>');
    }
    $('img').each(function() {
      if (/^\/\//.test($(this).attr('src'))) {
        return $(this).attr('src', 'http:' + $(this).attr('src'));
      }
    });
    $('a').each(function() {
      if (/^\/bbs/.test($(this).attr('href'))) {
        return $(this).attr('href', 'https://www.ptt.cc' + $(this).attr('href'));
      }
    });
    $('iframe').parent().remove();
    return $.get('html/push.html', function(pushHTML) {
      return $('.push').each(function() {
        var push, pushContent, pushTag;
        push = $(this)[0].outerHTML;
        $(this).html($(pushHTML).html());
        pushTag = $(push).find('.push-tag').html();
        $(this).find('.push-tag').html(pushTag);
        if (/推/.test(pushTag)) {
          $(this).find('.push-tag').addClass('push-tag-push');
        } else if (/噓/.test(pushTag)) {
          $(this).find('.push-tag').addClass('push-tag-boo');
        } else {
          $(this).find('.push-tag').addClass('push-tag-arrow');
        }
        $(this).find('.push-userid').html($(push).find('.push-userid').html());
        $(this).find('.push-ipdatetime').html($(push).find('.push-ipdatetime').html());
        pushContent = $(push).find('.push-content').html();
        if (!pushContent.match(/^:*$/)) {
          return $(this).find('.push-content').html(pushContent.match(/^:((.|\n)*)$/)[1]);
        }
      });
    }, 'html');
  };

  showPost = function(num) {
    var post;
    post = window.posts[num];
    if (post.author === '-') {
      return;
    }
    $('#' + num).addClass('post-read');
    switch (post.status) {
      case '+':
      case '~':
        post.status = ' ';
        break;
      case 'S':
        post.status = 's';
        break;
      case 'M':
      case '=':
        post.status = 'm';
    }
    $('#' + num).find('.post-status').text(post.status);
    showLoading();
    return $.ajax({
      url: window.url + '/read',
      type: 'PUT',
      dataType: 'json',
      data: {
        token: window.token,
        id: post.id
      }
    }).done(function() {
      return $.ajax({
        url: post.url,
        headers: {
          cookie: 'over18=1'
        },
        dataType: 'html',
        type: 'GET'
      }).done(function(data) {
        hideLoading();
        $('#loading-posts').remove();
        window.postsHTML = $('#container').html();
        $('#container').html($(data).find('#main-content')[0].outerHTML);
        window.postsScrollY = window.scrollY;
        scrollTo(0, 0);
        $('#home').unbind('click');
        $('#home').click(function(event) {
          event.preventDefault();
          $('#container').html(window.postsHTML);
          window.postsHTML = null;
          scrollTo(0, window.postsScrollY);
          $('#home').unbind('click');
          $(this).click(function(event) {
            event.preventDefault();
            resetHomeButton();
            return favoriteSession();
          });
          return improvePosts();
        });
        return improvePost();
      }).fail(failNoLogout);
    }).fail(failNoLogout);
  };

  improvePosts = function() {
    var postsSpinner;
    $('.post').unbind('click');
    $('.post').click(function(event) {
      var num;
      event.preventDefault();
      num = $(this).attr('id');
      return showPost(num);
    });
    $('#container').append('<div id="loading-posts"></div>');
    postsSpinner = new Spinner().spin();
    $('#loading-posts').html(postsSpinner.el);
    return $('#loading-posts').one('inview', function() {
      return loadPosts(function() {
        postsSpinner.stop();
        return $('#loading-posts').remove();
      });
    });
  };

  loadPosts = function(preDone, postDone) {
    return $.getJSON(window.url + '/posts', {
      token: window.token
    }, function(data) {
      var container;
      container = $('#posts');
      window.posts = window.posts.concat(data.posts);
      return $.get('html/post.html', function(postHTML) {
        if (typeof preDone === 'function') {
          preDone();
        }
        $.each(data.posts, function(i, post) {
          var num, template;
          num = window.postNum + i;
          container.append(postHTML.replace('{id}', num));
          template = container.children('#' + num);
          if (!(post.status === '+' || post.status === 'M' || post.status === 'S')) {
            template.addClass('post-read');
          }
          template.find('.post-date').text(post.date);
          if (parseInt(post.like) < 10) {
            template.find('.post-like').addClass('post-like-digit');
          } else if (parseInt(post.like)) {
            template.find('.post-like').addClass('post-like-two-digits');
          } else if (post.like === '爆') {
            template.find('.post-like').addClass('post-like-bomb');
          } else {
            template.find('.post-like').addClass('post-like-xx');
          }
          template.find('.post-like').text(post.like);
          template.find('.post-status').text(post.status);
          template.find('.post-author').text(post.author);
          if (post.source !== '□') {
            template.find('.post-title').text(post.source + ' ');
          }
          template.find('.post-title').append(post.title);
          return container.append('<hr />');
        });
        window.postNum = window.posts.length;
        improvePosts();
        if (typeof postDone === 'function') {
          return postDone();
        }
      }, 'html');
    }).fail(failNoLogout);
  };

  postsSession = function(boardName) {
    showLoading();
    return $.ajax({
      url: window.url + '/enter',
      type: 'PUT',
      dataType: 'json',
      data: {
        token: window.token,
        board: boardName
      }
    }).done(function(data) {
      resetHomeButton();
      $('#home').prepend('<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>');
      $('#home').append('<small>' + data.board + '</small>').click(function(event) {
        event.preventDefault();
        resetHomeButton();
        return favoriteSession();
      });
      window.posts = [];
      window.postNum = 0;
      loadPosts(null, hideLoading);
      return $('#container').html('<div id="posts"></div>');
    }).fail(failNoLogout);
  };

  favoriteSession = function() {
    showLoading();
    return $.getJSON(window.url + '/favorites', {
      token: window.token
    }, function(data) {
      var container;
      resetHomeButton();
      $('#home').append(' <small>我的最愛</small>');
      container = $('#container');
      container.empty();
      window.favorites = data.favorites;
      return $.get('html/board.html', function(boardHTML) {
        $.each(window.favorites, function(i, board) {
          var template;
          container.append(boardHTML.replace('{id}', i));
          template = container.children('#' + i);
          template.find('.board-en-name').text(board.en_name);
          if (board.unread) {
            template.find('.board-unread').removeClass('sr-only');
          }
          template.find('.board-zh-name').text(board.zh_name);
          return template.find('.board-popularity').text(board.popularity);
        });
        $('.board').click(function() {
          var num;
          num = $(this).attr('id');
          return postsSession(window.favorites[num].en_name);
        });
        hideLoading();
        return $.material.init();
      }, 'html');
    }).fail(fail);
  };

  delOther = function(del) {
    $('#ask-del-other').modal('hide');
    showLoading();
    return $.ajax({
      url: window.url + '/other',
      type: 'DELETE',
      dataType: 'json',
      data: {
        token: window.token,
        del: del
      }
    }).done(function() {
      hideLoading();
      return favoriteSession();
    }).fail(fail);
  };

  askDelOther = function() {
    $('#keep-other').click(function() {
      return delOther(false);
    });
    $('#del-other').click(function() {
      return delOther(true);
    });
    return $('#ask-del-other').modal('show');
  };

  login = function(account, password) {
    showLoading();
    return $.ajax({
      url: window.url + '/login',
      type: 'PUT',
      dataType: 'json',
      data: {
        token: window.token,
        account: account,
        password: password
      }
    }).done(function(data) {
      hideLoading();
      $('#logout-button').removeClass('sr-only');
      toastr.success('Logged in');
      if (data.status === 'Other Online') {
        return askDelOther();
      } else {
        return favoriteSession();
      }
    }).fail(function(xhr, status, data) {
      localStorage.removeItem('auto-login');
      return fail(xhr, status, data);
    });
  };

  loginSession = function(allowAuto) {
    var account, autoLogin, password;
    if (allowAuto == null) {
      allowAuto = true;
    }
    autoLogin = localStorage.getItem('auto-login') === 'true';
    account = localStorage.getItem('account');
    password = localStorage.getItem('password');
    return $('#container').load('html/login-form.html', function() {
      $('#home').prepend('<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>').click(function(event) {
        event.preventDefault();
        return disconnect();
      });
      $('#account').val(account);
      $('#password').val(password);
      if (autoLogin) {
        $('#auto-login').attr('checked', 'checked');
      }
      $.material.init();
      if (allowAuto && autoLogin) {
        $(this).find('button[type=submit]').button('loading');
        return login(account, password);
      } else {
        return $('#login').submit(function(event) {
          event.preventDefault();
          $(this).find('button[type=submit]').button('loading');
          showLoading();
          account = $('input#account').val();
          password = $('input#password').val();
          autoLogin = $('input#auto-login').prop('checked');
          localStorage.setItem('auto-login', autoLogin);
          if (autoLogin) {
            localStorage.setItem('account', account);
            localStorage.setItem('password', password);
          } else {
            localStorage.removeItem('account');
            localStorage.removeItem('password');
          }
          return login(account, password);
        });
      }
    });
  };

  connect = function() {
    return $.post(window.url + '/connect', function(data, status) {
      window.token = data.token;
      toastr.success(data.status);
      return loginSession();
    }, 'json').fail(function(xhr, status, data) {
      $('#connect').find('button[type=submit]').button('reset');
      return fail(xhr, status, data);
    }).always(function() {
      return hideLoading();
    });
  };

  connectSession = function() {
    return $('#container').load('html/connect-form.html', function() {
      $('input#graptt-url').val(localStorage.getItem('graptt-url'));
      if (localStorage.getItem('remember-url') === 'true') {
        $('input#remember-url').attr('checked', 'checked');
      }
      $('#connect').submit(function(event) {
        var remember;
        event.preventDefault();
        $(this).find('button[type=submit]').button('loading');
        showLoading();
        window.url = $('input#graptt-url').val();
        remember = $('input#remember-url').prop('checked');
        localStorage.setItem('remember-url', remember);
        if (remember) {
          localStorage.setItem('graptt-url', window.url);
        } else {
          localStorage.removeItem('graptt-url');
        }
        return connect();
      });
      return $.material.init();
    });
  };

  $(document).ready(function() {
    toastr.options.positionClass = 'toast-bottom-center';
    $.ajaxSetup({
      crossDomain: true,
      xhr: function() {
        return new XMLHttpRequest({
          mozAnon: true,
          mozSystem: true
        });
      },
      xhrFields: {
        withCredentials: true
      }
    });
    $('#logout-button').click(disconnect);
    return connectSession();
  });

}).call(this);
