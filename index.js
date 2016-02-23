#!/usr/bin/env node
(function () {

  'use strict';

  var requestify = require('requestify');
  var program = require('commander');
  var clc = require('cli-color');
  var pkg = require('./package.json');

  var baseurl =' http://labs.bible.org/api/';

  program
    .version(pkg.version)
    .usage('[options] <book> <chapter> <verse>')
    .option('-f, --formatting [type]', 'Response format [full|para|plain]', 'plain')
    .option('-t, --type [type]', 'Response type [text|xml|json|jsonp]', 'json')
    .option('-w, --charwidth', 'Wrap at character width', -1)
    .option('-v, --verbose', 'Show verbose messages (debugging)')

    .action(function (book, chapter, verse) {
      fetch(book, chapter, verse).then(display);
    });

  program.parse(process.argv);

  function fetch (book, chapter, verse) {
    return requestify.get(baseurl, {
      params: {
        passage: book +'+'+ chapter +':'+ verse,
        formatting: program.formatting,
        type: program.type,
      }
    }).then(function(response) {
        if (program.verbose) {
          console.log(response);
        }
        return response;
    });
  }

  var superscript = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };

  function toSuper (str) {
    var value = '';

    for (var i=0; i< str.length; i+=1) {
      var schar = superscript[str[i]];

      if (schar) {
        value += schar;
      }
    }

    return value;
  }


  function sanitize (text) {
    text = text.replace(/\&\#8211/g, '–');
    return text;
  }


  function display (data) {
    if (program.type === 'json') {
      var f1 = clc.red;
      var verses = JSON.parse(data.body);

      var bookname = '';
      var chapter = '';
      var verse = '';

      var style = {
        bookname_chapter: clc.white.bold.underline,
        verse_number: clc.white,
        verse_text: clc.reset,
        link: clc.blue.underline,
      };

      var output = '';

      verses.forEach(function(verse) {

        if (verse.bookname !== bookname) {
          bookname = verse.bookname;
        }

        if (verse.chapter !== chapter) {
          chapter = verse.chapter;
          output += style.bookname_chapter('\n\n'+bookname + ' ' + chapter + '\n\n');
        }

        output += style.verse_number(toSuper(verse.verse)) + '' + verse.text + ' ';
      });

      output += "\n\nNET Bible® - ";
      output += style.link("https://bible.org/copyright#cpyrt\n");

      console.log(sanitize(output));
    } else {
      console.log(data.body);
    }
  }

})();
