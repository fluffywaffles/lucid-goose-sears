var topbar         = $1('.top')
  , featured       = $1('.featured')
  , featuredThumbs = $1('.featured .thumbs')
  , unfeatured     = $1('.unfeatured')
  , featuredImg    = $('.featured img')
  , unfeaturedImg  = $('.unfeatured img')
  , uploadBtn      = $1('button.upload')
  , logoutBtn      = $1('button.logout')
  , uploadInput    = $1('#upload')
  , featuredList   = [ ]
  , rightClickedItem = null

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

    updateFeaturedList(this.src, onoff)

    this.parentElement.remove()
    var newParent = (onoff ? featuredThumbs : unfeatured)
    newParent.appendChild(this.parentElement)

    this.removeEventListener('click', toggle)
    this.on('click', toggleFeaturedHandler(!onoff))

    negativeSpaceCheck()
  }
}

var syncTimer
var syncLimit = 1500

function updateFeaturedList (it, feature) {
  if (feature) {
    featuredList.push(it)
    syncTimer = setTimeout(syncFeatured, 1500)
  } else {
    var idx = featuredList.indexOf(it)
    if (~idx) {
      featuredList.splice(idx, 1)
      syncTimer = setTimeout(syncFeatured, 1500)
    }
  }
}

// Drop zones
function onDrop (event) {
  event.preventDefault()
  event.stopPropagation()
  console.log(event)
  console.log(originDropzone)
  console.log(this)
  if (originDropzone && originDropzone !== this) {
    dragElement.remove()
    this.appendChild(dragElement)
    updateFeaturedList(dragElement.children[0].src, originDropzone === unfeatured)
    negativeSpaceCheck()
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
    if (syncTimer) clearTimeout(syncTimer)
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

function createThumb(s3Response) {
  var img = document.createElement('img')
  img.src = s3Response.Location
  var thumb = document.createElement('div')
  thumb.className = 'thumb'
  thumb.s3key = s3Response.key
  thumb.appendChild(img)
  attachRightClickHandler(thumb)
  setupOnDrag(img)

  return thumb
}

uploadBtn.on('click', function () {
  uploadInput.click()
})

uploadInput.on('change', function () {
  console.log(this.files)
  var upload = this.files[0]

  if (!upload.type.startsWith('image/')) {
    console.error('Tried to upload a non-image file, you fool.')
    alert('That doesn\'t look like an image file; the upload cannot continue.')
    return
  }

  var fd = new FormData()
  fd.append('photo', upload)

  qwest.put('/photos', fd)
    .catch(function (err, xhr, response) {
      console.error(err)
    })
    .then(function (xhr, response) {
      console.info(response)
      var thumb = createThumb(response)
      unfeatured.appendChild(thumb)
    })
})

var menu = contextmenu([
  {
    label: 'Delete',
    onclick: function (e) {
      qwest.delete('/photos?key=' + rightClickedItem.s3key)
        .catch(function (err, xhr, response) {
          console.error(err)
        })
        .then(function  (xhr, response) {
          console.log(response)
          console.log('successfully deleted')
          rightClickedItem.remove()
        })
    }
  }
])

function attachRightClickHandler (el) {
  el.on('contextmenu', function (e) {
    rightClickedItem = this
    console.log('Right clicked on: ', rightClickedItem)
  })
  contextmenu.attach(el, menu)
}

$('.featured .thumb').forEach(attachRightClickHandler)

$('.unfeatured .thumb').forEach(attachRightClickHandler)

qwest.get('/featured')
  .catch(function (err, xhr, response) {
    console.error(err)
  })
  .then(function (xhr, response) {
    featuredList = response || [ ]
    return qwest.get('/photos')
  })
  .catch(function (err, xhr, response) {
    console.error(err)
  })
  .then(function (xhr, response) {
    response.forEach(function (s3Img) {
      console.log(s3Img)
      var thumb = createThumb(s3Img)
      if (~featuredList.indexOf(s3Img.Location)) {
        featuredThumbs.appendChild(thumb)
        thumb.children[0].on('click', toggleFeaturedHandler(false))
      } else {
        unfeatured.appendChild(thumb)
        thumb.children[0].on('click', toggleFeaturedHandler(true))
      }
    })
  })

function syncFeatured () {
  qwest.put('/featured', featuredList, { dataType: 'json' })
    .catch(function (err, xhr, response) {
      console.error(err)
    })
    .then(function (xhr, response) {
      console.log(response)
    })
}
