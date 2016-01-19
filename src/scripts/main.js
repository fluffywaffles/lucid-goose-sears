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

var topbar         = $1('.top')
  , featured       = $1('.featured')
  , featuredThumbs = $1('.featured .thumbs')
  , unfeatured     = $1('.unfeatured')
  , featuredImg    = $('.featured img')
  , unfeaturedImg  = $('.unfeatured img')

window.addEventListener('scroll', stickyFeatured)

function toggleFeaturedHandler (onoff) {
  return function toggle () {
    alert('This element is ' + (!onoff ? '' : 'un') + 'featured!')
    this.parentElement.remove()
    var newParent = (onoff ? featuredThumbs : unfeatured)
    newParent.appendChild(this.parentElement)
    this.removeEventListener('click', toggle)
    this.on('click', toggleFeaturedHandler(!onoff))
  }
}

featuredImg.on('click', toggleFeaturedHandler(false))
unfeaturedImg.on('click', toggleFeaturedHandler(true))
