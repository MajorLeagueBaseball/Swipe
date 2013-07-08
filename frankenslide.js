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
    define(['jquery', './swipe.js', 'bridge/util/mixins/events'], factory);

    //NODE
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('jquery'), require('./swipe'), require('paperboy'));

    //GLOBAL
  } else {
    window.frankenslide = factory(jQuery, window.Swipe, window.paperboy);
  }
})(function( $, Swipe, paperboy ) {
	
	function replaceImageSrc( i, image ) {
		image.src = image.getAttribute('data-src');
		image.removeAttribute('data-src');
	}

	return {
		create: function( container, options ) {
			var slider = new Swipe( container, options );

			var trigger = paperboy.mixin(slider, ['move', 'animationEnd', 'autoAdvance', 'next', 'prev']);
			slider.setEmit(trigger);

			// wire up next/prev buttons
			if (options.next) {
				$(options.next).on('click', slider.next);
			}
			if (options.prev) {
				$(options.prev).on('click', slider.prev);
			}

			if (options.nextPage) {
				$(options.nextPage).on('click', slider.nextPage);
			}
			if (options.prevPage) {
				$(options.prevPage).on('click', slider.prevPage);
			}

			// auto load images
			slider.on('move', function( newIndex ) {
			    var start = newIndex;
			    var slidesPerPage = slider.slidesPerPage();
			    var end = start + (slidesPerPage * 2);
			    for (var i = start; i < end; i += 1) {
					var slide = slider.getSlideElement( i );
					$('[data-src]', slide).each(replaceImageSrc);
			    }
			});

			$('[data-src]', slider.getSlideElement(0)).each(replaceImageSrc);
			$('[data-src]', slider.getSlideElement(1)).each(replaceImageSrc);

			return slider;
		}
	};

});
