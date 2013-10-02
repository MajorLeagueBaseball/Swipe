/*!
 * Navigation Dots for frankenslide
 * Copyright 2013 Stu Kabakoff
 * Licensed under the MIT license.
 */
(function( factory ) {
  //AMD
  if(typeof define === 'function' && define.amd) {
    define(['jquery'], factory);

  //NODE
  } else if(typeof module === 'object' && module.exports) {
    var $ = require('jquery');
    module.exports = factory($);

  //GLOBAL
  } else {
    window.NavigationDots = factory(jQuery);
  }
})(function($) {

  var defaultConfig = {
    useNumbers: false,
    activeClass: 'on',
    containerClass: 'nav-dots',
    elementType: 'a'
  };


  return {
    create: function( carousel, target, config ) {

      var self = {};

      config = $.extend({}, defaultConfig, config);

      var htmlStr;
      var dotCount;
      var slidesPerPage = carousel.slidesPerPage();
      var hidden = false;

      function renderDots() {
        var html = '';
        var contentStr = '';
        dotCount = carousel.slideCount() - carousel.slidesPerPage() + 1;
        for( var i = 0; i < dotCount; i += 1 ) {
          if (config.useNumbers) {
            contentStr = i;
          }
          if (config.elementType === 'a') {
            html += '<a href="#">'+contentStr+'</a>';
          } else {
            html += '<'+config.elementType+'>'+contentStr+'</'+config.elementType+'>';
          }
        }
        return html;
      }

      if (config.elementType === 'li') {
        htmlStr = '<ul class="'+config.containerClass+'">';
      } else {
        htmlStr = '<div class="'+config.containerClass+'">';
      }
      
      htmlStr += renderDots();

      if (config.elementType === 'li') {
        htmlStr += '</ul>';
      } else {
        htmlStr += '</div>';
      }

      self.updateState = function( newIndex ) {
        self.dots.removeClass( config.activeClass );
        self.dots.eq(newIndex).addClass( config.activeClass );
      };
      
      self.updateDotCount = function( force ) {
        var newSlidesPerPage = carousel.slidesPerPage();
        if (force || newSlidesPerPage !== slidesPerPage) {
          self.container.removeClass('dot-count-'+dotCount);

          self.container.html(renderDots());
          self.dots = self.container.children();
          self.updateState();

          slidesPerPage = newSlidesPerPage;

          self.container.addClass('dot-count-'+dotCount);
        }
      };

      self.hide = function() {
        hidden = true;
        self.container.hide();
      };

      self.show = function() {
        hidden = false;
        self.container.show();
      };

      self.container = $(htmlStr);
      self.dots = self.container.children();

      $(target).append(self.container);
      self.updateState( carousel.currentSlide() );
      
      self.container.on('click', config.elementType, function( event ) {
        event.preventDefault();
        var index = self.dots.index(event.target);
        carousel.to(index);
        carousel.element.trigger('navigationDotClick.frankenslide', [index]);
      });
      carousel.on('move', self.updateState);
      carousel.on('sizeChange', self.updateDotCount);

      return self;
    }
  };

});
