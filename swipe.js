/*jshint lastsemic: true, expr: true */
/*global DocumentTouch: true */
/*
 * Swipe 2.0
 *
 * Brad Birdsall
 * Copyright 2013, MIT License
 *
*/
(function(factory) {
  //AMD
  if (typeof define === 'function' && define.amd) {
    define([], factory);

    //NODE
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();

    //GLOBAL
  } else {
    window.Swipe = factory();
  }
})(function() {

function getStyle( el, styleProp ) {
  var y;
  if (el.currentStyle) {
    y = el.currentStyle[styleProp];
  } else if (window.getComputedStyle) {
    y = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
  }
  return y;
}

function getWidth( element ) {
  var width = element.offsetWidth;
  if (width === 0) {
    var widthStr = getStyle( element, 'width' );
    if (widthStr === 'auto') {
      width = getWidth( element.parentNode );
    } else if (widthStr.charAt(widthStr.length-1) === '%') {
      var percent = parseInt( widthStr, 10 );
      var parentWidth = getWidth( element.parentNode );
      width = parentWidth * (percent / 100);
    } else {
      width = parseInt( widthStr, 10 );
    }
  }
  return width;
}

// utilities
var noop = function() {}; // simple no operation function
var offloadFn = function(fn) { setTimeout(fn || noop, 0) }; // offload a functions execution

// check browser capabilities
var browser = {
  addEventListener: !!window.addEventListener,
  touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
  transitions: (function(temp) {
    var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
    for ( var i in props ) if (temp.style[ props[i] ] !== undefined) return true;
    return false;
  })(document.createElement('swipe'))
};
var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame ||
                            function(cb) { setTimeout(cb, 16) }; 


function Swipe(container, options) {

  "use strict";

  // quit if no root element
  if (!container) return;
  var element = container.children[0];
  var slides, slidePos, width, slidesPerPage, slideWidth, enabled = true;
  
  options = options || {};
  var index = parseInt(options.startSlide, 10) || 0;
  var speed = options.speed || 300;
  options.continuous = !!options.continuous;
  options.autoStop = options.autoStop === undefined ? false : !!options.autoStop;
  options.snapToNearest = options.snapToNearest === undefined ? false : !!options.snapToNearest;
  var emit = options.emit || noop;

  function slideWillPassThroughFrame( slide, from, to ) {
    
    if (delta.x > 0 === from >= to) {
      from -= 1;
    } else if (delta.x < 0 === from < to) {
      from += 1;
    }

    if (to === slides.length - slidesPerPage) {
      to -= 1;
    }
    
    if (from < to) {
      return slide >= from && slide <= to + slidesPerPage;
    } else {
      return slide <= from + slidesPerPage && slide >= to;
    }
  }

  function getPositionOfSlideWhenAtIndex( slide, index ) {
    if (index === slides.length - slidesPerPage) {
      var extraSpace = width % slideWidth;
      return (slide - index) * slideWidth + extraSpace;
    } else {
      return (slide - index) * slideWidth;
    }
  }
  
  function setup() {

    // cache slides
    slides = element.children;

    // create an array to store current positions of each slide
    slidePos = new Array(slides.length);

    element.style.width = '';
    slides[0].style.width = '';

    // determine width of each slide
    width = getWidth( container );
    slideWidth = getWidth( slides[0] );
    var slideClientWidth = slides[0].clientWidth || slideWidth;
    slidesPerPage = Math.floor( width / slideWidth );

    element.style.width = (slides.length * slideWidth) + 'px';

    // stack elements
    var pos = slides.length;
    while(pos--) {

      var slide = slides[pos];

      slide.style.width = slideClientWidth + 'px';
      slide.setAttribute('data-index', pos);

      if (browser.transitions) {
        slide.style.left = (pos * -slideWidth) + 'px';
        slide.style.webkitTransitionTimingFunction = 'ease-out';
        move( pos, getPositionOfSlideWhenAtIndex( pos, index ), 0 );
      }

    }

    if (!browser.transitions) element.style.left = (index * -slideWidth) + 'px';

    container.style.visibility = 'visible';

  }

  function setupIfSizeChanged() {
    var newWidth = container.getBoundingClientRect().width || container.offsetWidth;
    if (newWidth !== width) {
      setup();
      emit('sizeChange');
    }
  }

  function prev() {

    if (index) slide(index-1);
    else if (options.continuous) slide(slides.length-slidesPerPage);

  }

  function next() {

    if (index < slides.length - slidesPerPage) slide(index+1);
    else if (options.continuous) slide(0);

  }

  function prevPage() {

    if (index) slide(index-slidesPerPage);
    else if (options.continuous) slide(slides.length-slidesPerPage);

  }

  function nextPage() {

    if (index < slides.length - slidesPerPage) slide(index+slidesPerPage);
    else if (options.continuous) slide(0);

  }

  function slide(to, slideSpeed, startWithExistingPositions) {
    
    emit('move', to, index);

    if (+slideSpeed !== slideSpeed) {
      slideSpeed = speed;
    }
    // do nothing if already on requested slide
    //if (index == to) return;
    if (options.continuous) {
      to = (to + slides.length - slidesPerPage) % (slides.length - slidesPerPage);
    }
    to = Math.max( to, 0 );
    to = Math.min( to, slides.length - slidesPerPage );
    
    var startingIndex = index;
    
    if (browser.transitions) {
      var pos = slides.length;

      if (!startWithExistingPositions) {
        while(pos--) {
          var oldPosition = getPositionOfSlideWhenAtIndex( pos, startingIndex );
          if( index !== to && slideWillPassThroughFrame( pos, startingIndex, to ) ) {
            move( pos, oldPosition, 0 );
          } else {
            slidePos[pos] = oldPosition;
          }
        }
      }
      // animations must be started in a timeout to ensure that
      // they start from the starting point determined above.
      offloadFn(function() {
        pos = slides.length;      
       
        while(pos--) {
          var newPosition = getPositionOfSlideWhenAtIndex( pos, to );
          if( slideWillPassThroughFrame( pos, startingIndex, to ) ) {
            move( pos, newPosition, slideSpeed );
          } else {
            slidePos[pos] = newPosition;
          }
        }
        delta.x = 0;
      });

    } else {
      animate(startingIndex * -slideWidth, to * -slideWidth, slideSpeed || speed);
    }

    index = to;

    offloadFn(options.callback && options.callback(index, slides[index]));

  }

  function move(index, dist, speed) {

    translate(index, dist, speed);
    slidePos[index] = dist;

  }

  function translate(index, dist, speed) {

    var slide = slides[index];
    var style = slide && slide.style;

    if (!style) return;

    style.webkitTransitionDuration = 
    style.MozTransitionDuration = 
    style.msTransitionDuration = 
    style.OTransitionDuration = 
    style.transitionDuration = speed + 'ms';

    style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
    style.msTransform = 
    style.MozTransform = 
    style.OTransform = 'translateX(' + dist + 'px)';

  }

  function animate(from, to, speed) {

    // if not an animation, just reposition
    if (!speed) {
      
      element.style.left = to + 'px';
      return;

    }
    
    var start = +new Date();
    
    var timer = setInterval(function() {

      var timeElap = +new Date() - start;
      
      if (timeElap > speed) {

        element.style.left = to + 'px';

        if (delay) begin();

        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);
        emit('animationEnd', to);

        clearInterval(timer);
        return;

      }

      element.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

    }, 4);

  }

  function calculateResistance( overshoot ) {
    return overshoot / 2;
  }

  function calculateOvershoot( x ) {
    var locationOfFirstSlide = x + slidePos[0];
    var locationOfLastSlide = x + slidePos[slides.length-1] + width % slideWidth;
    
    if (locationOfFirstSlide > 0) { // first slide, going left
      return locationOfFirstSlide;
 
    } else if (locationOfLastSlide < width - slideWidth - width % slideWidth) { //(width + (slideWidth * slidesPerPage)) ) { // last slide, going right
      return -((slideWidth * (slidesPerPage - 1)) - locationOfLastSlide);
    }

    return 0;
  }

  function placeAnimationFrame( x, speed ) {

    speed = speed || 0;

    var overshoot = calculateOvershoot( x );
    var leftBoundary = -slideWidth;
    var rightBoundary = width;
    
    if (overshoot < 0) { // last slide, finger moving right
      leftBoundary -= width; // this ensures that slides don't overlap when springing back.
      x -= calculateResistance( overshoot );

    } else if (overshoot > 0) { // first slide, finger moving left
      rightBoundary += width; // this ensures that slides don't overlap when springing back.
      x -= calculateResistance( overshoot );
    }

    // translate 1:1
    for( var i = 0; i < slides.length; i++ ) {
      var location = x + slidePos[i];
      if (location < leftBoundary) { // not visible, to the left
        location = -slideWidth;
      } else if (location > rightBoundary) { // not visible, to the right
        location = width;
      }
      translate(i, location, speed);

      
    }
  }

  function setCurrentLocationAfterToss() {
    var currentIndex = index - Math.round( delta.x / slideWidth );
    //var pxDiff = (index - currentIndex) * slideWidth;
    for( var i = 0; i < slides.length; i += 1) {
      slidePos[i] += delta.x;
    }
    delta.x = 0;//pxDiff;
    emit('move', currentIndex, index);
    index = currentIndex;
  }

  var stopToss = false;
  var tossing = false;
  function animateToss( velocity ) {
    tossing = true;
    var currentIndex = index;
    if (Math.abs(velocity) < 0.1) {
      if (!options.snapToNearest) {
        return;
      }
      currentIndex = index - Math.round( delta.x / slideWidth );
      slide(currentIndex, speed/2, true);
    }
    if (Math.abs(velocity) === Infinity) {
      velocity = velocity < 0 ? -20 : 20;
    }
    var loopVelocity = velocity * 16;
    var totalDistance = 0;
    while( loopVelocity|0 !== 0 ) {
      totalDistance += loopVelocity;
      loopVelocity = loopVelocity * 0.9;
    }
    if (totalDistance === 0) {
      setCurrentLocationAfterToss();
      return;
    }

    var slideCount = Math.round(totalDistance / slideWidth);

    if (options.snapToNearest) {
      var overflow = (delta.x % slideWidth);
      totalDistance = (slideCount * slideWidth) - overflow;
    }

    var overshoot = calculateOvershoot( totalDistance + delta.x );
    if (overshoot < -slideWidth) {
      totalDistance -= overshoot + slideWidth;
    } else if (overshoot > slideWidth) {
      totalDistance -= overshoot - slideWidth;
    }

    var remainingDistance = totalDistance;
    var lastAnimationTime = new Date();

    var animator = function() {
      if (stopToss) {
        tossing = false;
        return;
      }

      var now = new Date();
      var ms = now - lastAnimationTime;
      if (ms < 5) { // the ipad simulator sometimes calls RAF too much.
        setTimeout(animator, 10);
        return;
      }
      lastAnimationTime = now;

      var distance = (remainingDistance / totalDistance) * velocity * ms;
      remainingDistance -= distance;

      if (Math.abs(distance) > Math.abs(remainingDistance)) { // if the thread was blocked for a long time this will happen.
        distance = remainingDistance;
      }

      if ( Math.abs(distance) < 0.1 || Math.abs(remainingDistance) > Math.abs(totalDistance) ) {
        tossing = false;
        currentIndex = index - Math.round( delta.x / slideWidth );
        if (!options.snapToNearest && currentIndex > 0 && currentIndex < slides.length-slidesPerPage) {
          setCurrentLocationAfterToss();
        } else {
          slide(currentIndex, speed/2, true);
        }
        return;
      }
      delta.x += distance;
      placeAnimationFrame( delta.x );
      requestAnimationFrame(animator);
    };
    requestAnimationFrame(animator);

  }

  // setup auto slideshow
  var delay = options.auto || 0;
  var interval;

  function begin() {

    interval = setTimeout(function() {
      next();
      emit('autoAdvance');
    }, delay);

  }

  function stop() {

    stopToss = true;
    delay = 0;
    pause();

  }

  function autoStop() {
    if (options.autoStop) {
      stop();
    } else {
      pause();
    }
  }

  function pause() {
    clearTimeout(interval);

  }

  // setup initial vars
  var start = {};
  var delta = {
    x: 0,
    y: 0
  };
  var isScrolling;
  var lastVelocities; 
  var currentVelocitiesIndex = 0; 
  var lastEventTime;
  var startingPosition = {
    x: 0,
    y: 0
  };

  function preventDefault( event ) {
    event.preventDefault();
  }

  function preventClickFromTouch( el ) {

    el.addEventListener('click', preventDefault, true );

    setTimeout(function() {
      el.removeEventListener('click', preventDefault, true );
    }, 500);
  }

  // setup event capturing
  var events = {

    handleEvent: function(event) {
      if (!enabled) {
        return;
      }
      switch (event.type) {
        case 'touchstart': this.start(event); break;
        case 'touchmove': this.move(event); break;
        case 'touchcancel':
        case 'touchend': offloadFn(this.end(event)); break;
        case 'webkitTransitionEnd':
        case 'msTransitionEnd':
        case 'oTransitionEnd':
        case 'otransitionend':
        case 'transitionend': offloadFn(this.transitionEnd(event)); break;
        case 'resize': offloadFn(setupIfSizeChanged); break;
      }

      if (options.stopPropagation) event.stopPropagation();

    },
    start: function(event) {

      var touches = event.touches[0];
      if (tossing) {
        stopToss = true;
        if (!options.snapToNearest) {
          setCurrentLocationAfterToss();
        }
      }

      // measure start values
      start = {

        // get initial touch coords
        x: touches.pageX,
        y: touches.pageY,

        // store time to determine touch duration
        time: +new Date()

      };

      startingPosition.x = touches.pageX;
      startingPosition.y = touches.pageY;
      
      // used for testing first move event
      isScrolling = undefined;
      
      lastVelocities = [];
      currentVelocitiesIndex = 0;
      lastEventTime = new Date();

      // attach touchmove and touchend listeners
      element.addEventListener('touchmove', this, false);
      element.addEventListener('touchend', this, false);
      element.addEventListener('touchcancel', this, false);

      event.preventDefault();

    },
    move: function(event) {

      // ensure swiping with one touch and not pinching
      if ( event.touches.length > 1 || event.scale && event.scale !== 1) return;

      if (options.disableScroll) event.preventDefault();

      var touches = event.touches[0];
      var lastDelta = {
        x: delta.x,
        y: delta.y
      };

      // measure change in x and y
      delta.x = touches.pageX - start.x;
      delta.y = touches.pageY - start.y;

      var distanceSinceLastEvent = delta.x - lastDelta.x;
      var now = new Date();
      var timeSinceLastEvent = now - lastEventTime;
      lastEventTime = now;

      if ( lastVelocities[currentVelocitiesIndex-1] && // the direction switches
          (lastVelocities[currentVelocitiesIndex-1] < 0) !== (distanceSinceLastEvent < 0) ) {
        lastVelocities.length = 0;
        currentVelocitiesIndex = 0;
      }
      lastVelocities[currentVelocitiesIndex] = distanceSinceLastEvent / timeSinceLastEvent;
      currentVelocitiesIndex += 1;
      if (currentVelocitiesIndex === 4) {
        currentVelocitiesIndex = 0;
      }

      // determine if scrolling test has run - one time test
      if ( typeof isScrolling == 'undefined') {
        isScrolling = !!( isScrolling || Math.abs(startingPosition.x - touches.pageX) < Math.abs(startingPosition.y - touches.pageY) );
      }

      // if user is not trying to scroll vertically
      if (!isScrolling) {

        // prevent native scrolling 
        event.preventDefault();

        // stop slideshow
        autoStop();
        
        placeAnimationFrame( delta.x );

      }

    },
    end: function() {

      // measure duration
      var duration = +new Date() - start.time;
      var absDelta = Math.abs(delta.x);

      // determine if slide attempt triggers next/prev slide
      var isValidSlide = 
            Number(duration) < 250 &&  // if slide duration is less than 250ms
            absDelta > 20 ||           // and if slide amt is greater than 20px
            absDelta > slideWidth/2;   // or if slide amt is greater than half the width

      // determine if slide attempt is past start and end
      var isPastBounds = 
            !index && delta.x > 0 ||                     // if first slide and slide amt is greater than 0
            index >= slides.length - slidesPerPage && delta.x < 0;   // or if last slide and slide amt is less than 0
      
      // if not scrolling vertically
      if (!isScrolling) {

        if (isValidSlide) {
          preventClickFromTouch( event.target );
        }

        if (isValidSlide && !isPastBounds) {
          var newIndex;
          if (slidesPerPage > 1 || options.toss) {
            var velocity = 0;
            for( var i = 0; i < lastVelocities.length; i += 1) {
              velocity += lastVelocities[i];
            }
            velocity = velocity / lastVelocities.length;
            stopToss = false;
            animateToss( velocity );
          } else {
            if (absDelta > slideWidth / 2) {
              newIndex = index - Math.round(delta.x / slideWidth);
            } else if (delta.x > 0) {
              newIndex = index-1;
            } else {
              newIndex = index+1;
            }

            newIndex = Math.min( Math.max( newIndex, 0), slides.length-slidesPerPage);

            // separate if/else for this for the first case above.
            if (newIndex === index+1) {
              emit('next');
            } else if (newIndex === index-1) {
              emit('prev');
            }
            slide(newIndex, speed, true);

            options.callback && options.callback(index, slides[index]);
          }

        } else {

          slide(index);

        }

      }

      // kill touchmove and touchend event listeners until touchstart called again
      element.removeEventListener('touchmove', events, false);
      element.removeEventListener('touchend', events, false);
      element.removeEventListener('touchcancel', events, false);

    },
    transitionEnd: function(event) {

      if (parseInt(event.target.getAttribute('data-index'), 10) == index) {
        
        if (delay) begin();

        options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);
        emit('animationEnd', index );

      }

    }

  };

  // trigger setup
  setup();

  // start auto slideshow if applicable
  if (delay) begin();


  // add event listeners
  if (browser.addEventListener) {
    // set touchstart event on element    
    if (browser.touch) element.addEventListener('touchstart', events, false);

    if (browser.transitions) {
      element.addEventListener('webkitTransitionEnd', events, false);
      element.addEventListener('msTransitionEnd', events, false);
      element.addEventListener('oTransitionEnd', events, false);
      element.addEventListener('otransitionend', events, false);
      element.addEventListener('transitionend', events, false);
    }

    // set resize event on window
    window.addEventListener('resize', events, false);

  } else {

    window.onresize = function () { setup() }; // to play nice with old IE

  }

  // expose the Swipe API
  return {
    setup: function() {

      setup();

    },
    slide: function(to, speed) {
      
      // cancel slideshow
      autoStop();
      
      slide(to, speed);

    },
    to: function(to, speed) {
      
      // cancel slideshow
      autoStop();
      
      slide(to, speed);

    },
    prev: function() {

      // cancel slideshow
      autoStop();

      emit('prev');
      
      prev();

    },
    next: function() {

      // cancel slideshow
      autoStop();
      
      emit('next');
      
      next();

    },
    prevPage: function() {
      
      autoStop();

      emit('prevPage');

      prevPage();

    },
    nextPage: function() {
      
      autoStop();

      emit('nextPage');

      nextPage();
      
    },
    currentSlide: function() {

      // return current index position
      return index;

    },
    slideCount: function() {
      
      // return total number of slides
      return slides.length;
    },
    slidesPerPage: function() {
      return slidesPerPage;
    },
    getSlideElement: function( index ) {
      return slides[index];
    },
    getSlideData: function( property ) {
      return slides[index].getAttribute('data-'+property);
    },
    setEmit: function( newEmit ) {
      emit = newEmit;
    },

    enable: function() {
      enabled = true;
    },
    disable: function() {
      enabled = false;
    },
    kill: function() {

      // cancel slideshow
      stop();

      // reset element
      element.style.width = 'auto';
      element.style.left = 0;

      // reset slides
      var pos = slides.length;
      while(pos--) {

        var slide = slides[pos];
        slide.style.width = '100%';
        slide.style.left = 0;

        if (browser.transitions) translate(pos, 0, 0);

      }

      // removed event listeners
      if (browser.addEventListener) {

        // remove current event listeners
        element.removeEventListener('touchstart', events, false);
        element.removeEventListener('webkitTransitionEnd', events, false);
        element.removeEventListener('msTransitionEnd', events, false);
        element.removeEventListener('oTransitionEnd', events, false);
        element.removeEventListener('otransitionend', events, false);
        element.removeEventListener('transitionend', events, false);
        window.removeEventListener('resize', events, false);

      }
      else {

        window.onresize = null;

      }

    }
  };

}


if ( window.jQuery || window.Zepto ) {
  (function($) {
    $.fn.Swipe = function(params) {
      return this.each(function() {
        var $self = $(this);
        var swipe = new Swipe($self[0], params);
        swipe.setEmit(function() {$self.trigger.apply( $self, arguments );});
        $(this).data('Swipe', swipe);
      });
    };
  })( window.jQuery || window.Zepto );
}
  return Swipe;
});
