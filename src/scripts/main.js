// NOTE(jordan): elements
var topbar         = $1('.top')
  , main           = $1('.main')
  , infoText       = $1('span.info-text')
  , newsletter     = $1('.newsletter')
  , newsletterList = $1('ul.newsletter-list')
  , nlItemTemplate = $1('.newsletter-item.template')
  , featured       = $1('.featured')
  , featuredThumbs = $1('.featured .thumbs')
  , unfeatured     = $1('.unfeatured')
  , featuredImg    = $('.featured img')
  , unfeaturedImg  = $('.unfeatured img')
  , uploadBtn      = $1('button.upload')
  , logoutBtn      = $1('button.logout')
  , uploadInput    = $1('#upload')
  , viewChangeBtn  = $1('button.newsletter-btn')

// NOTE(jordan): state
var currentView    = main.className.split(' ')[1]
  , featuredList   = [ ]
  , rightClickedItem = null

// NOTE(jordan): drag n drop reusable globals
var dragElement = originDropzone = null

// NOTE(jordan): top-level view change operations
function setView (mode) {
  if (mode === 'mode__newsletter') {
    newsletter.removeClass('hide')
  } else {
    featured.removeClass('hide')
    unfeatured.removeClass('hide')
  }

  setTimeout(function () {
    main.removeClass(currentView)
    main.addClass(mode)
  }, 100)

  setTimeout(function () {
    if (mode === 'mode__newsletter') {
      featured.addClass('hide')
      unfeatured.addClass('hide')
    } else {
      newsletter.addClass('hide')
    }
  }, 400)

  var photos = mode === 'mode__photos'
  var btn = photos ? 'Newsletters' : 'Photos'
  var info = infoText.innerHTML.replace(
    btn.toLowerCase(),
    btn === 'Photos' ? 'newsletters' : 'photos'
  )

  viewChangeBtn.innerHTML = btn
  infoText.innerHTML = info

  main.removeClass(currentView)
  main.addClass(mode)
  currentView = mode
}

function toggleView () {
  if (currentView === 'mode__photos') {
    setView('mode__newsletter')
  }
  else if (currentView === 'mode__newsletter') {
    setView('mode__photos')
  }
}

// NOTE(jordan): attach view to view change button (upper right hand corner btn)
viewChangeBtn.on('click', function () {
  toggleView()
})

// NOTE(jordan): make sure the current view is shown
setView(currentView)

// NOTE(jordan): too lazy to add this to the markup I guess
var noneFeatured = document.createElement('p')
noneFeatured.innerHTML = 'Click on an image below to feature it!'

// NOTE(jordan): if negative space, show negative space message
function negativeSpaceCheck () {
  if ($1('.featured img') === null) {
    // no featured images
    featuredThumbs.appendChild(noneFeatured)
  } else if (noneFeatured.parentElement) {
    noneFeatured.remove()
  }
}

// NOTE(jordan): sticky photos header
window.addEventListener('scroll', toggleClassAtScroll({
  element: featured,
  direction: 'down',
  position: topbar.offsetHeight,
  className: 'sticky'
}))

// NOTE(jordan): check for negative space
negativeSpaceCheck()

// NOTE(jordan): timer variable for server auto-sync
var syncTimer
var syncLimit = 1500 // ~1.5s

// NOTE(jordan): call whenever featuredList changes to sync w/ server
function syncFeatured () {
  qwest.put('/featured', featuredList, { dataType: 'json' })
    .catch(function (err, xhr, response) {
      console.error(err)
    })
    .then(function (xhr, response) {
      console.log(response)
    })
}

// NOTE(jordan): call whenever featuredList should change
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

// NOTE(jordan): Featuring and unfeaturing photos on click
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

// NOTE(jordan): featuring and unfeaturing photos on drag
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

// NOTE(jordan): messy code for wrangling HTML5 dragdrop and creating drop zones
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

