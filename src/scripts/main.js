var topbar         = $1('.top')
  , featured       = $1('.featured')
  , featuredThumbs = $1('.featured .thumbs')
  , unfeatured     = $1('.unfeatured')
  , featuredImg    = $('.featured img')
  , unfeaturedImg  = $('.unfeatured img')

var noneFeatured = document.createElement('p')
noneFeatured.innerHTML = 'Click on an image below to feature it!'

// Stickiness
function unstickyFeatured (e) {
  var y = window.pageYOffset
  if (y < topbar.offsetHeight) {
    featured.removeClass('sticky')
    window.removeEventListener('scroll', unstickyFeatured)
    window.addEventListener('scroll', stickyFeatured)
  }
}

function stickyFeatured (e) {
  var y = window.pageYOffset
  if (y > topbar.offsetHeight) {
    featured.addClass('sticky')
    window.removeEventListener('scroll', stickyFeatured)
    window.addEventListener('scroll', unstickyFeatured)
  }
}

// Negative space
function negativeSpaceCheck () {
  if ($1('.featured img') === null) {
    // no featured images
    featuredThumbs.appendChild(noneFeatured)
  } else if (noneFeatured.parentElement) {
    noneFeatured.remove()
  }
}

// Featuring and unfeaturing
function toggleFeaturedHandler (onoff) {
  return function toggle () {
    console.info('This element will now be ' + (onoff ? '' : 'un')  + 'featured.')
    console.info('\t', this)
    this.parentElement.remove()
    var newParent = (onoff ? featuredThumbs : unfeatured)
    newParent.appendChild(this.parentElement)
    this.removeEventListener('click', toggle)
    this.on('click', toggleFeaturedHandler(!onoff))

    negativeSpaceCheck()
  }
}

// Wire everything up / Init
featuredImg.on('click', toggleFeaturedHandler(false))
unfeaturedImg.on('click', toggleFeaturedHandler(true))

window.addEventListener('scroll', stickyFeatured)

negativeSpaceCheck()
