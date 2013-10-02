(function(factory) {
  //AMD
  if (typeof define === 'function' && define.amd) {
    define(['jquery', './swipe', 'paperboy/paperboy'], factory);

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

			var trigger = paperboy.mixin(slider, ['move', 'animationEnd', 'autoAdvance', 'next', 'prev', 'sizeChange']);
			slider.setEmit(trigger);

			// wire up next/prev buttons
			if (options.next) {
				$(options.next).on('click', function( event ) {
					slider.next();
					event.preventDefault();
				});
			}
			if (options.prev) {
				$(options.prev).on('click', function( event ) {
					slider.prev();
					event.preventDefault();
				});
			}

			if (options.nextPage) {
				$(options.nextPage).on('click', function( event ) {
					slider.nextPage();
					event.preventDefault();
				});
			}
			if (options.prevPage) {
				$(options.prevPage).on('click', function( event ) {
					slider.prevPage();
					event.preventDefault();
				});
			}

			var slidesLoaded = [];
			// auto load images
			slider.on('move', function( newIndex ) {
			    var start = newIndex;
			    var slidesPerPage = slider.slidesPerPage();
			    var end = start + (slidesPerPage * 2);
			    for (var i = start; i < end; i += 1) {
					var slide = slider.getSlideElement( i );
					if (slidesLoaded.indexOf(slide) === -1) {
						$('[data-src]', slide).each(replaceImageSrc);
						slidesLoaded.push(slide);
					}
			    }
			});

			var slidesPerPage = slider.slidesPerPage();
			var currentSlide = slider.currentSlide();
			for( var i = 0; i < slidesPerPage*2; i += 1) {
				$('[data-src]', slider.getSlideElement(i + currentSlide)).each(replaceImageSrc);
			}

			return slider;
		}
	};

});