// NOTE(jordan): set up / init click-to-(un)feature
featuredImg.on('click', toggleFeaturedHandler(false))
unfeaturedImg.on('click', toggleFeaturedHandler(true))

// NOTE(jordan): set up / init drop areas for drag n drop
createDropZone(featuredThumbs)
createDropZone(unfeatured)

// NOTE(jordan): also need to track drag events on photos
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

// NOTE(jordan): attach drag events to photos
featuredImg.forEach(setupOnDrag)
unfeaturedImg.forEach(setupOnDrag)

// NOTE(jordan): create new elements for uploads obtained from s3
// NOTE(jordan): thumbs
function createThumb(s3Response) {
  var img = document.createElement('img')
  img.src = s3Response.Location
  var thumb = document.createElement('div')
  thumb.className = 'thumb'
  thumb.s3key = s3Response.Key
  thumb.appendChild(img)
  attachRightClickMenu(thumb)
  setupOnDrag(img)

  return thumb
}

// NOTE(jordan): newsletter items
function createNewsletterItem(item) {
  var newItem = nlItemTemplate.cloneNode(true)

  newItem.removeClass('template')
  newItem.removeClass('hide')

  var filename = newItem.querySelector('.filename')
  var date = newItem.querySelector('.date')

  filename.innerHTML = item.Key.split('/')[1]
  date.innerHTML = (new Date(item.LastModified)).toDateString()

  var dlBtn = newItem.querySelector('.download-btn')
  var delBtn = newItem.querySelector('.delete-btn')

  dlBtn.on('click', function () {
    window.open(item.Location)
  })

  delBtn.on('click', function () {
    var rly = confirm('Are you sure you want to delete ' + filename.innerHTML + '?')
    if (rly) {
      qwest.delete('/newsletters?key=' + item.Key)
        .catch(function (err, xhr, response) {
          console.error(err)
        })
        .then(function (xhr, response) {
          console.log(response)
          newItem.remove()
        })
    }
  })

  return newItem
}

// NOTE(jordan): attach pretty upload button to shitty upload input
uploadBtn.on('click', function () {
  uploadInput.click()
})

// NOTE(jordan): upload utilities
function uploadPhoto (upload) {
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
}

function uploadNewsletter (upload) {
  if (!~upload.type.indexOf('pdf')) {
    console.error('Tried to upload non-pdf newsletter.')
    alert('Whoops! Newsletter files must be pdfs.')
    return
  }

  var fd = new FormData()
  fd.append('newsletter', upload)

  qwest.put('/newsletters', fd)
    .catch(function (err, xhr, response) {
      console.error(err)
    })
    .then(function (xhr, response) {
      console.info(response)
      var newsletterItem = createNewsletterItem(response)
      newsletterList.appendChild(newsletterItem)
    })
}

// NOTE(jordan): attach actual upload work to upload input
uploadInput.on('change', function () {
  console.log(this.files)
  var upload = this.files[0]

  if (currentView === 'mode__photos')
    uploadPhoto(upload)
  else if (currentView === 'mode__newsletter')
    uploadNewsletter(upload)
})

// NOTE(jordan): create a right click menu for photos
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

function attachRightClickMenu (el) {
  el.on('contextmenu', function (e) {
    rightClickedItem = this
    console.log('Right clicked on: ', rightClickedItem)
  })
  contextmenu.attach(el, menu)
}

// NOTE(jordan): attach right click menu to photos
$('.featured .thumb').forEach(attachRightClickMenu)
$('.unfeatured .thumb').forEach(attachRightClickMenu)

// NOTE(jordan): load photos from server
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

// NOTE(jordan): load newsletters from server
qwest.get('/newsletters')
  .catch(function (err, xhr, response) {
    console.error(err)
  })
  .then(function (xhr, response) {
    response.forEach(function (s3Pdf) {
      console.log(s3Pdf)
      var newsletterItem = createNewsletterItem(s3Pdf)
      newsletterList.appendChild(newsletterItem)
    })
  })
