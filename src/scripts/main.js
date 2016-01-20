var topbar         = $1('.top')
  , featured       = $1('.featured')
  , featuredThumbs = $1('.featured .thumbs')
  , unfeatured     = $1('.unfeatured')
  , featuredImg    = $('.featured img')
  , unfeaturedImg  = $('.unfeatured img')
  , uploadBtn      = $1('button.upload')
  , logoutBtn      = $1('button.logout')

var dragElement = originDropzone = null

var noneFeatured = document.createElement('p')
noneFeatured.innerHTML = 'Click on an image below to feature it!'

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
    console.info('This element will now be'
                  , (onoff ? '' : 'un') + 'featured.')
    console.info('\t', this)

    var sure = confirm((onoff ? '' : 'un') + 'feature this image?')

    if (!sure) return

    this.parentElement.remove()
    var newParent = (onoff ? featuredThumbs : unfeatured)
    newParent.appendChild(this.parentElement)

    this.removeEventListener('click', toggle)
    this.on('click', toggleFeaturedHandler(!onoff))

    negativeSpaceCheck()
  }
}

// Drop zones
function onDrop (event) {
  event.preventDefault()
  event.stopPropagation()
  if (originDropzone && originDropzone !== this) {
    dragElement.remove()
    this.appendChild(dragElement)
  }
}

function createDropZone (el) {
  // event.dataTransfer.files
  el.on('dragenter', function () {
    event.preventDefault()
    event.stopPropagation()
  })
  el.on('dragleave', function () {
    event.preventDefault()
    event.stopPropagation()
  })
  el.on('dragend', function (event) {
    event.preventDefault()
    event.stopPropagation()
    unfeatured.removeClass('show-dropzone')
    featuredThumbs.removeClass('show-dropzone')
  })
  el.on('dragover', function (event) {
    // oh this is stupid AF
    event.preventDefault()
    event.stopPropagation()
  })
  el.on('drop', onDrop, false)
}

createDropZone(featuredThumbs)
createDropZone(unfeatured)

// Wire everything up / Init
featuredImg.on('click', toggleFeaturedHandler(false))
unfeaturedImg.on('click', toggleFeaturedHandler(true))

function setupOnDrag (img) {
  var thumb = img.parentElement
  thumb.draggable = true
  thumb.on('dragstart', function () {
    dragElement = this
    originDropzone = thumb.parentElement
    if (originDropzone === featuredThumbs)
      unfeatured.addClass('show-dropzone')
    else
      featuredThumbs.addClass('show-dropzone')
  })
}

featuredImg.forEach(setupOnDrag)
unfeaturedImg.forEach(setupOnDrag)

window.addEventListener('scroll', toggleClassAtScroll({
  element: featured,
  direction: 'down',
  position: topbar.offsetHeight,
  className: 'sticky'
}))

negativeSpaceCheck()

filepicker.setKey(FILEPICKER_API_KEY)

uploadBtn.on('click', function () {
  filepicker.pick({
    mimetype: 'image/*',
    container: 'window',
    services: ['COMPUTER', 'FACEBOOK', 'BOX', 'DROPBOX', 'INSTAGRAM', 'TWITTER', 'GMAIL', 'URL', 'CONVERT'],
    maxSize: 1024*1024*1024 // max size: 1GB
  }, function success (blob) {
    // cool, success.
    console.log('Upload successful.')
    // add image to unfeatured
  }, function error (FPError) {
    console.log(FPError.toString())
    alert('There was an error uploading your file! Please try again.')
  })
})
