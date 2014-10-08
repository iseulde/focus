window.jQuery( function( $ ) {
	'use strict';

	var $window = $( window ),
		$document = $( document ),
		$wrap = $( '#wpwrap' ),
		$adminBar = $( '#wp-toolbar' ),
		$editor = $( '#post-body-content' ),
		$title = $( '#title' ),
		$content = $( '#content' ),
		$overlay = $( document.createElement( 'DIV' ) ),
		$slug = $( '#edit-slug-box' ),
		$slugFocusEl = $slug.find( 'a' )
			.add( $slug.find( 'button' ) )
			.add( $slug.find( 'input' ) ),
		buffer = 20,
		tick = 0,
		fadeInTime = 400,
		fadeOutTime = 2000,
		faded, fadedAdminBar, fadedSlug, editorRect, x, y, mouseY;

	$( document.body ).append( $overlay );

	$overlay.hide().css( {
		background: '#f1f1f1',
		position: 'fixed',
		top: $( '#wpadminbar' ).height(),
		right: 0,
		bottom: 0,
		left: 0,
		'z-index': 9997
	} );

	$window.on( 'mousemove.focus', function( event ) {
		mouseY = event.pageY;
	} );

	function fadeOut() {
		if ( ! faded ) {
			faded = true;

			$editor.css( {
				position: 'relative',
				'z-index': 9998
			} );

			$overlay.stop().fadeIn( fadeOutTime )
				// Always recalculate the editor area entering the overlay with the mouse.
				.on( 'mouseenter.focus', function() {
					editorRect = $editor.offset();
					editorRect.right = editorRect.left + $editor.outerWidth();
					editorRect.bottom = editorRect.top + $editor.outerHeight();

					$window.on( 'scroll.focus', function() {
						if ( mouseY && ( mouseY < editorRect.top - buffer || mouseY > editorRect.bottom + buffer ) ) {
							fadeIn();
						}
					} );
				} )
				.on( 'mouseleave.focus', function() {
					tick = 0;

					$window.off( 'scroll.focus' );
				} )
				// Fade in when the mouse moves away form the editor area.
				// Let's confirm this by checking 4 times. Mouse movement is very sensitive.
				// Also don't fade in when we are less than buffer * 1px away from the editor area.
				.on( 'mousemove.focus', function( event ) {
					var _x = event.pageX,
						_y = event.pageY;

					if ( x && y && ( _x !== x || _y !== y ) ) {
						if (
							( _y <= y && _y < editorRect.top ) ||
							( _y >= y && _y > editorRect.bottom ) ||
							( _x <= x && _x < editorRect.left ) ||
							( _x >= x && _x > editorRect.right )
						) {
							tick++;
							if (
								_y >= editorRect.top - buffer &&
								_y <= editorRect.bottom + buffer &&
								_x >= editorRect.left - buffer &&
								_x <= editorRect.right + buffer
							) {
								return;
							}

							if ( tick > 3 ) {
								fadeIn();

								x = y = null;
								tick = 0;

								return;
							}
						}
					}

					x = _x;
					y = _y;
				} )
				// When the overlay is touched, always fade in and cancel the event.
				.on( 'touchstart.focus', function( event ) {
					event.preventDefault();
					fadeIn();
				} );
		}

		fadeOutAdminBar();
		fadeOutSlug();
	}

	function fadeIn() {
		if ( faded ) {
			faded = false;

			$overlay.stop().fadeOut( fadeInTime ).off( 'mouseenter.focus mouseleave.focus mousemove.focus touchstart.focus' );

			$window.off( 'scroll.focus' );
		}

		fadeInAdminBar();
		fadeInSlug();
	}

	function maybeFadeIn() {
		setTimeout( function() {
			var position = document.activeElement.compareDocumentPosition( $editor.get( 0 ) );

			// The focussed node is before or behind the editor area, and not ouside the wrap.
			if ( ( position === 2 || position === 4 ) && $.contains( $wrap.get( 0 ), document.activeElement ) ) {
				fadeIn();
			}
		}, 0 );
	}

	function fadeOutAdminBar() {
		if ( ! fadedAdminBar && faded ) {
			fadedAdminBar = true;

			$adminBar.fadeTo( fadeOutTime, 0.3 ).on( 'mouseenter.focus', fadeInAdminBar ).off( 'mouseleave.focus' );
		}
	}

	function fadeInAdminBar() {
		if ( fadedAdminBar ) {
			fadedAdminBar = false;

			$adminBar.fadeTo( fadeInTime, 1 ).on( 'mouseleave.focus', fadeOutAdminBar ).off( 'mouseenter.focus' );
		}
	}

	function fadeOutSlug() {
		if ( ! fadedSlug && faded && ! $slug.find( ':focus').length ) {
			fadedSlug = true;

			$slug.fadeTo( 'fast', 0.3 ).on( 'mouseenter.focus', fadeInSlug ).off( 'mouseleave.focus' );

			$slugFocusEl.on( 'focus.focus', fadeInSlug );
		}
	}

	function fadeInSlug() {
		if ( fadedSlug ) {
			fadedSlug = false;

			$slug.fadeTo( 'fast', 1 ).on( 'mouseleave.focus', fadeOutSlug ).off( 'mouseenter.focus' );

			$slugFocusEl.off( 'focus.focus' );
		}
	}

	$title.add( $content ).on( 'focus.focus click.focus touchstart.focus keyup.focus', fadeOut ).on( 'blur', maybeFadeIn );

	$document.on( 'tinymce-editor-init.focus', function( event, editor ) {
		if ( editor.id === 'content' ) {
			editor.on( 'click focus keyup', fadeOut );
			editor.on( 'blur', maybeFadeIn );
		}
	} );
} );
